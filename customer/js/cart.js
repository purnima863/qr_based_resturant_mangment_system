/* =====================================================
   CART.JS — quantities, remove, totals, place order
   ===================================================== */
if (Customer.init('cart')) {
  $('#footer').innerHTML = Customer.footer();
  const root = $('#cart-root');
  let note = '';

  function render() {
    const items = Cart.items(), t = calc(items);
    $('#cart-sub').textContent = items.length ? `Table ${Store.session().table} · ${Cart.count()} item${Cart.count() > 1 ? 's' : ''}` : '';
    if (!items.length) {
      root.innerHTML = `<div class="card empty"><i class="fa-solid fa-bag-shopping"></i><h3>Your cart is empty</h3><p>Add something delicious from the menu.</p>
        <a class="btn btn-primary" href="menu.html" style="margin-top:16px"><i class="fa-solid fa-utensils"></i> Browse menu</a></div>`;
      return;
    }
    root.innerHTML = `<div class="cart-layout">
      <div class="card">${items.map((i, k) => `
        <div class="cart-item" data-id="${i.id}" style="animation-delay:${k * 50}ms">
          <div class="thumb">${foodImg(i)}</div>
          <div><h4>${esc(i.name)}</h4><div class="muted small">${moneyShort(i.price)} each</div>
            <div class="small" style="margin-top:4px"><span class="veg-dot ${i.veg ? '' : 'non'}"></span></div></div>
          <div class="ctl"><div class="line-total">${moneyShort(i.price * i.qty)}</div>
            <div class="qty"><button data-act="dec" aria-label="Decrease"><i class="fa-solid fa-minus"></i></button><span>${i.qty}</span><button data-act="inc" aria-label="Increase"><i class="fa-solid fa-plus"></i></button></div>
            <button class="link-danger" data-act="rm"><i class="fa-regular fa-trash-can"></i> Remove</button></div>
        </div>`).join('')}
        <div style="padding:14px 16px;display:flex;justify-content:space-between;border-top:1px solid var(--line)">
          <a class="btn btn-ghost btn-sm" href="menu.html"><i class="fa-solid fa-plus"></i> Add more items</a>
          <button class="btn btn-ghost btn-sm" id="clear" style="color:var(--red)"><i class="fa-regular fa-trash-can"></i> Clear cart</button></div>
      </div>
      <aside class="card card-pad summary">
        <h3 style="margin-bottom:12px">Order Summary</h3>
        <div class="field" style="margin-bottom:12px"><label>Special instructions (optional)</label>
          <textarea class="textarea" id="note" maxlength="140" placeholder="Less spicy, no onion, etc.">${esc(note)}</textarea></div>
        <div class="sum-row"><span>Subtotal</span><span>${money(t.subtotal)}</span></div>
        <div class="sum-row"><span>GST (${TAX_RATE * 100}%)</span><span>${money(t.tax)}</span></div>
        <div class="sum-row total"><span>Grand Total</span><span>${money(t.total)}</span></div>
        <button class="btn btn-primary btn-lg btn-block" id="place" style="margin-top:16px"><i class="fa-solid fa-paper-plane"></i> Place Order</button>
        <p class="muted tiny text-center" style="margin-top:10px"><i class="fa-solid fa-lock"></i> You can pay after your meal from the Bill page.</p>
      </aside></div>`;
  }

  root.addEventListener('input', e => { if (e.target.id === 'note') note = e.target.value; });
  root.addEventListener('click', e => {
    const row = e.target.closest('.cart-item'), act = e.target.closest('[data-act]')?.dataset.act;
    if (row && act) {
      const id = row.dataset.id;
      if (act === 'inc') Cart.setQty(id, Cart.qtyOf(id) + 1);
      if (act === 'dec') Cart.setQty(id, Cart.qtyOf(id) - 1);
      if (act === 'rm') { Cart.remove(id); Toast.show('Item removed', 'info'); }
      render();
    }
    if (e.target.closest('#clear')) Modal.confirm({ title: 'Clear cart?', message: 'All items will be removed from your cart.', okText: 'Clear', danger: true }).then(ok => { if (ok) { Cart.clear(); render(); } });
    if (e.target.closest('#place')) placeOrder();
  });

  function askDetails(next) {
    const o = Modal.open({ title: 'Almost done — who is ordering?', size: 'sm', body: `<form id="who" novalidate>
      <div class="field"><label>Your name <span class="req">*</span></label><input class="input" name="name" autocomplete="name" placeholder="e.g. Purnima Yadav"><small class="err"></small></div>
      <div class="field"><label>Mobile number <span class="req">*</span></label><input class="input" name="phone" inputmode="numeric" maxlength="10" autocomplete="tel" placeholder="10-digit mobile number"><small class="err"></small></div>
      <button class="btn btn-primary btn-block">Continue &amp; place order</button></form>` });
    const form = $('#who', o); Form.clearOnInput(form);
    form.onsubmit = e => {
      e.preventDefault();
      const v = Form.validate(form, {
        name: v => !v ? 'Please enter your name' : v.length < 2 ? 'Name is too short' : !/^[A-Za-z .'-]+$/.test(v) ? 'Use letters only' : '',
        phone: v => !v ? 'Please enter your mobile number' : !isPhone(v) ? 'Enter a valid 10-digit mobile number' : ''
      });
      if (!v) return;
      const customers = Store.customers(); let c = customers.find(x => x.phone === v.phone);
      if (!c) { c = { id: 'C' + String(customers.length + 1).padStart(3, '0'), name: v.name, phone: v.phone, email: '', joined: new Date().toISOString() }; customers.push(c); Store.setCustomers(customers); }
      const s2 = Store.session(); s2.customerId = c.id; Store.setSession(s2);
      Modal.close(true); next();
    };
  }

  function placeOrder() {
    const items = Cart.items(); if (!items.length) return Toast.show('Your cart is empty', 'error');
    const s = Store.session(), cust = Customer.currentCustomer();
    if (!cust) return askDetails(placeOrder);   // direct-entry guests give name + phone only when ordering

    const orders = Store.orders(), t = calc(items), id = nextOrderId(orders);
    orders.push({
      id, customerId: cust.id, customerName: cust.name, phone: cust.phone, table: s.table,
      items: items.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty })),
      subtotal: t.subtotal, discount: 0, tax: t.tax, total: t.total,
      status: 'Pending', payment: 'Unpaid', method: null, note: note.trim(), invoiceNo: null, createdAt: new Date().toISOString()
    });
    Store.setOrders(orders);

    // table becomes occupied
    const tables = Store.tables(), tb = tables.find(x => x.number === s.table);
    if (tb && tb.status !== 'Occupied') { tb.status = 'Occupied'; Store.setTables(tables); }

    s.cart = []; s.lastOrderId = id; Store.setSession(s);
    Modal.open({ title: 'Order placed! 🎉', size: 'sm',
      body: `<div class="text-center"><div class="scan-frame done" style="width:110px;height:110px"><i class="fa-solid fa-circle-check" style="font-size:3.4rem"></i></div>
        <p class="muted">Your order ID</p><h2 style="color:var(--brand);margin:4px 0 8px">${id}</h2><p class="small muted">We're confirming it now. Track live status on the next screen.</p></div>`,
      footer: `<a class="btn btn-primary btn-block" href="orders.html?id=${id}">Track my order</a>`, onClose: () => location.href = 'orders.html?id=' + id });
  }
  render();
}
