/* =====================================================
   ADMIN-COMMON.JS — sidebar, topbar, pager, chart helpers
   ===================================================== */
const Admin = {
  NAV: [
    { href: 'dashboard.html', key: 'dashboard', icon: 'fa-gauge-high',      label: 'Dashboard' },
    { href: 'orders.html',    key: 'orders',    icon: 'fa-receipt',         label: 'Orders', badge: true },
    { href: 'menu.html',      key: 'menu',      icon: 'fa-utensils',        label: 'Menu' },
    { href: 'tables.html',    key: 'tables',    icon: 'fa-chair',           label: 'Tables & QR' },
    { href: 'customers.html', key: 'customers', icon: 'fa-users',           label: 'Customers' },
    { href: 'billing.html',   key: 'billing',   icon: 'fa-file-invoice-dollar', label: 'Billing' },
    { href: 'reports.html',   key: 'reports',   icon: 'fa-chart-line',      label: 'Reports' }
  ],
  init(active, title, subtitle = '') {
    // login guard — customers never reach the admin panel without credentials
    if (sessionStorage.getItem('rqr_admin') !== '1') { location.replace('login.html'); return; }
    const pending = Store.orders().filter(o => o.status === 'Pending').length;
    $('#sidebar').innerHTML = `
      <div class="sb-brand"><span class="brand-logo"><i class="fa-solid fa-utensils"></i></span><div><b>${esc(RESTAURANT.name)}</b><small>Admin Panel</small></div></div>
      <nav class="sb-nav"><div class="sb-label">Management</div>
        ${this.NAV.map(n => `<a href="${n.href}" class="${n.key === active ? 'active' : ''}"><i class="fa-solid ${n.icon}"></i>${n.label}${n.badge && pending ? `<span class="sb-badge">${pending}</span>` : ''}</a>`).join('')}
      </nav>
      <div class="sb-foot">
        <button id="reset-demo"><i class="fa-solid fa-rotate-left"></i> Reset demo data</button>
        <button id="logout"><i class="fa-solid fa-right-from-bracket"></i> Log out</button>
      </div>`;
    $('#topbar').innerHTML = `<div class="tb-left"><button class="menu-toggle" id="menu-toggle" aria-label="Menu"><i class="fa-solid fa-bars"></i></button>
        <div><h1>${esc(title)}</h1></div></div>
      <div class="tb-right"><span class="tb-date"><i class="fa-regular fa-calendar"></i> ${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        <div class="tb-user"><div class="avatar">AD</div><div>Admin<small>Manager</small></div></div></div>`;
    if (!$('.sidebar-backdrop')) { const b = document.createElement('div'); b.className = 'sidebar-backdrop'; document.body.appendChild(b); }
    $('#menu-toggle').onclick = () => document.body.classList.toggle('sb-open');
    $('.sidebar-backdrop').onclick = () => document.body.classList.remove('sb-open');
    $('#logout').onclick = () => { sessionStorage.removeItem('rqr_admin'); location.href = 'login.html'; };
    $('#reset-demo').onclick = async () => {
      if (await Modal.confirm({ title: 'Reset demo data?', message: 'All orders, menu, tables and customers will return to the original sample data.', okText: 'Reset', danger: true })) { DB.reset(); location.reload(); }
    };
  }
};

/* ---------- pager ---------- */
function renderPager(el, total, page, size, onChange) {
  const pages = Math.max(1, Math.ceil(total / size)); page = Math.min(page, pages);
  const from = total ? (page - 1) * size + 1 : 0, to = Math.min(total, page * size);
  let nums = []; for (let i = 1; i <= pages; i++) if (i === 1 || i === pages || Math.abs(i - page) <= 1) nums.push(i);
  const out = []; nums.forEach((n, i) => { if (i && n - nums[i - 1] > 1) out.push('…'); out.push(n); });
  el.innerHTML = `<div>Showing ${from}–${to} of ${total}</div><div class="pages">
    <button data-p="${page - 1}" ${page === 1 ? 'disabled' : ''}><i class="fa-solid fa-chevron-left"></i></button>
    ${out.map(n => n === '…' ? '<button disabled>…</button>' : `<button data-p="${n}" class="${n === page ? 'active' : ''}">${n}</button>`).join('')}
    <button data-p="${page + 1}" ${page === pages ? 'disabled' : ''}><i class="fa-solid fa-chevron-right"></i></button></div>`;
  el.onclick = e => { const b = e.target.closest('[data-p]'); if (b && !b.disabled) onChange(+b.dataset.p); };
  return page;
}

/* ---------- Chart.js helpers ---------- */
const CHART_COLORS = ['#b5432a', '#d9a441', '#1f9a8a', '#3b7bd6', '#7d5bd6', '#2e9b5f', '#d98a12', '#d64545'];
const _charts = {};
function makeChart(id, config) {
  if (typeof Chart === 'undefined') { const c = document.getElementById(id); if (c) c.parentElement.innerHTML = '<div class="empty"><p>Chart library could not load (check internet).</p></div>'; return; }
  if (_charts[id]) _charts[id].destroy();
  Chart.defaults.font.family = "'Inter',sans-serif"; Chart.defaults.color = '#7b6b63';
  config.options = Object.assign({ responsive: true, maintainAspectRatio: false }, config.options || {});
  _charts[id] = new Chart(document.getElementById(id), config);
  return _charts[id];
}
const gridOpts = { grid: { color: '#f0e7dd' }, border: { display: false } };

/* revenue by day key for given orders */
function revenueByDay(orders) {
  const m = {}; orders.filter(isPaid).forEach(o => { const k = dayKey(o.createdAt); m[k] = (m[k] || 0) + o.total; }); return m;
}
function lastNDays(n) {
  const out = []; for (let i = n - 1; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); out.push(d); } return out;
}
