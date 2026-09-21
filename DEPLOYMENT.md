# Deployment Guide — Vercel + Render + Aiven

Production architecture:

```
Browser ──► Vercel (React SPA, https://<your-app>.vercel.app)
                │
                │  VITE_API_URL=https://scms-api.onrender.com/api
                ▼
             Render (Express API, https://scms-api.onrender.com)
                │
                │  DB_HOST / DB_USER / DB_PASSWORD / DB_NAME / DB_SSL=true
                ▼
             Aiven (MySQL)
```

> ⚠️ Render free web services sleep after ~15 minutes of inactivity and take ~30–60s to cold-start. First request after idle will be slow — that's expected.

---

## 1. Push the code to GitHub (already done)

The repository is on GitHub at **https://github.com/kamrulshawn2003/Supply-Chain-Management-System** (branch `main`).

If you're re-running this locally:

```bash
git branch -M main
git remote add origin https://github.com/kamrulshawn2003/Supply-Chain-Management-System.git
git push -u origin main
```

---

## 2. Create the database on Aiven

1. Go to https://console.aiven.io and create an account (or log in).
2. **Create a new service** → choose **MySQL** → plan **Hobbyist** (free, 1 GB — enough for demo).
3. Pick a region close to Render (e.g. `google-europe-west1` or `aws-us-west-1`) and create the service.
4. Open the service **Overview** tab and copy:
   - **Host** (e.g. `scms-mysql-xxxx.aivencloud.com`)
   - **Port** (e.g. `10682`)
   - **User** (e.g. `avnadmin`)
   - **Password** (shown under *Connection information* → MySQL → `avnadmin`)
   - **Database name** (`defaultdb` — you can also create a new one, e.g. `scms_db`)

> Aiven MySQL requires TLS — the backend supports it via the `DB_SSL=true` env var (already set in `render.yaml`).

---

## 3. Deploy the backend on Render

**Option A — Blueprint (recommended).** The repo already contains `render.yaml`:

1. Go to https://dashboard.render.com → **New** → **Blueprint**.
2. Select the GitHub repo `Supply-Chain-Management-System`.
3. Render reads `render.yaml` and creates the `scms-api` web service automatically.
4. In the service → **Environment**, fill the 4 synced values from Aiven:
   - `DB_NAME` = `defaultdb` (or your DB name)
   - `DB_HOST` = your Aiven host
   - `DB_USER` = `avnadmin`
   - `DB_PASSWORD` = your Aiven password
5. **Manual Deploy** → **Deploy latest commit**. The pre-deploy step runs `npm run migrate` (creates all tables), then the API starts.

**Option B — Manual web service:**

1. **New** → **Web Service** → connect the repo.
2. **Root Directory:** `backend`
3. **Build Command:** `npm install`
4. **Pre-deploy Command:** `npm run migrate`
5. **Start Command:** `npm start`
6. **Instance Type:** Free
7. Add the environment variables (same list as above, plus `NODE_ENV=production`, `PORT=10000`, `JWT_SECRET=<long random string>`, `DB_SSL=true`, `DB_PORT=3306`).
8. Deploy.

**Verify:** open `https://scms-api.onrender.com/api/health` — you should see `{"success":true,...,"db":"connected"}`.

> If you named the service something other than `scms-api`, the URL changes — note the real URL, you'll need it in step 4.

---

## 4. Deploy the frontend on Vercel

1. Go to https://vercel.com → **Add New** → **Project** → import the GitHub repo.
2. **Root Directory:** `scms-frontend` (Vercel auto-detects Vite).
3. **Framework Preset:** Vite (auto).
4. Under **Environment Variables** add:

   | Key | Value |
   |---|---|
   | `VITE_API_URL` | `https://scms-api.onrender.com/api` (use your actual Render URL) |

5. **Deploy.**

> `VITE_API_URL` is baked into the production build, so if the backend URL changes, update this variable and redeploy.

**Verify:** open the deployed app → register or log in → any page should load data from Render.

---

## 5. Post-deploy setup

The production database is fresh — it has tables but no users. Two ways to get accounts:

- **Register on the site:** the public register page creates a `customer` account — log in and you're done.
- **Create an admin:** register a customer, then promote it (or create the initial admin) by running the backend locally against Aiven, or with a one-off script. For example, from the `backend` folder:

  ```bash
  # temporarily point .env at Aiven, then:
  npm run migrate        # if pre-deploy already ran, this is a no-op
  node -e "const {User}=require('./models'); const bcrypt=require('bcryptjs'); (async()=>{const p=await bcrypt.hash('YourStrongPass1!',10); await User.create({name:'Admin',email:'admin@yourdomain.com',password:p,role:'admin'}); console.log('created'); process.exit(0)})().catch(e=>{console.error(e);process.exit(1)})"
  ```

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `/api/health` returns `db: disconnected` | Check Aiven host/port/user/password/DB name; ensure `DB_SSL=true`; verify the service is running (not sleeping) |
| 401 on login | Wrong email/password; if you re-seeded, the password hash must be regenerated via the same code path (`bcrypt.hash(password, 10)`) |
| Frontend can't reach API (CORS/network) | Confirm `VITE_API_URL` is exactly `https://<render-service>.onrender.com/api` (no trailing slash) and redeploy; backend CORS reflects any origin, so this is usually a wrong-URL issue |
| Render deploy fails in pre-deploy | The Aiven service must be running and env vars set **before** deploy; fix env vars and redeploy |
| Cold start slow | Expected on free tier; visit the site once to wake the backend |
