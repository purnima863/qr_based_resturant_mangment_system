/* =====================================================
   BILLING.JS (admin) — bills list, invoice generation, print, payment
   ===================================================== */
Admin.init('billing', 'Billing Management');
const PAGE = 12; let page = 1;
$('#q').value = new URLSearchParams(location.search).get('q') || '';

function stats() {
  const o = Store.orders(), paid = o.filter(isPaid), unpaid = o.filter(x => !isPaid(x));
  $('#stats').innerHTML = [['Total billed', moneyShort(o.reduce((s, x) => s + x.total, 0)), 'fa-file-invoice-dollar', 'brand'], ['Collected', moneyShort(revenueOf(o)), 'fa-circle-check', 'green'],
    ['Outstanding', moneyShort(unpaid.reduce((s, x) => s + x.total, 0)), 'fa-clock', 'red'], ['Unpaid bills', unpaid.length, 'fa-receipt', 'amber']]
    .map(c => `<div class="card stat"><div class="ico ico-${c[3]}"><i class="fa-solid ${c[2]}"></i></div><div><div class="lbl">${c[0]}</div><div class="val">${c[1]}</div></div></div>`).join('');
}

function render() {
  stats();
  const q = $('#q').value.trim().toLowerCase(), p = $('#f-pay').value;
  const list = Store.orders().filter(o => (p === 'all' || o.payment === p) && (!q || (o.id + (o.invoiceNo || '') + o.customerName).toLowerCase().includes(q)))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  page = renderPager($('#pager'), list.length, page, PAGE, n => { page = n; render(); });
  $('#rows').innerHTML = list.slice((page - 1) * PAGE, page * PAGE).map(o => `<tr>
    <td>${o.invoiceNo ? `<b>${o.invoiceNo}</b>` : '<span class="muted">Not generated</span>'}</td><td><b>${o.id}</b></td><td>${esc(o.customerName)}</td><td>Table ${o.table}</td>
    <td class="muted">${fmtDate(o.createdAt)}</td><td>${money(o.subtotal - (o.discount || 0))}</td><td>${money(o.tax)}</td><td><b>${money(o.total)}</b></td><td>${statusBadge(o.payment)}</td>
    <td><div class="td-actions">
      <button class="icon-btn" data-view="${o.id}" title="${o.invoiceNo ? 'View invoice' : 'Generate invoice'}"><i class="fa-solid ${o.invoiceNo ? 'fa-eye' : 'fa-file-circle-plus'}"></i></button>
      <button class="icon-btn" data-print="${o.id}" title="Print"><i class="fa-solid fa-print"></i></button></div></td></tr>`).join('') ||
    '<tr><td colspan="10"><div class="empty"><i class="fa-solid fa-file-invoice"></i><h3>No bills found</h3><p>Check the order ID and try again.</p></div></td></tr>';
}

const find = id => Store.orders().find(o => o.id === id);
function ensureInvoice(id) {
  const orders = Store.orders(), o = orders.find(x => x.id === id);
  if (!o.invoiceNo) { o.invoiceNo = 'INV-' + (5000 + parseInt(id.split('-')[1]) - 1000); Store.setOrders(orders); }
  return o;
}

$('#rows').addEventListener('click', e => {
  const v = e.target.closest('[data-view]'), p = e.target.closest('[data-print]');
  if (v) { const o = find(v.dataset.view); o.invoiceNo ? openInvoice(o.id) : openGenerate(o.id); }
  if (p) { const o = ensureInvoice(p.dataset.print); printHTML(invoiceHTML(o)); render(); }
});

/* ---------- invoice view ---------- */
function openInvoice(id) {
  const o = find(id);
  const m = Modal.open({ title: 'Invoice ' + (o.invoiceNo || ''), size: 'lg', body: invoiceHTML(o),
    footer: `<button class="btn btn-outline" id="regen"><i class="fa-solid fa-percent"></i> Apply discount</button>
      ${o.payment === 'Unpaid' ? `<button class="btn btn-gold" id="paid"><i class="fa-solid fa-check"></i> Payment received at counter</button>`
        : '<button class="btn btn-outline" id="unpaid"><i class="fa-solid fa-rotate-left"></i> Mark unpaid</button>'}
      <button class="btn btn-primary" id="pr"><i class="fa-solid fa-print"></i> Print</button>` });
  const upd = (fn, msg) => { const orders = Store.orders(), x = orders.find(z => z.id === id); fn(x); Store.setOrders(orders); Toast.show(msg); render(); openInvoice(id); };
  $('#pr', m).onclick = () => printHTML(invoiceHTML(find(id)));
  $('#regen', m).onclick = () => openGenerate(id);
  const paid = $('#paid', m); if (paid) paid.onclick = () => upd(x => { x.payment = 'Paid'; x.method = 'Cash'; }, 'Bill marked as paid');
  const unp = $('#unpaid', m); if (unp) unp.onclick = () => upd(x => { x.payment = 'Unpaid'; x.method = null; }, 'Bill marked as unpaid');
}

/* ---------- generate invoice (with optional discount) ---------- */
function openGenerate(preId) {
  const orders = Store.orders().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const pending = orders.filter(o => !o.invoiceNo), pool = preId ? orders : [...pending, ...orders.filter(o => o.invoiceNo)].slice(0, 80);
  const m = Modal.open({ title: 'Generate invoice', size: 'sm', body: `<form id="gf" novalidate>
      <div class="field"><label>Order <span class="req">*</span></label><select class="select" name="order">${pool.map(o => `<option value="${o.id}" ${o.id === preId ? 'selected' : ''}>${o.id} — ${esc(o.customerName)} — ${moneyShort(o.subtotal)}${o.invoiceNo ? ' (invoiced)' : ''}</option>`).join('')}</select><small class="err"></small></div>
      <div class="field"><label>Discount (₹)</label><input class="input" name="discount" type="number" min="0" step="1" value="0"><small class="err"></small></div>
      <div class="inv-totals" id="prev" style="max-width:none;background:#faf5ee;padding:12px 16px;border-radius:12px"></div></form>`,
    footer: `<button class="btn btn-outline" data-close>Cancel</button><button class="btn btn-primary" id="go"><i class="fa-solid fa-file-invoice"></i> Generate</button>` });
  const f = $('#gf', m); Form.clearOnInput(f);
  const preview = () => { const o = find(f.order.value); if (!o) return; const d = Math.max(0, parseFloat(f.discount.value) || 0), t = calc(o.items, d);
    $('#prev', m).innerHTML = `<div><span>Subtotal</span><span>${money(t.subtotal)}</span></div><div><span>Discount</span><span>− ${money(Math.min(d, t.subtotal))}</span></div><div><span>GST ${TAX_RATE * 100}%</span><span>${money(t.tax)}</span></div><div class="grand"><span>Total</span><span>${money(t.total)}</span></div>`; };
  const syncDiscount = () => { const o = find(f.order.value); if (o) f.discount.value = o.discount || 0; preview(); };
  f.order.onchange = syncDiscount; f.discount.oninput = preview; syncDiscount();
  $('#go', m).onclick = () => {
    const v = Form.validate(f, { order: v => !v ? 'Select an order' : '', discount: v => { const n = parseFloat(v || 0), o = find(f.order.value); return isNaN(n) || n < 0 ? 'Discount cannot be negative' : o && n > o.subtotal ? 'Discount cannot exceed the subtotal' : ''; } });
    if (!v) return;
    const all = Store.orders(), o = all.find(x => x.id === v.order), d = parseFloat(v.discount || 0), t = calc(o.items, d);
    Object.assign(o, { discount: d, tax: t.tax, total: t.total });
    if (!o.invoiceNo) o.invoiceNo = 'INV-' + (5000 + parseInt(o.id.split('-')[1]) - 1000);
    Store.setOrders(all); Toast.show('Invoice ' + o.invoiceNo + ' generated'); render(); openInvoice(o.id);
  };
}

$('#gen').onclick = () => openGenerate();
$('#q').addEventListener('input', debounce(() => { page = 1; render(); }, 200));
$('#f-pay').onchange = () => { page = 1; render(); };
render();
window.addEventListener('storage', render);
