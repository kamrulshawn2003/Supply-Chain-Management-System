# Supply-Chain-Management-System

A full-stack Supply Chain Management System with role-based access for **admin, warehouse manager, supplier, customer, and driver**.

Live demo: *add your Vercel URL here after deploying — see [DEPLOYMENT.md](DEPLOYMENT.md)*

## Features

- **Auth & RBAC** — JWT login, registration, five roles with per-role API and UI access
- **Products & Inventory** — product catalog, multi-warehouse stock, stock movements, low-stock alerts
- **Orders** — create / approve / ship / deliver lifecycle, customer order cancellation with automatic stock restock
- **Purchasing** — purchase orders (draft → pending → approved → received → cancelled) with multi-line items and goods-receipt stock in
- **Returns** — customers request returns on delivered orders; admin/warehouse approve or reject with stock restock
- **Notifications** — in-app notification center + navbar bell with unread badge (30s polling)
- **Reports & Analytics** — revenue report, dashboard summaries, low-stock overview
- **Admin panel** — user / supplier / warehouse management (CRUD)

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, Redux Toolkit, React Router, Tailwind CSS, Headless UI, Recharts |
| Backend | Node.js, Express, Sequelize ORM |
| Database | MySQL |

## Project Structure

```
├── backend/          # Express API (port 5000), models, migrations, services, routes
├── scms-frontend/    # React/Vite SPA (port 3000)
├── database/         # Local MySQL dumps (dev reference)
└── docs/             # Manual test checklist
```

## Run Locally

1. **Database** — create a MySQL database and set the credentials in `backend/.env`:

   ```env
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_NAME=scms_db
   DB_USER=root
   DB_PASSWORD=your_password
   JWT_SECRET=change_me
   ```

2. **Backend**

   ```bash
   cd backend
   npm install
   npm run migrate     # creates all tables
   npm start           # http://localhost:5000
   ```

3. **Frontend**

   ```bash
   cd scms-frontend
   npm install
   npm run dev         # http://localhost:3000
   ```

### Demo Accounts (local dev database)

| Role | Email | Password |
|---|---|---|
| Admin | `test@gmail.com` | `123456` |
| Warehouse Manager | `warehouse@test.com` | `123456` |
| Customer | `customer@test.com` | `123456` |
| Driver | `driver@test.com` | `123456` |
| Admin (test) | `scms.test.admin@example.com` | `Test#12345` |
| Customer (test) | `scms.test.customer@example.com` | `Test#12345` |

## Deployment

Step-by-step guide for **Vercel (frontend) + Render (backend) + Aiven (MySQL)** is in **[DEPLOYMENT.md](DEPLOYMENT.md)**. A Render Blueprint (`render.yaml`) is included at the repo root.
