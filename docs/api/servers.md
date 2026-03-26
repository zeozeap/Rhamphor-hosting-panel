# API — Servers

All server routes require authentication. Non-admin users can only access servers they own.

---

## GET /api/servers

List servers.

**Auth:** Required  
**Role:** Admin sees all; users see their own only

**Response `200 OK`:**

```json
[
  {
    "id": 1,
    "name": "My Minecraft Server",
    "status": "running",
    "nodeId": 1,
    "userId": 2,
    "eggId": 3,
    "memory": 2048,
    "disk": 10240,
    "createdAt": "2026-01-01T00:00:00.000Z"
  }
]
```

---

## POST /api/servers

Create a new server.

**Auth:** Required  
**Role:** Admin only

**Request body:**

```json
{
  "name": "Survival World",
  "nodeId": 1,
  "eggId": 2,
  "userId": 3,
  "memory": 2048,
  "disk": 10240,
  "startupOverride": "java -Xmx2G -jar paper.jar",
  "environment": { "JAVA_VERSION": "21" }
}
```

**Response `201 Created`:** The created server object.

**Errors:**

| Code | Reason |
|------|--------|
| `400` | Missing required fields |
| `404` | Node or egg not found |

---

## GET /api/servers/:id

Get a single server's details.

**Auth:** Required  
**Role:** Admin or server owner

**Response `200 OK`:** Full server object including node info and egg info.

**Errors:**

| Code | Reason |
|------|--------|
| `403` | Not the owner and not admin |
| `404` | Server not found |

---

## PATCH /api/servers/:id

Update a server's configuration.

**Auth:** Required  
**Role:** Admin only

**Request body:** Any subset of: `name`, `memory`, `disk`, `userId`, `startupOverride`, `environment`

**Response `200 OK`:** Updated server object.

---

## DELETE /api/servers/:id

Delete a server and remove its files from the node.

**Auth:** Required  
**Role:** Admin only

**Response `200 OK`:**

```json
{ "ok": true }
```

---

## POST /api/servers/:id/power

Send a power action to the server via Flaps.

**Auth:** Required  
**Role:** Admin or server owner

**Request body:**

```json
{ "action": "start" }
```

| Value | Description |
|-------|-------------|
| `start` | Start the server process |
| `stop` | Gracefully stop the server |
| `restart` | Stop then start |
| `kill` | Immediately kill the process (SIGKILL) |

**Response `200 OK`:**

```json
{ "ok": true, "status": "starting" }
```

**Errors:**

| Code | Reason |
|------|--------|
| `400` | Invalid action |
| `503` | Flaps node unreachable |

---

## POST /api/servers/:id/command

Send a console command to the running server.

**Auth:** Required  
**Role:** Admin or server owner

**Request body:**

```json
{ "command": "say Hello world" }
```

**Response `200 OK`:**

```json
{ "ok": true }
```

---

## GET /api/servers/:id/logs

Get recent console lines from the server's 1000-line buffer.

**Auth:** Required  
**Role:** Admin or server owner

**Response `200 OK`:**

```json
{
  "lines": [
    "[12:00:00] [Server thread/INFO]: Starting Minecraft server...",
    "[12:00:01] [Server thread/INFO]: Done (1.234s)!"
  ]
}
```

---

## GET /api/servers/:id/stats

Get the server's current resource usage from Flaps.

**Auth:** Required  
**Role:** Admin or server owner

**Response `200 OK`:**

```json
{
  "cpu": 12.5,
  "memory": { "used": 1024, "total": 2048 },
  "status": "running",
  "uptime": 3600
}
```
