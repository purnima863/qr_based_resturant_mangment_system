/* =====================================================
   CUSTOMER-COMMON.JS — header, nav, session + cart logic
   ===================================================== */
const Cart = {
  items() {                       // joined with live menu data
    const menu = Store.menu();
    return Store.session().cart.map(c => ({ ...menu.find(m => m.id === c.id), qty: c.qty }))
      .filter(i => i.id && i.available);
  },
  count: () => Store.session().cart.reduce((s, c) => s + c.qty, 0),
  qtyOf: id => (Store.session().cart.find(c => c.id === id) || { qty: 0 }).qty,
  add(id, qty = 1) {
    const s = Store.session(), line = s.cart.find(c => c.id === id);
    line ? line.qty = Math.min(20, line.qty + qty) : s.cart.push({ id, qty });
    Store.setSession(s); Customer.updateBadge(true);
  },
  setQty(id, qty) {
    const s = Store.session();
    if (qty <= 0) s.cart = s.cart.filter(c => c.id !== id);
    else if (s.cart.some(c => c.id === id)) s.cart = s.cart.map(c => c.id === id ? { ...c, qty: Math.min(20, qty) } : c);
    else s.cart.push({ id, qty: Math.min(20, qty) });
    Store.setSession(s); Customer.updateBadge();
  },
  remove(id) { this.setQty(id, 0); },
  clear() { const s = Store.session(); s.cart = []; Store.setSession(s); Customer.updateBadge(); },
  totals() { return calc(this.items()); }
};

const Customer = {
  NAV: [
    { href: 'menu.html',   key: 'menu',   icon: 'fa-utensils',        label: 'Menu' },
    { href: 'cart.html',   key: 'cart',   icon: 'fa-bag-shopping',    label: 'Cart' },
    { href: 'orders.html', key: 'orders', icon: 'fa-receipt',         label: 'Orders' },
    { href: 'bill.html',   key: 'bill',   icon: 'fa-file-invoice',    label: 'Bill' },
    { href: 'tables.html', key: 'tables', icon: 'fa-chair',           label: 'Tables' }
  ],
  session: () => Store.session(),
  currentCustomer() { const id = Store.session().customerId; return Store.customers().find(c => c.id === id) || null; },

  init(active) {
    const s = Store.session();
    if (!s.table) { location.replace('qr-entry.html'); return false; }
    const nav = this.NAV.map(n => `<a href="${n.href}" class="${n.key === active ? 'active' : ''}">${n.label}</a>`).join('');
    const bottom = this.NAV.map(n => `<a href="${n.href}" class="${n.key === active ? 'active' : ''}"><i class="fa-solid ${n.icon}"></i>${n.label}</a>`).join('');
    const h = $('#app-header');
    if (h) h.innerHTML = `<header class="c-header"><div class="container c-header-in">
      <a class="brand" href="menu.html"><span class="brand-logo"><i class="fa-solid fa-utensils"></i></span><span class="brand-name">Foodie<b>Hub</b></span></a>
      <nav class="c-nav">${nav}</nav>
      <div class="c-actions">
        <a class="table-chip" href="tables.html" title="Your table"><i class="fa-solid fa-chair"></i><span><span class="t-label">Table </span>${esc(s.table)}</span></a>
        <a class="cart-btn" href="cart.html" aria-label="Cart"><i class="fa-solid fa-bag-shopping"></i><span class="cart-count">0</span></a>
      </div></div></header>
      <nav class="bottom-nav">${bottom}</nav>`;
    this.updateBadge();
    return true;
  },
  updateBadge(bump) {
    const b = $('.cart-count'); if (!b) return;
    b.textContent = Cart.count(); b.classList.remove('bump'); if (bump) { void b.offsetWidth; b.classList.add('bump'); }
    b.style.display = Cart.count() ? 'grid' : 'none';
  },
  /* orders belonging to the current customer, newest first */
  myOrders() {
    const s = Store.session();
    return Store.orders().filter(o => o.customerId === s.customerId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },
  footer() { return `<div class="c-footer">© ${new Date().getFullYear()} ${esc(RESTAURANT.name)} · Scan. Order. Enjoy.</div>`; }
};
