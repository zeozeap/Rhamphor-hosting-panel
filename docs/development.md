# Development Guide

## Monorepo Commands

This project uses pnpm workspaces. All packages are under `artifacts/` and `lib/`.

```bash
# Install all dependencies
pnpm install

# Run a specific package's script
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/panel run dev
pnpm --filter @workspace/flaps-daemon run dev

# Run all dev servers at once (if configured)
pnpm run dev
```

### Package names

| Directory | Package name |
|-----------|-------------|
| `artifacts/api-server` | `@workspace/api-server` |
| `artifacts/panel` | `@workspace/panel` |
| `artifacts/flaps-daemon` | `@workspace/flaps-daemon` |
| `lib/db` | `@workspace/db` |
| `lib/api-client-react` | `@workspace/api-client-react` |

---

## Database

### Making schema changes

1. Edit `lib/db/schema.ts`
2. Push the schema to the database:

```bash
pnpm --filter @workspace/db run push
```

3. If you added columns used by the API, update the relevant route in `artifacts/api-server/src/routes/`.

### Seeding

```bash
pnpm --filter @workspace/db run seed
```

Creates demo users, nests, eggs, nodes, and servers. Re-running the seed is idempotent for most records.

### Migrations

Drizzle generates migrations when you run:

```bash
pnpm --filter @workspace/db run generate
```

Migrations live in `lib/db/migrations/`.

---

## Adding an API Route

1. Create `artifacts/api-server/src/routes/myfeature.ts`:

```typescript
import { Router } from 'express';
import { requireAuth, requireAdmin } from '../lib/middleware';

const router = Router();

router.get('/', requireAuth, requireAdmin, async (req, res) => {
  res.json({ ok: true });
});

export default router;
```

2. Register it in `artifacts/api-server/src/routes/index.ts`:

```typescript
import myFeature from './myfeature';
app.use('/api/myfeature', myFeature);
```

3. Add the corresponding API client function in `lib/api-client-react/src/` if the frontend needs it.

---

## Adding a Panel Page

1. Create `artifacts/panel/src/pages/MyPage.tsx`
2. Add the route in `artifacts/panel/src/App.tsx`:

```tsx
// Inside the router, protected routes section:
<Route path="/my-page" component={() => (
  <AdminRoute>   {/* or ProtectedRoute for all users */}
    <MyPage />
  </AdminRoute>
)} />
```

3. Add a sidebar link in `artifacts/panel/src/components/layout/Sidebar.tsx`

---

## Flaps Development

The Flaps daemon runs in dev mode with hot reload via `tsx watch`:

```bash
FLAPS_PORT=9000 FLAPS_DATA_DIR=/tmp/flaps-data FLAPS_TOKEN=dev-token-rhamphor \
  pnpm --filter @workspace/flaps-daemon run dev
```

Default dev values:
- Port: `9000`
- Token: `dev-token-rhamphor`
- Data dir: `/tmp/flaps-data`

To add a new Flaps route:

1. Create or edit files in `artifacts/flaps-daemon/src/routes/`
2. Register the router in `artifacts/flaps-daemon/src/index.ts`

---

## Environment Variables in Dev

Copy `.env.example` to `.env` and fill in values. The API server reads from `process.env` at startup.

For Flaps, pass env vars directly in the workflow/start command — there's no `.env` file for the daemon in development.

---

## Code Style

- TypeScript strict mode enabled on all packages
- ESLint + Prettier configured at the root
- Tailwind CSS for all frontend styling — avoid inline styles
- shadcn/ui components for all UI elements
- All async route handlers should use try/catch and return appropriate HTTP status codes
- Use Drizzle ORM for all database access — never raw SQL strings

---

## Testing

Use the built-in Playwright-based testing tool to run end-to-end tests after implementing features. Test plans should cover:

- Authentication flows (login/logout, role-based redirects)
- Server power controls
- File manager operations (create, rename, delete, move, compress, extract)
- Settings persistence
- Activity log streaming
