# Servers

## All Servers (Admin)

Route: `/servers`  
Access: Admin only

The **All Servers** page shows every server on the panel. Admins can:

- See server name, owner, node, status, and egg type
- Create new servers via the **New Server** button
- Click a server to open its detail page

## My Servers (Users)

Route: `/my-servers`  
Access: All authenticated users

Regular users see only their own servers. The layout is identical but filtered to servers where `userId` matches the logged-in user.

---

## Creating a Server

Route: `/servers/create`  
Access: Admin only

The Create Server form collects:

| Field | Description |
|-------|-------------|
| Name | Display name for the server |
| Node | Which Flaps node to run the server on |
| Nest | Server type group (e.g. "Minecraft") |
| Egg | Specific server type within the nest (e.g. "Paper") |
| Owner | Which user owns this server |
| Memory | RAM allocation (MB) |
| Disk | Disk allocation (MB) |
| Startup command override | Optional override of the egg's default start command |
| Environment variables | Optional key-value env overrides |

On submit, the panel:
1. Creates the server record in the database
2. Calls Flaps on the selected node to register the server slot
3. Provisions the server data directory on the node

---

## Server Detail Page

Route: `/servers/:id`

The server detail page has five tabs:

### Console Tab

- Real-time output from the game server process, streamed via WebSocket
- 1000-line rolling buffer — older lines are discarded
- **Command input** at the bottom to send commands directly to the server process (e.g. `say Hello`, `stop`)
- **Power buttons**: Start, Stop, Restart, Kill

#### Power States

| State | Description |
|-------|-------------|
| Starting | Process is launching |
| Running | Server is online and accepting connections |
| Stopping | Graceful stop requested |
| Stopped | Process is not running |

| Button | Action |
|--------|--------|
| Start | Launches the server process |
| Stop | Sends a graceful stop signal (e.g. `stop` command for Minecraft) |
| Restart | Stop + Start |
| Kill | Sends SIGKILL immediately — use when stop is unresponsive |

### Files Tab

See [File Manager](file-manager.md) for full documentation.

### Plugins Tab

- Lists installed plugins for this server
- **Install** button to add a plugin by name/URL
- **Remove** button to uninstall a plugin
- Plugin metadata (name, version, status) is stored in the database

> Note: The current version stores plugin metadata but does not auto-download JAR files. See [Known Issues](../known-issues.md).

### Subdomains Tab

- Lists subdomains assigned to this server
- **Add Subdomain** to assign a custom subdomain
- **Remove** to delete a subdomain assignment

### Settings Tab

- Rename the server
- Change the owner
- Change memory/disk allocation
- Change startup command
- **Delete Server** — permanently removes the server and its files from the node

---

## Access Control

- `GET /servers` — admins see all; users see their own only
- `GET /servers/:id` and all sub-routes — blocked (403) for users who don't own the server
- Create/delete — admin only
