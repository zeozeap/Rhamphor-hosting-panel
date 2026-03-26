import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { serversTable, subdomainsTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

const router: IRouter = Router();

router.get("/servers/:id/subdomains", async (req, res) => {
  const servers = await db.select().from(serversTable).where(eq(serversTable.id, req.params.id)).limit(1);
  if (!servers.length) { res.status(404).json({ error: "Server not found" }); return; }

  const subdomains = await db.select().from(subdomainsTable).where(eq(subdomainsTable.serverId, req.params.id));
  res.json(subdomains);
});

router.post("/servers/:id/subdomains", async (req, res) => {
  const servers = await db.select().from(serversTable).where(eq(serversTable.id, req.params.id)).limit(1);
  if (!servers.length) { res.status(404).json({ error: "Server not found" }); return; }
  const server = servers[0];

  const { subdomain } = req.body;
  if (!subdomain) { res.status(400).json({ error: "subdomain is required" }); return; }

  const cleanSub = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/^-+|-+$/g, "");
  if (!cleanSub || cleanSub.length < 3) {
    res.status(400).json({ error: "Subdomain must be at least 3 characters (letters, numbers, hyphens)" });
    return;
  }

  const existing = await db.select().from(subdomainsTable).where(eq(subdomainsTable.subdomain, cleanSub)).limit(1);
  if (existing.length) {
    res.status(409).json({ error: "Subdomain already taken" });
    return;
  }

  const [sub] = await db.insert(subdomainsTable).values({
    id: uuidv4(),
    serverId: req.params.id,
    subdomain: cleanSub,
    targetPort: String(server.port),
  }).returning();

  res.status(201).json(sub);
});

router.delete("/servers/:id/subdomains/:subId", async (req, res) => {
  const servers = await db.select().from(serversTable).where(eq(serversTable.id, req.params.id)).limit(1);
  if (!servers.length) { res.status(404).json({ error: "Server not found" }); return; }

  const subs = await db.select().from(subdomainsTable)
    .where(and(eq(subdomainsTable.id, req.params.subId), eq(subdomainsTable.serverId, req.params.id)))
    .limit(1);
  if (!subs.length) { res.status(404).json({ error: "Subdomain not found" }); return; }

  await db.delete(subdomainsTable)
    .where(and(eq(subdomainsTable.id, req.params.subId), eq(subdomainsTable.serverId, req.params.id)));

  res.json({ message: "Subdomain removed successfully" });
});

export default router;
