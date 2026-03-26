# Nodes

Route: `/nodes`  
Access: Admin only

Nodes are the physical or virtual machines that run the Flaps daemon and host actual game server processes.

---

## Node List

The Nodes page shows all registered nodes with:

| Column | Description |
|--------|-------------|
| Name | Display name for the node |
| FQDN | Fully qualified domain name or IP address |
| Port | Port the Flaps daemon listens on |
| Status | Online / Offline based on a health check ping |
| Server count | Number of servers assigned to this node |

---

## Adding a Node

Click **Add Node** to open the node creation form:

| Field | Description |
|-------|-------------|
| Name | A friendly name (e.g. "US East Node 1") |
| FQDN | The node's domain name or IP (e.g. `node1.yourdomain.com`) |
| Port | Port the Flaps daemon is listening on (default: `8443`) |
| Token | The secret bearer token configured in Flaps (`FLAPS_TOKEN`) |
| Description | Optional notes about this node |

After saving, Rhamphor sends a test request to `https://<fqdn>:<port>/api/health` to verify the node is reachable.

---

## Node Health Check

The panel polls each node's `/api/health` endpoint periodically. If the check fails:

- The node status shows **Offline**
- Servers on this node show as unreachable
- Power controls and file manager will return errors

The health endpoint does **not** require authentication, making it safe to use for monitoring tools.

---

## Editing a Node

Click a node to edit its name, FQDN, port, token, or description.

> **Note:** If you change a node's token, you must also update `FLAPS_TOKEN` in the Flaps daemon's environment and restart the Flaps service.

---

## Deleting a Node

Deleting a node removes it from the panel's database. It does **not** stop any running server processes on the node — those continue running under Flaps until manually stopped or Flaps is restarted.

Before deleting a node:
1. Stop all servers on the node from the panel
2. Reassign or delete the server records for servers on that node
3. Then delete the node

---

## Flaps Connectivity Requirements

- The Flaps port must be reachable from the Rhamphor API server (not from the user's browser)
- Recommended: firewall the Flaps port to only allow connections from the panel server's IP
- The Flaps daemon's token must match the token stored in the node record
