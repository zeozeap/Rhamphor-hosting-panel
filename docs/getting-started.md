# Getting Started

## What is Rhamphor?

Rhamphor is a self-hosted game server hosting panel. It gives server administrators a web interface to create, monitor, and manage game servers across one or more physical/virtual nodes. Think of it as a lightweight, purpose-built alternative to Pterodactyl.

**Rhamphor** is the control plane — the panel and API that administrators and users interact with.  
**Flaps** is the data plane — a lightweight daemon installed on each game server node that actually runs the game processes.

---

## Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | 20 or later |
| pnpm | 9 or later |
| PostgreSQL | 15 or later |

---

## Development Setup

### 1. Clone the repository

```bash
git clone https://github.com/yourorg/rhamphor.git
cd rhamphor
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set at minimum:

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/rhamphor
SESSION_SECRET=change-me-to-something-random
```

### 4. Push the database schema

```bash
pnpm --filter @workspace/db run push
```

### 5. Seed demo data

```bash
pnpm --filter @workspace/db run seed
```

This creates:
- **Admin account** — username: `admin`, password: `admin123`
- **Regular user** — email: `player1@panel.local`, password: `player1234`
- Sample nests, eggs, and a demo server

### 6. Start all services

Run each in a separate terminal (or use the Replit workflow runner):

```bash
# API backend
pnpm --filter @workspace/api-server run dev

# React frontend
pnpm --filter @workspace/panel run dev

# Flaps daemon (optional for local dev)
FLAPS_PORT=9000 FLAPS_DATA_DIR=/tmp/flaps-data FLAPS_TOKEN=dev-token-rhamphor \
  pnpm --filter @workspace/flaps-daemon run dev
```

### 7. Open the panel

- Panel: `http://localhost:5173` (or the port shown in Vite output)
- API: `http://localhost:8080`
- Flaps daemon: `http://localhost:9000`

Log in with `admin` / `admin123`.

---

## What You'll See

After logging in as **admin** you land on the **Dashboard** showing server count, node health, and recent activity.

Regular **users** land on **My Servers** and can only see servers assigned to them.

See the [Architecture](architecture.md) doc for how everything fits together.
