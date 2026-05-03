# Gullak V4 — Investor Deploy Guide

You need a **publicly hosted** URL (not `npm run dev` on your laptop) so investors can access the app reliably from their own devices, plus an **APK** for Android-side installation. Here's the cheapest, fastest, free path.

> **Total time: ~30-40 minutes** if you follow this verbatim.
> Cost: **₹0**.

---

## Path A — Recommended: Vercel + PWABuilder

### Step 1 · Push to GitHub (5 min)

```bash
# From C:\Users\Sumit\Desktop\Cursor\Ifb
git init
git add .
git commit -m "feat(v4): investor-ready Gullak — splash, savestment, smart calculator, dashboard, bottom-nav, PWA"

# Create a private repo on github.com (e.g., gullak-app), then:
git remote add origin https://github.com/<your-username>/gullak-app.git
git branch -M main
git push -u origin main
```

### Step 2 · Switch Prisma to Postgres (5 min)

Vercel's serverless functions don't keep SQLite files between invocations — you must use Postgres. **Edit `prisma/schema.prisma` line 10:**

```diff
 datasource db {
-  provider = "sqlite"
+  provider = "postgresql"
   url      = env("DATABASE_URL")
 }
```

Then locally regenerate the migration so it works on Postgres:

```bash
# Provision a free Postgres first (pick ONE):
#   - Neon: https://neon.tech (~30s, gives a postgresql:// URL)
#   - Supabase: https://supabase.com/dashboard
#   - Vercel Postgres: Vercel → Storage → Create

# Put the URL in .env temporarily:
echo 'DATABASE_URL="postgresql://..."' > .env

# Regenerate migrations for postgres:
rm -rf prisma/migrations
npx prisma migrate dev --name v4_postgres_init
npx tsx prisma/seed.ts

# Commit the new migrations:
git add prisma/migrations
git commit -m "chore: migrate to postgres for vercel deploy"
git push
```

### Step 3 · Deploy to Vercel (5 min)

1. Go to [vercel.com](https://vercel.com), sign up free with your GitHub.
2. Click **Add New → Project**, import your `gullak-app` repo.
3. Framework Preset: **Next.js** (auto-detected).
4. Build Command: leave default (`npm run build` runs `prisma generate && prisma migrate deploy && next build`).
5. **Environment Variables**: paste from `.env.production.example`:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | your Postgres URL (from Neon/Supabase/Vercel Postgres) |
| `AUTH_SECRET` | run `openssl rand -base64 32` for a random 32-byte string |
| `OTP_DEMO_CODE` | `123456` |
| `CRON_SECRET` | any random string |
| `FLAGS_ENABLE_ROUNDUP` | `true` |
| `FLAGS_ENABLE_SALARY_SWEEP` | `true` |
| `FLAGS_ENABLE_NOTIFICATIONS` | `true` |
| `FLAGS_ENABLE_UNDO_WINDOW` | `true` |
| `FLAGS_ENABLE_FORCE_FAIL_DEV_TOGGLE` | `true` |

6. Click **Deploy**. Wait ~3 min.
7. Vercel gives you a URL like `https://gullak-app-abc123.vercel.app`.

### Step 4 · Seed the production DB (3 min)

Locally, with your production `DATABASE_URL`:

```bash
DATABASE_URL="postgresql://...prod-url..." npx tsx prisma/seed.ts
```

Now the demo user `9999900000 / 123456` exists in production with 35 days of saving history.

### Step 5 · Generate APK with PWABuilder (10 min)

1. Open your Vercel URL in a browser, verify the splash plays.
2. Go to [pwabuilder.com](https://pwabuilder.com).
3. Paste your Vercel URL → **Start**.
4. Wait for the analyzer (~30s). You should see a **Manifest ✓** and **Service Worker ✓** badge.
5. Click **Package for Stores → Android**.
6. **Package ID**: e.g., `com.gullak.app` (any reverse-DNS string).
7. **App name**: `Gullak`.
8. **Signing**: choose **Generate new signing key** (PWABuilder will create + return a `.keystore` file — save it; you need it to update the APK later).
9. Click **Download Package**. You get a `.zip` containing:
   - `app-release-signed.apk` — install this on Android phones.
   - `app-release-bundle.aab` — for Play Store (later).
10. **Test on Android**: send the APK to your phone via email / USB / Drive.
    - On the phone: Settings → Security → Allow install from unknown sources.
    - Tap the APK → install.
    - Open Gullak — it loads from your Vercel URL, but feels native.

### Step 6 · Share with investors

- **Web URL**: paste your Vercel URL anywhere — works on any phone, any laptop.
- **APK**: send the `.apk` file directly (WhatsApp, email).
- **Demo login**: phone `9999900000`, OTP `123456`.

---

## Path B — If GitHub setup is blocked

If for any reason GitHub is blocked at your end, use **[Railway](https://railway.app)** as an alternative (also free tier, supports SQLite via persistent volume — no Postgres switch needed):

```bash
# Install CLI
npm install -g @railway/cli
railway login
railway init
railway up
# Set DATABASE_URL=file:/data/dev.db in Railway dashboard
# Mount /data as a persistent volume
```

Then point PWABuilder at the Railway URL.

---

## Paths NOT recommended

- ❌ Cloudflare Tunnel + local dev — laptop must stay on; unreliable for investor demos.
- ❌ ngrok free — same problem; URL changes on every restart.
- ❌ Heroku — paid since 2022.

---

## Common gotchas

| Issue | Fix |
|---|---|
| `prisma migrate deploy` fails on Vercel | Make sure `DATABASE_URL` is set in Vercel **before** the first deploy, and provider is `postgresql` not `sqlite` |
| Service worker doesn't register | Check browser DevTools → Application → Service Workers. SW only registers on HTTPS — Vercel auto-provides this. |
| Splash flicker | Hard-refresh on your phone (clear cache); the SW caches aggressively |
| APK shows "Untrusted developer" | Normal for sideloaded APKs — Settings → Security → Trust developer or enable "Install unknown apps" for the source |
| OTP doesn't work | Confirm `OTP_DEMO_CODE=123456` is in Vercel env, then redeploy |

---

## What happens after the demo

When investors fund the next round, swap:
- Mock OTP → Twilio Verify (`lib/auth/otp.ts` is the seam)
- Mock AA → real Sahamati AA (`lib/aa/index.ts`)
- Mock OCEN → real NBFC partners (`lib/ocen/index.ts`)
- Mock payment → Razorpay UPI AutoPay or Setu (`lib/payments/index.ts`)
- iOS APK: $99/yr Apple Developer Program → PWABuilder iOS package

The architecture was designed as a one-line swap for each — no refactor needed.
