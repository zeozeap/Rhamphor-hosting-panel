import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { serversTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import * as serverManager from "../lib/serverManager.js";
import { requireAuth, requireServerAccess } from "../lib/middleware.js";

const router: IRouter = Router();

router.get("/servers/:id/files", requireAuth, requireServerAccess, async (req, res) => {
  const servers = await db.select().from(serversTable).where(eq(serversTable.id, req.params.id)).limit(1);
  if (!servers.length) { res.status(404).json({ error: "Server not found" }); return; }
  const server = servers[0];
  serverManager.initFileSystem(server.id, server.serverType);

  const dirPath = (req.query.path as string) || "/";
  const entries = serverManager.listFiles(server.id, dirPath);
  res.json({ path: dirPath, entries });
});

router.get("/servers/:id/files/read", requireAuth, requireServerAccess, async (req, res) => {
  const servers = await db.select().from(serversTable).where(eq(serversTable.id, req.params.id)).limit(1);
  if (!servers.length) { res.status(404).json({ error: "Server not found" }); return; }
  const server = servers[0];
  serverManager.initFileSystem(server.id, server.serverType);

  const filePath = req.query.path as string;
  if (!filePath) { res.status(400).json({ error: "path query parameter required" }); return; }

  const entry = serverManager.readFile(server.id, filePath);
  if (!entry) { res.status(404).json({ error: "File not found" }); return; }
  if (entry.isDir) { res.status(400).json({ error: "Path is a directory" }); return; }

  res.json({ path: filePath, content: entry.content ?? "", size: entry.size, updatedAt: entry.updatedAt });
});

router.put("/servers/:id/files/write", requireAuth, requireServerAccess, async (req, res) => {
  const servers = await db.select().from(serversTable).where(eq(serversTable.id, req.params.id)).limit(1);
  if (!servers.length) { res.status(404).json({ error: "Server not found" }); return; }
  const server = servers[0];
  serverManager.initFileSystem(server.id, server.serverType);

  const filePath = req.query.path as string;
  if (!filePath) { res.status(400).json({ error: "path query parameter required" }); return; }

  const { content } = req.body;
  if (typeof content !== "string") { res.status(400).json({ error: "content must be a string" }); return; }

  const entry = serverManager.writeFile(server.id, filePath, content);
  res.json({ path: filePath, size: entry.size, updatedAt: entry.updatedAt, message: "File saved successfully" });
});

router.delete("/servers/:id/files", async (req, res) => {
  const servers = await db.select().from(serversTable).where(eq(serversTable.id, req.params.id)).limit(1);
  if (!servers.length) { res.status(404).json({ error: "Server not found" }); return; }
  const server = servers[0];
  serverManager.initFileSystem(server.id, server.serverType);

  const filePath = req.query.path as string;
  if (!filePath) { res.status(400).json({ error: "path query parameter required" }); return; }

  const deleted = serverManager.deleteFilePath(server.id, filePath);
  if (!deleted) { res.status(404).json({ error: "File not found" }); return; }

  res.json({ message: "File deleted successfully" });
});

router.post("/servers/:id/files/mkdir", async (req, res) => {
  const servers = await db.select().from(serversTable).where(eq(serversTable.id, req.params.id)).limit(1);
  if (!servers.length) { res.status(404).json({ error: "Server not found" }); return; }
  const server = servers[0];
  serverManager.initFileSystem(server.id, server.serverType);

  const { path: dirPath } = req.body;
  if (!dirPath) { res.status(400).json({ error: "path required" }); return; }

  const entry = serverManager.createDirectory(server.id, dirPath);
  res.json(entry);
});

export default router;
