/* =====================================================
   QR-ENTRY.JS — direct entry
   Table QR encodes:  https://<site>/customer/qr-entry.html?table=5
   Scan (phone camera / Google Lens) → table detected → menu opens automatically.
   Name + phone are asked only when the customer places an order.
   Add ?demo=1 to get the table-picker simulator for testing on a laptop.
   ===================================================== */
const stage = $('#qr-stage');
const params = new URLSearchParams(location.search);
const tableNo = parseInt(params.get('table'), 10);
const tables = Store.tables();

const scanFrame = done => `<div class="scan-frame ${done ? 'done' : ''}"><i class="fa-solid ${done ? 'fa-circle-check' : 'fa-qrcode'}"></i><div class="scan-line"></div></div>`;

function showScanPrompt() {
  stage.innerHTML = `${scanFrame(false)}<h2 style="font-size:1.5rem;margin-bottom:6px">Scan the QR code on your table</h2>
    <p class="muted">Open your phone camera or Google Lens and point it at the QR code on your table. The menu will open automatically.</p>`;
}

function showSimulator() {
  stage.innerHTML = `${scanFrame(false)}<h2 style="font-size:1.4rem;margin-bottom:6px">Demo: simulate a scan</h2>
    <p class="muted small">Pick a table to act as if its QR code was scanned.</p>
    <div class="sim-grid">${[...tables].sort((a, b) => a.number - b.number).map(t => {
      const blocked = t.status === 'Reserved' || t.status === 'Cleaning';
      return `<button class="sim-btn ${blocked ? 'blocked' : ''}" data-t="${t.number}" ${blocked ? 'disabled' : ''}><i class="fa-solid fa-chair" style="color:var(--${blocked ? 'amber' : 'brand'})"></i><br>Table ${t.number}<small class="muted">${t.status}</small></button>`; }).join('')}</div>`;
  $$('.sim-btn', stage).forEach(b => b.onclick = () => location.search = '?table=' + b.dataset.t);
}

function showProblem(title, text) {
  stage.innerHTML = `<div class="empty" style="padding:10px 0 10px"><i class="fa-solid fa-triangle-exclamation" style="color:var(--amber)"></i><h3>${title}</h3><p>${text}</p></div>`;
}

function enter(t) {
  const s = Store.session();
  if (s.table !== t.number) { s.cart = []; }      // new table → fresh cart
  s.table = t.number; Store.setSession(s);
  stage.innerHTML = `${scanFrame(true)}<div class="muted small">Table detected</div>
    <div class="table-big"><i class="fa-solid fa-chair"></i> Table ${t.number}</div>
    <p class="muted small">Opening the menu…</p><a class="btn btn-primary btn-block" href="menu.html" style="margin-top:12px">View Menu <i class="fa-solid fa-arrow-right"></i></a>`;
  setTimeout(() => location.replace('menu.html'), 1100);
}

if (!params.has('table')) params.has('demo') ? showSimulator() : showScanPrompt();
else {
  stage.innerHTML = `${scanFrame(false)}<h3>Scanning…</h3><p class="muted small">Identifying your table</p>`;
  setTimeout(() => {
    const t = tables.find(t => t.number === tableNo);
    if (!t) showProblem('Table not found', 'This QR code does not match any table. Please ask our staff for help.');
    else if (t.status === 'Reserved') showProblem(`Table ${t.number} is reserved`, 'This table is reserved. Please ask our staff for another table.');
    else if (t.status === 'Cleaning') showProblem(`Table ${t.number} is being cleaned`, 'Please try again in a minute.');
    else enter(t);
  }, 700);
}
