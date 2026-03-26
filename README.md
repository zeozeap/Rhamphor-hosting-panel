<div align="center">

# Rhamphor

**The Modern Game Server Hosting Panel**

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-20%2B-brightgreen)
![PostgreSQL](https://img.shields.io/badge/postgresql-15%2B-blue)

Rhamphor is a production-ready game server hosting panel with real-time console streaming, file management, plugin manager, subdomain manager, Nests & Eggs system, full panel personalization, and role-based access control — powered by the **Flaps** node daemon.

</div>

---

## Features

- **Dashboard** — Server stats, node health, activity overview
- **Server Management** — Start, stop, restart, kill game servers with real-time console
- **File Manager** — Browse, edit, upload, delete server files in-browser with context menus, inline rename, move dialog with directory tree, compress/extract
- **Plugin Manager** — Track and manage server plugins
- **Subdomain Manager** — Assign custom subdomains to servers
- **Nests & Eggs** — Pterodactyl-style server type system (Minecraft, Discord bots, Go, Python, Node.js)
- **Nodes** — Multi-node support powered by the Flaps daemon
- **User Management** — Role-based access (admin / user), users only see their own servers
- **Real-Time Activity Log** — WebSocket-powered live audit stream with pause/resume
- **Full Personalization** — Custom panel name, logo, favicon, theme color (8 presets + custom), login background, custom CSS
- **Security** — Optional Google reCAPTCHA v2 on login, bcrypt passwords, session auth
- **Flaps Daemon** — Lightweight node agent for actual process management on game nodes

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Tailwind CSS, shadcn/ui |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL + Drizzle ORM |
| Real-time | WebSocket (ws) |
| Auth | Session-based (express-session) |
| Daemon | Flaps (Node.js + Express + WebSocket) |
| Monorepo | pnpm workspaces |

---

## Quick Start (Development)

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL 15+

### Setup

```bash
# Clone the repo
git clone https://github.com/yourorg/rhamphor.git
cd rhamphor

# Install dependencies
pnpm install

# Configure environment
cp .env.example .env
# Edit .env: set DATABASE_URL and SESSION_SECRET

# Push database schema
pnpm --filter @workspace/db run push

# Seed demo data (creates admin/admin123)
pnpm --filter @workspace/db run seed

# Start the API server
pnpm --filter @workspace/api-server run dev

# Start the panel
pnpm --filter @workspace/panel run dev
```

Default admin credentials after seeding: `admin` / `admin123`

---

## Production Installation

### Panel (Rhamphor)

```bash
sudo bash install-rhamphor.sh \
  --domain panel.yourdomain.com \
  --email admin@yourdomain.com
```

### Node Daemon (Flaps)

Run on each game server node:

```bash
sudo bash install-flaps.sh \
  --token YOUR_SECRET_TOKEN \
  --port 8443 \
  --node-id my-node-1
```

After installing Flaps, add the node in the panel: **Nodes → Add Node**.

---

## Documentation

Full documentation lives in the [`docs/`](docs/index.md) folder:

| Section | Description |
|---------|-------------|
| [Getting Started](docs/getting-started.md) | Dev setup, credentials, first run |
| [Installation](docs/installation.md) | Production install scripts |
| [Architecture](docs/architecture.md) | System design, monorepo layout, DB schema |
| [Configuration](docs/configuration.md) | All environment variables and settings |
| [Security](docs/security.md) | Auth, RBAC, bcrypt, reCAPTCHA, checklists |
| [Known Issues](docs/known-issues.md) | Active bugs and limitations |
| [API Reference](docs/api/overview.md) | Full REST + WebSocket API docs |
| [Flaps Daemon](docs/flaps/overview.md) | Daemon architecture, REST API, WebSocket streams |
| [Panel Guide](docs/panel/dashboard.md) | Per-page UI documentation |

---

## Flaps Daemon API

Flaps exposes a REST + WebSocket API on each node (default port `8443`).

All endpoints require `Authorization: Bearer <token>` except `/` and `/api/health`.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health check (no auth) |
| `GET` | `/api/stats` | CPU, RAM, disk, network + server list |
| `POST` | `/api/servers/:id/power` | `start` / `stop` / `restart` / `kill` |
| `POST` | `/api/servers/:id/command` | Send console command |
| `GET` | `/api/servers/:id/console` | Console history (1000 lines) |
| `*` | `/api/servers/:id/files/*` | Full file manager API |

**WebSocket:**
```
ws://node:8443/ws?type=console&server=<id>&token=<token>   # Console stream
ws://node:8443/ws?type=stats&token=<token>                 # Stats stream (2s interval)
```

---

## Project Structure

```
rhamphor/
├── artifacts/
│   ├── api-server/          # Express API backend
│   ├── panel/               # React + Vite frontend
│   └── flaps-daemon/        # Flaps game node daemon
├── lib/
│   ├── db/                  # Drizzle ORM schema + migrations
│   └── api-client-react/    # Generated React Query hooks
├── docs/                    # Full documentation
├── scripts/
│   ├── install-rhamphor.sh  # Panel install script
│   └── install-flaps.sh     # Daemon install script
└── pnpm-workspace.yaml
```

---

## Role-Based Access

| Feature | Admin | User |
|---------|-------|------|
| Dashboard | Yes | No (redirected to My Servers) |
| All Servers | Yes | No |
| Own Servers | Yes | Yes |
| Nodes, Users, Nests | Yes | No |
| Activity Log | Yes | No |
| Panel Personalization | Yes | No |
| Account Settings | Yes | Yes |

---

## License

MIT — see [LICENSE](LICENSE)

---

<div align="center">
Built with Rhamphor &nbsp;·&nbsp; Powered by Flaps
</div>
