-- HLWAIT: RLS + dynamic grants — extends bootstrap_schema for any new tenant schema.
-- After this migration: SELECT hlwait.bootstrap_schema('desigma'); creates tables + RLS + grants.

-- ---------------------------------------------------------------------------
-- Rename existing bootstrap → core (tables, indexes, triggers only)
-- ---------------------------------------------------------------------------

alter function hlwait.bootstrap_schema(text) rename to bootstrap_schema_core;

-- ---------------------------------------------------------------------------
-- Role helpers (per tenant schema)
-- ---------------------------------------------------------------------------

create or replace function hlwait.bootstrap_schema_rls(p_schema text)
returns void
language plpgsql
as $$
declare
  tbl text;
  all_tables text[] := array[
    'roles', 'users', 'categories', 'suppliers', 'supplier_ledger', 'customers',
    'products', 'orders', 'order_items', 'inventory', 'inventory_movements',
    'payments', 'expenses', 'income', 'tasks', 'notifications', 'documents', 'settings'
  ];
  business_tables text[] := array[
    'categories', 'suppliers', 'supplier_ledger', 'customers', 'products',
    'orders', 'order_items', 'inventory', 'inventory_movements',
    'payments', 'expenses', 'income', 'tasks', 'documents'
  ];
begin
  if p_schema !~ '^[a-z][a-z0-9_]*$' then
    raise exception 'Invalid schema name: %', p_schema;
  end if;

  -- Helper: map role name → level
  execute format($sql$
    create or replace function %1$I.role_level(p_role text)
    returns int
    language sql
    immutable
    as $fn$
      select case p_role
        when 'viewer' then 1
        when 'employee' then 2
        when 'manager' then 3
        when 'admin' then 4
        when 'super_admin' then 5
        else 0
      end;
    $fn$
  $sql$, p_schema);

  -- Helper: current app user row id (links auth.users → tenant users)
  execute format($sql$
    create or replace function %1$I.app_user_id()
    returns uuid
    language sql
    stable
    security definer
    set search_path = %1$I, public
    as $fn$
      select u.id
      from %1$I.users u
      where u.auth_user_id = auth.uid()
        and u.is_active = true
      limit 1;
    $fn$
  $sql$, p_schema);

  -- Helper: current role name
  execute format($sql$
    create or replace function %1$I.app_role_name()
    returns text
    language sql
    stable
    security definer
    set search_path = %1$I, public
    as $fn$
      select r.name
      from %1$I.users u
      join %1$I.roles r on r.id = u.role_id
      where u.auth_user_id = auth.uid()
        and u.is_active = true
      limit 1;
    $fn$
  $sql$, p_schema);

  -- Helper: minimum role check
  execute format($sql$
    create or replace function %1$I.has_min_role(p_min_role text)
    returns boolean
    language sql
    stable
    security definer
    set search_path = %1$I, public
    as $fn$
      select coalesce(%1$I.role_level(%1$I.app_role_name()), 0)
          >= %1$I.role_level(p_min_role);
    $fn$
  $sql$, p_schema);

  -- Service role bypass helper
  execute format($sql$
    create or replace function %1$I.is_service_role()
    returns boolean
    language sql
    stable
    as $fn$
      select coalesce(
        current_setting('request.jwt.claim.role', true),
        current_setting('role', true)
      ) = 'service_role';
    $fn$
  $sql$, p_schema);

  execute format(
    'grant execute on function %I.role_level(text) to authenticated, service_role',
    p_schema
  );
  execute format(
    'grant execute on function %I.app_user_id() to authenticated, service_role',
    p_schema
  );
  execute format(
    'grant execute on function %I.app_role_name() to authenticated, service_role',
    p_schema
  );
  execute format(
    'grant execute on function %I.has_min_role(text) to authenticated, service_role',
    p_schema
  );
  execute format(
    'grant execute on function %I.is_service_role() to authenticated, service_role',
    p_schema
  );

  -- Enable RLS on all tables
  foreach tbl in array all_tables
  loop
    execute format('alter table %I.%I enable row level security', p_schema, tbl);
  end loop;

  -- Drop existing policies (idempotent re-bootstrap)
  foreach tbl in array all_tables
  loop
    execute format(
      'drop policy if exists %I_select on %I.%I',
      tbl, p_schema, tbl
    );
    execute format(
      'drop policy if exists %I_insert on %I.%I',
      tbl, p_schema, tbl
    );
    execute format(
      'drop policy if exists %I_update on %I.%I',
      tbl, p_schema, tbl
    );
    execute format(
      'drop policy if exists %I_delete on %I.%I',
      tbl, p_schema, tbl
    );
  end loop;

  -- roles: read viewer+, write admin+, delete super_admin
  execute format($sql$
    create policy roles_select on %1$I.roles for select to authenticated
      using (%1$I.is_service_role() or %1$I.has_min_role('viewer'));
    create policy roles_insert on %1$I.roles for insert to authenticated
      with check (%1$I.is_service_role() or %1$I.has_min_role('admin'));
    create policy roles_update on %1$I.roles for update to authenticated
      using (%1$I.is_service_role() or %1$I.has_min_role('admin'))
      with check (%1$I.is_service_role() or %1$I.has_min_role('admin'));
    create policy roles_delete on %1$I.roles for delete to authenticated
      using (%1$I.is_service_role() or %1$I.has_min_role('super_admin'));
  $sql$, p_schema);

  -- users: read viewer+, write admin+, delete admin+
  execute format($sql$
    create policy users_select on %1$I.users for select to authenticated
      using (%1$I.is_service_role() or %1$I.has_min_role('viewer'));
    create policy users_insert on %1$I.users for insert to authenticated
      with check (%1$I.is_service_role() or %1$I.has_min_role('admin'));
    create policy users_update on %1$I.users for update to authenticated
      using (
        %1$I.is_service_role()
        or %1$I.has_min_role('admin')
        or (id = %1$I.app_user_id() and %1$I.has_min_role('employee'))
      )
      with check (
        %1$I.is_service_role()
        or %1$I.has_min_role('admin')
        or (id = %1$I.app_user_id() and %1$I.has_min_role('employee'))
      );
    create policy users_delete on %1$I.users for delete to authenticated
      using (%1$I.is_service_role() or %1$I.has_min_role('admin'));
  $sql$, p_schema);

  -- settings: read admin+, write super_admin only
  execute format($sql$
    create policy settings_select on %1$I.settings for select to authenticated
      using (%1$I.is_service_role() or %1$I.has_min_role('admin'));
    create policy settings_insert on %1$I.settings for insert to authenticated
      with check (%1$I.is_service_role() or %1$I.has_min_role('super_admin'));
    create policy settings_update on %1$I.settings for update to authenticated
      using (%1$I.is_service_role() or %1$I.has_min_role('super_admin'))
      with check (%1$I.is_service_role() or %1$I.has_min_role('super_admin'));
    create policy settings_delete on %1$I.settings for delete to authenticated
      using (%1$I.is_service_role() or %1$I.has_min_role('super_admin'));
  $sql$, p_schema);

  -- notifications: own rows OR admin+
  execute format($sql$
    create policy notifications_select on %1$I.notifications for select to authenticated
      using (
        %1$I.is_service_role()
        or %1$I.has_min_role('admin')
        or user_id = %1$I.app_user_id()
      );
    create policy notifications_insert on %1$I.notifications for insert to authenticated
      with check (%1$I.is_service_role() or %1$I.has_min_role('admin'));
    create policy notifications_update on %1$I.notifications for update to authenticated
      using (
        %1$I.is_service_role()
        or %1$I.has_min_role('admin')
        or user_id = %1$I.app_user_id()
      )
      with check (
        %1$I.is_service_role()
        or %1$I.has_min_role('admin')
        or user_id = %1$I.app_user_id()
      );
    create policy notifications_delete on %1$I.notifications for delete to authenticated
      using (%1$I.is_service_role() or %1$I.has_min_role('admin'));
  $sql$, p_schema);

  -- tasks: read viewer+; insert employee+; update own (employee) or manager+; delete admin+
  execute format($sql$
    create policy tasks_select on %1$I.tasks for select to authenticated
      using (%1$I.is_service_role() or %1$I.has_min_role('viewer'));
    create policy tasks_insert on %1$I.tasks for insert to authenticated
      with check (%1$I.is_service_role() or %1$I.has_min_role('employee'));
    create policy tasks_update on %1$I.tasks for update to authenticated
      using (
        %1$I.is_service_role()
        or %1$I.has_min_role('manager')
        or (assigned_user_id = %1$I.app_user_id() and %1$I.has_min_role('employee'))
      )
      with check (
        %1$I.is_service_role()
        or %1$I.has_min_role('manager')
        or (assigned_user_id = %1$I.app_user_id() and %1$I.has_min_role('employee'))
      );
    create policy tasks_delete on %1$I.tasks for delete to authenticated
      using (%1$I.is_service_role() or %1$I.has_min_role('admin'));
  $sql$, p_schema);

  -- business tables: standard CRUD by role tier
  foreach tbl in array business_tables
  loop
    execute format($sql$
      create policy %2$I_select on %1$I.%2$I for select to authenticated
        using (%1$I.is_service_role() or %1$I.has_min_role('viewer'));
    $sql$, p_schema, tbl);

    if tbl in ('orders', 'order_items', 'inventory_movements') then
      execute format($sql$
        create policy %2$I_insert on %1$I.%2$I for insert to authenticated
          with check (%1$I.is_service_role() or %1$I.has_min_role('employee'));
      $sql$, p_schema, tbl);
    else
      execute format($sql$
        create policy %2$I_insert on %1$I.%2$I for insert to authenticated
          with check (%1$I.is_service_role() or %1$I.has_min_role('manager'));
      $sql$, p_schema, tbl);
    end if;

    execute format($sql$
      create policy %2$I_update on %1$I.%2$I for update to authenticated
        using (%1$I.is_service_role() or %1$I.has_min_role('manager'))
        with check (%1$I.is_service_role() or %1$I.has_min_role('manager'));
      create policy %2$I_delete on %1$I.%2$I for delete to authenticated
        using (%1$I.is_service_role() or %1$I.has_min_role('admin'));
    $sql$, p_schema, tbl);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Dynamic grants for any tenant schema
-- ---------------------------------------------------------------------------

create or replace function hlwait.bootstrap_schema_grants(p_schema text)
returns void
language plpgsql
as $$
begin
  if p_schema !~ '^[a-z][a-z0-9_]*$' then
    raise exception 'Invalid schema name: %', p_schema;
  end if;

  execute format(
    'grant usage on schema %I to postgres, anon, authenticated, service_role',
    p_schema
  );
  execute format(
    'grant all on all tables in schema %I to postgres, service_role',
    p_schema
  );
  execute format(
    'grant select, insert, update, delete on all tables in schema %I to authenticated',
    p_schema
  );
  execute format(
    'grant select on all tables in schema %I to anon',
    p_schema
  );
  execute format(
    'alter default privileges in schema %I grant all on tables to postgres, service_role',
    p_schema
  );
  execute format(
    'alter default privileges in schema %I grant select, insert, update, delete on tables to authenticated',
    p_schema
  );
  execute format(
    'grant execute on all functions in schema %I to authenticated, service_role',
    p_schema
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Public entry point: tables + RLS + grants + default roles
-- ---------------------------------------------------------------------------

create or replace function hlwait.bootstrap_schema(p_schema text)
returns void
language plpgsql
as $$
begin
  perform hlwait.bootstrap_schema_core(p_schema);
  perform hlwait.bootstrap_schema_rls(p_schema);
  perform hlwait.bootstrap_schema_grants(p_schema);

  execute format($sql$
    insert into %1$I.roles (name, label) values
      ('super_admin', 'Super Admin'),
      ('admin',       'Admin'),
      ('manager',     'Manager'),
      ('employee',    'Employee'),
      ('viewer',      'Viewer')
    on conflict (name) do nothing
  $sql$, p_schema);
end;
$$;

comment on function hlwait.bootstrap_schema(text) is
  'Creates full tenant ERP schema: tables, FKs, indexes, triggers, RLS, grants, default roles.';

-- Apply RLS to existing schemas (tables already exist from prior migration)
select hlwait.bootstrap_schema_rls('hlwait');
select hlwait.bootstrap_schema_rls('hlwait_demo');
