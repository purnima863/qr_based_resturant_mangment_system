/* =====================================================
   CUSTOMERS.JS — list, search, filter, order history
   ===================================================== */
Admin.init('customers', 'Customer Management');
const PAGE = 10; let page = 1;

function customerRows() {
  const orders = Store.orders();
  return Store.customers().map(c => {
    const mine = orders.filter(o => o.customerId === c.id);
    return { ...c, orders: mine, count: mine.length, spent: revenueOf(mine),
      last: mine.reduce((m, o) => Math.max(m, +new Date(o.createdAt)), 0) };
  });
}

function render() {
  const q = $('#q').value.trim().toLowerCase(), f = $('#filter').value, s = $('#sort').value;
  let list = customerRows().filter(c =>
    (!q || (c.name + c.phone + (c.email || '')).toLowerCase().includes(q)) &&
    (f === 'all' || (f === 'repeat' && c.count >= 3) || (f === 'new' && c.count <= 2) || (f === 'vip' && c.spent >= 5000)));
  list.sort({ spent: (a, b) => b.spent - a.spent, orders: (a, b) => b.count - a.count, recent: (a, b) => b.last - a.last, name: (a, b) => a.name.localeCompare(b.name) }[s]);
  page = renderPager($('#pager'), list.length, page, PAGE, p => { page = p; render(); });
  $('#rows').innerHTML = list.slice((page - 1) * PAGE, page * PAGE).map(c => `<tr>
    <td><div class="cust-cell"><div class="avatar">${initials(c.name)}</div><div><b>${esc(c.name)}</b><span class="muted tiny">${esc(c.id)} · joined ${fmtDate(c.joined)}</span></div></div></td>
    <td><i class="fa-solid fa-phone muted tiny"></i> ${esc(c.phone)}<br><span class="muted small">${esc(c.email || 'No email')}</span></td>
    <td><b>${c.count}</b></td><td><b>${moneyShort(c.spent)}</b></td>
    <td class="muted">${c.last ? fmtDate(c.last) : '—'}</td>
    <td><div class="td-actions"><button class="btn btn-outline btn-sm" data-id="${c.id}"><i class="fa-solid fa-clock-rotate-left"></i> History</button></div></td></tr>`).join('') ||
    '<tr><td colspan="6"><div class="empty"><i class="fa-solid fa-user-slash"></i><h3>No customers found</h3><p>Try changing your search or filter.</p></div></td></tr>';
}

$('#rows').onclick = e => {
  const b = e.target.closest('[data-id]'); if (!b) return;
  const c = customerRows().find(x => x.id === b.dataset.id);
  const sorted = [...c.orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  Modal.open({ title: esc(c.name), size: 'lg', body: `
    <div class="kv"><div><span>Phone</span><b>${esc(c.phone)}</b></div><div><span>Email</span><b>${esc(c.email || '—')}</b></div>
      <div><span>Total orders</span><b>${c.count}</b></div><div><span>Total spent</span><b>${money(c.spent)}</b></div></div>
    <h4 style="font-family:var(--font);margin-bottom:8px">Order history</h4>
    ${sorted.length ? `<div class="table-wrap" style="max-height:340px"><table class="mini-table"><thead><tr><th>Order</th><th>Date</th><th>Table</th><th>Items</th><th>Total</th><th>Status</th></tr></thead><tbody>
      ${sorted.map(o => `<tr><td><b>${o.id}</b></td><td>${fmtDateTime(o.createdAt)}</td><td>${o.table}</td><td>${o.items.map(i => i.qty + '× ' + esc(i.name)).join(', ')}</td><td>${moneyShort(o.total)}</td><td>${statusBadge(o.status)}</td></tr>`).join('')}
    </tbody></table></div>` : '<p class="muted">No orders yet.</p>'}` });
};
$('#q').addEventListener('input', debounce(() => { page = 1; render(); }, 200));
$('#filter').onchange = $('#sort').onchange = () => { page = 1; render(); };
render();
window.addEventListener('storage', render);
