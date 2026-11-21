/* =====================================================
   DASHBOARD.JS — KPI cards, charts, recent orders
   ===================================================== */
Admin.init('dashboard', 'Dashboard');

function renderDashboard() {
  const orders = Store.orders(), tables = Store.tables(), customers = Store.customers(), menu = Store.menu(), cats = Store.categories();
  const today = dayKey(new Date());
  const cards = [
    ['Total Orders', orders.length.toLocaleString('en-IN'), 'fa-receipt', 'brand', 'All time'],
    ['Total Customers', customers.length, 'fa-users', 'blue', 'Registered via QR'],
    ["Today's Revenue", moneyShort(revenueOf(orders.filter(o => dayKey(o.createdAt) === today))), 'fa-indian-rupee-sign', 'green', 'Paid bills today'],
    ['Total Revenue', moneyShort(revenueOf(orders)), 'fa-sack-dollar', 'gold', 'All paid bills'],
    ['Available Tables', tables.filter(t => t.status === 'Available').length + ' / ' + tables.length, 'fa-chair', 'teal', 'Ready for guests'],
    ['Occupied Tables', tables.filter(t => t.status === 'Occupied').length, 'fa-users-line', 'red', 'Currently dining'],
    ['Pending Orders', orders.filter(o => o.status === 'Pending').length, 'fa-hourglass-half', 'amber', 'Need confirmation']
  ];
  $('#stats').innerHTML = cards.map((c, i) => `<div class="card stat" style="animation-delay:${i * 50}ms"><div class="ico ico-${c[3]}"><i class="fa-solid ${c[2]}"></i></div>
    <div><div class="lbl">${c[0]}</div><div class="val">${c[1]}</div><div class="sub">${c[4]}</div></div></div>`).join('');

  /* sales last 7 days */
  const days = lastNDays(7), rev = revenueByDay(orders);
  makeChart('c-sales', { type: 'line', data: { labels: days.map(d => d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' })),
    datasets: [{ label: 'Revenue (₹)', data: days.map(d => Math.round(rev[dayKey(d)] || 0)), borderColor: '#b5432a', backgroundColor: 'rgba(181,67,42,.12)', fill: true, tension: .38, pointBackgroundColor: '#fff', pointBorderColor: '#b5432a', pointBorderWidth: 2, pointRadius: 5 }] },
    options: { plugins: { legend: { display: false } }, scales: { y: { ...gridOpts, beginAtZero: true, ticks: { callback: v => '₹' + v.toLocaleString('en-IN') } }, x: { grid: { display: false } } } } });

  /* status doughnut */
  makeChart('c-status', { type: 'doughnut', data: { labels: STATUSES, datasets: [{ data: STATUSES.map(s => orders.filter(o => o.status === s).length), backgroundColor: ['#d98a12', '#3b7bd6', '#7d5bd6', '#1f9a8a', '#2e9b5f'], borderWidth: 3, borderColor: '#fff' }] },
    options: { cutout: '62%', plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 14 } } } } });

  /* category revenue + top items */
  const itemCat = Object.fromEntries(menu.map(m => [m.id, m.cat]));
  const byCat = {}, byItem = {};
  orders.filter(isPaid).forEach(o => o.items.forEach(i => {
    const c = itemCat[i.id] || 'other'; byCat[c] = (byCat[c] || 0) + i.price * i.qty;
    byItem[i.name] = (byItem[i.name] || 0) + i.qty;
  }));
  const catLabels = Object.keys(byCat);
  makeChart('c-cat', { type: 'bar', data: { labels: catLabels.map(c => (cats.find(x => x.id === c) || { name: c }).name), datasets: [{ data: catLabels.map(c => Math.round(byCat[c])), backgroundColor: CHART_COLORS, borderRadius: 8 }] },
    options: { plugins: { legend: { display: false } }, scales: { y: { ...gridOpts, ticks: { callback: v => '₹' + (v / 1000) + 'k' } }, x: { grid: { display: false } } } } });
  const top = Object.entries(byItem).sort((a, b) => b[1] - a[1]).slice(0, 5);
  makeChart('c-top', { type: 'bar', data: { labels: top.map(t => t[0]), datasets: [{ data: top.map(t => t[1]), backgroundColor: '#d9a441', borderRadius: 8 }] },
    options: { indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { ...gridOpts }, y: { grid: { display: false } } } } });

  /* recent orders */
  $('#recent').innerHTML = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 7).map(o => `<tr>
    <td><b>${o.id}</b></td><td>${esc(o.customerName)}</td><td>Table ${o.table}</td><td><b>${moneyShort(o.total)}</b></td><td class="muted">${fmtDateTime(o.createdAt)}</td><td>${statusBadge(o.status)}</td></tr>`).join('');
}
renderDashboard();
window.addEventListener('storage', renderDashboard);
