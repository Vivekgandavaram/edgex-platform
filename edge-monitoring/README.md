# EdgeX — Intelligence for the physical world.

A production-shaped, sensor-agnostic IoT/edge monitoring platform built on the MERN stack.

- `backend/` — Node.js + Express + MongoDB (Mongoose) API, Socket.IO, JWT + Google OAuth + email OTP auth, RBAC, audit logging, the two universal `write`/`read` ingestion APIs.
- `frontend/` — React (Vite) + Tailwind, the full premium dark-glass UI described in the design brief: dashboard, devices, live monitoring, analytics, alerts, API management, users/admins, audit logs.

**No fake data anywhere.** Every page is wired to the real API and shows a genuine empty/loading/error state until your backend has real devices and readings.

---

## 0. What you'll need

| Thing | Why | Cost |
|---|---|---|
| Node.js 18+ | Run both apps | Free |
| MongoDB (Atlas or local) | Store users/devices/readings | Free tier is enough to start |
| SMTP provider (Resend, Postmark, Gmail app password, etc.) | Send verification/OTP/reset emails | Most have a free tier |
| Google Cloud OAuth Client | "Continue with Google" | Free |

You can run the whole thing with **just MongoDB** — Google login and email just log to the console in dev mode until you configure them (see below).

---

## 1. Get a MongoDB connection string

**Easiest path — MongoDB Atlas (free, cloud-hosted, ~5 minutes):**

1. Go to https://www.mongodb.com/cloud/atlas/register and create a free account.
2. Create a new **Project**, then click **Build a Database** → choose the **M0 Free** tier → pick a cloud region close to you → Create.
3. Under **Security → Database Access**, add a database user with a username/password (save these).
4. Under **Security → Network Access**, add an IP entry. For local development, `0.0.0.0/0` (allow from anywhere) is simplest; tighten this before production.
5. Go to **Database → Connect → Drivers**, copy the connection string. It looks like:
   ```
   mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
   ```
6. Add your database name before the `?`: `.../edgex?retryWrites=true...`

**Alternative — run MongoDB locally:**
```bash
# macOS
brew tap mongodb/brew && brew install mongodb-community && brew services start mongodb-community
# then use: MONGODB_URI=mongodb://127.0.0.1:27017/edgex
```

---

## 2. Set up Google OAuth (optional, for "Continue with Google")

1. Go to https://console.cloud.google.com/ and create (or select) a project.
2. Go to **APIs & Services → OAuth consent screen**. Choose **External**, fill in the app name ("EdgeX"), your email, and save.
3. Go to **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
4. Application type: **Web application**.
5. Add an **Authorized JavaScript origin**: `http://localhost:5173`
6. Add an **Authorized redirect URI** if you later add a redirect-based flow: `http://localhost:5173`
7. Copy the **Client ID** and **Client Secret**.

Put the Client ID in `frontend/.env` (`VITE_GOOGLE_CLIENT_ID`) and both values in `backend/.env` (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`).

> The Login page currently has a placeholder for the Google button — wire in `@react-oauth/google` (or Google's `accounts.google.com/gsi/client` script) to get a real `idToken`, then call `endpoints.googleLogin(idToken)`. The backend endpoint (`POST /api/v1/auth/google`) is already fully implemented and verifies the token server-side.

---

## 3. Set up transactional email (optional, for OTP/verification/reset emails)

`backend/.env` already defaults `EMAIL_FROM` to `EdgeX <support@vigotech.in>`. To actually send from that address you need an SMTP provider that's allowed to send as `vigotech.in` — pick one:

- **Resend** (https://resend.com) — free tier, simplest setup. Add `vigotech.in` under **Domains**, add the DNS records it gives you (SPF/DKIM) at your domain registrar, then use the API key it gives you as `EMAIL_PASS` with `EMAIL_USER=resend` and `EMAIL_HOST=smtp.resend.com`.
- **Google Workspace**, if `support@vigotech.in` is a real Workspace mailbox — use an **App Password** (Google Account → Security → 2-Step Verification → App Passwords) as `EMAIL_PASS`, `EMAIL_HOST=smtp.gmail.com`, `EMAIL_PORT=587`.
- Any other SMTP provider (Postmark, SES, Mailgun) works the same way — set `EMAIL_HOST` / `EMAIL_PORT` / `EMAIL_USER` / `EMAIL_PASS` accordingly.

If you skip this, `backend/.env` can leave `EMAIL_HOST` blank — emails will just be printed to the backend console instead of sent, so you can still test the OTP/verification/reset flows locally by reading the code from the terminal.

---

## 4. Run it

```bash
# Backend
cd backend
cp .env.example .env
# edit .env: paste your MONGODB_URI, generate two random strings for JWT_SECRET / JWT_REFRESH_SECRET
npm install
npm run seed     # optional — creates demo Admin/User + sample devices & readings for testing
npm run dev       # http://localhost:5000

# Frontend (new terminal)
cd frontend
cp .env.example .env
npm install
npm run dev       # http://localhost:5173
```

Generate random secrets quickly with:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### The real Super Admin

`backend/.env` has:
```
SUPER_ADMIN_EMAIL=vivekgopi07@gmail.com
```

Whoever signs in with that exact email — via **Sign Up**, **Google**, or **Email OTP** — is automatically promoted to `SUPER_ADMIN` with full global access, the instant they authenticate. No seeding, no manual DB edit required. So to get started for real:

1. Go to `http://localhost:5173/register` and sign up with `vivekgopi07@gmail.com`.
2. Log in. You're now the Super Admin.
3. Go to **Administrators** and **Users** to invite your team and assign roles/permissions — that's the whole point of this account.

To change who the platform owner is, just update `SUPER_ADMIN_EMAIL` in `backend/.env` before that person signs in.

### Demo data (optional)

`npm run seed` creates separate, clearly-labeled demo accounts so you can click around with sample devices and readings without touching the real Super Admin account:
```
Demo Super Admin: demo-admin@edgex.vigotech.in / ChangeMe123!
Demo Admin:       rahul@edgex.vigotech.in / ChangeMe123!
Demo User:        priya@edgex.vigotech.in / ChangeMe123!
```
(from `SEED_DEMO_SUPER_ADMIN_EMAIL` / `SEED_DEMO_SUPER_ADMIN_PASSWORD` in `.env` — safe to delete this data later since it's unrelated to your real account).

---

## 5. Send real sensor data

Every device you create gets a WRITE API key (shown once, in the "Add Device" flow or API Management). Point any controller at:

```bash
curl -X POST http://localhost:5000/api/v1/write \
  -H "Authorization: Bearer sk_live_xxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{"data": {"temperature": 28.6, "humidity": 64.2}}'
```

New metric names are auto-provisioned as sensors — the platform never assumes a fixed sensor list. The dashboard, telemetry panels, and analytics charts will populate automatically; live monitoring updates over Socket.IO the moment a new reading lands.

---

## 6. Project layout

```
backend/
  server.js                 entry point
  src/
    config/                 env + MongoDB connection
    models/                 Mongoose schemas (User, Device, Sensor, Reading, ApiKey, Alert, AlertRule, AuditLog, ...)
    middleware/              auth (JWT), permission (RBAC + device scoping), rate limiting, error handling
    controllers/             route handlers, one file per resource
    routes/                  route wiring, one file per resource
    services/                email, audit logging
    sockets/                 Socket.IO auth + live event delivery
    seed/                    dev-only demo data script

frontend/
  src/
    lib/                     api client (axios), socket client, auth context
    components/
      layout/                app shell, nav rail, top bar, command palette (⌘K)
      ui/                    design-system primitives (GlassPanel, MetricCard, EmptyState, StatusBadge, ...)
      domain/                NetworkTopology, TelemetryPanel (sensor-agnostic charts)
    pages/
      auth/                  login, register, forgot/reset password, OTP login
      Dashboard, Live, Devices, DeviceDetail, Sensors, Locations, Analytics,
      Alerts, ApiManagement, ApiDocumentation, Users, Admins, RolesPermissions,
      AuditLogs, Settings
```

## 7. Deploying to edgex.vigotech.in

When you're ready to point the real domain at this:

- Backend: deploy `backend/` anywhere that runs Node (Railway, Render, a VPS). Set `APP_URL=https://edgex.vigotech.in`, `API_BASE_URL=https://api.edgex.vigotech.in` (or whatever subdomain you use), `NODE_ENV=production`, and the real `MONGODB_URI` / `JWT_SECRET`s / email creds as environment variables on that platform — don't ship `.env` itself.
- Frontend: `npm run build` in `frontend/`, deploy the `dist/` folder (Vercel, Netlify, or served as static files by the backend). Set `VITE_API_URL=https://api.edgex.vigotech.in/api/v1` at build time.
- DNS: point `edgex.vigotech.in` (and your API subdomain, if separate) at wherever you deploy, and add HTTPS (most of the above platforms handle this automatically via Let's Encrypt).
- Google OAuth: add `https://edgex.vigotech.in` as an additional Authorized JavaScript origin in the Google Cloud Console (step 2) once you have the real domain live — `localhost` won't work in production.
- CORS: the backend's `cors()` config in `server.js` reads `env.appUrl`, so setting `APP_URL` correctly in production is what allows the deployed frontend to talk to the deployed backend.

## 8. What's a full production build vs. what's here

Implemented end-to-end against the real backend: auth (password, OTP, Google — Google needs the frontend button wired to a real Google script per step 2), device/sensor CRUD with auto-provisioned sensors, the two universal `write`/`read` APIs, API key lifecycle (create/rotate/revoke), threshold-based alert rules + alert center, live Socket.IO telemetry, analytics charts, users/admins/RBAC, audit logging, and the full premium design system across every listed page.

Reasonable next steps for a real production rollout: swap the naive WRITE-key lookup (`ingestController.js`) for a keyed lookup once you have real device volume, add a background job to flip devices to `OFFLINE` after a last-seen timeout, add refresh-token rotation, and split the SVG network topology into a proper force-directed layout once you have many devices.
