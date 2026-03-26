# Flaps — Overview

**Flaps** is the game server node daemon for Rhamphor. It runs on each physical or virtual machine that hosts game server processes and handles the actual work of starting, stopping, and monitoring servers.

---

## Why a Separate Daemon?

The Rhamphor panel is a control plane — it manages configuration, users, and state, but does not run game servers itself. Game servers typically need to run on dedicated, high-resource machines separate from the web server.

Flaps acts as the agent on each game node, accepting authenticated commands from the Rhamphor panel and executing them locally.

---

## Architecture

```
Rhamphor Panel API
       │
       │  HTTPS + Bearer Token
       ▼
Flaps Daemon (per node)
       │
       ├─ REST API (/api/...)
       ├─ WebSocket (/ws?type=console&...)
       ├─ WebSocket (/ws?type=stats&...)
       │
       ├─ processManager.ts   ← manages child_process instances
       ├─ fileManager.ts      ← safe file operations
       └─ systemInfo.ts       ← CPU/RAM/disk via systeminformation
```

---

## Supported Server Types

Flaps can launch any process via a configurable start command. It has native understanding of these server types for graceful stop behavior:

| Type | Start command pattern | Stop signal |
|------|----------------------|-------------|
| Paper / Spigot | `java -jar paper.jar` | Sends `stop` to stdin |
| Forge | `java -jar forge.jar` | Sends `stop` to stdin |
| Fabric | `java -jar fabric-server-launch.jar` | Sends `stop` to stdin |
| Vanilla | `java -jar server.jar` | Sends `stop` to stdin |
| Node.js / discord.js | `node index.js` | SIGTERM |
| Python / discord.py | `python bot.py` | SIGTERM |
| Go binary | `./server` | SIGTERM |
| Custom | Any command in the egg's `startCommand` | SIGTERM |

---

## Process Management

Flaps uses Node.js `child_process.spawn()` to launch game servers. Each server process:

- Gets its own isolated working directory under `FLAPS_DATA_DIR/servers/<id>/`
- Has its stdout/stderr captured into a rolling 1000-line console buffer
- Can receive stdin commands via `POST /api/servers/:id/command`
- Can be killed via SIGKILL if graceful stop is unresponsive

---

## Console Buffer

Each running server maintains a circular buffer of the last 1000 console lines. This buffer:

- Is populated from stdout + stderr of the child process
- Is served via `GET /api/servers/:id/console` (REST snapshot)
- Is streamed in real time via WebSocket (`type=console`)
- Is cleared when the process is restarted

---

## File Management

The Flaps file manager (`fileManager.ts`) provides safe file operations within a server's data directory:

- All paths are resolved relative to the server root and checked against it
- Path traversal attempts (e.g. `../../etc/passwd`) are blocked
- Supports: list, read, write, create dir, create file, rename, move, copy, compress (zip), extract (zip), delete

---

## System Stats

Flaps uses the `systeminformation` npm package to collect real-time system metrics:

- **CPU:** current load percentage
- **RAM:** used and total memory in MB
- **Disk:** used and total disk space for the data directory's mount point
- **Network:** bytes in/out per second

These are broadcast every 2 seconds via the stats WebSocket and served on demand via `GET /api/stats`.
