-- HLWAIT ג€” isolated schema on shared Supabase instance
-- All project tables live under hlwait.* (never public.*)
-- Demo environment: hlwait_demo.* (fully separated from production)

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Bootstrap: create identical table structure in any target schema
-- Usage: select hlwait.bootstrap_schema('hlwait');
--        select hlwait.bootstrap_schema('hlwait_demo');
-- ---------------------------------------------------------------------------

create schema if not exists hlwait;

create or replace function hlwait.bootstrap_schema(p_schema text)
returns void
language plpgsql
as $$
declare
  tbl text;
  tables_with_updated_at text[] := array[
    'roles', 'users', 'categories', 'suppliers', 'customers', 'products',
    'orders', 'expenses', 'income', 'tasks', 'settings'
  ];
begin
  if p_schema !~ '^[a-z][a-z0-9_]*$' then
    raise exception 'Invalid schema name: %', p_schema;
  end if;

  execute format('create schema if not exists %I', p_schema);

  -- roles
  execute format($sql$
    create table if not exists %1$I.roles (
      id          uuid primary key default gen_random_uuid(),
      name        text not null,
      label       text not null,
      permissions jsonb not null default '{}'::jsonb,
      created_at  timestamptz not null default now(),
      updated_at  timestamptz not null default now(),
      constraint roles_name_chk check (
        name in ('super_admin', 'admin', 'manager', 'employee', 'viewer')
      ),
      unique (name)
    )
  $sql$, p_schema);

  -- users
  execute format($sql$
    create table if not exists %1$I.users (
      id            uuid primary key default gen_random_uuid(),
      auth_user_id  uuid unique,
      role_id       uuid not null references %1$I.roles (id) on delete restrict,
      name          text not null,
      email         text,
      phone         text,
      is_active     boolean not null default true,
      created_at    timestamptz not null default now(),
      updated_at    timestamptz not null default now()
    )
  $sql$, p_schema);

  execute format(
    'create index if not exists users_role_id_idx on %I.users (role_id)',
    p_schema
  );
  execute format(
    'create index if not exists users_auth_user_id_idx on %I.users (auth_user_id)',
    p_schema
  );

  -- categories
  execute format($sql$
    create table if not exists %1$I.categories (
      id          uuid primary key default gen_random_uuid(),
      name        text not null,
      description text,
      parent_id   uuid references %1$I.categories (id) on delete set null,
      sort_order  int not null default 0,
      is_active   boolean not null default true,
      created_at  timestamptz not null default now(),
      updated_at  timestamptz not null default now()
    )
  $sql$, p_schema);

  execute format(
    'create index if not exists categories_parent_id_idx on %I.categories (parent_id)',
    p_schema
  );

  -- suppliers
  execute format($sql$
    create table if not exists %1$I.suppliers (
      id               uuid primary key default gen_random_uuid(),
      supplier_code    text,
      name             text not null,
      phone            text,
      email            text,
      address          text,
      contact_person   text,
      tax_id           text,
      opening_balance  numeric(14, 2) not null default 0,
      balance          numeric(14, 2) not null default 0,
      notes            text,
      created_at       timestamptz not null default now(),
      updated_at       timestamptz not null default now(),
      unique (supplier_code)
    )
  $sql$, p_schema);

  -- supplier ledger (׳›׳¨׳˜׳¡׳× ׳¡׳₪׳§)
  execute format($sql$
    create table if not exists %1$I.supplier_ledger (
      id            uuid primary key default gen_random_uuid(),
      supplier_id   uuid not null references %1$I.suppliers (id) on delete cascade,
      entry_date    date not null,
      doc_type      text not null default '',
      description   text not null default '',
      debit         numeric(14, 2) not null default 0 check (debit >= 0),
      credit        numeric(14, 2) not null default 0 check (credit >= 0),
      reference_type text,
      reference_id  uuid,
      created_at    timestamptz not null default now()
    )
  $sql$, p_schema);

  execute format(
    'create index if not exists supplier_ledger_supplier_date_idx on %I.supplier_ledger (supplier_id, entry_date)',
    p_schema
  );

  -- customers
  execute format($sql$
    create table if not exists %1$I.customers (
      id            uuid primary key default gen_random_uuid(),
      customer_code text,
      name          text not null,
      phone         text,
      email         text,
      address       text,
      balance       numeric(14, 2) not null default 0,
      created_at    timestamptz not null default now(),
      updated_at    timestamptz not null default now(),
      unique (customer_code)
    )
  $sql$, p_schema);

  -- products
  execute format($sql$
    create table if not exists %1$I.products (
      id              uuid primary key default gen_random_uuid(),
      category_id     uuid references %1$I.categories (id) on delete set null,
      supplier_id     uuid references %1$I.suppliers (id) on delete set null,
      sku             text,
      name            text not null,
      barcode         text,
      purchase_price  numeric(14, 2) not null default 0 check (purchase_price >= 0),
      sale_price      numeric(14, 2) not null default 0 check (sale_price >= 0),
      current_stock   numeric(14, 3) not null default 0,
      min_stock       numeric(14, 3) not null default 0 check (min_stock >= 0),
      is_active       boolean not null default true,
      created_at      timestamptz not null default now(),
      updated_at      timestamptz not null default now(),
      unique (sku),
      unique (barcode)
    )
  $sql$, p_schema);

  execute format(
    'create index if not exists products_category_id_idx on %I.products (category_id)',
    p_schema
  );
  execute format(
    'create index if not exists products_supplier_id_idx on %I.products (supplier_id)',
    p_schema
  );

  -- orders
  execute format($sql$
    create table if not exists %1$I.orders (
      id           uuid primary key default gen_random_uuid(),
      customer_id  uuid references %1$I.customers (id) on delete set null,
      order_number text not null,
      status       text not null default 'open',
      subtotal     numeric(14, 2) not null default 0,
      discount     numeric(14, 2) not null default 0 check (discount >= 0),
      total        numeric(14, 2) not null default 0,
      notes        text,
      created_at   timestamptz not null default now(),
      updated_at   timestamptz not null default now(),
      delivered_at timestamptz,
      cancelled_at timestamptz,
      constraint orders_status_chk check (
        status in ('open', 'in_preparation', 'ready', 'delivered', 'cancelled')
      ),
      unique (order_number)
    )
  $sql$, p_schema);

  execute format(
    'create index if not exists orders_customer_id_idx on %I.orders (customer_id)',
    p_schema
  );
  execute format(
    'create index if not exists orders_status_idx on %I.orders (status)',
    p_schema
  );
  execute format(
    'create index if not exists orders_created_at_idx on %I.orders (created_at desc)',
    p_schema
  );

  -- order items
  execute format($sql$
    create table if not exists %1$I.order_items (
      id          uuid primary key default gen_random_uuid(),
      order_id    uuid not null references %1$I.orders (id) on delete cascade,
      product_id  uuid not null references %1$I.products (id) on delete restrict,
      quantity    numeric(14, 3) not null check (quantity > 0),
      unit_price  numeric(14, 2) not null check (unit_price >= 0),
      line_total  numeric(14, 2) not null check (line_total >= 0),
      notes       text,
      created_at  timestamptz not null default now()
    )
  $sql$, p_schema);

  execute format(
    'create index if not exists order_items_order_id_idx on %I.order_items (order_id)',
    p_schema
  );
  execute format(
    'create index if not exists order_items_product_id_idx on %I.order_items (product_id)',
    p_schema
  );

  -- inventory (per product + location)
  execute format($sql$
    create table if not exists %1$I.inventory (
      id          uuid primary key default gen_random_uuid(),
      product_id  uuid not null references %1$I.products (id) on delete cascade,
      location    text not null default 'default',
      quantity    numeric(14, 3) not null default 0,
      updated_at  timestamptz not null default now(),
      unique (product_id, location)
    )
  $sql$, p_schema);

  execute format(
    'create index if not exists inventory_product_id_idx on %I.inventory (product_id)',
    p_schema
  );

  -- inventory movements
  execute format($sql$
    create table if not exists %1$I.inventory_movements (
      id              uuid primary key default gen_random_uuid(),
      product_id      uuid not null references %1$I.products (id) on delete restrict,
      movement_type   text not null,
      quantity        numeric(14, 3) not null check (quantity > 0),
      from_location   text,
      to_location     text,
      reference_type  text,
      reference_id    uuid,
      note            text,
      created_by      uuid references %1$I.users (id) on delete set null,
      created_at      timestamptz not null default now(),
      constraint inventory_movements_type_chk check (
        movement_type in ('in', 'out', 'transfer', 'adjustment')
      )
    )
  $sql$, p_schema);

  execute format(
    'create index if not exists inventory_movements_product_id_idx on %I.inventory_movements (product_id)',
    p_schema
  );
  execute format(
    'create index if not exists inventory_movements_created_at_idx on %I.inventory_movements (created_at desc)',
    p_schema
  );

  -- payments
  execute format($sql$
    create table if not exists %1$I.payments (
      id              uuid primary key default gen_random_uuid(),
      customer_id     uuid references %1$I.customers (id) on delete set null,
      supplier_id     uuid references %1$I.suppliers (id) on delete set null,
      amount          numeric(14, 2) not null check (amount > 0),
      payment_method  text not null default 'cash',
      reference_type  text,
      reference_id    uuid,
      paid_at         timestamptz not null default now(),
      notes           text,
      created_at      timestamptz not null default now(),
      constraint payments_method_chk check (
        payment_method in ('cash', 'credit', 'bank_transfer', 'check', 'other')
      )
    )
  $sql$, p_schema);

  execute format(
    'create index if not exists payments_customer_id_idx on %I.payments (customer_id)',
    p_schema
  );
  execute format(
    'create index if not exists payments_supplier_id_idx on %I.payments (supplier_id)',
    p_schema
  );
  execute format(
    'create index if not exists payments_paid_at_idx on %I.payments (paid_at desc)',
    p_schema
  );

  -- expenses
  execute format($sql$
    create table if not exists %1$I.expenses (
      id            uuid primary key default gen_random_uuid(),
      expense_type  text not null,
      supplier_id   uuid references %1$I.suppliers (id) on delete set null,
      employee_id   uuid references %1$I.users (id) on delete set null,
      amount        numeric(14, 2) not null check (amount > 0),
      description   text not null default '',
      expense_date  date not null default current_date,
      payment_status text not null default 'unpaid',
      created_at    timestamptz not null default now(),
      updated_at    timestamptz not null default now(),
      constraint expenses_type_chk check (
        expense_type in ('supplier', 'employee', 'daily', 'investment', 'external')
      ),
      constraint expenses_payment_status_chk check (
        payment_status in ('unpaid', 'partial', 'paid')
      )
    )
  $sql$, p_schema);

  execute format(
    'create index if not exists expenses_expense_date_idx on %I.expenses (expense_date desc)',
    p_schema
  );
  execute format(
    'create index if not exists expenses_type_idx on %I.expenses (expense_type)',
    p_schema
  );

  -- income
  execute format($sql$
    create table if not exists %1$I.income (
      id           uuid primary key default gen_random_uuid(),
      income_type  text not null,
      customer_id  uuid references %1$I.customers (id) on delete set null,
      order_id     uuid references %1$I.orders (id) on delete set null,
      amount       numeric(14, 2) not null check (amount > 0),
      description  text not null default '',
      income_date  date not null default current_date,
      created_at   timestamptz not null default now(),
      updated_at   timestamptz not null default now(),
      constraint income_type_chk check (
        income_type in ('cash', 'credit', 'bank_transfer', 'other')
      )
    )
  $sql$, p_schema);

  execute format(
    'create index if not exists income_income_date_idx on %I.income (income_date desc)',
    p_schema
  );
  execute format(
    'create index if not exists income_customer_id_idx on %I.income (customer_id)',
    p_schema
  );

  -- tasks
  execute format($sql$
    create table if not exists %1$I.tasks (
      id                uuid primary key default gen_random_uuid(),
      title             text not null,
      description       text,
      assigned_user_id  uuid references %1$I.users (id) on delete set null,
      due_date          date,
      status            text not null default 'pending',
      priority          text not null default 'normal',
      created_at        timestamptz not null default now(),
      updated_at        timestamptz not null default now(),
      completed_at      timestamptz,
      constraint tasks_status_chk check (
        status in ('pending', 'in_progress', 'completed', 'cancelled')
      ),
      constraint tasks_priority_chk check (
        priority in ('low', 'normal', 'high', 'urgent')
      )
    )
  $sql$, p_schema);

  execute format(
    'create index if not exists tasks_assigned_user_id_idx on %I.tasks (assigned_user_id)',
    p_schema
  );
  execute format(
    'create index if not exists tasks_due_date_idx on %I.tasks (due_date)',
    p_schema
  );
  execute format(
    'create index if not exists tasks_status_idx on %I.tasks (status)',
    p_schema
  );

  -- notifications
  execute format($sql$
    create table if not exists %1$I.notifications (
      id         uuid primary key default gen_random_uuid(),
      user_id    uuid not null references %1$I.users (id) on delete cascade,
      title      text not null,
      body       text not null default '',
      type       text not null default 'info',
      data       jsonb not null default '{}'::jsonb,
      read_at    timestamptz,
      created_at timestamptz not null default now()
    )
  $sql$, p_schema);

  execute format(
    'create index if not exists notifications_user_id_idx on %I.notifications (user_id, created_at desc)',
    p_schema
  );
  execute format(
    'create index if not exists notifications_unread_idx on %I.notifications (user_id) where read_at is null',
    p_schema
  );

  -- documents
  execute format($sql$
    create table if not exists %1$I.documents (
      id           uuid primary key default gen_random_uuid(),
      title        text not null,
      file_path    text not null,
      mime_type    text,
      entity_type  text,
      entity_id    uuid,
      uploaded_by  uuid references %1$I.users (id) on delete set null,
      created_at   timestamptz not null default now()
    )
  $sql$, p_schema);

  execute format(
    'create index if not exists documents_entity_idx on %I.documents (entity_type, entity_id)',
    p_schema
  );

  -- settings
  execute format($sql$
    create table if not exists %1$I.settings (
      key        text primary key,
      value      jsonb not null default '{}'::jsonb,
      updated_at timestamptz not null default now()
    )
  $sql$, p_schema);

  -- updated_at trigger helper
  execute format($sql$
    create or replace function %1$I.set_updated_at()
    returns trigger
    language plpgsql
    as $fn$
    begin
      new.updated_at = now();
      return new;
    end;
    $fn$
  $sql$, p_schema);

  foreach tbl in array tables_with_updated_at
  loop
    execute format('drop trigger if exists %I_updated_at on %I.%I', tbl, p_schema, tbl);
    execute format(
      'create trigger %I_updated_at before update on %I.%I for each row execute function %I.set_updated_at()',
      tbl, p_schema, tbl, p_schema
    );
  end loop;

  execute format('drop trigger if exists inventory_updated_at on %I.inventory', p_schema);
  execute format(
    'create trigger inventory_updated_at before update on %I.inventory for each row execute function %I.set_updated_at()',
    p_schema, p_schema
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Production + Demo schemas
-- ---------------------------------------------------------------------------

select hlwait.bootstrap_schema('hlwait');
select hlwait.bootstrap_schema('hlwait_demo');

-- Seed default roles (production)
insert into hlwait.roles (name, label) values
  ('super_admin', 'Super Admin'),
  ('admin',       'Admin'),
  ('manager',     'Manager'),
  ('employee',    'Employee'),
  ('viewer',      'Viewer')
on conflict (name) do nothing;

-- Seed default roles (demo)
insert into hlwait_demo.roles (name, label) values
  ('super_admin', 'Super Admin'),
  ('admin',       'Admin'),
  ('manager',     'Manager'),
  ('employee',    'Employee'),
  ('viewer',      'Viewer')
on conflict (name) do nothing;

-- ---------------------------------------------------------------------------
-- Permissions: expose schemas to Supabase API roles
-- ---------------------------------------------------------------------------

grant usage on schema hlwait to postgres, anon, authenticated, service_role;
grant usage on schema hlwait_demo to postgres, anon, authenticated, service_role;

grant all on all tables in schema hlwait to postgres, service_role;
grant all on all tables in schema hlwait_demo to postgres, service_role;

grant select, insert, update, delete on all tables in schema hlwait to authenticated;
grant select, insert, update, delete on all tables in schema hlwait_demo to authenticated;

grant select on all tables in schema hlwait to anon;
grant select on all tables in schema hlwait_demo to anon;

alter default privileges in schema hlwait
  grant all on tables to postgres, service_role;
alter default privileges in schema hlwait
  grant select, insert, update, delete on tables to authenticated;

alter default privileges in schema hlwait_demo
  grant all on tables to postgres, service_role;
alter default privileges in schema hlwait_demo
  grant select, insert, update, delete on tables to authenticated;

-- ---------------------------------------------------------------------------
-- PostgREST: add schemas to exposed list (run manually if needed)
-- Dashboard ג†’ Settings ג†’ API ג†’ Exposed schemas: hlwait, hlwait_demo
-- Or: alter role authenticator set pgrst.db_schemas = 'public, hlwait, hlwait_demo';
-- ---------------------------------------------------------------------------

comment on schema hlwait is 'HLWAIT production ג€” isolated ERP schema';
comment on schema hlwait_demo is 'HLWAIT demo ג€” fully separated from production';
