/* =====================================================
   TABLES.JS — availability board for customers
   ===================================================== */
if (Customer.init('tables')) {
  $('#footer').innerHTML = Customer.footer();
  const mineNo = Store.session().table;
  let filter = 'All';

  function render() {
    const tables = Store.tables().sort((a, b) => a.number - b.number);
    const count = s => tables.filter(t => t.status === s).length;
    $('#stats').innerHTML = [['Available', 'green'], ['Occupied', 'red'], ['Reserved', 'amber'], ['Cleaning', 'blue']]
      .map(([s, c]) => `<div class="card"><span class="muted small">${s}</span><b style="color:var(--${c})">${count(s)}</b></div>`).join('');
    $('#filters').innerHTML = ['All', ...TABLE_STATUSES].map(s => `<button class="chip ${filter === s ? 'active' : ''}" data-f="${s}">${s}${s === 'All' ? ` (${tables.length})` : ` (${count(s)})`}</button>`).join('');
    const list = tables.filter(t => filter === 'All' || t.status === filter);
    $('#tbl-grid').innerHTML = list.length ? list.map((t, i) => `
      <div class="card tbl-card s-${t.status.toLowerCase()} ${t.number === mineNo ? 'mine' : ''}" style="animation-delay:${i * 40}ms">
        ${t.number === mineNo ? '<span class="mine-tag">YOUR TABLE</span>' : ''}
        <i class="fa-solid fa-chair" style="color:var(--muted)"></i>
        <div class="num">${t.number}</div>
        <div class="meta"><i class="fa-solid fa-user-group"></i> ${t.seats} seats · ${esc(t.area)}</div>
        ${statusBadge(t.status)}
      </div>`).join('') : '<div class="empty card" style="grid-column:1/-1"><i class="fa-solid fa-chair"></i><h3>No tables in this state</h3></div>';
  }
  $('#filters').onclick = e => { const b = e.target.closest('[data-f]'); if (b) { filter = b.dataset.f; render(); } };
  render();
  setInterval(render, 5000);
  window.addEventListener('storage', render);
}
