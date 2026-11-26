/* ADMIN routes — everything except /login needs a valid admin token. */
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const pool = require('../db');
const requireAdmin = require('../middleware/auth');
const U = require('../lib/util');
const { bad, wrap } = U;

/* ---------- login (max 10 tries / 15 min per IP) ---------- */
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many login attempts. Try again in 15 minutes.' } });
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);

router.post('/login', loginLimiter, wrap(async (req, res) => {
  const { username, password } = req.body || {};
  if (typeof username !== 'string' || typeof password !== 'string') bad('Enter username and password');
  const [[a]] = await pool.query('SELECT * FROM admins WHERE username = ?', [username]);
  const ok = await bcrypt.compare(password, a ? a.password_hash : DUMMY_HASH);   // same work either way
  if (!a || !ok) bad('Wrong username or password', 401);
  const token = jwt.sign({ id: a.id, username: a.username }, process.env.JWT_SECRET, { expiresIn: '8h' });
  res.json({ token, username: a.username });
}));

router.use(requireAdmin);

/* ---------- orders ---------- */
router.get('/orders', wrap(async (req, res) => res.json(await U.loadOrders())));

async function orderOr404(code) {
  const id = U.parseOrderCode(code);
  const [o] = id >= 1 ? await U.loadOrders('WHERE o.id = ?', [id]) : [];
  if (!o) bad('Order not found', 404);
  return { id, order: o };
}

router.patch('/orders/:code/status', wrap(async (req, res) => {
  const { id } = await orderOr404(req.params.code);
  if (!U.ORDER_STATUSES.includes(req.body.status)) bad('Invalid status');
  await pool.query('UPDATE orders SET status = ? WHERE id = ?', [req.body.status, id]);
  res.json((await U.loadOrders('WHERE o.id = ?', [id]))[0]);
}));

router.patch('/orders/:code/payment', wrap(async (req, res) => {
  const { id } = await orderOr404(req.params.code);
  const { payment } = req.body;
  if (!['Paid', 'Unpaid'].includes(payment)) bad('Invalid payment status');
    await pool.query('UPDATE orders SET payment_status = ?, payment_method = ?, invoice_no = COALESCE(invoice_no, ?) WHERE id = ?',
    [payment, payment === 'Paid' ? 'Cash' : null, 'INV-' + (4000 + id), id]);
  res.json((await U.loadOrders('WHERE o.id = ?', [id]))[0]);
}));

/* generate invoice (optional discount) — totals recalculated here */
router.post('/orders/:code/invoice', wrap(async (req, res) => {
  const { id, order } = await orderOr404(req.params.code);
  const discount = Number(req.body.discount || 0);
  if (!Number.isFinite(discount) || discount < 0) bad('Discount cannot be negative');
  if (discount > order.subtotal) bad('Discount cannot exceed the subtotal');
  const t = U.calc(order.subtotal, discount);
  await pool.query('UPDATE orders SET discount = ?, tax = ?, total = ?, invoice_no = COALESCE(invoice_no, ?) WHERE id = ?',
    [t.discount, t.tax, t.total, 'INV-' + (4000 + id), id]);
  res.json((await U.loadOrders('WHERE o.id = ?', [id]))[0]);
}));

/* ---------- customers ---------- */
router.get('/customers', wrap(async (req, res) => {
  const [rows] = await pool.query('SELECT id, name, phone, email, created_at FROM customers ORDER BY created_at DESC');
  res.json(rows.map(c => ({ id: 'C' + String(c.id).padStart(3, '0'), dbId: c.id, name: c.name, phone: c.phone, email: c.email || '', joined: new Date(c.created_at).toISOString() })));
}));

/* ---------- categories ---------- */
router.post('/categories', wrap(async (req, res) => {
  const name = String(req.body.name || '').trim(), icon = String(req.body.icon || 'fa-utensils');
  if (name.length < 2 || name.length > 40) bad('Category name must be 2–40 characters');
  if (!/^fa-[a-z0-9-]+$/.test(icon)) bad('Invalid icon');
  const id = U.slug(name) || 'cat-' + Date.now();
  try { await pool.query('INSERT INTO categories (id, name, icon) VALUES (?,?,?)', [id, name, icon]); }
  catch (e) { if (e.code === 'ER_DUP_ENTRY') bad('Category already exists', 409); throw e; }
  res.status(201).json({ id, name, icon });
}));
router.put('/categories/:id', wrap(async (req, res) => {
  const name = String(req.body.name || '').trim();
  if (name.length < 2 || name.length > 40) bad('Category name must be 2–40 characters');
  try { const [r] = await pool.query('UPDATE categories SET name = ? WHERE id = ?', [name, req.params.id]); if (!r.affectedRows) bad('Category not found', 404); }
  catch (e) { if (e.code === 'ER_DUP_ENTRY') bad('Category already exists', 409); throw e; }
  res.json({ id: req.params.id, name });
}));
router.delete('/categories/:id', wrap(async (req, res) => {
  try { const [r] = await pool.query('DELETE FROM categories WHERE id = ?', [req.params.id]); if (!r.affectedRows) bad('Category not found', 404); }
  catch (e) { if (e.code === 'ER_ROW_IS_REFERENCED_2') bad('Move or delete the items in this category first', 409); throw e; }
  res.json({ ok: true });
}));

/* ---------- menu items ---------- */
function readMenuBody(b) {
  const name = String(b.name || '').trim(), desc = String(b.desc || '').trim(), price = Number(b.price), prep = U.toInt(b.prep);
  if (name.length < 2 || name.length > 80) bad('Enter a food name (2–80 characters)');
  if (desc.length < 10 || desc.length > 255) bad('Description must be 10–255 characters');
  if (!(price > 0 && price <= 100000)) bad('Enter a valid price');
  if (!(prep >= 1 && prep <= 120)) bad('Prep time must be 1–120 minutes');
  if (typeof b.cat !== 'string' || !b.cat) bad('Choose a category');
  const img = String(b.img || '');
  if (img && !/^(https?:\/\/|data:image\/(png|jpeg|webp);base64,)/.test(img)) bad('Invalid image');
  return [b.cat, name, desc, U.round2(price), b.veg ? 1 : 0, b.available === false ? 0 : 1, prep, img || null];
}
router.post('/menu', wrap(async (req, res) => {
  const v = readMenuBody(req.body), id = 'M' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 4).toUpperCase();
  try { await pool.query('INSERT INTO menu_items (id, category_id, name, description, price, is_veg, is_available, prep_minutes, image_url) VALUES (?,?,?,?,?,?,?,?,?)', [id, ...v]); }
  catch (e) { if (e.code === 'ER_NO_REFERENCED_ROW_2') bad('Category not found'); throw e; }
  const [[row]] = await pool.query('SELECT * FROM menu_items WHERE id = ?', [id]);
  res.status(201).json(U.menuItem(row));
}));
router.put('/menu/:id', wrap(async (req, res) => {
  const v = readMenuBody(req.body);
  try {
    const [r] = await pool.query('UPDATE menu_items SET category_id=?, name=?, description=?, price=?, is_veg=?, is_available=?, prep_minutes=?, image_url=? WHERE id=?', [...v, req.params.id]);
    if (!r.affectedRows) bad('Item not found', 404);
  } catch (e) { if (e.code === 'ER_NO_REFERENCED_ROW_2') bad('Category not found'); throw e; }
  const [[row]] = await pool.query('SELECT * FROM menu_items WHERE id = ?', [req.params.id]);
  res.json(U.menuItem(row));
}));
router.patch('/menu/:id', wrap(async (req, res) => {        // quick price / availability edits
  const sets = [], vals = [];
  if (req.body.price !== undefined) { const p = Number(req.body.price); if (!(p > 0 && p <= 100000)) bad('Enter a valid price'); sets.push('price = ?'); vals.push(U.round2(p)); }
  if (req.body.available !== undefined) { sets.push('is_available = ?'); vals.push(req.body.available ? 1 : 0); }
  if (!sets.length) bad('Nothing to update');
  const [r] = await pool.query(`UPDATE menu_items SET ${sets.join(', ')} WHERE id = ?`, [...vals, req.params.id]);
  if (!r.affectedRows) bad('Item not found', 404);
  const [[row]] = await pool.query('SELECT * FROM menu_items WHERE id = ?', [req.params.id]);
  res.json(U.menuItem(row));
}));
router.delete('/menu/:id', wrap(async (req, res) => {
  const [r] = await pool.query('DELETE FROM menu_items WHERE id = ?', [req.params.id]);
  if (!r.affectedRows) bad('Item not found', 404);
  res.json({ ok: true });
}));

/* ---------- tables ---------- */
function readTableBody(b) {
  const number = U.toInt(b.number), seats = U.toInt(b.seats);
  if (!(number >= 1 && number <= 999)) bad('Enter a table number (1–999)');
  if (!(seats >= 1 && seats <= 20)) bad('Seats must be 1–20');
  if (!U.TABLE_AREAS.includes(b.area)) bad('Invalid area');
  if (!U.TABLE_STATUSES.includes(b.status)) bad('Invalid status');
  return [number, seats, b.area, b.status];
}
router.post('/tables', wrap(async (req, res) => {
  const v = readTableBody(req.body);
  try { const [r] = await pool.query('INSERT INTO restaurant_tables (table_number, seats, area, status) VALUES (?,?,?,?)', v);
    const [[row]] = await pool.query('SELECT * FROM restaurant_tables WHERE id = ?', [r.insertId]); res.status(201).json(U.table(row)); }
  catch (e) { if (e.code === 'ER_DUP_ENTRY') bad('This table number already exists', 409); throw e; }
}));
router.put('/tables/:id', wrap(async (req, res) => {
  const v = readTableBody(req.body), id = U.toInt(req.params.id);
  try { const [r] = await pool.query('UPDATE restaurant_tables SET table_number=?, seats=?, area=?, status=? WHERE id=?', [...v, id]); if (!r.affectedRows) bad('Table not found', 404); }
  catch (e) { if (e.code === 'ER_DUP_ENTRY') bad('This table number already exists', 409); throw e; }
  const [[row]] = await pool.query('SELECT * FROM restaurant_tables WHERE id = ?', [id]);
  res.json(U.table(row));
}));
router.patch('/tables/:id/status', wrap(async (req, res) => {
  const id = U.toInt(req.params.id);
  if (!U.TABLE_STATUSES.includes(req.body.status)) bad('Invalid status');
  const [r] = await pool.query('UPDATE restaurant_tables SET status = ? WHERE id = ?', [req.body.status, id]);
  if (!r.affectedRows) bad('Table not found', 404);
  const [[row]] = await pool.query('SELECT * FROM restaurant_tables WHERE id = ?', [id]);
  res.json(U.table(row));
}));
router.delete('/tables/:id', wrap(async (req, res) => {
  try { const [r] = await pool.query('DELETE FROM restaurant_tables WHERE id = ?', [U.toInt(req.params.id)]); if (!r.affectedRows) bad('Table not found', 404); }
  catch (e) { if (e.code === 'ER_ROW_IS_REFERENCED_2') bad('This table has past orders, so it cannot be deleted. Set it to Cleaning/Reserved instead.', 409); throw e; }
  res.json({ ok: true });
}));

module.exports = router;
