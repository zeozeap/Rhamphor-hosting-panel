# Activity Log

Route: `/activity`  
Access: Admin only

The Activity Log provides a real-time audit trail of all actions performed in the panel.

---

## Live Stream

When you open the Activity Log page, a WebSocket connection is established to `/ws/audit`. New entries appear at the top of the list as actions are performed anywhere in the panel.

### Pause / Resume

A **Pause** button freezes the live stream while you review existing entries. New events continue accumulating in the background. Clicking **Resume** flushes the buffered events and resumes live updates.

---

## Log Entry Fields

| Field | Description |
|-------|-------------|
| Timestamp | When the action occurred (local time) |
| User | Username of the account that performed the action |
| Action | What was done (e.g. `server.start`, `file.delete`, `user.create`) |
| Target | The resource affected (e.g. server name, file path, username) |
| IP Address | The IP address the request came from |

---

## Action Types

| Action | Trigger |
|--------|---------|
| `auth.login` | Successful login |
| `auth.logout` | Logout |
| `auth.login.failed` | Failed login attempt |
| `server.create` | New server created |
| `server.delete` | Server deleted |
| `server.start` | Server started |
| `server.stop` | Server stopped |
| `server.restart` | Server restarted |
| `server.kill` | Server killed |
| `server.command` | Console command sent |
| `file.create` | File or folder created |
| `file.delete` | File or folder deleted |
| `file.rename` | File or folder renamed |
| `file.move` | File or folder moved |
| `file.copy` | File or folder copied |
| `file.compress` | File or folder compressed |
| `file.extract` | ZIP file extracted |
| `file.write` | File contents updated |
| `user.create` | User account created |
| `user.update` | User account updated |
| `user.delete` | User account deleted |
| `node.create` | Node added |
| `node.update` | Node updated |
| `node.delete` | Node removed |
| `settings.update` | Panel settings changed |
| `nest.create` | Nest created |
| `nest.delete` | Nest deleted |
| `egg.create` | Egg created |
| `egg.delete` | Egg deleted |

---

## Paginated Log (REST)

In addition to the live stream, the full audit log is available via `GET /api/audit`:

```
GET /api/audit?page=1&limit=50&userId=3&action=server.start
```

See [API → Audit Log](../api/audit.md) for the full reference.

---

## Retention

Audit log entries are stored indefinitely in the `auditLog` table. There is no automatic pruning in the current version.
