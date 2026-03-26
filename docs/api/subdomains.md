# API — Subdomains

Subdomain routes are under `/api/servers/:id/subdomains` and require server ownership or admin.

---

## GET /api/servers/:id/subdomains

List subdomains assigned to a server.

**Auth:** Required  
**Role:** Admin or server owner

**Response `200 OK`:**

```json
[
  {
    "id": 1,
    "serverId": 1,
    "subdomain": "survival.yourdomain.com",
    "createdAt": "2026-01-01T00:00:00.000Z"
  }
]
```

---

## POST /api/servers/:id/subdomains

Assign a subdomain to a server.

**Auth:** Required  
**Role:** Admin or server owner

**Request body:**

```json
{ "subdomain": "pvp.yourdomain.com" }
```

**Response `201 Created`:** Created subdomain record.

**Errors:**

| Code | Reason |
|------|--------|
| `409` | Subdomain already assigned to another server |

---

## DELETE /api/servers/:id/subdomains/:subId

Remove a subdomain assignment.

**Auth:** Required  
**Role:** Admin or server owner

**Response `200 OK`:**

```json
{ "ok": true }
```

---

## Notes

- The subdomain manager stores assignments in the database only
- Actual DNS records and Nginx routing must be configured separately on your infrastructure
- Future versions may include automatic Nginx config generation and DNS provider integration
