# Architecture

## Overview

Rhamphor follows a three-tier architecture:

```
┌─────────────────────────────────────────────────────────┐
│                    User's Browser                        │
│         React + Vite Panel (artifacts/panel)             │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP/WebSocket
┌────────────────────────▼────────────────────────────────┐
│               Rhamphor API Server                        │
│      Express + TypeScript (artifacts/api-server)         │
│              PostgreSQL ← Drizzle ORM                    │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP/WebSocket (per node)
              ┌──────────┼──────────┐
              ▼          ▼          ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ Flaps    │ │ Flaps    │ │ Flaps    │
        │ Node 1   │ │ Node 2   │ │ Node N   │
        │(daemon)  │ │(daemon)  │ │(daemon)  │
        └──────────┘ └──────────┘ └──────────┘
```

---

## Monorepo Structure

```
rhamphor/
├── artifacts/
│   ├── api-server/          # Express REST + WebSocket API
│   │   └── src/
│   │       ├── index.ts     # Entry point, WebSocket + HTTP server
│   │       ├── routes/      # auth, servers, nodes, users, nests,
│   │       │                  files, plugins, subdomains, audit, settings
│   │       └── lib/         # serverManager, auditLogger, middleware
│   ├── panel/               # React 19 + Vite frontend
│   │   └── src/
│   │       ├── App.tsx      # Router, AuthProvider, route guards
│   │       ├── pages/       # Dashboard, Servers, ServerDetail, Nodes,
│   │       │                  Users, Nests, ActivityLog, Settings,
│   │       │                  MyServers, CreateServer, Login
│   │       ├── components/  # Layout, Sidebar, shared UI
│   │       └── contexts/    # AuthContext, PanelSettingsContext
│   ├── flaps-daemon/        # Flaps game node daemon
│   │   └── src/
│   │       ├── index.ts     # Entry point, REST + WebSocket server
│   │       ├── auth.ts      # Bearer token middleware
│   │       ├── config.ts    # Env-based config
│   │       ├── types.ts     # Shared types
│   │       ├── routes/      # servers, files, system
│   │       └── lib/         # processManager, fileManager, systemInfo
│   └── mockup-sandbox/      # Vite preview server for UI prototyping
├── lib/
│   ├── db/                  # Drizzle ORM schema + migrations
│   └── api-client-react/    # Generated React Query hooks + API client
├── scripts/
│   ├── install-rhamphor.sh  # Panel install script
│   ├── install-flaps.sh     # Daemon install script
│   └── post-merge.sh        # Auto-runs after task merges
└── pnpm-workspace.yaml
```

---

## Database Schema

All data lives in PostgreSQL managed via Drizzle ORM (`lib/db/schema.ts`).

| Table | Description |
|-------|-------------|
| `users` | Admin and regular user accounts (username, email, hashed password, role) |
| `servers` | Game server records (name, nodeId, eggId, userId, status) |
| `nodes` | Game server nodes (FQDN, port, token, name) |
| `nests` | Server type groups (e.g. "Minecraft", "Discord Bots") |
| `eggs` | Server type definitions under a nest (start command, Docker image, env defaults) |
| `plugins` | Plugin records per server |
| `subdomains` | Subdomain assignments per server |
| `auditLog` | Action audit trail (user, action, target, IP, timestamp) |
| `settings` | Key-value store for panel-wide settings |
| `session` | Express session storage |

---

## Authentication

- **Session-based** — `express-session` stores sessions in PostgreSQL
- **Login flow** — `POST /api/auth/login` validates credentials, sets session cookie
- **Frontend** — `AuthContext` calls `GET /api/auth/me` on load to restore session state
- **Logout** — `POST /api/auth/logout` destroys session; `AuthContext.logout()` navigates to `/login`

---

## Role-Based Access Control

Two roles exist: `admin` and `user`.

### Backend middleware (`lib/middleware.ts`)

| Middleware | Effect |
|------------|--------|
| `requireAuth` | Returns 401 if not logged in |
| `requireAdmin` | Returns 403 if not admin |
| `requireServerAccess` | Returns 403 if non-admin accessing a server they don't own |
| `getUserRole` | Helper that reads `req.session.user.role` |

### Frontend guards (`App.tsx`)

| Component | Effect |
|-----------|--------|
| `ProtectedRoute` | Redirects to `/login` if not authenticated |
| `AdminRoute` | Redirects non-admins to `/my-servers` |

---

## Real-Time Communication

### Panel ↔ API WebSocket

The API server upgrades HTTP to WebSocket at `/ws/audit`. Clients subscribe to the live audit event stream.

### Panel ↔ Flaps WebSocket

Flaps exposes two WebSocket endpoints:

- `ws://node/ws?type=console&server=<id>&token=<token>` — streams real-time console output from a game server process
- `ws://node/ws?type=stats&token=<token>` — broadcasts CPU/RAM/disk/network stats every 2 seconds

The API server acts as a **relay**: the panel connects to the API, which proxies the WebSocket connection through to the appropriate Flaps node.

---

## Flaps ↔ API Communication

The API server calls Flaps nodes over HTTP using the node's FQDN, port, and bearer token stored in the `nodes` table. Operations like power control, file management, and console command dispatch all go through this channel.
