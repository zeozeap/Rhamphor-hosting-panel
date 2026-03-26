# API — Nodes

All node routes require admin authentication.

---

## GET /api/nodes

List all registered nodes.

**Auth:** Required  
**Role:** Admin only

**Response `200 OK`:**

```json
[
  {
    "id": 1,
    "name": "US East Node 1",
    "fqdn": "node1.example.com",
    "port": 8443,
    "description": "Primary game node",
    "createdAt": "2026-01-01T00:00:00.000Z"
  }
]
```

---

## POST /api/nodes

Register a new node.

**Auth:** Required  
**Role:** Admin only

**Request body:**

```json
{
  "name": "EU West Node",
  "fqdn": "eu-node.example.com",
  "port": 8443,
  "token": "my-secret-token",
  "description": "European game node"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Display name |
| `fqdn` | Yes | Domain or IP address of the node |
| `port` | Yes | Port the Flaps daemon is listening on |
| `token` | Yes | Bearer token configured in Flaps |
| `description` | No | Optional notes |

**Response `201 Created`:** The created node object (token is not returned).

---

## GET /api/nodes/:id

Get a single node's details.

**Auth:** Required  
**Role:** Admin only

**Response `200 OK`:** Node object.

**Errors:**

| Code | Reason |
|------|--------|
| `404` | Node not found |

---

## PATCH /api/nodes/:id

Update a node.

**Auth:** Required  
**Role:** Admin only

**Request body:** Any subset of: `name`, `fqdn`, `port`, `token`, `description`

**Response `200 OK`:** Updated node object.

---

## DELETE /api/nodes/:id

Delete a node.

**Auth:** Required  
**Role:** Admin only

**Response `200 OK`:**

```json
{ "ok": true }
```

> Note: Deleting a node does not stop running servers on that node. It only removes the node record from the panel database.
