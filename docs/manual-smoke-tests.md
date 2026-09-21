# Manual Smoke Test Checklist

Use this checklist after `backend/scripts/verify-all-phases.js` passes, or whenever a phase is marked skipped because credentials, Docker, or a future endpoint are not available.

## Phase 1: Infrastructure & DB Connectivity

- [ ] Start backend and confirm `http://localhost:5000/` responds with `SCMS Backend Running`.
- [ ] Confirm the required health endpoint exists at `GET /api/health`, returns `200`, and includes uptime plus DB status.
- [ ] Confirm browser requests from the React dev origin, usually `http://localhost:5173`, are not blocked by CORS.
- [ ] Confirm invalid JSON and oversized/empty bodies return controlled API errors, not HTML stack traces.

## Phase 2: Authentication & RBAC

- [ ] Register a new customer from the React Register page.
- [ ] Log in from the React Login page and confirm the JWT/session is stored only in the intended place.
- [ ] Refresh a protected page and confirm the authenticated session is restored.
- [ ] Log out and confirm protected routes redirect to Login.
- [ ] Log in as a customer and verify admin-only screens and direct admin URLs are blocked.
- [ ] Log in as admin, warehouse manager, supplier, customer, and driver accounts and confirm each sidebar only shows allowed routes.

## Phase 3: Product Module

- [ ] Admin or supplier can create a product with name, price, category, and optional supplier.
- [ ] Invalid product forms show field-level errors and do not create records.
- [ ] Product list loads, paginates or scrolls cleanly, and empty state is readable.
- [ ] Product edit persists changes after refresh.
- [ ] Product delete removes the row and shows a success/error state.
- [ ] Customer/user roles cannot create, edit, or delete products through UI or direct API calls.

## Phase 4: Inventory Module

- [ ] Warehouse stock page shows product, warehouse, quantity, and low-stock threshold.
- [ ] Stock adjustment increases, decreases, and sets quantities correctly.
- [ ] Invalid stock operations, such as negative quantity or overdraw, show controlled errors.
- [ ] Warehouse transfer updates both source and destination inventories.
- [ ] Low-stock page shows items where quantity is at or below the configured threshold.
- [ ] Note: the current backend implementation checks `quantity < lowStockThreshold`; update it if the product requirement is `quantity <= threshold`.

## Phase 5: Order Management

- [ ] Customer can create an order only when inventory exists.
- [ ] Order creation deducts stock and reflects the new quantity in Inventory.
- [ ] Order detail page loads by ID and shows product, warehouse, status, total, and shipping address.
- [ ] Admin or warehouse manager can move orders through the supported lifecycle.
- [ ] Invalid transitions, such as delivered back to pending, are blocked.
- [ ] Driver assignment works only for approved or shipped orders.
- [ ] Driver can see assigned orders and mark allowed status changes.

## Phase 6: Dashboard & Analytics

- [ ] Dashboard cards show total users, products, suppliers, warehouses, low-stock count, and order status counts.
- [ ] Charts render with real data and remain readable at desktop, tablet, and mobile widths.
- [ ] Revenue/order reports filter correctly by status and date range.
- [ ] Report pages show loading, empty, error, and success states.
- [ ] Analytics endpoints respond within the agreed threshold, for example under 2 seconds on local seed data.

## Phase 7: Deployment & Environment

- [ ] `docker compose up --build` starts frontend, backend, and database services.
- [ ] `docker ps` shows backend and database containers as running, and health checks are healthy if configured.
- [ ] Production `.env` values are populated: `NODE_ENV`, `PORT`, `JWT_SECRET`, and either `DATABASE_URL` or the DB host/user/password/name variables.
- [ ] Production CORS allows only the approved frontend domain.
- [ ] API base URL in the frontend build points to the deployed backend.
- [ ] Domain DNS resolves to the deployment target.
- [ ] HTTPS certificate is valid and redirects from HTTP to HTTPS.
- [ ] Deployment logs contain no startup errors, migration failures, unhandled promise rejections, or CORS errors.
