/* =====================================================
   REPORTS.JS (admin) — daily/weekly/monthly sales, popular items, customers
   Revenue = paid bills only (same rule as the dashboard).
   ===================================================== */
Admin.init('reports', 'Reports & Analytics');
let period = 'daily', rowsForCsv = [];

const startOfDay = d => { d = new Date(d); d.setHours(0, 0, 0, 0); return d; };

/* build [{label, from, to}] buckets for the selected period */
function buckets(p) {
  const out = [], today = startOfDay(new Date());
  if (p === 'daily') for (let i = 13; i >= 0; i--) { const f = new Date(today); f.setDate(f.getDate() - i); const t = new Date(f); t.setDate(t.getDate() + 1); out.push({ label: f.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }), from: f, to: t }); }
  if (p === 'weekly') for (let i = 7; i >= 0; i--) { const t = new Date(today); t.setDate(t.getDate() + 1 - i * 7); const f = new Date(t); f.setDate(f.getDate() - 7); const last = new Date(t); last.setDate(last.getDate() - 1);
    out.push({ label: f.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) + ' – ' + last.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }), from: f, to: t }); }
  if (p === 'monthly') for (let i = 5; i >= 0; i--) { const f = new Date(today.getFullYear(), today.getMonth() - i, 1), t = new Date(today.getFullYear(), today.getMonth() - i + 1, 1); out.push({ label: f.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }), from: f, to: t }); }
  return out;
}

function render() {
  const orders = Store.orders(), menu = Store.menu(), cats = Store.categories(), customers = Store.customers();
  const paid = orders.filter(isPaid), totalRev = revenueOf(orders);

  $('#stats').innerHTML = [['Total revenue', moneyShort(totalRev), 'fa-sack-dollar', 'gold'], ['Total orders', orders.length.toLocaleString('en-IN'), 'fa-receipt', 'brand'],
    ['Avg. order value', moneyShort(paid.length ? totalRev / paid.length : 0), 'fa-scale-balanced', 'teal'], ['Customers', customers.length, 'fa-users', 'blue']]
    .map((c, i) => `<div class="card stat" style="animation-delay:${i * 50}ms"><div class="ico ico-${c[3]}"><i class="fa-solid ${c[2]}"></i></div><div><div class="lbl">${c[0]}</div><div class="val">${c[1]}</div></div></div>`).join('');

  /* ----- period sales ----- */
  const b = buckets(period).map(x => { const inR = orders.filter(o => { const d = new Date(o.createdAt); return d >= x.from && d < x.to; }); const rev = revenueOf(inR), n = inR.length; return { ...x, orders: n, revenue: rev, avg: n ? rev / inR.filter(isPaid).length || 0 : 0 }; });
  $('#sales-title').textContent = { daily: 'Daily sales — last 14 days', weekly: 'Weekly sales — last 8 weeks', monthly: 'Monthly sales — last 6 months' }[period];
  makeChart('c-sales', { data: { labels: b.map(x => x.label), datasets: [
      { type: 'bar', label: 'Revenue (₹)', data: b.map(x => Math.round(x.revenue)), backgroundColor: '#b5432a', borderRadius: 8, yAxisID: 'y', order: 2 },
      { type: 'line', label: 'Orders', data: b.map(x => x.orders), borderColor: '#d9a441', backgroundColor: '#d9a441', tension: .35, pointRadius: 4, yAxisID: 'y1', order: 1 }] },
    options: { interaction: { mode: 'index', intersect: false }, plugins: { legend: { position: 'bottom', labels: { usePointStyle: true } } },
      scales: { y: { ...gridOpts, beginAtZero: true, ticks: { callback: v => '₹' + v.toLocaleString('en-IN') } }, y1: { position: 'right', beginAtZero: true, grid: { display: false }, border: { display: false } }, x: { grid: { display: false } } } } });
  rowsForCsv = [['Period', 'Orders', 'Revenue', 'Avg order value'], ...b.map(x => [x.label, x.orders, x.revenue.toFixed(2), x.avg.toFixed(2)])];
  $('#period-rows').innerHTML = [...b].reverse().map(x => `<tr><td><b>${x.label}</b></td><td>${x.orders}</td><td><b>${moneyShort(x.revenue)}</b></td><td>${moneyShort(x.avg)}</td></tr>`).join('') +
    `<tr style="background:#faf5ee"><td><b>Total</b></td><td><b>${b.reduce((s, x) => s + x.orders, 0)}</b></td><td><b>${moneyShort(b.reduce((s, x) => s + x.revenue, 0))}</b></td><td></td></tr>`;

  /* ----- popular items / categories (paid orders) ----- */
  const itemCat = Object.fromEntries(menu.map(m => [m.id, m.cat])), items = {}, byCat = {};
  paid.forEach(o => o.items.forEach(i => {
    const e = items[i.name] || (items[i.name] = { qty: 0, rev: 0 }); e.qty += i.qty; e.rev += i.qty * i.price;
    const c = itemCat[i.id] || 'other'; byCat[c] = (byCat[c] || 0) + i.qty * i.price;
  }));
  const top = Object.entries(items).sort((a, b) => b[1].qty - a[1].qty).slice(0, 8), max = top[0] ? top[0][1].qty : 1;
  makeChart('c-pop', { type: 'bar', data: { labels: top.map(t => t[0]), datasets: [{ data: top.map(t => t[1].qty), backgroundColor: '#d9a441', borderRadius: 8 }] },
    options: { indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: gridOpts, y: { grid: { display: false } } } } });
  const cl = Object.keys(byCat);
  makeChart('c-cat', { type: 'doughnut', data: { labels: cl.map(c => (cats.find(x => x.id === c) || { name: c }).name), datasets: [{ data: cl.map(c => Math.round(byCat[c])), backgroundColor: CHART_COLORS, borderWidth: 3, borderColor: '#fff' }] },
    options: { cutout: '58%', plugins: { legend: { position: 'right', labels: { usePointStyle: true } } } } });
  $('#pop-rows').innerHTML = top.map((t, i) => `<tr><td><span class="rank">${i + 1}</span></td><td><b>${esc(t[0])}</b></td>
    <td><div class="bar-cell"><div class="bar" style="width:${Math.round(t[1].qty / max * 90)}px"></div>${t[1].qty}</div></td><td>${moneyShort(t[1].rev)}</td></tr>`).join('');

  /* ----- customer report ----- */
  const rows = customers.map(c => { const m = paid.filter(o => o.customerId === c.id); return { c, n: m.length, s: m.reduce((a, o) => a + o.total, 0) }; })
    .sort((a, b) => b.s - a.s).slice(0, 8);
  $('#cust-rows').innerHTML = rows.map(r => `<tr><td><div class="cust-cell"><div class="avatar">${initials(r.c.name)}</div><b>${esc(r.c.name)}</b></div></td><td>${r.n}</td><td><b>${moneyShort(r.s)}</b></td><td>${moneyShort(r.n ? r.s / r.n : 0)}</td></tr>`).join('');
}

$('#tabs').onclick = e => { const b = e.target.closest('[data-p]'); if (!b) return; period = b.dataset.p; $$('#tabs button').forEach(x => x.classList.toggle('active', x === b)); render(); };
$('#csv').onclick = () => {
  const csv = rowsForCsv.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = `${period}-sales-report.csv`; a.click(); URL.revokeObjectURL(a.href);
  Toast.show('CSV downloaded');
};
render();
