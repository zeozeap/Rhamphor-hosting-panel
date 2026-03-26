# Flaps — REST API

Base URL: `http://<node-fqdn>:<port>`

All endpoints except `/` and `/api/health` require:

```
Authorization: Bearer <token>
```

---

## GET /

Version and identity info.

**Auth:** Not required

**Response `200 OK`:**

```json
{
  "name": "Flaps",
  "version": "1.0.0",
  "nodeId": "game-node-1",
  "panel": "Rhamphor"
}
```

---

## GET /api/health

Health check. Used by the panel to verify node connectivity.

**Auth:** Not required

**Response `200 OK`:**

```json
{
  "ok": true,
  "uptime": 86400,
  "cpu": 5.2,
  "memory": { "used": 4096, "total": 16384 }
}
```

---

## GET /api/stats

Full system stats and list of all registered servers on this node.

**Auth:** Required

**Response `200 OK`:**

```json
{
  "cpu": { "load": 12.5 },
  "memory": { "used": 4096, "total": 16384 },
  "disk": { "used": 102400, "total": 512000 },
  "network": { "rx": 1024, "tx": 512 },
  "servers": [
    { "id": "abc123", "name": "Survival World", "status": "running", "pid": 1234 }
  ]
}
```

---

## GET /api/servers

List all server slots registered on this node.

**Auth:** Required

**Response `200 OK`:** Array of server slot objects.

---

## POST /api/servers

Register a new server slot on this node.

**Auth:** Required

**Request body:**

```json
{
  "id": "abc123",
  "name": "Survival World",
  "startCommand": "java -Xmx2G -jar paper.jar --nogui",
  "workingDir": "/var/lib/flaps/servers/abc123",
  "environment": { "JAVA_VERSION": "21" }
}
```

**Response `201 Created`:** Server slot object.

---

## POST /api/servers/:id/power

Send a power action to a server.

**Auth:** Required

**Request body:**

```json
{ "action": "start" }
```

| Action | Description |
|--------|-------------|
| `start` | Launch the server process |
| `stop` | Send graceful stop (stdin command or SIGTERM) |
| `restart` | Stop + start |
| `kill` | Send SIGKILL immediately |

**Response `200 OK`:**

```json
{ "ok": true, "status": "starting" }
```

---

## POST /api/servers/:id/command

Send a command to the server's stdin.

**Auth:** Required

**Request body:**

```json
{ "command": "say Hello from Rhamphor!" }
```

**Response `200 OK`:**

```json
{ "ok": true }
```

**Errors:**

| Code | Reason |
|------|--------|
| `400` | Server is not running |
| `404` | Server not found |

---

## GET /api/servers/:id/console

Get the server's console buffer (last 1000 lines).

**Auth:** Required

**Response `200 OK`:**

```json
{
  "lines": [
    "[12:00:00] [Server thread/INFO]: Starting server...",
    "[12:00:01] [Server thread/INFO]: Done (1.2s)!"
  ]
}
```

---

## File Endpoints

All file endpoints are prefixed with `/api/servers/:id/files` and mirror the panel's file API exactly. See [API → Files](../api/files.md) for request/response shapes.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/servers/:id/files` | List directory |
| `GET` | `/api/servers/:id/files/read` | Read file |
| `PUT` | `/api/servers/:id/files/write` | Write file |
| `POST` | `/api/servers/:id/files/mkdir` | Create directory |
| `POST` | `/api/servers/:id/files/touch` | Create empty file |
| `POST` | `/api/servers/:id/files/rename` | Rename in place |
| `POST` | `/api/servers/:id/files/move` | Move to new path |
| `POST` | `/api/servers/:id/files/copy` | Copy to new path |
| `POST` | `/api/servers/:id/files/compress` | Create ZIP |
| `POST` | `/api/servers/:id/files/extract` | Extract ZIP |
| `DELETE` | `/api/servers/:id/files` | Delete file or folder |
