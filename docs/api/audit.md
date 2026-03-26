# API — Audit Log

The audit log records all significant actions performed in the panel.

---

## GET /api/audit

Get paginated audit log entries.

**Auth:** Required  
**Role:** Admin only

**Query parameters:**

| Param | Default | Description |
|-------|---------|-------------|
| `page` | `1` | Page number (1-based) |
| `limit` | `50` | Entries per page (max 200) |
| `userId` | — | Filter by user ID |
| `action` | — | Filter by action string (exact match or prefix) |

**Response `200 OK`:**

```json
{
  "entries": [
    {
      "id": 42,
      "userId": 1,
      "username": "admin",
      "action": "server.start",
      "target": "Survival World",
      "targetId": "3",
      "ip": "192.168.1.1",
      "createdAt": "2026-01-15T12:00:00.000Z"
    }
  ],
  "total": 1234,
  "page": 1,
  "limit": 50,
  "pages": 25
}
```

---

## WebSocket — Real-Time Audit Stream

Connect to `/ws/audit` with a valid session cookie to receive new audit entries in real time.

**Auth:** Session cookie (admin only)

**Message format:** Each message is a JSON string:

```json
{
  "id": 43,
  "userId": 2,
  "username": "player1",
  "action": "server.stop",
  "target": "Creative World",
  "targetId": "7",
  "ip": "10.0.0.5",
  "createdAt": "2026-01-15T12:01:00.000Z"
}
```

Events are broadcast to all connected admin WebSocket clients whenever an audit entry is created.

---

## Audit Entry Fields

| Field | Description |
|-------|-------------|
| `id` | Auto-incrementing entry ID |
| `userId` | ID of the user who performed the action |
| `username` | Username at the time of the action |
| `action` | Dot-notation action identifier (e.g. `server.start`, `file.delete`) |
| `target` | Human-readable description of what was affected |
| `targetId` | ID or path of the affected resource |
| `ip` | IP address of the request |
| `createdAt` | ISO 8601 timestamp |

---

## Full Action Reference

See [Activity Log](../panel/activity-log.md#action-types) for the complete list of action identifiers.
