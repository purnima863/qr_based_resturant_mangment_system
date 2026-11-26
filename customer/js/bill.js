/* =====================================================
   BILL.JS — invoice, payment status, print
   Payment is ONLY at the counter: the customer shows the bill to the
   cashier, and the admin marks it "Paid" in the Billing page.
   ===================================================== */
if (Customer.init('bill')) {
  $('#footer').innerHTML = Customer.footer();
  let id = new URLSearchParams(location.search).get('id') || Store.session().lastOrderId;
  if (!Customer.myOrders().find(o => o.id === id)) id = (Customer.myOrders()[0] || {}).id;

  function render() {
    const orders = Customer.myOrders(), o = orders.find(x => x.id === id);
    if (!o) {
      $('#bill-root').innerHTML = `<div class="card empty"><i class="fa-solid fa-file-invoice"></i><h3>No bill yet</h3><p>Place an order to see your invoice here.</p>
        <a class="btn btn-primary" href="menu.html" style="margin-top:16px">Browse menu</a></div>`; return;
    }
    $('#bill-select').innerHTML = orders.length > 1 ? `<div class="field select-inline"><label>Select order</label>
      <select class="select" id="sel">${orders.map(x => `<option value="${x.id}" ${x.id === id ? 'selected' : ''}>${x.id} — ${fmtDate(x.createdAt)} — ${moneyShort(x.total)}</option>`).join('')}</select></div>` : '';

    const payNote = o.payment === 'Unpaid'
      ? `<div class="card card-pad" style="margin-top:18px;border-left:5px solid var(--gold)"><b><i class="fa-solid fa-store"></i> Please pay at the counter</b>
         <p class="muted small" style="margin-top:4px">Show this bill to our cashier after your meal. Your payment status will change to <b>Paid</b> once the cashier confirms.</p></div>`
      : '<span class="badge st-paid" style="padding:9px 16px">Payment received — thank you!</span>';

    $('#bill-root').innerHTML = `<div class="card fade-up">${invoiceHTML(o)}</div>
      <div class="bill-actions">
        <button class="btn btn-primary" id="print"><i class="fa-solid fa-print"></i> Print Bill</button>
        <a class="btn btn-outline" href="orders.html?id=${o.id}"><i class="fa-solid fa-location-dot"></i> Track order</a>
      </div>${payNote}`;
    const sel = $('#sel'); if (sel) sel.onchange = e => { id = e.target.value; history.replaceState(null, '', '?id=' + id); render(); };
    $('#print').onclick = () => printHTML(invoiceHTML(o));
  }
  render();
  setInterval(render, 4000);            // picks up "Paid" as soon as the admin confirms
  window.addEventListener('storage', render);
}
