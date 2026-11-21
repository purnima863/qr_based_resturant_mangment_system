/* =====================================================
   COMMON.JS — helpers shared by both panels
   ===================================================== */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = n => '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const moneyShort = n => '₹' + Math.round(n || 0).toLocaleString('en-IN');
const fmtDate = d => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtTime = d => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
const fmtDateTime = d => fmtDate(d) + ', ' + fmtTime(d);
const dayKey = d => { d = new Date(d); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const uid = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
const debounce = (fn, ms = 250) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const initials = n => String(n).split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
const slug = s => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

/* ---------- images (with graceful fallback) ---------- */
const CAT_EMOJI = { pizza: '🍕', burger: '🍔', indian: '🍛', snacks: '🍟', drinks: '🥤', desserts: '🍰' };
function placeholderImg(cat) {
  const e = CAT_EMOJI[cat] || '🍽️';
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='450'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#f6d9a8'/><stop offset='1' stop-color='#e58f6e'/></linearGradient></defs><rect width='600' height='450' fill='url(#g)'/><text x='50%' y='54%' font-size='150' text-anchor='middle' dominant-baseline='middle'>${e}</text></svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}
function imgFail(el) { el.onerror = null; el.src = placeholderImg(el.dataset.cat); }
function foodImg(item, cls = '') {
  return `<img class="${cls}" src="${esc(item.img || placeholderImg(item.cat))}" alt="${esc(item.name)}" data-cat="${esc(item.cat)}" loading="lazy" onerror="imgFail(this)">`;
}

/* ---------- badges ---------- */
const statusBadge = s => `<span class="badge st-${String(s).toLowerCase()}">${esc(s)}</span>`;

/* ---------- Toast ---------- */
const Toast = {
  show(msg, type = 'success') {
    let wrap = $('#toast-wrap');
    if (!wrap) { wrap = document.createElement('div'); wrap.id = 'toast-wrap'; document.body.appendChild(wrap); }
    const icon = { success: 'fa-circle-check', error: 'fa-circle-exclamation', info: 'fa-circle-info' }[type];
    const t = document.createElement('div'); t.className = 'toast ' + type;
    t.innerHTML = `<i class="fa-solid ${icon}"></i><span>${esc(msg)}</span>`;
    wrap.appendChild(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, 2800);
  }
};

/* ---------- Modal ---------- */
const Modal = {
  current: null,
  open({ title = '', body = '', footer = null, size = 'md', onClose } = {}) {
    this.close(true);
    const o = document.createElement('div'); o.className = 'modal-overlay';
    o.innerHTML = `<div class="modal modal-${size}" role="dialog" aria-modal="true">
      <div class="modal-head"><h3>${title}</h3><button class="icon-btn" data-close aria-label="Close"><i class="fa-solid fa-xmark"></i></button></div>
      <div class="modal-body"></div>${footer !== null ? '<div class="modal-foot"></div>' : ''}</div>`;
    const set = (sel, c) => { const el = $(sel, o); if (!el) return; typeof c === 'string' ? el.innerHTML = c : el.appendChild(c); };
    set('.modal-body', body); if (footer !== null) set('.modal-foot', footer);
    o.addEventListener('mousedown', e => { if (e.target === o) Modal.close(); });
    o.addEventListener('click', e => { if (e.target.closest('[data-close]')) Modal.close(); });
    document.body.appendChild(o); document.body.style.overflow = 'hidden';
    this.current = { el: o, onClose };
    return o;
  },
  close(silent) {
    if (!this.current) return;
    const { el, onClose } = this.current; el.remove(); this.current = null;
    document.body.style.overflow = ''; if (!silent && onClose) onClose();
  },
  confirm({ title = 'Are you sure?', message = '', okText = 'Confirm', danger = false } = {}) {
    return new Promise(res => {
      const o = this.open({
        title, size: 'sm', body: `<p class="muted">${message}</p>`,
        footer: `<button class="btn btn-outline" data-close>Cancel</button><button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" id="cf-ok">${okText}</button>`,
        onClose: () => res(false)
      });
      $('#cf-ok', o).onclick = () => { this.current.onClose = null; this.close(true); res(true); };
    });
  }
};
document.addEventListener('keydown', e => { if (e.key === 'Escape') Modal.close(); });

/* ---------- Form validation ----------
   Form.validate(formEl, { fieldName: v => 'error message' | '' })
   Returns an object of values or null when invalid. Each input must sit in .field */
const Form = {
  validate(form, rules) {
    let ok = true, first = null; const values = {};
    Object.keys(rules).forEach(name => {
      const input = form.elements[name]; if (!input) return;
      const v = (input.type === 'checkbox' ? input.checked : String(input.value).trim());
      values[name] = v;
      const msg = rules[name](v, form);
      Form.mark(input, msg);
      if (msg) { ok = false; first = first || input; }
    });
    if (first) first.focus();
    return ok ? values : null;
  },
  mark(input, msg) {
    const f = input.closest('.field'); if (!f) return;
    f.classList.toggle('invalid', !!msg); const e = $('.err', f); if (e) e.textContent = msg || '';
  },
  clearOnInput(form) {
    form.addEventListener('input', e => { const f = e.target.closest('.field'); if (f) f.classList.remove('invalid'); });
  }
};
const isPhone = v => /^[6-9]\d{9}$/.test(String(v).replace(/[\s-]/g, ''));
const isEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

/* ---------- Invoice (used by Customer bill + Admin billing) ---------- */
function invoiceHTML(o) {
  const t = calc(o.items, o.discount || 0);
  const half = (t.tax / 2).toFixed(2);
  return `<div class="invoice">
    <div class="stamp ${o.payment === 'Paid' ? 'paid' : 'unpaid'}">${esc(o.payment)}</div>
    <div class="inv-head">
      <div class="inv-brand"><div class="logo"><i class="fa-solid fa-utensils"></i></div>
        <div><h2>${esc(RESTAURANT.name)}</h2><div class="muted small">${esc(RESTAURANT.address)}<br>${esc(RESTAURANT.phone)} · GSTIN ${esc(RESTAURANT.gstin)}</div></div></div>
      <div class="inv-meta"><strong>${o.invoiceNo ? esc(o.invoiceNo) : 'TAX INVOICE'}</strong><br>Order <b>${esc(o.id)}</b><br>${fmtDateTime(o.createdAt)}</div>
    </div>
    <div class="inv-info">
      <div><span>Billed to</span><b>${esc(o.customerName)}</b></div>
      <div><span>Phone</span><b>${esc(o.phone || '—')}</b></div>
      <div><span>Table</span><b>Table ${esc(o.table)}</b></div>
      <div><span>Payment</span><b>${esc(o.payment)}${o.method ? ' · ' + esc(o.method) : ''}</b></div>
    </div>
    <table><thead><tr><th>Item</th><th class="r">Qty</th><th class="r">Price</th><th class="r">Amount</th></tr></thead><tbody>
      ${o.items.map(i => `<tr><td>${esc(i.name)}</td><td class="r">${i.qty}</td><td class="r">${money(i.price)}</td><td class="r">${money(i.price * i.qty)}</td></tr>`).join('')}
    </tbody></table>
    <div class="inv-totals">
      <div><span>Subtotal</span><span>${money(t.subtotal)}</span></div>
      ${t.discount ? `<div><span>Discount</span><span>− ${money(t.discount)}</span></div>` : ''}
      <div><span>CGST (${TAX_RATE * 50}%)</span><span>${money(half)}</span></div>
      <div><span>SGST (${TAX_RATE * 50}%)</span><span>${money(half)}</span></div>
      <div class="grand"><span>Grand Total</span><span>${money(t.total)}</span></div>
    </div>
    <div class="inv-foot">Thank you for dining with ${esc(RESTAURANT.name)}! · This is a computer-generated invoice.</div>
  </div>`;
}

/* Print any HTML block using a hidden #print-area (CSS in base.css) */
function printHTML(html) {
  let area = $('#print-area');
  if (!area) { area = document.createElement('div'); area.id = 'print-area'; document.body.appendChild(area); }
  area.innerHTML = html; document.body.classList.add('printing');
  const done = () => { document.body.classList.remove('printing'); area.innerHTML = ''; window.removeEventListener('afterprint', done); };
  window.addEventListener('afterprint', done);
  setTimeout(() => window.print(), 80);
}

/* ---------- order helpers ---------- */
const nextOrderId = orders => 'ORD-' + (orders.reduce((m, o) => Math.max(m, parseInt(o.id.split('-')[1]) || 0), 1000) + 1);
const isPaid = o => o.payment === 'Paid';
const revenueOf = orders => orders.filter(isPaid).reduce((s, o) => s + o.total, 0);
