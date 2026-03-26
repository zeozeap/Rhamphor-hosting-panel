# VortexPanel — Minecraft Hosting Panel

## Overview

A full Minecraft server hosting panel (Pterodactyl-like) with a React frontend, Express API backend, session-based auth, and in-memory server process manager with WebSocket console streaming.

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + Wouter routing + TailwindCSS (cyan dark theme)

## Demo Credentials

- Admin: `admin` / `admin123` (or `admin@panel.local`)
- Player: `player1@panel.local` / `player1234`

## Seeded Data

- 2 Nodes: US-East, EU-West
- 3 Servers: Survival SMP (paper 1.21.1), Creative World (paper 1.20.4), Modded 1.12 (forge 1.12.2)
- Plugins seeded: Survival SMP (EssentialsX, WorldGuard, LuckPerms), Creative World (EssentialsX, WorldEdit, PlaceholderAPI)
- Subdomain seeded: survival-smp.vortexpanel.io:25565

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server (port from $PORT)
│   └── panel/              # React frontend (Vite, port from $PORT)
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks + custom-fetch
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/
│   └── src/seed.ts         # Seeds demo data (nodes, users, servers)
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## New Features (Latest)

### Personalization System
- **Panel Settings API**: `GET/PUT /api/settings`, `GET /api/settings/public`
- **PanelSettingsContext**: Loads public settings on app init, applies CSS vars + favicon + page title dynamically
- **Theme colors**: 8 presets (cyan, purple, emerald, rose, orange, blue, yellow, pink) + custom hex color picker
- **Logo/Favicon**: Configurable URLs for sidebar logo and browser favicon
- **Custom CSS**: Inject arbitrary CSS into all panel pages

### Login Page Customization
- Custom title, subtitle, logo URL, background image URL
- Password visibility toggle (eye icon)
- Dynamic primary color applied to button + glow effects
- Glass/blur card design with animated gradient background

### reCAPTCHA (Optional)
- Toggle on/off per panel settings (Security tab in Settings)
- Google reCAPTCHA v2 with dark theme
- Site key (public) + Secret key (private) stored in DB
- Only renders when both `recaptchaEnabled=true` and `recaptchaSiteKey` set

### Nests & Eggs (like Pterodactyl)
- **Nests**: Categories for server types (DB: `nests` table)
- **Eggs**: Server type definitions with docker image + startup command (DB: `eggs` table)
- Import presets: Minecraft Java (Paper, Forge, Vanilla, Fabric), Discord Bots (Discord.js, Python, JDA), Generic (Node.js, Python, Go)
- Full CRUD: create/edit/delete nests and eggs
- Collapsible nest accordion with inline egg creation

### Real-Time Activity Log & Audit System
- **DB**: `audit_logs` table (action, userId, username, resourceType, resourceId, resourceName, metadata, ip, level)
- **auditLogger.ts**: `logAudit()`, `auditFromReq()`, `onActivity()` event emitter
- **WebSocket**: `/ws/activity` broadcasts events to all connected admin clients in real-time
- **Audit API**: `GET /api/audit` (admin, paginated, filterable)
- **Activity Log page**: Live feed with pause/resume, filter by action/user/resource, color-coded badges
- Audit events logged: user.login, server.start/stop/restart/kill/create/update/delete, nest.create/delete, egg.create/delete

## Key Features

### Frontend (`artifacts/panel`)
- **Theme**: Cyan dark (#00BCD4 primary, #0D1117 background)
- **Pages**: Login, Dashboard, Servers, Server Detail (6 tabs), Nodes, Users, My Servers, Settings
- **Auth**: `AuthContext` + `ProtectedRoute` using `useAuth` hook; session cookie via `credentials: 'include'`
- **Routing**: Wouter v3 with `<Route path="..."><Component /></Route>` pattern (NOT render props)
- **Redirect pattern**: `useEffect(() => { if (!user) setLocation('/login') }, [user])` — NEVER call setLocation during render

#### Sidebar Structure
- **My Account** section: "My Servers" → `/my-servers`
- **Administration** section (admin only): Dashboard, All Servers, Nodes, Users
- Settings link + user avatar + logout button at bottom

#### Server Detail Tabs (6 tabs)
1. **Console** — WebSocket terminal at `ws://.../ws/servers/:id/console`; live streaming + command input
2. **Files** — Dual-pane file manager: left tree + right code editor; Ctrl+S to save; in-memory FS
3. **Plugins** — List installed plugins with toggle/delete; install form with name input
4. **Subdomains** — Manage `{sub}.vortexpanel.io:{port}` addresses; add/copy/delete
5. **Stats** — RAM/CPU/disk usage cards with animated stat display
6. **Settings** — Edit server name, description, memory, disk, max players, port; danger zone (delete)

#### My Servers Page (`/my-servers`)
- Shows only the logged-in user's servers (filtered by userId)
- Power controls (Start/Stop), stats display, link to server detail

### Backend (`artifacts/api-server`)
- **Auth**: `express-session` + `bcryptjs`; routes at `/api/auth/login|logout|me|profile`
- **Routes**: servers, users, nodes, server-logs, files, plugins, subdomains at `/api/servers|users|nodes|server-logs`
- **File routes**: `GET /api/servers/:id/files`, `GET /api/servers/:id/files/read`, `PUT /api/servers/:id/files/write`, `DELETE /api/servers/:id/files`
- **Plugin routes**: `GET|POST /api/servers/:id/plugins`, `PATCH /api/servers/:id/plugins/:pluginId`, `DELETE /api/servers/:id/plugins/:pluginId`
- **Subdomain routes**: `GET|POST /api/servers/:id/subdomains`, `DELETE /api/servers/:id/subdomains/:subId`
- **WebSocket**: Console streaming at `ws://host/ws/servers/:id/console`; uses `addClient`/`removeClient`
- **PATCH route**: `PATCH /api/servers/:id/update` — update server settings
- **Server Manager**: `src/lib/serverManager.ts` — in-memory map of server processes + in-memory file system

#### In-Memory File System (serverManager.ts)
- `initFileSystem(serverId, serverType)` — creates default Minecraft files per type (paper/forge/vanilla)
- `listFiles(serverId, dirPath)` — returns FileEntry[]
- `readFile(serverId, filePath)` — returns FileEntry with content
- `writeFile(serverId, filePath, content)` — upserts file
- `deleteFilePath(serverId, filePath)` — deletes file or dir
- Pre-seeded files: `server.properties`, `eula.txt`, `paper.yml`, `spigot.yml`, `server.log`, directories: `plugins/`, `world/`, `world_nether/`, `world_the_end/`, `crash-reports/`

### Database (`lib/db`)
- Schema: `users`, `nodes`, `servers`, `server_logs`, `server_plugins`, `subdomains`
- Push migrations: `pnpm --filter @workspace/db run push`

### API Codegen
- Run: `pnpm --filter @workspace/api-spec run codegen`
- Output: `lib/api-client-react/src/generated/` and `lib/api-zod/src/generated/`

## Generated Hook Variable Shapes (Mutations)

- `useUpdateServer`: `{ id, data: UpdateServerRequest }`
- `useWriteServerFile`: `{ id, data: FileWriteRequest, params: WriteServerFileParams }`
- `useDeleteServerFile`: `{ id, params: DeleteServerFileParams }`
- `useInstallServerPlugin`: `{ id, data: InstallPluginRequest }`
- `useToggleServerPlugin`: `{ id, pluginId, data: ToggleServerPluginBody }`
- `useRemoveServerPlugin`: `{ id, pluginId }`
- `useCreateServerSubdomain`: `{ id, data: CreateSubdomainRequest }`
- `useDeleteServerSubdomain`: `{ id, subId }`

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

- **Always typecheck from the root** — run `pnpm run typecheck`
- **`emitDeclarationOnly`** — only `.d.ts` files during typecheck; JS bundling done by esbuild/vite
- **Project references** — packages must list their dependencies in `references` array

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly`
- `pnpm --filter @workspace/scripts run seed` — seed demo data

## Custom Fetch Notes

`lib/api-client-react/src/custom-fetch.ts` is configured with `credentials: "include"` so session cookies are always sent. This is required for the session-based auth to work in the browser.

## Flaps Daemon

The **Flaps** daemon (`artifacts/flaps-daemon/`) is the node agent that runs on game server nodes. It communicates with the Rhamphor panel via HTTP REST + WebSocket.

### Architecture
```
Rhamphor Panel API  ←→  Flaps Daemon (per node)  ←→  Game Server Processes
```

### Flaps API (port 9000 in dev, 8443 in prod)
- `GET /` - Daemon info (no auth)
- `GET /api/health` - Health + system stats (no auth)
- `GET /api/stats` - Full CPU/RAM/disk/network stats + server list (auth required)
- `POST /api/servers` - Register server slot (auth required)
- `POST /api/servers/:id/power` - start/stop/restart/kill (auth required)
- `POST /api/servers/:id/command` - Send console command (auth required)
- `GET /api/servers/:id/console` - Console history (auth required)
- `GET/PUT/DELETE /api/servers/:id/files*` - File manager (auth required)
- `WS /ws?type=console&server=:id&token=:token` - Real-time console stream
- `WS /ws?type=stats&token=:token` - Real-time system stats stream

### Dev Token
Token in dev: `dev-token-rhamphor`

### Installation Scripts
- `scripts/install-flaps.sh` — One-command Flaps daemon installation (installs Node.js, systemd service, firewall rules)
- `scripts/install-rhamphor.sh` — One-command Rhamphor panel installation (installs Node.js, PostgreSQL, Nginx, SSL)
