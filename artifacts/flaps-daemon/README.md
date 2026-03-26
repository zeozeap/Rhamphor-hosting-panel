# Flaps — The Rhamphor Node Daemon

Flaps is the official node agent for the **Rhamphor** game server hosting panel. It runs on each physical or virtual machine (node) that hosts game servers, and communicates with the Rhamphor panel over HTTP and WebSocket.

## Quick Install

```bash
curl -fsSL https://get.rhamphor.io/flaps.sh | sudo bash
```

Or with options:

```bash
sudo bash install-flaps.sh \
  --token YOUR_SECRET_TOKEN \
  --port 8443 \
  --node-id my-node-1 \
  --panel-url https://panel.yourdomain.com
```

## Architecture

```
[ Rhamphor Panel ]
       |
  HTTP + WebSocket
       |
  [ Flaps Daemon ]   ← runs on each node
       |
  child_process.spawn()
       |
  [ Minecraft / Bot / Game Server Processes ]
```

## REST API

All endpoints (except `/` and `/api/health`) require:
```
Authorization: Bearer <FLAPS_TOKEN>
```

### System

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Daemon info (no auth) |
| GET | `/api/health` | Health check with stats (no auth) |
| GET | `/api/stats` | Full system + server stats |
| GET | `/api/version` | Daemon version info |

### Server Management

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/servers` | List all server processes |
| POST | `/api/servers` | Register a new server slot |
| GET | `/api/servers/:id` | Get server details |
| DELETE | `/api/servers/:id` | Remove a server slot |
| POST | `/api/servers/:id/power` | Power action (start/stop/restart/kill) |
| POST | `/api/servers/:id/command` | Send console command |
| GET | `/api/servers/:id/console` | Get console history |
| GET | `/api/servers/:id/stats` | Get per-server resource stats |

### File Management

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/servers/:id/files?path=/` | List directory contents |
| GET | `/api/servers/:id/files/read?path=/file` | Read file contents |
| PUT | `/api/servers/:id/files/write` | Write file (`{path, content}`) |
| DELETE | `/api/servers/:id/files` | Delete file or directory (`{path}`) |
| POST | `/api/servers/:id/files/mkdir` | Create directory (`{path}`) |
| POST | `/api/servers/:id/files/rename` | Rename file (`{from, to}`) |

## WebSocket

Connect to `ws://node:PORT/ws` with query params:

```
# Console streaming
ws://node:8443/ws?type=console&server=<id>&token=<FLAPS_TOKEN>

# System stats streaming (every 2s)
ws://node:8443/ws?type=stats&token=<FLAPS_TOKEN>
```

### Console WebSocket Messages

**Received from server:**
```json
{ "type": "history", "data": "[2026-01-01] Server started..." }
{ "type": "line", "data": "[2026-01-01] Player joined" }
{ "type": "error", "message": "Server not found" }
```

**Send to server:**
```json
{ "type": "command", "data": "say Hello World" }
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `FLAPS_PORT` | `8443` | Port to listen on |
| `FLAPS_TOKEN` | `change-me-in-production` | Authentication token |
| `FLAPS_NODE_ID` | `node-local` | Unique node identifier |
| `FLAPS_DATA_DIR` | `/var/lib/flaps` | Data directory for server files |
| `FLAPS_LOG_LEVEL` | `info` | Log level (debug/info/warn/error) |
| `FLAPS_PANEL_URL` | `` | Rhamphor panel URL for callbacks |
| `FLAPS_MAX_SERVERS` | `50` | Maximum concurrent server slots |

## Supported Server Types

| Type | Start Command |
|------|--------------|
| `paper`, `spigot`, `minecraft` | `java -Xmx<mem>M -jar server.jar --nogui` |
| `forge`, `fabric` | Same as above with modded flags |
| `vanilla` | Standard Minecraft server jar |
| `nodejs`, `discord.js`, `bot` | `node index.js` |
| `python`, `discord.py` | `python3 main.py` |
| `go` | `./server` |
| Custom | Set `startCommand` in server config |

## Development

```bash
# Install deps
pnpm install

# Run in development (with hot reload)
FLAPS_PORT=9000 FLAPS_TOKEN=dev-token FLAPS_DATA_DIR=/tmp/flaps pnpm dev

# Build for production
pnpm build

# Run production build
pnpm start
```

## Security

- All requests (except health check) require a Bearer token
- File operations are sandboxed to the server's data directory (path traversal protection)
- The daemon runs as a dedicated `flaps` system user (no root access)
- Systemd service has `NoNewPrivileges=yes` and `PrivateTmp=yes`
- Recommended: run behind a firewall, only allow panel IP to reach the daemon port
