-- Sweet DEMO seed — sample data for schema "demo" only (isolated from production).
-- Safe to re-run: deterministic UUIDs + ON CONFLICT.

select hlwait.bootstrap_schema('demo');

do $$
declare
  v_role_admin      uuid;
  v_role_manager    uuid;
  v_role_employee   uuid;
  v_user_admin      uuid := 'a1000001-0001-4001-8001-000000000001';
  v_user_manager    uuid := 'a1000001-0001-4001-8001-000000000002';
  v_user_employee   uuid := 'a1000001-0001-4001-8001-000000000003';
  v_cat_cakes       uuid := 'b2000001-0001-4001-8001-000000000001';
  v_cat_pastries    uuid := 'b2000001-0001-4001-8001-000000000002';
  v_cat_beverages   uuid := 'b2000001-0001-4001-8001-000000000003';
  v_cat_raw         uuid := 'b2000001-0001-4001-8001-000000000004';
  v_sup_flour       uuid := 'c3000001-0001-4001-8001-000000000001';
  v_sup_dairy       uuid := 'c3000001-0001-4001-8001-000000000002';
  v_sup_packaging   uuid := 'c3000001-0001-4001-8001-000000000003';
  v_cust_retail     uuid := 'd4000001-0001-4001-8001-000000000001';
  v_cust_catering   uuid := 'd4000001-0001-4001-8001-000000000002';
  v_cust_hotel      uuid := 'd4000001-0001-4001-8001-000000000003';
  v_cust_wedding    uuid := 'd4000001-0001-4001-8001-000000000004';
  v_cust_walkin     uuid := 'd4000001-0001-4001-8001-000000000005';
  v_prod_choco      uuid := 'e5000001-0001-4001-8001-000000000001';
  v_prod_cheesecake uuid := 'e5000001-0001-4001-8001-000000000002';
  v_prod_croissant  uuid := 'e5000001-0001-4001-8001-000000000003';
  v_prod_sabich     uuid := 'e5000001-0001-4001-8001-000000000004';
  v_prod_coffee     uuid := 'e5000001-0001-4001-8001-000000000005';
  v_prod_flour25    uuid := 'e5000001-0001-4001-8001-000000000006';
  v_order_1         uuid := 'f6000001-0001-4001-8001-000000000001';
  v_order_2         uuid := 'f6000001-0001-4001-8001-000000000002';
  v_order_3         uuid := 'f6000001-0001-4001-8001-000000000003';
  v_order_4         uuid := 'f6000001-0001-4001-8001-000000000004';
  v_order_5         uuid := 'f6000001-0001-4001-8001-000000000005';
begin
  select id into v_role_admin from demo.roles where name = 'admin';
  select id into v_role_manager from demo.roles where name = 'manager';
  select id into v_role_employee from demo.roles where name = 'employee';

  insert into demo.users (id, role_id, name, email, phone, is_active) values
    (v_user_admin,    v_role_admin,    'מנהל מערכת',   'admin@sweet.demo',    '050-1000001', true),
    (v_user_manager,  v_role_manager,  'רונית כהן',    'ronit@sweet.demo',    '050-1000002', true),
    (v_user_employee, v_role_employee, 'יוסי לוי',    'yossi@sweet.demo',    '050-1000003', true)
  on conflict (id) do nothing;

  insert into demo.categories (id, name, description, sort_order) values
    (v_cat_cakes,     'עוגות',        'עוגות מעוצבות ושכבות', 1),
    (v_cat_pastries,  'מאפים',        'מאפים טריים יומיים',   2),
    (v_cat_beverages, 'משקאות',       'קפה ושתייה קרה',       3),
    (v_cat_raw,       'חומרי גלם',    'מלאי מטבח וייצור',     4)
  on conflict (id) do nothing;

  insert into demo.suppliers (
    id, supplier_code, name, phone, email, address, contact_person, opening_balance, balance, notes
  ) values
    (v_sup_flour,     'SUP-001', 'טחנות הקמח',     '03-5551001', 'sales@flour.demo',     'רחוב התעשייה 12, חולון',  'משה בר',   5000,  8200,  'אספקה שבועית'),
    (v_sup_dairy,     'SUP-002', 'מחלבות השרון',   '09-5552002', 'orders@dairy.demo',    'אזור תעשייה נתניה',       'דנה Weiss', 0,    3400,  'חלב וגבינות'),
    (v_sup_packaging, 'SUP-003', 'אריזות פלוס',    '04-5553003', 'info@pack.demo',       'קרית אתא',                'אלי Pack',  1200,  950,   'קופסאות ונייר')
  on conflict (id) do nothing;

  insert into demo.supplier_ledger (supplier_id, entry_date, doc_type, description, debit, credit) values
    (v_sup_flour,     '2026-05-01', 'חשבונית', 'אספקת קמח — מאי',        4100, 0),
    (v_sup_flour,     '2026-05-15', 'תשלום',   'העברה בנקאית',           0,    2000),
    (v_sup_dairy,     '2026-05-10', 'חשבונית', 'גבינות ושמנת',           3400, 0),
    (v_sup_packaging, '2026-05-05', 'חשבונית', 'אריזות חודשיות',         950,  0)
  on conflict do nothing;

  insert into demo.customers (id, customer_code, name, phone, email, address, balance) values
    (v_cust_retail,   'CUS-001', 'קונדיטוריית השכונה', '052-2000001', 'shop@demo.local',    'רחוב הרצל 5, תל אביב',     1250),
    (v_cust_catering, 'CUS-002', 'קייטרינג VIP',       '052-2000002', 'vip@catering.demo',  'משמר haSharon',            4800),
    (v_cust_hotel,    'CUS-003', 'מלון הים',           '04-2000003',  'fb@sea-hotel.demo',  'טיילת נתניה',              2100),
    (v_cust_wedding,  'CUS-004', 'אירועי זהב',         '058-2000004', 'events@gold.demo',     'ראשון לציון',              0),
    (v_cust_walkin,   'CUS-005', 'לקוח מזדמן',         null,          null,                 null,                       0)
  on conflict (id) do nothing;

  insert into demo.products (
    id, category_id, supplier_id, sku, name, barcode,
    purchase_price, sale_price, current_stock, min_stock, is_active
  ) values
    (v_prod_choco,      v_cat_cakes,     v_sup_dairy,     'PRD-001', 'עוגת שוקולד 24cm',  '7290000001001', 45,  180, 12,  3,  true),
    (v_prod_cheesecake, v_cat_cakes,     v_sup_dairy,     'PRD-002', 'עוגת גבינה NY',     '7290000001002', 38,  160, 8,   2,  true),
    (v_prod_croissant,  v_cat_pastries,  v_sup_flour,     'PRD-003', 'קרואסון חמאה',      '7290000001003', 3.5, 14,  120, 30, true),
    (v_prod_sabich,     v_cat_pastries,  null,            'PRD-004', 'בורקס תפוחי אדמה',  '7290000001004', 2,   9,   80,  20, true),
    (v_prod_coffee,     v_cat_beverages, null,            'PRD-005', 'קפה אמריקano',      '7290000001005', 1.2, 12,  999, 0,  true),
    (v_prod_flour25,    v_cat_raw,       v_sup_flour,     'PRD-006', 'קמח 25kg',          '7290000001006', 85,  0,   40,  10, true)
  on conflict (id) do nothing;

  insert into demo.inventory (product_id, location, quantity) values
    (v_prod_choco,      'חדר קירור', 12),
    (v_prod_cheesecake, 'חדר קירור', 8),
    (v_prod_croissant,  'מדף מכירה', 120),
    (v_prod_sabich,     'מדף מכירה', 80),
    (v_prod_flour25,    'מחסן',      40)
  on conflict (product_id, location) do update set quantity = excluded.quantity;

  insert into demo.inventory_movements (
    product_id, movement_type, quantity, from_location, to_location, note, created_by
  ) values
    (v_prod_flour25,    'in',         50,  null,          'מחסן',      'קבלת משלוח מטחנות הקמח', v_user_manager),
    (v_prod_croissant,  'out',        30,  'מדף מכירה',   null,        'מכירה יומית',            v_user_employee),
    (v_prod_choco,      'transfer',   2,   'חדר קירור',   'מדף תצוגה', 'העברה לאירוע',           v_user_employee),
    (v_prod_cheesecake, 'adjustment', 1,   null,          'חדר קירור', 'תיקון ספירה',            v_user_manager)
  on conflict do nothing;

  insert into demo.orders (
    id, customer_id, order_number, status, subtotal, discount, total, notes, delivered_at
  ) values
    (v_order_1, v_cust_catering, 'ORD-2026-001', 'delivered',       960,  0,   960,  'מגשי עוגות לאירוע',        '2026-05-20 14:00:00+00'),
    (v_order_2, v_cust_hotel,    'ORD-2026-002', 'ready',           450,  50,  400,  'מאפים בוקר — מלון הים',    null),
    (v_order_3, v_cust_wedding,  'ORD-2026-003', 'in_preparation',  1800, 0,   1800, 'עוגת חתונה + קינוחים',     null),
    (v_order_4, v_cust_retail,   'ORD-2026-004', 'open',            320,  0,   320,  'הזמנה שבועית',             null),
    (v_order_5, v_cust_walkin,   'ORD-2026-005', 'cancelled',       42,   0,   42,   'בוטל — לקוח לא הגיע',      null)
  on conflict (id) do nothing;

  insert into demo.order_items (order_id, product_id, quantity, unit_price, line_total) values
    (v_order_1, v_prod_choco,      4,  180, 720),
    (v_order_1, v_prod_cheesecake, 1,  160, 160),
    (v_order_1, v_prod_coffee,     8,  12,  96),
    (v_order_2, v_prod_croissant,  30, 14,  420),
    (v_order_2, v_prod_sabich,     10, 9,   90),
    (v_order_3, v_prod_choco,      6,  180, 1080),
    (v_order_3, v_prod_cheesecake, 4,  160, 640),
    (v_order_3, v_prod_croissant,  20, 14,  280),
    (v_order_4, v_prod_sabich,     20, 9,   180),
    (v_order_4, v_prod_croissant,  10, 14,  140),
    (v_order_5, v_prod_coffee,     2,  12,  24),
    (v_order_5, v_prod_croissant,  1,  14,  14)
  on conflict do nothing;

  insert into demo.payments (customer_id, supplier_id, amount, payment_method, reference_type, reference_id, paid_at, notes) values
    (v_cust_catering, null,          960,  'bank_transfer', 'order', v_order_1, '2026-05-21 10:00:00+00', 'תשלום מלא — אירוע VIP'),
    (v_cust_hotel,    null,          200,  'credit',        'order', v_order_2, '2026-05-22 09:00:00+00', 'מקדמה'),
    (null,            v_sup_flour,   2000, 'bank_transfer', null,    null,      '2026-05-15 11:00:00+00', 'תשלום לספק קמח'),
    (v_cust_retail,   null,          500,  'cash',          null,    null,      '2026-05-18 16:30:00+00', 'תשלום חוב קודם')
  on conflict do nothing;

  insert into demo.income (income_type, customer_id, order_id, amount, description, income_date) values
    ('bank_transfer', v_cust_catering, v_order_1, 960,  'הכנסה מהזמנה ORD-2026-001', '2026-05-21'),
    ('credit',        v_cust_hotel,    v_order_2, 200,  'מקדמה מלון הים',            '2026-05-22'),
    ('cash',          v_cust_retail,   null,      500,  'תשלום מזומן — קונדיטוריה',  '2026-05-18'),
    ('cash',          null,            null,      850,  'מכירות דלפק יומיות',        '2026-05-23'),
    ('other',         null,            null,      120,  'החזר אריזות',               '2026-05-19')
  on conflict do nothing;

  insert into demo.expenses (expense_type, supplier_id, employee_id, amount, description, expense_date, payment_status) values
    ('supplier',  v_sup_flour,     null,            4100, 'חשבונית קמח — מאי',           '2026-05-01', 'partial'),
    ('supplier',  v_sup_dairy,     null,            3400, 'גבינות ושמנת',                '2026-05-10', 'unpaid'),
    ('employee',  null,            v_user_employee, 4500, 'משכורת יוסי — מאי',           '2026-05-01', 'paid'),
    ('daily',     null,            null,            280,  'חשמל + מים',                  '2026-05-05', 'paid'),
    ('investment',null,            null,            12000,'תנור convection חדש',         '2026-05-12', 'paid'),
    ('external',  null,            null,            650,  'שירותי הדברה',                '2026-05-08', 'paid')
  on conflict do nothing;

  insert into demo.tasks (title, description, assigned_user_id, due_date, status, priority) values
    ('הכנת עוגת חתונה',       '3 קומות שוקולד-vanilla, דקורציה לבנה',  v_user_employee, '2026-05-28', 'in_progress', 'urgent'),
    ('ספירת מלאי שבועית',     'ספירת חומרי גלם במחסן',                  v_user_manager,  '2026-05-25', 'pending',     'high'),
    ('הזמנת קמח',             'להזמין 100 שקים לפני סוף החודש',         v_user_manager,  '2026-05-30', 'pending',     'normal'),
    ('ניקוי חדר קירור',       'ניקוי יסודי + בדיקת טמפרטורות',         v_user_employee, '2026-05-24', 'completed',   'normal'),
    ('עדכון תפריט קיץ',       'הוספת קינוחי פירות עונתיים',            v_user_admin,    '2026-06-05', 'pending',     'low')
  on conflict do nothing;

  insert into demo.settings (key, value) values
    ('business_name', '{"he": "Sweet Demo — קונדיטוריה", "en": "Sweet Demo Bakery"}'::jsonb),
    ('currency',      '{"code": "ILS", "symbol": "₪"}'::jsonb),
    ('tax_rate',      '{"vat_percent": 17}'::jsonb),
    ('order_prefix',  '{"prefix": "ORD-2026-"}'::jsonb)
  on conflict (key) do update set value = excluded.value, updated_at = now();

end $$;
