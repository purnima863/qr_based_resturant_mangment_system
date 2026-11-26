# Backend (Node.js + Express + MySQL)

## Setup (once)
1. Make sure the database exists (`database/schema.sql` + `database/seed.sql`).
2. In this folder:
   ```
   cd backend
   npm install
   copy .env.example .env        (Windows)   |   cp .env.example .env   (Mac/Linux)
   ```
3. Open `.env` and set `DB_PASSWORD` and `JWT_SECRET` (32+ random characters).
4. Create the admin login (password is stored hashed):
   ```
   npm run create-admin -- admin "YourStrongPassword"
   ```
5. Start: `npm start` → open http://localhost:3000/api/health → should show `{"ok":true,"database":"connected"}`

## API
**Public (customer):** `GET /api/menu` · `/api/categories` · `/api/tables` · `/api/tables/:n/scan` · `POST /api/orders` · `GET /api/orders/:code?phone=` · `GET /api/my-orders?phone=`

**Admin (header `Authorization: Bearer <token>`):** `POST /api/admin/login` · `GET /api/admin/orders` · `PATCH /api/admin/orders/:code/status|payment` · `POST /api/admin/orders/:code/invoice` · `GET /api/admin/customers` · CRUD `/api/admin/menu`, `/api/admin/categories`, `/api/admin/tables`

Payment is only at the counter: the admin marks a bill Paid (`PATCH /api/admin/orders/:code/payment`). Prices/totals are always calculated on the server. Never commit `.env`.
