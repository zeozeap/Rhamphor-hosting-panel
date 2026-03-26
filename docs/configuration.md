# Configuration

## API Server Environment Variables

Set these in `.env` at the project root (development) or in the systemd service environment file (production).

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | Full PostgreSQL connection string |
| `SESSION_SECRET` | Yes | — | Random string used to sign session cookies. Use at least 32 characters. |
| `PORT` | No | `8080` | Port the API server listens on |
| `NODE_ENV` | No | `development` | Set to `production` for production deployments |

### Example `.env`

```env
DATABASE_URL=postgresql://rhamphor:strongpassword@localhost:5432/rhamphor
SESSION_SECRET=replace-with-a-long-random-string-minimum-32-chars
PORT=8080
NODE_ENV=production
```

---

## Flaps Daemon Environment Variables

Set via the workflow command (development) or `/etc/flaps/env` (production).

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `FLAPS_TOKEN` | Yes | — | Bearer token. Must match the token stored in the node record in the panel. |
| `FLAPS_PORT` | No | `8443` | Port the Flaps HTTP/WS server listens on |
| `FLAPS_NODE_ID` | No | `node-local` | Human-readable identifier for this node |
| `FLAPS_DATA_DIR` | No | `/var/lib/flaps` | Root directory for all server data and files |
| `FLAPS_LOG_LEVEL` | No | `info` | Log verbosity: `debug`, `info`, `warn`, `error` |
| `FLAPS_PANEL_URL` | No | — | Rhamphor panel base URL (used for callbacks) |

### Development example

```bash
FLAPS_PORT=9000 \
FLAPS_DATA_DIR=/tmp/flaps-data \
FLAPS_TOKEN=dev-token-rhamphor \
FLAPS_NODE_ID=dev-node \
pnpm --filter @workspace/flaps-daemon run dev
```

### Production `/etc/flaps/env`

```env
FLAPS_PORT=8443
FLAPS_TOKEN=long-random-secret-token
FLAPS_NODE_ID=game-node-1
FLAPS_DATA_DIR=/var/lib/flaps
FLAPS_LOG_LEVEL=info
FLAPS_PANEL_URL=https://panel.yourdomain.com
```

---

## Panel Settings (Database)

These settings are stored in the `settings` table and managed through **Settings → Personalization** and **Settings → Security** in the panel. They are admin-only.

| Key | Description |
|-----|-------------|
| `panelName` | Display name shown on the login page and browser title |
| `panelLogo` | URL to the logo image shown on the login page |
| `panelFavicon` | URL to the favicon |
| `themeColor` | Hex color code for the primary theme color (e.g. `#7c3aed`) |
| `customCss` | Raw CSS injected into the panel's `<head>` |
| `loginBackground` | URL to a background image for the login page |
| `recaptchaEnabled` | `"true"` or `"false"` — toggles reCAPTCHA v2 on the login form |
| `recaptchaSiteKey` | Google reCAPTCHA v2 site key |
| `recaptchaSecretKey` | Google reCAPTCHA v2 secret key (validated server-side) |

The `GET /api/settings/public` endpoint returns a safe subset of these settings (name, logo, favicon, theme, loginBackground) to unauthenticated users so the login page can apply branding before auth.

---

## Session Configuration

Sessions are stored in PostgreSQL using `connect-pg-simple`. Session options:

| Setting | Value |
|---------|-------|
| Cookie name | `rhamphor.sid` |
| Max age | 7 days (rolling) |
| HTTP-only | Yes |
| Secure | Yes in production, No in development |
| Same-site | `lax` |
