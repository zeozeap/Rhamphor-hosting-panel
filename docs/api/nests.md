# API — Nests & Eggs

All nest and egg routes require admin authentication.

---

## Nests

### GET /api/nests

List all nests.

**Auth:** Required  
**Role:** Admin only

**Response `200 OK`:**

```json
[
  { "id": 1, "name": "Minecraft", "description": "Java Edition servers", "eggCount": 5 },
  { "id": 2, "name": "Discord Bots", "description": "Bot frameworks", "eggCount": 2 }
]
```

---

### POST /api/nests

Create a nest.

**Request body:**

```json
{ "name": "Rust Servers", "description": "Rust game servers" }
```

**Response `201 Created`:** Created nest object.

---

### GET /api/nests/:id

Get a nest with its eggs.

**Response `200 OK`:**

```json
{
  "id": 1,
  "name": "Minecraft",
  "description": "Java Edition servers",
  "eggs": [
    { "id": 1, "name": "Paper", "description": "High performance fork" },
    { "id": 2, "name": "Fabric", "description": "Lightweight modding" }
  ]
}
```

---

### PATCH /api/nests/:id

Update a nest's name or description.

**Request body:** `{ "name": "...", "description": "..." }` (either or both)

**Response `200 OK`:** Updated nest.

---

### DELETE /api/nests/:id

Delete a nest and all its eggs.

**Response `200 OK`:** `{ "ok": true }`

---

### GET /api/nests/:id/eggs

List all eggs in a specific nest.

**Response `200 OK`:** Array of egg objects.

---

## Eggs

### GET /api/eggs/:id

Get a single egg.

**Response `200 OK`:**

```json
{
  "id": 1,
  "nestId": 1,
  "name": "Paper",
  "description": "High performance Minecraft fork",
  "startCommand": "java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar server.jar --nogui",
  "stopCommand": "stop",
  "dockerImage": "",
  "defaultEnvironment": { "JAVA_VERSION": "21" },
  "createdAt": "2026-01-01T00:00:00.000Z"
}
```

---

### POST /api/eggs

Create an egg.

**Request body:**

```json
{
  "nestId": 1,
  "name": "Vanilla",
  "description": "Official Minecraft server",
  "startCommand": "java -Xmx{{SERVER_MEMORY}}M -jar server.jar --nogui",
  "stopCommand": "stop",
  "dockerImage": "",
  "defaultEnvironment": {}
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `nestId` | Yes | ID of the parent nest |
| `name` | Yes | Display name |
| `startCommand` | Yes | Command to start the server |
| `stopCommand` | No | Console command to gracefully stop (default: `stop`) |
| `description` | No | Short description |
| `dockerImage` | No | Docker image (future use) |
| `defaultEnvironment` | No | Key-value env vars |

**Response `201 Created`:** Created egg object.

---

### PATCH /api/eggs/:id

Update an egg.

**Request body:** Any subset of egg fields.

**Response `200 OK`:** Updated egg.

---

### DELETE /api/eggs/:id

Delete an egg.

**Response `200 OK`:** `{ "ok": true }`

> Existing servers using this egg will show a missing-egg warning but continue to function.
