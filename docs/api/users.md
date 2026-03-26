# API — Users

All user management routes require admin authentication.

---

## GET /api/users

List all users.

**Auth:** Required  
**Role:** Admin only

**Response `200 OK`:**

```json
[
  {
    "id": 1,
    "username": "admin",
    "email": "admin@panel.local",
    "role": "admin",
    "createdAt": "2026-01-01T00:00:00.000Z"
  },
  {
    "id": 2,
    "username": "player1",
    "email": "player1@panel.local",
    "role": "user",
    "createdAt": "2026-01-01T00:00:00.000Z"
  }
]
```

Passwords are never included in responses.

---

## POST /api/users

Create a new user.

**Auth:** Required  
**Role:** Admin only

**Request body:**

```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "securepassword",
  "role": "user"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `username` | Yes | Unique login name |
| `email` | Yes | Unique email address |
| `password` | Yes | Initial password (will be hashed) |
| `role` | Yes | `"admin"` or `"user"` |

**Response `201 Created`:** Created user object (no password).

**Errors:**

| Code | Reason |
|------|--------|
| `400` | Missing fields or validation error |
| `409` | Username or email already exists |

---

## GET /api/users/:id

Get a single user.

**Auth:** Required  
**Role:** Admin only

**Response `200 OK`:** User object.

**Errors:**

| Code | Reason |
|------|--------|
| `404` | User not found |

---

## PATCH /api/users/:id

Update a user.

**Auth:** Required  
**Role:** Admin only

**Request body:** Any subset of: `username`, `email`, `password`, `role`

**Response `200 OK`:** Updated user object.

---

## DELETE /api/users/:id

Delete a user account.

**Auth:** Required  
**Role:** Admin only

**Response `200 OK`:**

```json
{ "ok": true }
```

> Note: Servers owned by this user are not deleted. They become unowned. Reassign or delete them separately.
