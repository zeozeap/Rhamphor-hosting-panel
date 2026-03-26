# Flaps — WebSocket Streams

Flaps exposes two WebSocket endpoints for real-time data. Both require the bearer token passed as a query parameter.

---

## Console Stream

Stream real-time console output from a specific game server process.

**URL:**

```
ws://<node-fqdn>:<port>/ws?type=console&server=<serverId>&token=<token>
```

**Example:**

```
ws://node1.example.com:8443/ws?type=console&server=abc123&token=my-secret-token
```

### Connection Behavior

1. On connect, Flaps sends the current console buffer (last 1000 lines) as individual messages
2. New console lines are sent as they are produced by the server process
3. If the server is not running, the connection is accepted but no messages are sent until the server starts
4. If the server ID does not exist or the token is invalid, the connection is closed with code 4001 or 4004

### Message Format

Each message is a plain text string representing one console line:

```
[12:00:01] [Server thread/INFO]: Done (1.234s)! For help, type "help"
```

### Disconnect Behavior

- If the game server process exits, the WebSocket remains open but goes silent
- Clients should implement reconnect logic (see [Known Issues](../known-issues.md))

---

## Stats Stream

Stream real-time system stats from the node.

**URL:**

```
ws://<node-fqdn>:<port>/ws?type=stats&token=<token>
```

**Example:**

```
ws://node1.example.com:8443/ws?type=stats&token=my-secret-token
```

### Connection Behavior

1. Flaps sends a stats snapshot immediately on connect
2. A new snapshot is sent every **2 seconds**
3. Stats include node-level and per-server resource usage

### Message Format

Each message is a JSON string:

```json
{
  "timestamp": "2026-01-15T12:00:00.000Z",
  "cpu": { "load": 15.3 },
  "memory": { "used": 4096, "total": 16384 },
  "disk": { "used": 102400, "total": 512000 },
  "network": { "rx": 2048, "tx": 512 },
  "servers": [
    {
      "id": "abc123",
      "name": "Survival World",
      "status": "running",
      "cpu": 8.2,
      "memory": 1536,
      "pid": 1234,
      "uptime": 3600
    }
  ]
}
```

### Field Reference

| Field | Unit | Description |
|-------|------|-------------|
| `cpu.load` | Percent (0–100) | Overall CPU usage |
| `memory.used` | MB | RAM currently in use |
| `memory.total` | MB | Total available RAM |
| `disk.used` | MB | Disk space used on the data partition |
| `disk.total` | MB | Total disk space on the data partition |
| `network.rx` | Bytes/sec | Inbound network throughput |
| `network.tx` | Bytes/sec | Outbound network throughput |
| `servers[].cpu` | Percent | CPU attributed to this server's process |
| `servers[].memory` | MB | RAM used by this server's process |
| `servers[].uptime` | Seconds | How long the process has been running |

---

## Authentication

Both WebSocket endpoints validate the `token` query parameter against `FLAPS_TOKEN`. Invalid tokens result in an immediate close with code 4001 (Unauthorized).

---

## Panel WebSocket Proxy

The Rhamphor panel does not connect directly to Flaps WebSockets from the browser. The API server acts as a proxy:

1. Browser connects to `ws://panel/ws/console?serverId=<id>` with a session cookie
2. API server validates the session and server ownership
3. API server opens a connection to Flaps and relays messages bidirectionally
4. If Flaps is unreachable, the panel WebSocket closes with an error message
