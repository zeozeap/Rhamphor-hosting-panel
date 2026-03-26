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

## Key Features

### Frontend (`artifacts/panel`)
- **Theme**: Cyan dark (#00BCD4 primary, #0D1117 background)
- **Pages**: Login, Dashboard, Servers, Server Detail (console/stats), Nodes, Users, Settings
- **Auth**: `AuthContext` + `ProtectedRoute` using `useAuth` hook; session cookie via `credentials: 'include'`
- **Routing**: Wouter v3 with `<Route path="..."><Component /></Route>` pattern (NOT render props)
- **Redirect pattern**: `useEffect(() => { if (!user) setLocation('/login') }, [user])` — NEVER call setLocation during render

### Backend (`artifacts/api-server`)
- **Auth**: `express-session` + `bcryptjs`; routes at `/api/auth/login|logout|me|profile`
- **Routes**: servers, users, nodes, server-logs at `/api/servers|users|nodes|server-logs`
- **WebSocket**: Console streaming at `ws://host/ws/servers/:id/console`
- **Server Manager**: `src/lib/serverManager.ts` — in-memory map of server processes with simulated stats/logs

### Database (`lib/db`)
- Schema: `users`, `nodes`, `servers`, `server_logs`
- Push migrations: `pnpm --filter @workspace/db run push`

### API Codegen
- Run: `pnpm --filter @workspace/api-spec run codegen`
- Output: `lib/api-client-react/src/generated/` and `lib/api-zod/src/generated/`

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
