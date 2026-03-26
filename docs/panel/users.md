# Users

Route: `/users`  
Access: Admin only

The Users page lets administrators manage all accounts on the panel.

---

## User List

| Column | Description |
|--------|-------------|
| Username | The account's login name |
| Email | The account's email address |
| Role | `admin` or `user` |
| Servers | Number of servers assigned to this user |
| Created | Account creation date |

---

## Creating a User

Click **Add User** to open the creation form:

| Field | Required | Description |
|-------|----------|-------------|
| Username | Yes | Unique login name (no spaces) |
| Email | Yes | Unique email address |
| Password | Yes | Initial password (user should change on first login) |
| Role | Yes | `admin` or `user` |

---

## Editing a User

Click a user's row to edit:

- Username
- Email
- Role (promote to admin or demote to user)
- Reset password

> **Note:** An admin cannot remove their own admin role from this form (to prevent lockout).

---

## Deleting a User

Deleting a user removes their account. Their servers are **not** deleted — they become unowned. Reassign or delete those servers after removing the user.

---

## Role Differences

| Feature | Admin | User |
|---------|-------|------|
| Sees Dashboard | Yes | No |
| Sees all servers | Yes | No |
| Manages nodes | Yes | No |
| Manages users | Yes | No |
| Manages nests/eggs | Yes | No |
| Views audit log | Yes | No |
| Panel personalization | Yes | No |
| reCAPTCHA settings | Yes | No |
| Accesses own servers | Yes | Yes |
| Updates own account | Yes | Yes |

---

## Assigning Servers to Users

Servers are assigned to users when:
1. An admin creates a server and selects an owner
2. An admin edits a server's settings and changes the owner

Users can only see and interact with servers where `server.userId === user.id`.
