/* PUBLIC routes — used by the Customer panel (no login). */
const router = require('express').Router();
const pool = require('../db');
const U = require('../lib/util');
const { bad, wrap } = U;

router.get('/categories', wrap(async (req, res) => {
  const [rows] = await pool.query('SELECT id, name, icon FROM categories ORDER BY name');
  res.json(rows);
}));

router.get('/menu', wrap(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM menu_items ORDER BY rating DESC, name');
  res.json(rows.map(U.menuItem));
}));

router.get('/tables', wrap(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM restaurant_tables ORDER BY table_number');
  res.json(rows.map(U.table));
}));

/* QR scan: is this table number valid and open for guests? */
router.get('/tables/:number/scan', wrap(async (req, res) => {
  const n = U.toInt(req.params.number);
  const [[t]] = await pool.query('SELECT * FROM restaurant_tables WHERE table_number = ?', [n]);
  if (!t) bad('Table not found', 404);
  if (t.status === 'Reserved') bad('This table is reserved', 409);
  if (t.status === 'Cleaning') bad('This table is being cleaned', 409);
  res.json(U.table(t));
}));

/* Place an order. Prices and totals are ALWAYS calculated here on the server. */
router.post('/orders', wrap(async (req, res) => {
  const { tableNumber, customer = {}, items, note } = req.body || {};
  const tNo = U.toInt(tableNumber), name = U.cleanName(customer.name), phone = String(customer.phone || '').replace(/\s/g, '');
  if (!(tNo >= 1)) bad('Invalid table');
  if (!U.validName(name)) bad('Enter a valid name (letters only)');
  if (!U.isPhone(phone)) bad('Enter a valid 10-digit mobile number');
  if (!Array.isArray(items) || !items.length || items.length > 40) bad('Your cart is empty');
  if (note && String(note).length > 140) bad('Note is too long');

  // merge duplicate lines and validate quantities
  const qty = new Map();
  for (const i of items) {
    const q = U.toInt(i && i.qty);
    if (!i || typeof i.id !== 'string' || !(q >= 1 && q <= 20)) bad('Invalid item in cart');
    qty.set(i.id, Math.min(20, (qty.get(i.id) || 0) + q));
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[t]] = await conn.query('SELECT * FROM restaurant_tables WHERE table_number = ? FOR UPDATE', [tNo]);
    if (!t) bad('Table not found', 404);
    if (t.status === 'Reserved' || t.status === 'Cleaning') bad('This table is not open for orders right now', 409);

    let [[cust]] = await conn.query('SELECT * FROM customers WHERE phone = ?', [phone]);
    if (!cust) { const [r] = await conn.query('INSERT INTO customers (name, phone) VALUES (?, ?)', [name, phone]); cust = { id: r.insertId }; }

    const [menu] = await conn.query('SELECT * FROM menu_items WHERE id IN (?)', [[...qty.keys()]]);
    if (menu.length !== qty.size) bad('Some items are no longer on the menu');
    const unavailable = menu.filter(m => !m.is_available);
    if (unavailable.length) bad(`Not available right now: ${unavailable.map(m => m.name).join(', ')}`, 409);

    const subtotal = menu.reduce((s, m) => s + m.price * qty.get(m.id), 0);
    const t2 = U.calc(subtotal);
    const [o] = await conn.query(
      'INSERT INTO orders (customer_id, table_id, note, subtotal, discount, tax, total) VALUES (?,?,?,?,?,?,?)',
      [cust.id, t.id, note ? String(note).trim() : null, t2.subtotal, 0, t2.tax, t2.total]);
    await conn.query('INSERT INTO order_items (order_id, menu_item_id, item_name, unit_price, quantity) VALUES ?',
      [menu.map(m => [o.insertId, m.id, m.name, m.price, qty.get(m.id)])]);
    if (t.status !== 'Occupied') await conn.query("UPDATE restaurant_tables SET status = 'Occupied' WHERE id = ?", [t.id]);

    await conn.commit();
    const [order] = await U.loadOrders('WHERE o.id = ?', [o.insertId]);
    res.status(201).json(order);
  } catch (e) { await conn.rollback(); throw e; }
  finally { conn.release(); }
}));

/* Customer tracking: order code + the phone used to order (so strangers can't browse orders). */
router.get('/orders/:code', wrap(async (req, res) => {
  const id = U.parseOrderCode(req.params.code), phone = String(req.query.phone || '');
  if (!(id >= 1) || !U.isPhone(phone)) bad('Order not found', 404);
  const [order] = await U.loadOrders('WHERE o.id = ? AND c.phone = ?', [id, phone]);
  if (!order) bad('Order not found', 404);
  res.json(order);
}));

/* All orders of one customer (history) */
router.get('/my-orders', wrap(async (req, res) => {
  const phone = String(req.query.phone || '');
  if (!U.isPhone(phone)) bad('Enter a valid phone number');
  res.json(await U.loadOrders('WHERE c.phone = ?', [phone]));
}));

/* Customer pays online (demo) or chooses to pay at the counter */
router.post('/orders/:code/pay', wrap(async (req, res) => {
  const id = U.parseOrderCode(req.params.code), phone = String(req.body.phone || ''), method = req.body.method;
  if (!U.PAY_METHODS.includes(method)) bad('Choose a payment method');
  const [order] = await U.loadOrders('WHERE o.id = ? AND c.phone = ?', [id, phone]);
  if (!order) bad('Order not found', 404);
  if (order.payment === 'Paid') bad('Already paid', 409);
  const paid = method !== 'Cash';                      // cash = pay at counter, admin marks it paid
  await pool.query('UPDATE orders SET payment_method = ?, payment_status = ?, invoice_no = COALESCE(invoice_no, ?) WHERE id = ?',
    [method, paid ? 'Paid' : 'Unpaid', 'INV-' + (4000 + id), id]);
  const [updated] = await U.loadOrders('WHERE o.id = ?', [id]);
  res.json(updated);
}));

module.exports = router;
