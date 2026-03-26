# API Overview

The Rhamphor API is a REST + WebSocket API served by the Express backend.

## Base URL

```
/api
```

In development: `http://localhost:8080/api`  
In production: `https://panel.yourdomain.com/api`

---

## Authentication

All endpoints except the ones listed below require a valid session cookie.

**Login to get a session:**

```
POST /api/auth/login
Content-Type: application/json

{ "login": "admin", "password": "admin123" }
```

The response sets a `rhamphor.sid` session cookie. Include this cookie in all subsequent requests.

**Unauthenticated endpoints:**

| Endpoint | Reason |
|----------|--------|
| `POST /api/auth/login` | Login itself |
| `POST /api/auth/logout` | Safe to call when not logged in |
| `GET /api/settings/public` | Used by the login page for branding |
| `GET /api/health` | Health check |

---

## Error Format

All errors return JSON:

```json
{
  "error": "Human-readable error message"
}
```

Common status codes:

| Code | Meaning |
|------|---------|
| `200` | Success |
| `201` | Created |
| `400` | Bad request (validation error, invalid operation) |
| `401` | Not authenticated |
| `403` | Authenticated but not authorized (wrong role or wrong server owner) |
| `404` | Resource not found |
| `409` | Conflict (e.g. file already exists at destination) |
| `500` | Internal server error |

---

## Admin vs User Routes

| Route group | Admin | User |
|-------------|-------|------|
| `GET /servers` | All servers | Own servers only |
| `POST /servers` | Yes | No |
| `DELETE /servers/:id` | Yes | No |
| `/nodes/*` | Yes | No |
| `/users/*` | Yes | No |
| `/nests/*`, `/eggs/*` | Yes | No |
| `/audit` | Yes | No |
| `GET /settings` | Yes | No |
| `PATCH /settings` | Yes | No |
| `GET /settings/public` | Public | Public |
| `/servers/:id/*` (files, plugins, etc.) | Yes | If owner |
| `PATCH /auth/profile` | Yes | Yes (own account) |

---

## WebSocket

The API server also handles WebSocket connections at `/ws`:

| Path | Description |
|------|-------------|
| `/ws/audit` | Real-time audit log stream (admin only, session auth) |
| `/ws/console?serverId=<id>` | Proxied console stream from Flaps (session auth + server access) |
| `/ws/stats?serverId=<id>` | Proxied stats stream from Flaps (session auth + server access) |

---

## Request / Response Format

- All request bodies must be `Content-Type: application/json`
- All responses are `Content-Type: application/json`
- Timestamps are ISO 8601 strings
- IDs are integers
