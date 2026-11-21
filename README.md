# FoodieHub — QR Code Based Restaurant Management System (Frontend)

Two separate panels, HTML + CSS + JavaScript only (no backend yet):

- **Customer** (`customer/`): scan table QR → menu opens directly → cart, orders, bill, table availability.
- **Admin** (`admin/login.html`): dashboard, orders, menu, tables & QR codes, billing, reports.

## Run / deploy
Enable **Settings → Pages → Deploy from branch → main / root**. Site: `https://purnima863.github.io/qr_based_resturant_mangment_system/`

Then log in to `admin/login.html` and print each table's QR from **Tables & QR** (the QR uses the live link).

## Notes
- Admin login is front-end only (`ADMIN_LOGIN` in `assets/js/data.js`) — change the password; real security needs a backend.
- Data is stored in browser localStorage (demo). Orders do not sync across devices until a backend/database is added.
