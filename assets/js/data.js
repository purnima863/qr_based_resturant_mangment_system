/* =====================================================
   DATA.JS — sample data + tiny localStorage "Store"
   (No backend / no database: localStorage only, so the
   Customer and Admin panels share the same demo data.)
   ===================================================== */
const RESTAURANT = {
  name: 'FoodieHub',
  tagline: 'Fire-kissed flavours, served fresh at your table',
  address: '12, Assi Ghat Road, Varanasi, UP 221005',
  phone: '+91 98765 43210',
  email: 'hello@foodiehub.example',
  gstin: '09ABCDE1234F1Z5'
};
// Front-end only login (NOT real security — real auth needs a backend). Change before publishing.
const ADMIN_LOGIN = { username: 'admin', password: 'Admin@123' };
const TAX_RATE = 0.05; // 5% GST
const STATUSES = ['Pending', 'Confirmed', 'Preparing', 'Ready', 'Served'];
const TABLE_STATUSES = ['Available', 'Occupied', 'Reserved', 'Cleaning'];
const TABLE_AREAS = ['Indoor', 'Outdoor', 'Family', 'VIP'];

/* ---------- localStorage wrapper ---------- */
const DB = {
  read(key, seedFn) {
    try { const v = localStorage.getItem('rqr_' + key); if (v) return JSON.parse(v); } catch (e) {}
    const seed = seedFn(); DB.write(key, seed); return seed;
  },
  write(key, value) {
    try { localStorage.setItem('rqr_' + key, JSON.stringify(value)); return true; }
    catch (e) { console.warn('Storage error', e); if (window.Toast) Toast.show('Browser storage is full', 'error'); return false; }
  },
  reset() { Object.keys(localStorage).filter(k => k.startsWith('rqr_')).forEach(k => localStorage.removeItem(k)); }
};

/* ---------- seeded random so demo data is stable ---------- */
function rng(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/* ---------- seed: categories ---------- */
function seedCategories() {
  return [
    { id: 'pizza',   name: 'Pizza',        icon: 'fa-pizza-slice' },
    { id: 'burger',  name: 'Burger',       icon: 'fa-burger' },
    { id: 'indian',  name: 'Indian Food',  icon: 'fa-bowl-rice' },
    { id: 'snacks',  name: 'Snacks',       icon: 'fa-cookie-bite' },
    { id: 'drinks',  name: 'Drinks',       icon: 'fa-mug-hot' },
    { id: 'desserts',name: 'Desserts',     icon: 'fa-ice-cream' }
  ];
}

/* ---------- seed: menu ---------- */
function seedMenu() {
  const u = id => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=700&q=75`;
  const m = (id, name, cat, price, veg, desc, photo, rating, prep, available = true) =>
    ({ id, name, cat, price, veg, desc, img: u(photo), rating, prep, available });
  return [
    m('M01', 'Margherita Pizza', 'pizza', 299, true, 'Classic hand-tossed base with San Marzano tomato sauce, fresh mozzarella and basil.', 'photo-1574071318508-1cdbab80d002', 4.7, 20),
    m('M02', 'Farmhouse Pizza', 'pizza', 389, true, 'Loaded with capsicum, onion, mushroom, sweet corn and juicy tomatoes.', 'photo-1513104890138-7c749659a591', 4.6, 22),
    m('M03', 'Pepperoni Feast', 'pizza', 449, false, 'Generous pepperoni slices over molten mozzarella on a crisp thin crust.', 'photo-1628840042765-356cda07504e', 4.8, 22),
    m('M04', 'Paneer Tikka Pizza', 'pizza', 369, true, 'Tandoori paneer cubes, onion and mint mayo on a spicy tikka base.', 'photo-1565299624946-b28f40a0ae38', 4.5, 22),

    m('M05', 'Classic Veg Burger', 'burger', 179, true, 'Crunchy veggie patty, lettuce, tomato and our signature house sauce.', 'photo-1568901346375-23c9450c58cd', 4.4, 12),
    m('M06', 'Crispy Chicken Burger', 'burger', 229, false, 'Buttermilk-fried chicken, pickles and smoky mayo in a toasted brioche bun.', 'photo-1550547660-d9450f859349', 4.7, 15),
    m('M07', 'Double Cheese Burger', 'burger', 269, false, 'Two juicy patties, double melted cheddar, caramelised onions and mustard.', 'photo-1553979459-d2229ba7433b', 4.6, 15),
    m('M08', 'Aloo Tikki Burger', 'burger', 149, true, 'Spiced potato tikki with mint chutney, onions and cheese slice.', 'photo-1571091718767-18b5b1457add', 4.3, 10),

    m('M09', 'Paneer Butter Masala', 'indian', 289, true, 'Soft paneer cubes simmered in a rich, creamy tomato-butter gravy.', 'photo-1631452180519-c014fe946bc7', 4.8, 18),
    m('M10', 'Hyderabadi Chicken Biryani', 'indian', 349, false, 'Slow-cooked basmati rice layered with marinated chicken, saffron and herbs.', 'photo-1563379091339-03b21ab4a4f8', 4.9, 25),
    m('M11', 'Dal Makhani', 'indian', 239, true, 'Black lentils simmered overnight with butter and cream for a velvety finish.', 'photo-1546833999-b9f581a1996d', 4.6, 15),
    m('M12', 'Garlic Naan (2 pcs)', 'indian', 89, true, 'Tandoor-baked soft naan brushed with garlic butter and coriander.', 'photo-1601050690597-df0568f70950', 4.5, 8),

    m('M13', 'Peri Peri Fries', 'snacks', 129, true, 'Golden fries tossed in fiery peri-peri seasoning with a cool dip.', 'photo-1573080496219-bb080dd4f877', 4.4, 8),
    m('M14', 'Veg Spring Rolls', 'snacks', 169, true, 'Crispy rolls stuffed with seasoned vegetables, served with sweet chilli sauce.', 'photo-1606525437679-037aca74a3e9', 4.2, 12),
    m('M15', 'Paneer Tikka', 'snacks', 249, true, 'Charcoal-grilled marinated paneer with peppers, onions and mint chutney.', 'photo-1567188040759-fb8a883dc6d8', 4.7, 15),
    m('M16', 'Chilli Garlic Wings', 'snacks', 279, false, 'Six crispy wings glazed in a sticky chilli-garlic sauce.', 'photo-1567620832903-9fc6debc209f', 4.6, 15),

    m('M17', 'Fresh Lime Soda', 'drinks', 89, true, 'Zesty lime, mint and soda — sweet, salted or mixed.', 'photo-1513558161293-cdaf765ed2fd', 4.3, 4),
    m('M18', 'Mango Lassi', 'drinks', 119, true, 'Thick chilled yoghurt blended with Alphonso mango pulp.', 'photo-1553361371-9b22f78e8b1d', 4.7, 5),
    m('M19', 'Cold Coffee', 'drinks', 149, true, 'Creamy iced coffee blended with vanilla ice cream and chocolate drizzle.', 'photo-1461023058943-07fcbe16d735', 4.6, 6),
    m('M20', 'Peach Iced Tea', 'drinks', 129, true, 'Freshly brewed black tea, peach syrup and lots of ice.', 'photo-1556679343-c7306c1976bc', 4.2, 5),

    m('M21', 'Chocolate Lava Cake', 'desserts', 169, true, 'Warm chocolate cake with a gooey molten centre and vanilla ice cream.', 'photo-1624353365286-3f8d62daad51', 4.9, 12),
    m('M22', 'Gulab Jamun (2 pcs)', 'desserts', 99, true, 'Soft khoya dumplings soaked in warm cardamom-rose syrup.', 'photo-1666190092159-3171cf0fbb12', 4.5, 5),
    m('M23', 'Walnut Brownie Sundae', 'desserts', 189, true, 'Fudgy brownie, vanilla scoop, hot chocolate sauce and toasted walnuts.', 'photo-1564355808539-22fda35bed7e', 4.7, 8),
    m('M24', 'Rasmalai (2 pcs)', 'desserts', 129, true, 'Spongy cottage-cheese discs in chilled saffron milk with pistachios.', 'photo-1589301760014-d929f3979dbc', 4.6, 5, false)
  ];
}

/* ---------- seed: tables ---------- */
function seedTables() {
  const seats  = [2, 2, 4, 4, 4, 4, 6, 6, 2, 8, 8, 4];
  const areas  = ['Indoor','Indoor','Indoor','Indoor','Indoor','Outdoor','Outdoor','Outdoor','Outdoor','Family','Family','VIP'];
  const status = ['Available','Occupied','Available','Reserved','Occupied','Available','Cleaning','Available','Occupied','Reserved','Available','Available'];
  return seats.map((s, i) => ({ id: 'T' + (i + 1), number: i + 1, seats: s, area: areas[i], status: status[i] }));
}

/* ---------- seed: customers ---------- */
function seedCustomers() {
  const names = ['Aarav Sharma','Priya Verma','Rohan Gupta','Ananya Singh','Vikram Yadav','Sneha Mishra','Karan Patel','Neha Tiwari','Aditya Pandey','Kavya Reddy','Rahul Mehta','Isha Kapoor'];
  const r = rng(7);
  return names.map((n, i) => {
    const d = new Date(); d.setDate(d.getDate() - 20 - Math.floor(r() * 120));
    const first = n.split(' ')[0].toLowerCase();
    return { id: 'C' + String(i + 1).padStart(3, '0'), name: n, phone: '98765' + String(43210 + i * 137).slice(-5),
      email: `${first}${i + 1}@example.com`, joined: d.toISOString() };
  });
}

/* ---------- seed: orders ---------- */
function seedOrders() {
  const r = rng(42), menu = seedMenu().filter(m => m.available), custs = seedCustomers();
  const now = new Date(), sod = new Date(now); sod.setHours(0, 0, 0, 0);
  const methods = ['Cash'];   // payment is only at the counter
  const all = [];

  const makeItems = () => {
    const n = 1 + Math.floor(r() * 4), picked = new Set(), items = [];
    while (items.length < n) {
      // weight cheaper/popular items a little more
      const m = menu[Math.floor(Math.pow(r(), 1.25) * menu.length)];
      if (picked.has(m.id)) continue; picked.add(m.id);
      items.push({ id: m.id, name: m.name, price: m.price, qty: 1 + Math.floor(r() * 2.4) });
    }
    return items;
  };
  const push = (date) => {
    const c = custs[Math.floor(r() * custs.length)], items = makeItems();
    all.push({ date, c, items, table: 1 + Math.floor(r() * 12) });
  };

  for (let d = 150; d >= 1; d--) {
    const day = new Date(now); day.setDate(now.getDate() - d);
    const dow = day.getDay(), count = (dow === 0 || dow === 6) ? 4 + Math.floor(r() * 4) : 2 + Math.floor(r() * 4);
    for (let k = 0; k < count; k++) {
      const dt = new Date(day); dt.setHours(11 + Math.floor(r() * 11), Math.floor(r() * 60), 0, 0); push(dt);
    }
  }
  const elapsed = Math.max(now - sod, 3600e3), todayCount = 8;
  for (let i = 0; i < todayCount; i++) push(new Date(sod.getTime() + elapsed * (i + 1) / (todayCount + 1)));

  all.sort((a, b) => a.date - b.date);
  const todayFlow = ['Served','Served','Ready','Preparing','Preparing','Confirmed','Pending','Pending'];
  let ti = 0;
  return all.map((o, i) => {
    const isToday = o.date >= sod;
    const status = isToday ? todayFlow[ti++] : 'Served';
    const paid = isToday ? (status === 'Served' && ti <= 2) : true;
    const t = calc(o.items, 0);
    return {
      id: 'ORD-' + (1001 + i), customerId: o.c.id, customerName: o.c.name, phone: o.c.phone,
      table: o.table, items: o.items, subtotal: t.subtotal, discount: 0, tax: t.tax, total: t.total,
      status, payment: paid ? 'Paid' : 'Unpaid', method: paid ? methods[0] : null,
      note: '', invoiceNo: paid ? 'INV-' + (5001 + i) : null, createdAt: o.date.toISOString()
    };
  });
}

/* ---------- Store: single access point to all data ---------- */
const Store = {
  categories: () => DB.read('categories', seedCategories),
  setCategories: v => DB.write('categories', v),
  menu: () => DB.read('menu', seedMenu),
  setMenu: v => DB.write('menu', v),
  tables: () => DB.read('tables', seedTables),
  setTables: v => DB.write('tables', v),
  customers: () => DB.read('customers', seedCustomers),
  setCustomers: v => DB.write('customers', v),
  orders: () => DB.read('orders', seedOrders),
  setOrders: v => DB.write('orders', v),
  session: () => DB.read('session', () => ({ table: null, customerId: null, cart: [], lastOrderId: null })),
  setSession: v => DB.write('session', v)
};

/* ---------- billing maths (shared by Customer + Admin) ---------- */
function calc(items, discount = 0) {
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const taxable = Math.max(0, subtotal - discount);
  const tax = +(taxable * TAX_RATE).toFixed(2);
  return { subtotal, discount, tax, total: +(taxable + tax).toFixed(2) };
}
