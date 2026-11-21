/* =====================================================
   BILL.JS — invoice, payment status, pay now, print
   ===================================================== */
if (Customer.init('bill')) {
  $('#footer').innerHTML = Customer.footer();
  const mine = Customer.myOrders();
  let id = new URLSearchParams(location.search).get('id') || Store.session().lastOrderId;
  if (!mine.find(o => o.id === id)) id = (mine[0] || {}).id;

  function render() {
    const orders = Customer.myOrders(), o = orders.find(x => x.id === id);
    if (!o) {
      $('#bill-root').innerHTML = `<div class="card empty"><i class="fa-solid fa-file-invoice"></i><h3>No bill yet</h3><p>Place an order to see your invoice here.</p>
        <a class="btn btn-primary" href="menu.html" style="margin-top:16px">Browse menu</a></div>`; return;
    }
    $('#bill-select').innerHTML = orders.length > 1 ? `<div class="field select-inline"><label>Select order</label>
      <select class="select" id="sel">${orders.map(x => `<option value="${x.id}" ${x.id === id ? 'selected' : ''}>${x.id} — ${fmtDate(x.createdAt)} — ${moneyShort(x.total)}</option>`).join('')}</select></div>` : '';
    $('#bill-root').innerHTML = `<div class="card fade-up">${invoiceHTML(o)}</div>
      <div class="bill-actions">
        <button class="btn btn-primary" id="print"><i class="fa-solid fa-print"></i> Print Bill</button>
        ${o.payment === 'Unpaid' ? '<button class="btn btn-gold" id="pay"><i class="fa-solid fa-credit-card"></i> Pay Now</button>' : '<span class="badge st-paid" style="align-self:center;padding:9px 16px">Payment received — thank you!</span>'}
        <a class="btn btn-outline" href="orders.html?id=${o.id}"><i class="fa-solid fa-location-dot"></i> Track order</a>
      </div>
      ${o.payment === 'Unpaid' && o.method === 'Cash' ? '<p class="small muted" style="margin-top:12px"><i class="fa-solid fa-circle-info"></i> You chose to pay at the counter — please show this bill to our cashier.</p>' : ''}`;
    const sel = $('#sel'); if (sel) sel.onchange = e => { id = e.target.value; history.replaceState(null, '', '?id=' + id); render(); };
    $('#print').onclick = () => printHTML(invoiceHTML(o));
    const pay = $('#pay'); if (pay) pay.onclick = () => openPay(o);
  }

  function openPay(o) {
    const m = Modal.open({ title: 'Pay ' + money(o.total), size: 'sm',
      body: `<button class="pay-opt" data-m="UPI"><i class="fa-solid fa-mobile-screen"></i><div><b>UPI</b><small>GPay, PhonePe, Paytm (demo)</small></div></button>
             <button class="pay-opt" data-m="Card"><i class="fa-regular fa-credit-card"></i><div><b>Credit / Debit card</b><small>Visa, Mastercard, RuPay (demo)</small></div></button>
             <button class="pay-opt" data-m="Cash"><i class="fa-solid fa-money-bill-wave"></i><div><b>Pay at counter</b><small>Cash or card at the cashier</small></div></button>
             <p class="tiny muted">This is a front-end demo — no real payment is processed.</p>` });
    m.addEventListener('click', e => {
      const b = e.target.closest('[data-m]'); if (!b) return;
      const orders = Store.orders(), ord = orders.find(x => x.id === o.id); ord.method = b.dataset.m;
      if (b.dataset.m === 'Cash') Toast.show('Please pay at the counter', 'info');
      else { ord.payment = 'Paid'; ord.invoiceNo = ord.invoiceNo || 'INV-' + (5000 + parseInt(ord.id.split('-')[1]) - 1000); Toast.show('Payment successful — thank you!'); }
      Store.setOrders(orders); Modal.close(); render();
    });
  }
  render();
}
