/* =====================================================
   MENU.JS (admin) — CRUD for food items + categories
   ===================================================== */
Admin.init('menu', 'Menu Management');
const ICONS = ['fa-utensils', 'fa-pizza-slice', 'fa-burger', 'fa-bowl-rice', 'fa-cookie-bite', 'fa-mug-hot', 'fa-ice-cream', 'fa-fish', 'fa-drumstick-bite', 'fa-carrot', 'fa-bread-slice', 'fa-martini-glass', 'fa-cake-candles', 'fa-egg'];

const catName = id => (Store.categories().find(c => c.id === id) || { name: id }).name;

function fillCatFilter() {
  const cur = $('#f-cat').value;
  $('#f-cat').innerHTML = '<option value="all">All categories</option>' + Store.categories().map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('');
  $('#f-cat').value = Store.categories().some(c => c.id === cur) ? cur : 'all';
}

function render() {
  const q = $('#q').value.trim().toLowerCase(), cat = $('#f-cat').value, av = $('#f-avail').value;
  const list = Store.menu().filter(m => (cat === 'all' || m.cat === cat) && (av === 'all' || (av === 'yes') === m.available) && (!q || (m.name + m.desc).toLowerCase().includes(q)));
  $('#count').textContent = `${list.length} item${list.length === 1 ? '' : 's'}`;
  $('#grid').innerHTML = list.map((m, i) => `<article class="card m-card ${m.available ? '' : 'off'}" data-id="${m.id}" style="animation-delay:${Math.min(i, 10) * 35}ms">
    <div class="img">${foodImg(m)}${statusBadge(m.available ? 'Available' : 'Occupied').replace('Occupied', 'Unavailable')}<span class="veg-dot ${m.veg ? '' : 'non'}"></span></div>
    <div class="body"><div><h4>${esc(m.name)}</h4><div class="cat">${esc(catName(m.cat))} · ${m.prep} min</div></div>
      <div class="row"><label class="price-edit" title="Edit price"><span>₹</span><input type="number" min="1" step="1" value="${m.price}" data-price="${m.id}"></label>
        <label class="avail-wrap"><span class="switch"><input type="checkbox" data-avail="${m.id}" ${m.available ? 'checked' : ''}><span></span></span></label></div>
      <div class="row" style="border-top:1px solid var(--line);padding-top:8px;justify-content:flex-end">
        <button class="btn btn-ghost btn-sm" data-edit="${m.id}"><i class="fa-solid fa-pen"></i> Edit</button>
        <button class="btn btn-ghost btn-sm" data-del="${m.id}" style="color:var(--red)"><i class="fa-regular fa-trash-can"></i> Delete</button></div></div></article>`).join('') ||
    '<div class="card empty" style="grid-column:1/-1"><i class="fa-solid fa-bowl-food"></i><h3>No items found</h3><p>Add a new food item or change filters.</p></div>';
}

/* ---------- inline price / availability / buttons ---------- */
$('#grid').addEventListener('change', e => {
  const menu = Store.menu();
  if (e.target.dataset.price) {
    const m = menu.find(x => x.id === e.target.dataset.price), v = parseFloat(e.target.value);
    if (!(v > 0)) { Toast.show('Price must be greater than 0', 'error'); e.target.value = m.price; return; }
    m.price = Math.round(v * 100) / 100; Store.setMenu(menu); Toast.show(`${m.name} price updated to ${moneyShort(m.price)}`);
  }
  if (e.target.dataset.avail) {
    const m = menu.find(x => x.id === e.target.dataset.avail); m.available = e.target.checked; Store.setMenu(menu);
    Toast.show(`${m.name} is now ${m.available ? 'available' : 'unavailable'}`, 'info'); render();
  }
});
$('#grid').addEventListener('click', async e => {
  const ed = e.target.closest('[data-edit]'), del = e.target.closest('[data-del]');
  if (ed) openForm(Store.menu().find(m => m.id === ed.dataset.edit));
  if (del) {
    const m = Store.menu().find(x => x.id === del.dataset.del);
    if (await Modal.confirm({ title: 'Delete item?', message: `“${esc(m.name)}” will be removed from the menu. Past orders are not affected.`, okText: 'Delete', danger: true })) {
      Store.setMenu(Store.menu().filter(x => x.id !== m.id)); Toast.show('Item deleted', 'info'); render();
    }
  }
});

/* ---------- add / edit form ---------- */
function resizeImage(file, max = 700) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onerror = rej;
    r.onload = () => { const img = new Image(); img.onerror = rej; img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas');
      c.width = img.width * k; c.height = img.height * k; c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      res(c.toDataURL('image/jpeg', .82)); }; img.src = r.result; };
    r.readAsDataURL(file);
  });
}

function openForm(item) {
  const isEdit = !!item, m = item || { name: '', cat: Store.categories()[0]?.id, price: '', veg: true, desc: '', prep: 15, available: true, img: '' };
  let img = m.img || '';
  const o = Modal.open({ title: isEdit ? 'Edit food item' : 'Add food item', size: 'lg', body: `
    <form id="mf" novalidate>
      <div class="form-row"><div>
        <div class="field"><label>Food name <span class="req">*</span></label><input class="input" name="name" value="${esc(m.name)}" maxlength="50"><small class="err"></small></div>
        <div class="form-row"><div class="field"><label>Category <span class="req">*</span></label><select class="select" name="cat">${Store.categories().map(c => `<option value="${c.id}" ${c.id === m.cat ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select><small class="err"></small></div>
          <div class="field"><label>Price (₹) <span class="req">*</span></label><input class="input" name="price" type="number" min="1" step="1" value="${m.price}"><small class="err"></small></div></div>
        <div class="form-row"><div class="field"><label>Prep time (min)</label><input class="input" name="prep" type="number" min="1" max="120" value="${m.prep}"><small class="err"></small></div>
          <div class="field"><label>Type</label><div class="radio-pills"><label><input type="radio" name="veg" value="1" ${m.veg ? 'checked' : ''}><span><i class="veg-dot"></i> Veg</span></label><label><input type="radio" name="veg" value="0" ${!m.veg ? 'checked' : ''}><span><i class="veg-dot non"></i> Non-veg</span></label></div></div></div>
      </div>
      <div class="field"><label>Food image</label>
        <label class="upload" id="up"><input type="file" accept="image/*" id="file">
          ${img ? `<img src="${esc(img)}" alt="" id="prev" data-cat="${esc(m.cat)}" onerror="imgFail(this)">` : '<div class="ph" id="ph"><i class="fa-solid fa-cloud-arrow-up"></i><b>Click to upload</b><br><span class="small">JPG / PNG, up to 5 MB</span></div>'}
        </label><small class="err"></small>
        <input class="input" name="imgurl" placeholder="…or paste an image URL" value="${img.startsWith('data:') ? '' : esc(img)}" style="margin-top:8px"></div></div>
      <div class="field"><label>Description <span class="req">*</span></label><textarea class="textarea" name="desc" maxlength="160">${esc(m.desc)}</textarea><small class="err"></small></div>
      <label class="flex center gap-1" style="font-weight:600;font-size:.9rem"><span class="switch"><input type="checkbox" name="available" ${m.available ? 'checked' : ''}><span></span></span> Available to order</label>
    </form>`,
    footer: `<button class="btn btn-outline" data-close>Cancel</button><button class="btn btn-primary" id="save"><i class="fa-solid fa-check"></i> ${isEdit ? 'Save changes' : 'Add item'}</button>` });

  const form = $('#mf', o); Form.clearOnInput(form);
  const setPreview = src => { img = src; $('#up', o).innerHTML = `<input type="file" accept="image/*" id="file"><img src="${esc(src)}" alt="" id="prev" data-cat="${esc(form.cat.value)}" onerror="imgFail(this)">`; bindFile(); };
  function bindFile() {
    $('#file', o).onchange = async e => {
      const f = e.target.files[0]; if (!f) return;
      const err = $('#up', o).closest('.field').querySelector('.err');
      if (!f.type.startsWith('image/')) { Form.mark($('#file', o), 'Please choose an image file'); return; }
      if (f.size > 5 * 1024 * 1024) { Form.mark($('#file', o), 'Image is larger than 5 MB'); return; }
      Form.mark($('#file', o), ''); setPreview(await resizeImage(f)); form.imgurl.value = '';
    };
  }
  bindFile();
  form.imgurl.addEventListener('change', () => { const v = form.imgurl.value.trim(); if (/^https?:\/\//i.test(v)) setPreview(v); });

  $('#save', o).onclick = () => {
    const v = Form.validate(form, {
      name: v => v.length < 2 ? 'Enter a food name (min 2 characters)' : '',
      cat: v => !v ? 'Choose a category' : '',
      price: v => !(parseFloat(v) > 0) ? 'Enter a price greater than 0' : parseFloat(v) > 100000 ? 'Price looks too high' : '',
      prep: v => !(parseInt(v) >= 1 && parseInt(v) <= 120) ? 'Enter 1–120 minutes' : '',
      desc: v => v.length < 10 ? 'Describe the dish (min 10 characters)' : ''
    });
    if (!v) return;
    const url = form.imgurl.value.trim();
    if (url && !/^https?:\/\//i.test(url)) { Form.mark(form.imgurl, 'Image URL must start with http(s)://'); return; }
    const menu = Store.menu();
    if (menu.some(x => x.id !== (item || {}).id && x.name.toLowerCase() === v.name.toLowerCase() && x.cat === v.cat)) { Form.mark(form.name, 'This item already exists in that category'); return; }
    const data = { name: v.name, cat: v.cat, price: Math.round(parseFloat(v.price) * 100) / 100, prep: parseInt(v.prep), desc: v.desc,
      veg: form.veg.value === '1', available: form.available.checked, img: img || url };
    if (isEdit) Object.assign(menu.find(x => x.id === item.id), data);
    else menu.unshift({ id: uid('M'), rating: 4.5, ...data });
    if (Store.setMenu(menu)) { Toast.show(isEdit ? 'Item updated' : 'Item added to menu'); Modal.close(); render(); }
  };
}

/* ---------- categories manager ---------- */
function openCategories() {
  const draw = () => {
    const cats = Store.categories(), menu = Store.menu();
    return `${cats.map(c => `<div class="cat-row" data-id="${c.id}"><div class="ci"><i class="fa-solid ${c.icon}"></i></div>
      <input class="input" value="${esc(c.name)}" data-rename="${c.id}" maxlength="24"><div class="flex"><span class="muted small" style="align-self:center;margin-right:6px">${menu.filter(m => m.cat === c.id).length} items</span>
      <button class="icon-btn danger" data-delcat="${c.id}" title="Delete"><i class="fa-regular fa-trash-can"></i></button></div></div>`).join('')}
      <form id="cf" class="form-row" style="margin-top:18px;align-items:end" novalidate>
        <div class="field" style="margin:0"><label>New category</label><input class="input" name="name" placeholder="e.g. Salads" maxlength="24"><small class="err"></small></div>
        <div class="flex gap-1"><select class="select" name="icon">${ICONS.map(i => `<option value="${i}">${i.replace('fa-', '')}</option>`).join('')}</select><button class="btn btn-primary">Add</button></div></form>`;
  };
  const o = Modal.open({ title: 'Manage categories', size: 'md', body: draw(), onClose: () => { fillCatFilter(); render(); } });
  const redraw = () => { $('.modal-body', o).innerHTML = draw(); };
  o.addEventListener('change', e => {
    const id = e.target.dataset.rename; if (!id) return;
    const cats = Store.categories(), c = cats.find(x => x.id === id), v = e.target.value.trim();
    if (v.length < 2) { Toast.show('Name is too short', 'error'); e.target.value = c.name; return; }
    if (cats.some(x => x.id !== id && x.name.toLowerCase() === v.toLowerCase())) { Toast.show('Category already exists', 'error'); e.target.value = c.name; return; }
    c.name = v; Store.setCategories(cats); Toast.show('Category renamed');
  });
  o.addEventListener('click', async e => {
    const d = e.target.closest('[data-delcat]'); if (!d) return;
    const used = Store.menu().filter(m => m.cat === d.dataset.delcat).length;
    if (used) return Toast.show(`Move or delete its ${used} item(s) first`, 'error');
    Store.setCategories(Store.categories().filter(c => c.id !== d.dataset.delcat)); Toast.show('Category deleted', 'info'); redraw();
  });
  o.addEventListener('submit', e => {
    e.preventDefault(); const f = e.target, cats = Store.categories();
    const v = Form.validate(f, { name: v => v.length < 2 ? 'Enter a category name' : cats.some(c => c.name.toLowerCase() === v.toLowerCase()) ? 'Category already exists' : '' });
    if (!v) return;
    cats.push({ id: slug(v.name) || uid('c'), name: v.name, icon: f.icon.value }); Store.setCategories(cats); Toast.show('Category added'); redraw();
  });
}

$('#add-item').onclick = () => openForm();
$('#manage-cats').onclick = openCategories;
$('#q').addEventListener('input', debounce(render, 200));
$('#f-cat').onchange = $('#f-avail').onchange = render;
fillCatFilter(); render();
