/* =====================================================
   ORDERS.JS (admin) — list, filter, update status, details
   ===================================================== */
Admin.init('orders', 'Order Management');
const PAGE = 12; let page = 1;
$('#f-status').innerHTML += STATUSES.map(s => `<option>${s}</option>`).join('');

function filtered() {
  const q = $('#q').value.trim().toLowerCase(), st = $('#f-status').value, dt = $('#f-date').value;
  const since = dt === 'all' ? 0 : dt === 'today' ? new Date().setHours(0, 0, 0, 0) : Date.now() - (+dt) * 864e5;
  return Store.orders().filter(o =>
    (st === 'all' || o.status === st) && new Date(o.createdAt) >= since &&
    (!q || (o.id + o.customerName + o.phone + 'table ' + o.table).toLowerCase().includes(q)))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function render() {
  const list = filtered();
  page = renderPager($('#pager'), list.length, page, PAGE, p => { page = p; render(); });
  $('#rows').innerHTML = list.slice((page - 1) * PAGE, page * PAGE).map(o => `<tr>
    <td><b>${o.id}</b></td>
    <td><b>${esc(o.customerName)}</b><br><span class="muted small">${esc(o.phone)}</span></td>
    <td>Table ${o.table}</td>
    <td style="max-width:240px">${o.items.slice(0, 2).map(i => `<span class="item-pill">${i.qty}× ${esc(i.name)}</span>`).join('')}${o.items.length > 2 ? `<span class="item-pill">+${o.items.length - 2} more</span>` : ''}</td>
    <td><b>${moneyShort(o.total)}</b><br>${statusBadge(o.payment)}</td>
    <td class="muted">${fmtDateTime(o.createdAt)}</td>
    <td><select class="status-select st-${o.status.toLowerCase()}" data-id="${o.id}">${STATUSES.map(s => `<option ${s === o.status ? 'selected' : ''}>${s}</option>`).join('')}</select></td>
    <td><div class="td-actions"><button class="icon-btn" data-view="${o.id}" title="View details"><i class="fa-solid fa-eye"></i></button></div></td></tr>`).join('') ||
    '<tr><td colspan="8"><div class="empty"><i class="fa-solid fa-receipt"></i><h3>No orders found</h3><p>Try changing your filters.</p></div></td></tr>';
}

function setStatus(id, status) {
  const orders = Store.orders(), o = orders.find(x => x.id === id); if (!o) return;
  o.status = status; Store.setOrders(orders);
  Toast.show(`${id} → ${status}`); render(); Admin.init('orders', 'Order Management');
}

$('#rows').addEventListener('change', e => { if (e.target.dataset.id) setStatus(e.target.dataset.id, e.target.value); });
$('#rows').addEventListener('click', e => { const b = e.target.closest('[data-view]'); if (b) openDetails(b.dataset.view); });

function openDetails(id) {
  const o = Store.orders().find(x => x.id === id); if (!o) return;
  const idx = STATUSES.indexOf(o.status);
  const body = `
    <div class="kv"><div><span>Customer</span><b>${esc(o.customerName)}</b></div><div><span>Phone</span><b>${esc(o.phone)}</b></div>
      <div><span>Table</span><b>Table ${o.table}</b></div><div><span>Placed</span><b>${fmtDateTime(o.createdAt)}</b></div>
      <div><span>Payment</span><b>${statusBadge(o.payment)} ${o.payment === 'Paid' ? 'at counter' : ''}</b></div></div>
    <h4 style="font-family:var(--font);margin-bottom:6px">Update status</h4>
    <div class="mini-steps">${STATUSES.map((s, i) => `<button data-s="${s}" class="${i < idx ? 'done' : i === idx ? 'current' : ''}">${s}</button>`).join('')}</div>
    <table class="mini-table"><thead><tr><th>Item</th><th>Qty</th><th>Price</th><th class="text-right">Amount</th></tr></thead><tbody>
      ${o.items.map(i => `<tr><td>${esc(i.name)}</td><td>${i.qty}</td><td>${money(i.price)}</td><td class="text-right">${money(i.price * i.qty)}</td></tr>`).join('')}</tbody></table>
    <div class="inv-totals" style="margin-top:12px;font-size:.9rem"><div><span>Subtotal</span><span>${money(o.subtotal)}</span></div>
      ${o.discount ? `<div><span>Discount</span><span>− ${money(o.discount)}</span></div>` : ''}
      <div><span>GST (${TAX_RATE * 100}%)</span><span>${money(o.tax)}</span></div><div class="grand"><span>Total</span><span>${money(o.total)}</span></div></div>
    ${o.note ? `<p class="small" style="margin-top:12px;background:#faf5ee;padding:10px 12px;border-radius:10px"><i class="fa-regular fa-note-sticky"></i> Customer note: ${esc(o.note)}</p>` : ''}`;
  const m = Modal.open({ title: 'Order ' + o.id, size: 'lg', body,
    footer: `<a class="btn btn-outline" href="billing.html?q=${o.id}"><i class="fa-solid fa-file-invoice"></i> Open bill</a>
      <button class="btn btn-primary" id="adv" ${idx === STATUSES.length - 1 ? 'disabled' : ''}>Advance to ${STATUSES[idx + 1] || 'Served'} <i class="fa-solid fa-arrow-right"></i></button>` });
  m.addEventListener('click', e => {
    const b = e.target.closest('[data-s]'); if (b) { setStatus(o.id, b.dataset.s); openDetails(o.id); }
    if (e.target.closest('#adv')) { setStatus(o.id, STATUSES[idx + 1]); openDetails(o.id); }
  });
}

$('#q').addEventListener('input', debounce(() => { page = 1; render(); }, 200));
$('#f-status').onchange = $('#f-date').onchange = () => { page = 1; render(); };
render();
// live updates from the customer panel (new orders) — same browser only
window.addEventListener('storage', () => { render(); Admin.init('orders', 'Order Management'); });
