const pool = require('../db');

const TAX_RATE = 0.05;
const ORDER_STATUSES = ['Pending', 'Confirmed', 'Preparing', 'Ready', 'Served'];
const TABLE_STATUSES = ['Available', 'Occupied', 'Reserved', 'Cleaning'];
const TABLE_AREAS = ['Indoor', 'Outdoor', 'Family', 'VIP'];
const PAY_METHODS = ['UPI', 'Card', 'Cash'];

class HttpError extends Error { constructor(status, message) { super(message); this.status = status; } }
const bad = (msg, status = 400) => { throw new HttpError(status, msg); };
const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);   // async errors → error handler

const round2 = n => Math.round((n + Number.EPSILON) * 100) / 100;
const calc = (subtotal, discount = 0) => {
  const taxable = Math.max(0, subtotal - discount), tax = round2(taxable * TAX_RATE);
  return { subtotal: round2(subtotal), discount: round2(discount), tax, total: round2(taxable + tax) };
};

const isPhone = v => /^[6-9]\d{9}$/.test(String(v || ''));
const cleanName = v => String(v || '').trim();
const validName = v => /^[A-Za-z .'-]{2,80}$/.test(v);
const toInt = v => (/^-?\d+$/.test(String(v)) ? parseInt(v, 10) : NaN);
const slug = s => String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

/* ---- ids shown to the user:  ORD-1001 ... ---- */
const orderCode = id => 'ORD-' + (1000 + id);
const parseOrderCode = s => { const m = /^ORD-(\d+)$/.exec(String(s)); return m ? parseInt(m[1], 10) - 1000 : NaN; };

/* ---- DB rows → the same shapes the frontend already uses ---- */
const menuItem = r => ({ id: r.id, name: r.name, cat: r.category_id, price: r.price, veg: !!r.is_veg, desc: r.description,
  prep: r.prep_minutes, rating: r.rating, available: !!r.is_available, img: r.image_url || '' });
const table = r => ({ id: 'T' + r.id, dbId: r.id, number: r.table_number, seats: r.seats, area: r.area, status: r.status });

async function loadOrders(where = '', params = [], q = pool) {
  const [rows] = await q.query(
    `SELECT o.*, c.name AS customer_name, c.phone, t.table_number
       FROM orders o JOIN customers c ON c.id = o.customer_id JOIN restaurant_tables t ON t.id = o.table_id
       ${where} ORDER BY o.created_at DESC, o.id DESC`, params);
  if (!rows.length) return [];
  const [items] = await q.query('SELECT * FROM order_items WHERE order_id IN (?)', [rows.map(r => r.id)]);
  return rows.map(r => ({
    id: orderCode(r.id), customerId: r.customer_id, customerName: r.customer_name, phone: r.phone, table: r.table_number,
    items: items.filter(i => i.order_id === r.id).map(i => ({ id: i.menu_item_id, name: i.item_name, price: i.unit_price, qty: i.quantity })),
    subtotal: r.subtotal, discount: r.discount, tax: r.tax, total: r.total,
    status: r.status, payment: r.payment_status, method: r.payment_method, note: r.note || '',
    invoiceNo: r.invoice_no, createdAt: new Date(r.created_at).toISOString()
  }));
}

module.exports = { HttpError, bad, wrap, round2, calc, isPhone, cleanName, validName, toInt, slug, orderCode, parseOrderCode,
  menuItem, table, loadOrders, ORDER_STATUSES, TABLE_STATUSES, TABLE_AREAS, PAY_METHODS };
