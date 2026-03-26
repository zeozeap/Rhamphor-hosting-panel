# API — Authentication

## POST /api/auth/login

Log in and create a session.

**Auth required:** No

**Request body:**

```json
{
  "login": "admin",
  "password": "admin123",
  "captchaToken": "03AGdBq..."
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `login` | Yes | Username or email address |
| `password` | Yes | Account password |
| `captchaToken` | Conditional | Required when reCAPTCHA is enabled in settings |

**Response `200 OK`:**

```json
{
  "id": 1,
  "username": "admin",
  "email": "admin@panel.local",
  "role": "admin"
}
```

**Errors:**

| Code | Reason |
|------|--------|
| `400` | Missing fields, or reCAPTCHA validation failed |
| `401` | Invalid username/password |

---

## POST /api/auth/logout

Destroy the current session.

**Auth required:** No (safe to call when already logged out)

**Request body:** None

**Response `200 OK`:**

```json
{ "ok": true }
```

---

## GET /api/auth/me

Get the currently authenticated user.

**Auth required:** Yes

**Response `200 OK`:**

```json
{
  "id": 1,
  "username": "admin",
  "email": "admin@panel.local",
  "role": "admin"
}
```

**Errors:**

| Code | Reason |
|------|--------|
| `401` | Not logged in |

---

## PATCH /api/auth/profile

Update the currently logged-in user's own account.

**Auth required:** Yes (any role)

**Request body:**

```json
{
  "username": "newname",
  "email": "new@example.com",
  "currentPassword": "oldpassword",
  "newPassword": "newpassword"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `currentPassword` | Yes | Must be correct to make any changes |
| `username` | No | New username |
| `email` | No | New email |
| `newPassword` | No | New password (leave out to keep current) |

**Response `200 OK`:**

```json
{
  "id": 1,
  "username": "newname",
  "email": "new@example.com",
  "role": "admin"
}
```

**Errors:**

| Code | Reason |
|------|--------|
| `400` | Validation error (e.g. username taken) |
| `401` | Wrong current password |
