# Code Guide — how this project works (simple version)

## 1. The big picture
```
Customer phone ──scan QR──▶ customer/ pages ─┐
                                              ├─▶ (now) browser localStorage   (demo)
Admin computer ──login────▶ admin/ pages ────┘
                                              └─▶ (next) backend/ API ─▶ MySQL database
```
- **Frontend** = what you see (HTML = structure, CSS = looks, JavaScript = behaviour).
- **Backend** = a program on a server that talks to the database. Phones and computers ask it for data.
- **Database (MySQL)** = where orders, menu and tables are stored permanently.

## 2. Folder map
| Folder | What is inside |
|---|---|
| `customer/` | Pages customers see: scan page, menu, cart, orders, bill, tables |
| `admin/` | Pages for the owner: login, dashboard, orders, menu, tables+QR, customers, billing, reports |
| `assets/css/` | Design: `base.css` (shared), `customer.css`, `admin.css` |
| `assets/js/` | Shared JavaScript: `data.js` (sample data + saving), `common.js` (popups, validation, invoice) |
| `backend/` | Node.js server (the API) |
| `database/` | `schema.sql` (creates tables), `seed.sql` (sample data) |

Each page has an `.html` file and a matching file in its `js/` folder with the same name. Example: `customer/menu.html` + `customer/js/menu.js`.

## 3. What happens when a customer orders
1. **Scan** → opens `qr-entry.html?table=3`. `qr-entry.js` reads `3` from the link and saves "table 3" for this visit, then opens the menu.
2. **Menu** → `menu.js` shows food cards. "Add" calls `Cart.add(...)` (in `customer-common.js`), which saves the cart.
3. **Cart** → `cart.js` shows items, quantity buttons and totals. "Place Order" asks name + phone, then creates the order.
4. **Orders** → `orders.js` shows the 5-step tracker (Pending → Served) and refreshes every 3 seconds.
5. **Bill** → `bill.js` shows the invoice. Payment is **only at the counter**: the customer shows the bill, the admin clicks "Payment received at counter" in **Admin → Billing**, and the bill becomes Paid.

## 4. Important files, one line each
- `assets/js/data.js` — restaurant name, tax rate, admin login, sample data, and `Store` (read/save data).
- `assets/js/common.js` — `Toast` (small messages), `Modal` (popups), `Form.validate` (checks inputs), `invoiceHTML` (bill layout).
- `customer/js/customer-common.js` — top menu bar, cart functions, and the rule "no QR scan = no access".
- `admin/js/admin-common.js` — sidebar, login check, pagination, chart helpers.
- `admin/js/orders.js` — order table, status dropdown, details popup.
- `admin/js/menu.js` — add/edit/delete food, upload image, categories.
- `admin/js/tables.js` — table layout, status change, **QR code generator**.
- `admin/js/billing.js` — bills list, generate invoice, mark paid, print.
- `admin/js/reports.js` — daily/weekly/monthly charts.
- `backend/server.js` — starts the API. `backend/routes/public.js` = customer API, `backend/routes/admin.js` = admin API (needs login).

## 5. JavaScript words you will see
| Word | Meaning | Example |
|---|---|---|
| `const x = 5` | a named value that does not change | `const TAX_RATE = 0.05` |
| `function` / `() => {}` | a reusable block of steps (the arrow `=>` is a short way to write one) | `const money = n => '₹' + n` |
| `{ name: 'Pizza', price: 299 }` | an **object**: one thing with details | one menu item |
| `[ a, b, c ]` | an **array**: a list | list of orders |
| `.map()` | turn every item of a list into something else | list of items → list of HTML cards |
| `.filter()` | keep only the items that match | search results |
| `.find()` | get the first item that matches | find order by ID |
| `` `Hello ${name}` `` | text with values inside | building HTML |
| `$('#id')` | find an element on the page | our short form of `document.querySelector` |
| `.onclick = ...` / `addEventListener` | "when the user clicks, do this" | Add to cart button |
| `localStorage` | small storage inside the browser | where the demo keeps orders |
| `async` / `await` | "wait for the server's answer, then continue" | backend calls |
| `fetch(url)` | ask the backend for data | `fetch('/api/menu')` |

## 6. Where things live
- Change restaurant name, tax %, admin password → top of `assets/js/data.js`.
- Change colours → the `:root { ... }` block at the top of `assets/css/base.css`.
- Change sample menu → `seedMenu()` in `assets/js/data.js` (demo) or `database/seed.sql` (database).
