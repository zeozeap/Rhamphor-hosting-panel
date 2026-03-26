# Security

## Authentication

Rhamphor uses **session-based authentication** via `express-session` with a PostgreSQL session store.

- Sessions are signed using `SESSION_SECRET` — keep this value secret and rotate it if compromised
- Session cookies are HTTP-only and set to `Secure` in production (requires HTTPS)
- Cookie `SameSite` is set to `lax` to prevent CSRF in most scenarios
- Sessions expire after 7 days of inactivity

---

## Passwords

All passwords are hashed using **bcrypt** with a cost factor of 12 before being stored in the database. Plaintext passwords are never stored or logged.

---

## API Middleware

Three middleware functions protect every API route:

### `requireAuth`

```
GET /api/auth/me → 401 Unauthorized  (if not logged in)
```

Applied to all routes except `POST /auth/login`, `POST /auth/logout`, and `GET /settings/public`.

### `requireAdmin`

```
GET /api/nodes → 403 Forbidden  (if logged in but not admin)
```

Applied to: nodes, users, nests, eggs, audit log, settings (non-public), and admin-level server operations.

### `requireServerAccess`

```
GET /api/servers/:id/files → 403 Forbidden  (if you don't own the server and aren't admin)
```

Applied to all per-server routes: files, plugins, subdomains, console, power, stats.

---

## Role-Based Access Control

| Action | Admin | User |
|--------|-------|------|
| View all servers | Yes | No (own only) |
| Create/delete servers | Yes | No |
| Manage nodes | Yes | No |
| Manage users | Yes | No |
| Manage nests/eggs | Yes | No |
| View audit log | Yes | No |
| Panel personalization | Yes | No |
| Security settings (reCAPTCHA) | Yes | No |
| Access own server's files/console | Yes | Yes |
| Update own account | Yes | Yes |

---

## Path Traversal Protection (Flaps)

The Flaps file manager resolves all paths relative to the server's data directory (e.g. `/var/lib/flaps/servers/<id>/`). Any path that resolves outside this root is rejected with a 400 error.

```typescript
const safePath = path.resolve(serverRoot, userPath);
if (!safePath.startsWith(serverRoot)) {
  return res.status(400).json({ error: 'Path outside server root' });
}
```

---

## Flaps Bearer Token Auth

Every Flaps API request (except `GET /` and `GET /api/health`) must include:

```
Authorization: Bearer <token>
```

The token is set via `FLAPS_TOKEN` and must match the token stored in the node record in the panel's database. If the token doesn't match, Flaps returns 401.

---

## reCAPTCHA v2 (Optional)

When enabled in **Settings → Security**, the login form displays a Google reCAPTCHA v2 challenge. The `captchaToken` is submitted with login credentials and validated server-side against the Google reCAPTCHA API using the secret key before the password is checked.

To enable:
1. Create a reCAPTCHA v2 site at [google.com/recaptcha](https://www.google.com/recaptcha)
2. In Settings → Security, toggle "Enable reCAPTCHA" and enter your site key and secret key

---

## Production Security Checklist

- [ ] `SESSION_SECRET` is a long random string (32+ characters), not the default
- [ ] `NODE_ENV=production` is set so cookies are `Secure`
- [ ] HTTPS is configured (via Nginx + Certbot)
- [ ] Flaps token is a long random string and is not `dev-token-rhamphor`
- [ ] Flaps port (8443) is firewalled — only accessible from the panel server's IP
- [ ] Panel port (8080) is not exposed directly — traffic goes through Nginx
- [ ] PostgreSQL is only accessible from localhost
- [ ] Change the default admin password after first login
- [ ] Consider enabling reCAPTCHA if the panel is publicly reachable

---

## Security Reporting

If you find a security vulnerability, please report it privately via email rather than opening a public GitHub issue.
