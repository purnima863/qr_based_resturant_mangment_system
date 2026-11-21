/* =====================================================
   ORDERS.JS — live tracking stepper + order history
   Polls storage every 3s so admin status changes appear live.
   ===================================================== */
if (Customer.init('orders')) {
  $('#footer').innerHTML = Customer.footer();
  const STEP_ICON = ['fa-clock', 'fa-check', 'fa-fire-burner', 'fa-bell-concierge', 'fa-utensils'];
  const ETA = {
    Pending: 'Waiting for the restaurant to confirm your order.',
    Confirmed: 'Order confirmed — the chefs have it.',
    Preparing: 'Your food is being freshly prepared.',
    Ready: 'Your order is ready and on its way to your table!',
    Served: 'Enjoy your meal! 🍽️ You can view your bill any time.'
  };
  let selectedId = new URLSearchParams(location.search).get('id') || Store.session().lastOrderId;
  let last = '';

  function render() {
    const mine = Customer.myOrders();
    const sig = JSON.stringify(mine) + selectedId;
    if (sig === last) return; last = sig;

    // choose order: selected → newest active → newest
    let o = mine.find(x => x.id === selectedId) || mine.find(x => x.status !== 'Served') || mine[0];
    const track = $('#track-root'), hist = $('#hist-root');

    if (!o) {
      track.innerHTML = `<div class="card empty"><i class="fa-solid fa-receipt"></i><h3>No orders yet</h3><p>Once you place an order you can track it here.</p>
        <a class="btn btn-primary" href="menu.html" style="margin-top:16px">Order now</a></div>`;
      hist.innerHTML = '<p class="muted">Nothing here yet.</p>'; return;
    }
    const idx = STATUSES.indexOf(o.status), pct = idx / (STATUSES.length - 1) * 80;
    track.innerHTML = `<div class="card track-card fade-up">
      <div class="track-head">
        <div><div class="muted small">Order ID</div><h2>${esc(o.id)}</h2><div class="muted small">${fmtDateTime(o.createdAt)}</div></div>
        <div style="text-align:right"><span class="table-chip"><i class="fa-solid fa-chair"></i> Table ${esc(o.table)}</span>
          <div style="margin-top:10px">${statusBadge(o.status)} ${statusBadge(o.payment)}</div></div>
      </div>
      <div class="stepper"><div class="fill" style="width:${pct}%"></div>
        ${STATUSES.map((s, i) => `<div class="step ${i < idx ? 'done' : ''} ${i === idx ? (idx === STATUSES.length - 1 ? 'done' : 'current') : ''}">
          <div class="dot"><i class="fa-solid ${i < idx || (i === idx && idx === STATUSES.length - 1) ? 'fa-check' : STEP_ICON[i]}"></i></div><span>${s}</span></div>`).join('')}
      </div>
      <p class="text-center" style="font-weight:600;margin-bottom:22px">${ETA[o.status]}</p>
      <h4 style="font-family:var(--font);margin-bottom:6px">Order details</h4>
      <ul class="order-items">${o.items.map(i => `<li><span>${i.qty} × ${esc(i.name)}</span><b>${moneyShort(i.price * i.qty)}</b></li>`).join('')}</ul>
      ${o.note ? `<p class="small muted" style="margin-top:10px"><i class="fa-regular fa-note-sticky"></i> “${esc(o.note)}”</p>` : ''}
      <div class="sum-row"><span>Subtotal</span><span>${money(o.subtotal)}</span></div>
      <div class="sum-row"><span>GST</span><span>${money(o.tax)}</span></div>
      <div class="sum-row total"><span>Total</span><span>${money(o.total)}</span></div>
      <div class="bill-actions"><a class="btn btn-primary" href="bill.html?id=${o.id}"><i class="fa-solid fa-file-invoice"></i> View bill</a>
        <a class="btn btn-outline" href="menu.html"><i class="fa-solid fa-plus"></i> Order more</a></div>
    </div>`;

    hist.innerHTML = mine.map(x => `<div class="card hist-item ${x.id === o.id ? 'active' : ''}" data-id="${x.id}">
      <div><b>${esc(x.id)}</b><span class="muted small">${fmtDateTime(x.createdAt)} · Table ${esc(x.table)} · ${x.items.reduce((s, i) => s + i.qty, 0)} items</span></div>
      <div style="text-align:right"><b>${moneyShort(x.total)}</b>${statusBadge(x.status)}</div></div>`).join('');
  }
  $('#hist-root').onclick = e => {
    const h = e.target.closest('.hist-item'); if (!h) return;
    selectedId = h.dataset.id; render(); window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  render();
  setInterval(render, 3000);
  window.addEventListener('storage', render);
}
