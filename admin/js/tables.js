/* =====================================================
   TABLES.JS (admin) — floor layout, CRUD, status, QR codes
   ===================================================== */
Admin.init('tables', 'Table Management & QR Codes');
let filter = 'All';

/* URL encoded inside each table's QR code */
const qrUrl = n => new URL('../customer/qr-entry.html?table=' + n, location.href).href;

function render() {
  const tables = Store.tables().sort((a, b) => a.number - b.number);
  const count = s => tables.filter(t => t.status === s).length;
  $('#stats').innerHTML = [['Total tables', tables.length, 'fa-chair', 'brand'], ['Available', count('Available'), 'fa-circle-check', 'green'], ['Occupied', count('Occupied'), 'fa-users', 'red'], ['Reserved', count('Reserved'), 'fa-bookmark', 'amber'], ['Cleaning', count('Cleaning'), 'fa-broom', 'blue']]
    .map(c => `<div class="card stat"><div class="ico ico-${c[3]}"><i class="fa-solid ${c[2]}"></i></div><div><div class="lbl">${c[0]}</div><div class="val">${c[1]}</div></div></div>`).join('');
  $('#filters').innerHTML = ['All', ...TABLE_STATUSES].map(s => `<button class="chip ${filter === s ? 'active' : ''}" data-f="${s}">${s}</button>`).join('');

  const list = tables.filter(t => filter === 'All' || t.status === filter);
  const areas = [...new Set([...TABLE_AREAS, ...list.map(t => t.area)])].filter(a => list.some(t => t.area === a));
  $('#floor').innerHTML = areas.map(a => `<h3 class="area-title"><i class="fa-solid ${{ Indoor: 'fa-couch', Outdoor: 'fa-tree', Family: 'fa-people-roof', VIP: 'fa-crown' }[a] || 'fa-location-dot'}" style="color:var(--brand)"></i> ${esc(a)} <span>${list.filter(t => t.area === a).length} tables</span></h3>
    <div class="t-grid">${list.filter(t => t.area === a).map((t, i) => {
      const top = Math.ceil(t.seats / 2), bot = Math.floor(t.seats / 2);
      return `<div class="card t-card s-${t.status.toLowerCase()}" data-id="${t.id}" style="animation-delay:${i * 40}ms">
        <div class="tv"><div class="chairs">${'<i></i>'.repeat(top)}</div><div class="top">T${t.number}</div><div class="chairs bot">${'<i></i>'.repeat(bot)}</div></div>
        <div class="info"><i class="fa-solid fa-user-group"></i> ${t.seats} seats</div>
        <select class="status-select st-${t.status.toLowerCase()}" data-status="${t.id}" aria-label="Table status">${TABLE_STATUSES.map(s => `<option ${s === t.status ? 'selected' : ''}>${s}</option>`).join('')}</select>
        <div class="t-actions"><button class="btn btn-ghost btn-sm" data-qr="${t.id}"><i class="fa-solid fa-qrcode"></i> QR</button>
          <button class="icon-btn" data-edit="${t.id}" title="Edit"><i class="fa-solid fa-pen"></i></button>
          <button class="icon-btn danger" data-del="${t.id}" title="Delete"><i class="fa-regular fa-trash-can"></i></button></div></div>`; }).join('')}</div>`).join('')
    || '<div class="card empty"><i class="fa-solid fa-chair"></i><h3>No tables here</h3><p>Add a table or change the filter.</p></div>';
}

$('#filters').onclick = e => { const b = e.target.closest('[data-f]'); if (b) { filter = b.dataset.f; render(); } };
$('#floor').addEventListener('change', e => {
  const id = e.target.dataset.status; if (!id) return;
  const tables = Store.tables(), t = tables.find(x => x.id === id); t.status = e.target.value; Store.setTables(tables);
  Toast.show(`Table ${t.number} is now ${t.status}`, 'info'); render();
});
$('#floor').addEventListener('click', async e => {
  const q = e.target.closest('[data-qr]'), ed = e.target.closest('[data-edit]'), del = e.target.closest('[data-del]');
  const find = id => Store.tables().find(t => t.id === id);
  if (q) openQR(find(q.dataset.qr));
  if (ed) openForm(find(ed.dataset.edit));
  if (del) {
    const t = find(del.dataset.del);
    if (await Modal.confirm({ title: `Delete Table ${t.number}?`, message: 'Its QR code will stop working. This cannot be undone.', okText: 'Delete', danger: true })) {
      Store.setTables(Store.tables().filter(x => x.id !== t.id)); Toast.show('Table deleted', 'info'); render();
    }
  }
});

/* ---------- add / edit ---------- */
function openForm(t) {
  const isEdit = !!t, tables = Store.tables();
  const suggested = tables.reduce((m, x) => Math.max(m, x.number), 0) + 1;
  const d = t || { number: suggested, seats: 4, area: 'Indoor', status: 'Available' };
  const o = Modal.open({ title: isEdit ? `Edit Table ${t.number}` : 'Add table', size: 'sm', body: `<form id="tf" novalidate>
      <div class="form-row"><div class="field"><label>Table number <span class="req">*</span></label><input class="input" name="number" type="number" min="1" value="${d.number}"><small class="err"></small></div>
        <div class="field"><label>Seats <span class="req">*</span></label><input class="input" name="seats" type="number" min="1" max="20" value="${d.seats}"><small class="err"></small></div></div>
      <div class="field"><label>Area</label><select class="select" name="area">${TABLE_AREAS.map(a => `<option ${a === d.area ? 'selected' : ''}>${a}</option>`).join('')}</select></div>
      <div class="field" style="margin:0"><label>Status</label><select class="select" name="status">${TABLE_STATUSES.map(s => `<option ${s === d.status ? 'selected' : ''}>${s}</option>`).join('')}</select></div></form>`,
    footer: `<button class="btn btn-outline" data-close>Cancel</button><button class="btn btn-primary" id="save">${isEdit ? 'Save' : 'Add table'}</button>` });
  const form = $('#tf', o); Form.clearOnInput(form);
  const submit = () => {
    const v = Form.validate(form, {
      number: v => !(parseInt(v) >= 1) ? 'Enter a table number (1 or more)' : tables.some(x => x.number === parseInt(v) && x.id !== (t || {}).id) ? 'This table number already exists' : '',
      seats: v => !(parseInt(v) >= 1 && parseInt(v) <= 20) ? 'Seats must be 1–20' : ''
    });
    if (!v) return;
    const data = { number: parseInt(v.number), seats: parseInt(v.seats), area: form.area.value, status: form.status.value };
    if (isEdit) Object.assign(tables.find(x => x.id === t.id), data); else tables.push({ id: uid('T'), ...data });
    Store.setTables(tables); Toast.show(isEdit ? 'Table updated' : `Table ${data.number} added`); Modal.close(); render();
  };
  $('#save', o).onclick = submit; form.onsubmit = e => { e.preventDefault(); submit(); };
}

/* ---------- QR code ---------- */
function openQR(t) {
  const url = qrUrl(t.number);
  const o = Modal.open({ title: `QR code — Table ${t.number}`, size: 'sm', body: `
    <div class="qr-box" id="qr"></div>
    <p class="text-center small muted" style="margin-bottom:10px">Customers scan this code to open the menu for <b>Table ${t.number}</b>.</p>
    <div class="url-box" id="url">${esc(url)}</div>
    <a class="small" href="${esc(url)}" target="_blank" rel="noopener" style="color:var(--brand);font-weight:600;display:inline-block;margin-top:8px"><i class="fa-solid fa-arrow-up-right-from-square"></i> Test this link</a>`,
    footer: `<button class="btn btn-outline" id="copy"><i class="fa-regular fa-copy"></i> Copy link</button><button class="btn btn-outline" id="print"><i class="fa-solid fa-print"></i> Print</button><button class="btn btn-primary" id="dl"><i class="fa-solid fa-download"></i> Download PNG</button>` });
  if (typeof QRCode === 'undefined') { $('#qr', o).innerHTML = '<p class="muted small">QR library could not load (check internet).</p>'; }
  else new QRCode($('#qr', o), { text: url, width: 220, height: 220, colorDark: '#2b1e18', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.H });
  const dataUrl = () => { const c = $('#qr canvas', o), i = $('#qr img', o); return c ? c.toDataURL('image/png') : i ? i.src : ''; };
  $('#dl', o).onclick = () => { const d = dataUrl(); if (!d) return Toast.show('QR not ready', 'error'); const a = document.createElement('a'); a.href = d; a.download = `table-${t.number}-qr.png`; a.click(); };
  $('#print', o).onclick = () => { const d = dataUrl(); if (!d) return; printHTML(`<div class="qr-print"><h3 style="color:#b5432a">${esc(RESTAURANT.name)}</h3><h1>Table ${t.number}</h1><p>Scan to view the menu &amp; order from your seat</p><img src="${d}" style="width:320px;margin:20px auto;display:block"><p style="color:#7b6b63">${esc(url)}</p></div>`); };
  $('#copy', o).onclick = async () => { try { await navigator.clipboard.writeText(url); Toast.show('Link copied'); } catch (e) { Toast.show('Copy not allowed — select the link manually', 'error'); } };
}

$('#add-table').onclick = () => openForm();
render();
window.addEventListener('storage', render);
