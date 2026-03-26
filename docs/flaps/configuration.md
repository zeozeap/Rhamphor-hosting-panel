# Flaps — Configuration

## Environment Variables

All Flaps configuration is done through environment variables. In development, these are passed directly to the process. In production, they are stored in `/etc/flaps/env` and loaded by the systemd service.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `FLAPS_TOKEN` | **Yes** | — | Secret bearer token. Must match what's stored in the panel's node record. |
| `FLAPS_PORT` | No | `8443` | Port the Flaps HTTP and WebSocket server listens on. |
| `FLAPS_NODE_ID` | No | `node-local` | Human-readable identifier for this node. Shown in panel and logs. |
| `FLAPS_DATA_DIR` | No | `/var/lib/flaps` | Root directory for all server data files. Each server gets a subdirectory here. |
| `FLAPS_LOG_LEVEL` | No | `info` | Log verbosity level: `debug`, `info`, `warn`, `error`. |
| `FLAPS_PANEL_URL` | No | — | URL of the Rhamphor panel (used for callbacks in future versions). |

---

## config.ts

The `src/config.ts` file reads these environment variables and exports a typed config object used throughout the daemon:

```typescript
export const config = {
  port: parseInt(process.env.FLAPS_PORT ?? '8443'),
  token: process.env.FLAPS_TOKEN ?? '',
  nodeId: process.env.FLAPS_NODE_ID ?? 'node-local',
  dataDir: process.env.FLAPS_DATA_DIR ?? '/var/lib/flaps',
  logLevel: process.env.FLAPS_LOG_LEVEL ?? 'info',
  panelUrl: process.env.FLAPS_PANEL_URL ?? '',
};
```

---

## Data Directory Layout

```
FLAPS_DATA_DIR/
└── servers/
    ├── abc123/          ← server ID
    │   ├── server.jar
    │   ├── world/
    │   ├── plugins/
    │   └── server.properties
    └── def456/
        ├── bot.js
        └── config.json
```

Each server gets its own subdirectory named by its ID. All file operations via the Flaps file manager are scoped to this directory.

---

## Production systemd Service

The install script creates `/etc/systemd/system/flaps.service`:

```ini
[Unit]
Description=Flaps Game Node Daemon
After=network.target

[Service]
Type=simple
User=flaps
WorkingDirectory=/opt/flaps
EnvironmentFile=/etc/flaps/env
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

### Managing the service

```bash
sudo systemctl start flaps
sudo systemctl stop flaps
sudo systemctl restart flaps
sudo systemctl status flaps

# View logs
sudo journalctl -u flaps -f
sudo journalctl -u flaps --since "1 hour ago"
```

---

## Development Workflow

In the Replit environment, Flaps runs via the `artifacts/flaps-daemon: Flaps Daemon` workflow with:

```
FLAPS_PORT=9000
FLAPS_DATA_DIR=/tmp/flaps-data
FLAPS_TOKEN=dev-token-rhamphor
```

The daemon uses `tsx watch` for hot reload during development.
