# API — Plugins

Plugin routes are under `/api/servers/:id/plugins` and require server ownership or admin.

---

## GET /api/servers/:id/plugins

List all plugins installed on a server.

**Auth:** Required  
**Role:** Admin or server owner

**Response `200 OK`:**

```json
[
  {
    "id": 1,
    "serverId": 1,
    "name": "EssentialsX",
    "version": "2.20.1",
    "status": "active",
    "installedAt": "2026-01-01T00:00:00.000Z"
  }
]
```

---

## POST /api/servers/:id/plugins

Install a plugin (adds a metadata record).

**Auth:** Required  
**Role:** Admin or server owner

**Request body:**

```json
{
  "name": "WorldEdit",
  "version": "7.3.0",
  "downloadUrl": "https://dev.bukkit.org/projects/worldedit/files/latest"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Plugin display name |
| `version` | No | Version string |
| `downloadUrl` | No | URL to the plugin JAR |

**Response `201 Created`:** Created plugin record.

> **Note:** The current version stores the plugin metadata but does not automatically download the JAR. See [Known Issues](../known-issues.md).

---

## DELETE /api/servers/:id/plugins/:pluginId

Remove a plugin record.

**Auth:** Required  
**Role:** Admin or server owner

**Response `200 OK`:**

```json
{ "ok": true }
```
