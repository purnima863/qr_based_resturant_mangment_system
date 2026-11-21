/* =====================================================
   MENU.JS — categories, search, filters, add to cart, details
   ===================================================== */
if (Customer.init('menu')) {
  $('#hero-table').textContent = 'Table ' + Store.session().table;
  $('#footer').innerHTML = Customer.footer();

  const state = { cat: 'all', q: '', veg: false, sort: 'pop' };
  const cats = Store.categories();
  let menu = Store.menu();

  /* ---------- category chips ---------- */
  function renderCats() {
    $('#cat-bar').innerHTML = `<button class="chip ${state.cat === 'all' ? 'active' : ''}" data-cat="all"><i class="fa-solid fa-border-all"></i> All</button>` +
      cats.map(c => `<button class="chip ${state.cat === c.id ? 'active' : ''}" data-cat="${c.id}"><i class="fa-solid ${c.icon}"></i> ${esc(c.name)}</button>`).join('');
  }
  $('#cat-bar').onclick = e => {
    const b = e.target.closest('[data-cat]'); if (!b) return;
    state.cat = b.dataset.cat; renderCats(); renderGrid();
  };

  /* ---------- grid ---------- */
  function filtered() {
    let list = menu.filter(m => (state.cat === 'all' || m.cat === state.cat) &&
      (!state.veg || m.veg) &&
      (!state.q || (m.name + ' ' + m.desc + ' ' + m.cat).toLowerCase().includes(state.q)));
    const s = { pop: (a, b) => b.rating - a.rating, low: (a, b) => a.price - b.price, high: (a, b) => b.price - a.price, az: (a, b) => a.name.localeCompare(b.name) }[state.sort];
    return list.sort(s);
  }
  function card(m, i) {
    const q = Cart.qtyOf(m.id);
    return `<article class="card food-card ${m.available ? '' : 'unavailable'}" data-id="${m.id}" style="animation-delay:${Math.min(i, 12) * 45}ms">
      <div class="food-img">${foodImg(m)}<span class="veg-dot ${m.veg ? '' : 'non'}"></span>
        <span class="rating"><i class="fa-solid fa-star"></i>${m.rating}</span>${m.available ? '' : '<div class="sold-out">Unavailable</div>'}</div>
      <div class="food-body"><h3>${esc(m.name)}</h3><p>${esc(m.desc)}</p>
        <div class="food-meta"><span><i class="fa-regular fa-clock"></i> ${m.prep} min</span></div>
        <div class="food-foot"><span class="price">${moneyShort(m.price)}</span>
          ${!m.available ? '<span class="muted small">Not available</span>' :
            q ? `<div class="qty" data-stop><button data-act="dec" aria-label="Decrease"><i class="fa-solid fa-minus"></i></button><span>${q}</span><button data-act="inc" aria-label="Increase"><i class="fa-solid fa-plus"></i></button></div>` :
            `<button class="btn btn-primary btn-sm" data-act="add"><i class="fa-solid fa-plus"></i> Add</button>`}
        </div></div></article>`;
  }
  function renderGrid() {
    const list = filtered();
    $('#result-count').textContent = list.length + ' item' + (list.length === 1 ? '' : 's');
    $('#food-grid').innerHTML = list.length ? list.map(card).join('') :
      `<div class="empty card" style="grid-column:1/-1"><i class="fa-solid fa-magnifying-glass"></i><h3>No dishes found</h3><p>Try a different search or category.</p>
       <button class="btn btn-outline" id="reset-f" style="margin-top:14px">Clear filters</button></div>`;
    const r = $('#reset-f'); if (r) r.onclick = () => { state.cat = 'all'; state.q = ''; state.veg = false; $('#search').value = ''; $('#veg-only').checked = false; renderCats(); renderGrid(); };
    renderCartBar();
  }

  $('#food-grid').onclick = e => {
    const cardEl = e.target.closest('.food-card'); if (!cardEl) return;
    const id = cardEl.dataset.id, m = menu.find(x => x.id === id), act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'add') { Cart.add(id); Toast.show(m.name + ' added to cart'); renderGrid(); }
    else if (act === 'inc') { Cart.setQty(id, Cart.qtyOf(id) + 1); renderGrid(); }
    else if (act === 'dec') { Cart.setQty(id, Cart.qtyOf(id) - 1); renderGrid(); }
    else if (!e.target.closest('[data-stop]')) openDetail(m);
  };

  /* ---------- details modal with quantity ---------- */
  function openDetail(m) {
    let qty = Math.max(1, Cart.qtyOf(m.id) || 1);
    const catName = (cats.find(c => c.id === m.cat) || {}).name || '';
    const o = Modal.open({
      title: esc(m.name), size: 'md',
      body: `<div class="detail-img">${foodImg(m)}</div>
        <div class="flex between center"><div class="chips-inline"><span><span class="veg-dot ${m.veg ? '' : 'non'}"></span> ${m.veg ? 'Veg' : 'Non-veg'}</span><span>${esc(catName)}</span><span><i class="fa-solid fa-star" style="color:var(--gold)"></i> ${m.rating}</span><span><i class="fa-regular fa-clock"></i> ${m.prep} min</span></div>
        <span class="price" style="font-size:1.4rem">${moneyShort(m.price)}</span></div>
        <p class="muted" style="margin-top:6px">${esc(m.desc)}</p>
        ${m.available ? `<div class="detail-row"><div class="qty"><button id="q-dec"><i class="fa-solid fa-minus"></i></button><span id="q-val">${qty}</span><button id="q-inc"><i class="fa-solid fa-plus"></i></button></div>
        <button class="btn btn-primary btn-lg" id="q-add" style="flex:1"></button></div>` :
        '<div class="detail-row"><span class="badge st-unpaid">Currently unavailable</span></div>'}`
    });
    if (!m.available) return;
    const sync = () => { $('#q-val', o).textContent = qty; $('#q-add', o).innerHTML = `<i class="fa-solid fa-bag-shopping"></i> ${Cart.qtyOf(m.id) ? 'Update cart' : 'Add to cart'} · ${moneyShort(m.price * qty)}`; };
    $('#q-dec', o).onclick = () => { qty = Math.max(1, qty - 1); sync(); };
    $('#q-inc', o).onclick = () => { qty = Math.min(20, qty + 1); sync(); };
    $('#q-add', o).onclick = () => { Cart.setQty(m.id, qty); Toast.show(`${qty} × ${m.name} in your cart`); Modal.close(); renderGrid(); Customer.updateBadge(true); };
    sync();
  }

  /* ---------- floating cart bar ---------- */
  function renderCartBar() {
    const slot = $('#cart-bar-slot'), n = Cart.count();
    slot.innerHTML = n ? `<div class="cart-bar"><div><b>${n} item${n > 1 ? 's' : ''}</b> · ${moneyShort(Cart.totals().subtotal)}<div class="tiny" style="opacity:.7">+ taxes at checkout</div></div>
      <a class="btn btn-gold" href="cart.html">View cart <i class="fa-solid fa-arrow-right"></i></a></div>` : '';
  }

  /* ---------- events ---------- */
  $('#search').addEventListener('input', debounce(e => { state.q = e.target.value.trim().toLowerCase(); renderGrid(); }, 180));
  $('#veg-only').onchange = e => { state.veg = e.target.checked; renderGrid(); };
  $('#sort').onchange = e => { state.sort = e.target.value; renderGrid(); };
  window.addEventListener('storage', () => { menu = Store.menu(); renderGrid(); });   // admin edits show up live

  renderCats(); renderGrid();
}
