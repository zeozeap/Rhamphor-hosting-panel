# API — Files

All file routes are under `/api/servers/:id/files` and require authentication plus server ownership (or admin).

Path parameters are relative to the server's root data directory.

---

## GET /api/servers/:id/files

List the contents of a directory.

**Query params:**

| Param | Default | Description |
|-------|---------|-------------|
| `path` | `/` | Directory path to list |

**Response `200 OK`:**

```json
[
  { "name": "plugins", "path": "/plugins", "isDir": true, "size": 0, "modifiedAt": "2026-01-01T00:00:00.000Z" },
  { "name": "server.jar", "path": "/server.jar", "isDir": false, "size": 48291234, "modifiedAt": "2026-01-01T00:00:00.000Z" }
]
```

---

## GET /api/servers/:id/files/read

Read a file's contents.

**Query params:**

| Param | Required | Description |
|-------|----------|-------------|
| `path` | Yes | File path |

**Response `200 OK`:** Plain text file contents.

**Errors:**

| Code | Reason |
|------|--------|
| `400` | Path is a directory |
| `404` | File not found |

---

## PUT /api/servers/:id/files/write

Write (create or overwrite) a file.

**Request body:**

```json
{ "path": "/server.properties", "content": "level-name=world\n..." }
```

**Response `200 OK`:**

```json
{ "ok": true }
```

---

## POST /api/servers/:id/files/mkdir

Create a new directory.

**Request body:**

```json
{ "path": "/new-folder" }
```

**Response `200 OK`:**

```json
{ "ok": true }
```

**Errors:**

| Code | Reason |
|------|--------|
| `409` | Directory already exists |

---

## POST /api/servers/:id/files/touch

Create a new empty file.

**Request body:**

```json
{ "path": "/newfile.txt" }
```

**Response `200 OK`:**

```json
{ "ok": true }
```

---

## POST /api/servers/:id/files/rename

Rename a file or folder in place.

**Request body:**

```json
{ "path": "/oldname.txt", "newName": "newname.txt" }
```

Note: `newName` is just the filename, not a full path.

**Response `200 OK`:**

```json
{ "ok": true }
```

**Errors:**

| Code | Reason |
|------|--------|
| `404` | Source not found |
| `409` | A file with the new name already exists |

---

## POST /api/servers/:id/files/move

Move a file or folder to a different directory.

**Request body:**

```json
{ "src": "/plugins/old-plugin.jar", "dest": "/backup/old-plugin.jar" }
```

**Response `200 OK`:**

```json
{ "ok": true }
```

**Errors:**

| Code | Reason |
|------|--------|
| `400` | Source equals destination, or destination is inside source (subtree move) |
| `404` | Source not found |
| `409` | Destination already exists |

---

## POST /api/servers/:id/files/copy

Copy a file or folder to a new location.

**Request body:**

```json
{ "src": "/server.jar", "dest": "/backup/server.jar" }
```

**Response `200 OK`:**

```json
{ "ok": true }
```

**Errors:** Same as `/move`.

---

## POST /api/servers/:id/files/compress

Compress a file or folder into a ZIP archive at the same location.

**Request body:**

```json
{ "path": "/plugins" }
```

Creates `/plugins.zip`.

**Response `200 OK`:**

```json
{ "ok": true, "archive": "/plugins.zip" }
```

---

## POST /api/servers/:id/files/extract

Extract a ZIP archive in place.

**Request body:**

```json
{ "path": "/plugins.zip" }
```

Extracts contents into the same directory as the ZIP file.

**Response `200 OK`:**

```json
{ "ok": true }
```

**Errors:**

| Code | Reason |
|------|--------|
| `400` | File is not a `.zip` archive |
| `404` | File not found |

---

## DELETE /api/servers/:id/files

Delete a file or folder (recursive).

**Request body:**

```json
{ "path": "/old-world" }
```

**Response `200 OK`:**

```json
{ "ok": true }
```

**Errors:**

| Code | Reason |
|------|--------|
| `404` | Path not found |
