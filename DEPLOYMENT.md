# TeamEdit — Local Setup & Deployment Guide

This is a **pnpm + Turborepo monorepo** with two deployable apps:

| App      | Path          | What it is                                 | Where it must run                                                                    |
| -------- | ------------- | ------------------------------------------ | ------------------------------------------------------------------------------------ |
| `client` | `apps/client` | Next.js 15 frontend                        | Any Node/serverless host (Vercel recommended)                                        |
| `server` | `apps/server` | Socket.IO + uWebSockets.js realtime server | **A persistent Node process** (Railway/Render/Fly — NOT Vercel serverless functions) |

> **Why the server can't go on Vercel:** it holds long-lived WebSocket
> connections and uses `uWebSockets.js` (a native binary). Vercel serverless
> functions are short-lived and stateless, so they can't host it. Deploy
> `apps/server` to a host that runs a normal, always-on Node process.

I already fixed the parts of the code that were hardcoded to the original
author's own domains/GitHub OAuth app/Sentry project (see **"What I changed"**
at the bottom) so this now works with _your_ accounts and domains.

---

## 0. Prerequisites

- **Node.js 20+** (18 works but 20 LTS recommended)
- **pnpm 10** — `npm install -g pnpm@10.6.5` (matches the `packageManager` field, avoids lockfile mismatches)
- Git

---

## 1. Local development

```bash
# from the repo root
cd

# copy env templates
cp apps/client/.env.example apps/client/.env.local
```

`apps/client/.env.local` defaults (`http://localhost:3000` / `http://localhost:3001`)
already work for local dev — you don't need to fill in anything to just run it.
Leave `NEXT_PUBLIC_GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` empty if you
don't need the GitHub import/export feature locally.

The server needs **no `.env` file for local dev** — CORS already allow-lists
`http://localhost:3000` by default.

```bash
# from the repo root — runs both client (:3000) and server (:3001) together
pnpm dev
```

Open `http://localhost:3000`. Create a room, open it in a second tab/browser
to confirm the realtime sync works.

**Run them individually** (useful for debugging):

```bash
pnpm --filter=server dev     # http://localhost:3001
pnpm --filter=client dev     # http://localhost:3000
```

**Build locally to verify before deploying** (this is exactly what I ran
to validate the project):

```bash
pnpm --filter=@CodeX/types build
pnpm --filter=server build      # -> apps/server/dist
pnpm --filter=client build      # -> apps/client/.next
```

Both complete cleanly with zero errors as of this project state.

---

## 2. (Optional) GitHub OAuth app — only needed for the "Save/Open from GitHub" feature

1. Go to https://github.com/settings/developers → **New OAuth App**
2. Fill in:
   - **Homepage URL**: your client's URL (e.g. `https://your-app.vercel.app`)
   - **Authorization callback URL**: `<same URL>/api/github/auth`
3. Copy the **Client ID** and generate a **Client Secret**.
4. Set them as `NEXT_PUBLIC_GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` in the client env (local `.env.local` and/or your host's dashboard).

You'll likely want **two** OAuth apps: one with a `localhost:3000` callback
for dev, one with your production URL's callback for prod — then swap the
env vars per environment.

---

## 3. Deploy the server (Railway — free/cheap, easiest for a persistent Node app)

1. Push this repo to GitHub.
2. On [railway.app](https://railway.app) → **New Project → Deploy from GitHub repo** → select this repo.
3. In the service **Settings**:
   - **Root Directory**: `apps/server`
   - **Build Command**: `cd ../.. && pnpm install --frozen-lockfile && pnpm --filter=@CodeX/types build && pnpm --filter=server build`
   - **Start Command**: `node dist/index.js`
4. In **Variables**, add (from `apps/server/.env.example`):
   - `NODE_ENV=production`
   - `CLIENT_URL` — leave blank for now, you'll fill it in step 4.4 once the client is deployed (comma-separate multiple origins if needed, e.g. a Vercel preview + your custom domain).
5. Railway auto-detects the port from your app — the server listens on `3001` internally; Railway's proxy maps that to your public HTTPS URL automatically (no `PORT` env var needed since this app hardcodes `3001` and Railway's edge proxy already handles that — if you use a different host, check whether it requires `process.env.PORT` instead and adjust `apps/server/src/index.ts` accordingly).
6. Deploy. Note the generated public URL, e.g. `https://your-server.up.railway.app`.

**Render** works the same way: Web Service → root `apps/server` → same build/start commands → Node environment.

---

## 4. Deploy the client (Vercel — recommended, this is a standard Next.js app)

1. On [vercel.com](https://vercel.com) → **Add New Project** → import this repo.
2. **Root Directory**: `apps/client`
3. Framework preset: Next.js (auto-detected). Vercel will run `pnpm install` and `pnpm build` from that root automatically — no custom commands needed since `apps/client` is self-contained with the workspace package already built as part of `pnpm install`'s dependency graph.
   - If Vercel's monorepo detection has trouble resolving `@CodeX/types`, set **Build Command** to:
     `cd ../.. && pnpm install --frozen-lockfile && pnpm --filter=@CodeX/types build && pnpm --filter=client build`
4. **Environment Variables** (Project Settings → Environment Variables), from `apps/client/.env.example`:
   - `NEXT_PUBLIC_BASE_URL` = your Vercel URL, e.g. `https://your-app.vercel.app`
   - `NEXT_PUBLIC_SERVER_URL` = the Railway server URL from step 3.6, e.g. `https://your-server.up.railway.app`
   - `NEXT_PUBLIC_GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` — if using GitHub OAuth (step 2)
   - Leave `NEXT_PUBLIC_SENTRY_DSN`, `BETTERSTACK_API_KEY` etc. empty unless you set those services up yourself.
5. Deploy.
6. **Go back to Railway** and set `CLIENT_URL` = your Vercel URL (`https://your-app.vercel.app`). Redeploy the server so it picks up the env var. This lets the server's CORS allow-list accept requests from your real client domain.

---

## 5. Verify the full deployment

1. Open your Vercel URL, create a room.
2. Open the same room URL in a second browser/incognito tab — you should see live cursor sync, shared editing, and the user list update.
3. If sync doesn't work: open browser dev tools → Network/Console on the client. A CORS or WebSocket connection error almost always means `NEXT_PUBLIC_SERVER_URL` (client) and `CLIENT_URL` (server) don't match what's actually deployed — double check both, redeploy the server after any `CLIENT_URL` change.
4. Test code execution (uses the free public Piston API, no key needed — nothing to configure).
5. If you set up GitHub OAuth, test **Open from GitHub** / **Save to GitHub**.

---

## 6. What I changed in this codebase (and why)

The original project had several values **hardcoded to the original author's
own accounts and deployments** — deploying it as-is under your own domain/
GitHub org would have silently broken things or sent your users' data to
the original author's services. I fixed:

- **`apps/client/src/lib/constants.ts`** — `BASE_CLIENT_URL`, `BASE_SERVER_URL`,
  and `GITHUB_CLIENT_ID`/`GITHUB_CLIENT_SECRET` were hardcoded to
  `teamedit.up.railway.app` and the author's own GitHub OAuth app IDs. These
  now read from `NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_SERVER_URL`,
  `NEXT_PUBLIC_GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` — falling back to
  sensible localhost defaults for dev.
- **`apps/server/src/cors-config.ts`** — added an env-driven `CLIENT_URL`
  so the server's CORS allow-list can include _your_ deployed client domain
  without editing source code.
- **`apps/client/sentry.*.config.ts`** — the Sentry DSN was hardcoded to the
  original author's Sentry project, meaning your production errors (and
  session replays) would've been sent to _their_ dashboard. Sentry is now
  off by default and only activates if you set your own
  `NEXT_PUBLIC_SENTRY_DSN`.
- Added `apps/client/.env.example` and `apps/server/.env.example` documenting
  every environment variable the app actually uses.
- Verified `pnpm install`, `pnpm --filter=server build`, and
  `pnpm --filter=client build` all complete with **zero errors**, and that
  the server boots and the native `uWebSockets.js` binary loads correctly.

Left untouched (cosmetic, safe to ignore or edit later): credit/portfolio
links in the About/footer components, and the optional BetterStack "status"
widget (harmless if its env vars are left empty — the widget just won't
resolve a status).
