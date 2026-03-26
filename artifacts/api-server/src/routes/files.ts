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

router.delete("/servers/:id/files", requireAuth, requireServerAccess, async (req, res) => {
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

router.post("/servers/:id/files/mkdir", requireAuth, requireServerAccess, async (req, res) => {
  const servers = await db.select().from(serversTable).where(eq(serversTable.id, req.params.id)).limit(1);
  if (!servers.length) { res.status(404).json({ error: "Server not found" }); return; }
  const server = servers[0];
  serverManager.initFileSystem(server.id, server.serverType);

  const { path: dirPath } = req.body;
  if (!dirPath) { res.status(400).json({ error: "path required" }); return; }

  const entry = serverManager.createDirectory(server.id, dirPath);
  res.json(entry);
});

router.post("/servers/:id/files/touch", requireAuth, requireServerAccess, async (req, res) => {
  const servers = await db.select().from(serversTable).where(eq(serversTable.id, req.params.id)).limit(1);
  if (!servers.length) { res.status(404).json({ error: "Server not found" }); return; }
  const server = servers[0];
  serverManager.initFileSystem(server.id, server.serverType);

  const { path: filePath } = req.body;
  if (!filePath) { res.status(400).json({ error: "path required" }); return; }

  const result = serverManager.createFile(server.id, filePath);
  if (result === "exists") { res.status(409).json({ error: "A file already exists at that path" }); return; }
  res.json(result);
});

router.post("/servers/:id/files/rename", requireAuth, requireServerAccess, async (req, res) => {
  const servers = await db.select().from(serversTable).where(eq(serversTable.id, req.params.id)).limit(1);
  if (!servers.length) { res.status(404).json({ error: "Server not found" }); return; }
  const server = servers[0];
  serverManager.initFileSystem(server.id, server.serverType);

  const { path: oldPath, newName } = req.body;
  if (!oldPath || !newName) { res.status(400).json({ error: "path and newName required" }); return; }

  const result = serverManager.renameFilePath(server.id, oldPath, newName);
  if (result === null) { res.status(404).json({ error: "File not found" }); return; }
  if (result === "exists") { res.status(409).json({ error: "A file or folder with that name already exists" }); return; }

  res.json(result);
});

router.post("/servers/:id/files/move", requireAuth, requireServerAccess, async (req, res) => {
  const servers = await db.select().from(serversTable).where(eq(serversTable.id, req.params.id)).limit(1);
  if (!servers.length) { res.status(404).json({ error: "Server not found" }); return; }
  const server = servers[0];
  serverManager.initFileSystem(server.id, server.serverType);

  const { source, destination } = req.body;
  if (!source || !destination) { res.status(400).json({ error: "source and destination required" }); return; }

  const result = serverManager.moveFilePath(server.id, source, destination);
  if (result === null) { res.status(404).json({ error: "Source file not found" }); return; }
  if (result === "same") { res.status(400).json({ error: "Source and destination are the same" }); return; }
  if (result === "subtree") { res.status(400).json({ error: "Cannot move a directory into itself" }); return; }
  if (result === "exists") { res.status(409).json({ error: "A file or folder already exists at the destination" }); return; }

  res.json(result);
});

router.post("/servers/:id/files/copy", requireAuth, requireServerAccess, async (req, res) => {
  const servers = await db.select().from(serversTable).where(eq(serversTable.id, req.params.id)).limit(1);
  if (!servers.length) { res.status(404).json({ error: "Server not found" }); return; }
  const server = servers[0];
  serverManager.initFileSystem(server.id, server.serverType);

  const { source, destination } = req.body;
  if (!source || !destination) { res.status(400).json({ error: "source and destination required" }); return; }

  const result = serverManager.copyFilePath(server.id, source, destination);
  if (result === null) { res.status(404).json({ error: "Source file not found" }); return; }
  if (result === "same") { res.status(400).json({ error: "Source and destination are the same" }); return; }
  if (result === "subtree") { res.status(400).json({ error: "Cannot copy a directory into itself" }); return; }
  if (result === "exists") { res.status(409).json({ error: "A file or folder already exists at the destination" }); return; }

  res.json(result);
});

router.post("/servers/:id/files/compress", requireAuth, requireServerAccess, async (req, res) => {
  const servers = await db.select().from(serversTable).where(eq(serversTable.id, req.params.id)).limit(1);
  if (!servers.length) { res.status(404).json({ error: "Server not found" }); return; }
  const server = servers[0];
  serverManager.initFileSystem(server.id, server.serverType);

  const { path: sourcePath, destination } = req.body;
  if (!sourcePath) { res.status(400).json({ error: "path required" }); return; }

  const parentDir = sourcePath.substring(0, sourcePath.lastIndexOf("/")) || "/";
  const baseName = sourcePath.split("/").filter(Boolean).pop() ?? "archive";
  const destZipPath = destination || (parentDir === "/" ? `/${baseName}.zip` : `${parentDir}/${baseName}.zip`);

  const result = serverManager.compressPath(server.id, sourcePath, destZipPath);
  if (result === null) { res.status(404).json({ error: "Source not found" }); return; }
  if (result === "exists") { res.status(409).json({ error: "A file already exists at the destination" }); return; }

  res.json(result);
});

router.post("/servers/:id/files/extract", requireAuth, requireServerAccess, async (req, res) => {
  const servers = await db.select().from(serversTable).where(eq(serversTable.id, req.params.id)).limit(1);
  if (!servers.length) { res.status(404).json({ error: "Server not found" }); return; }
  const server = servers[0];
  serverManager.initFileSystem(server.id, server.serverType);

  const { path: zipPath, destination } = req.body;
  if (!zipPath) { res.status(400).json({ error: "path required" }); return; }
  if (!/\.zip$/i.test(zipPath)) { res.status(400).json({ error: "Only .zip files can be extracted" }); return; }

  const parentDir = zipPath.substring(0, zipPath.lastIndexOf("/")) || "/";
  const baseName = zipPath.split("/").filter(Boolean).pop()?.replace(/\.zip$/i, "") ?? "extracted";
  const destDirPath = destination || (parentDir === "/" ? `/${baseName}` : `${parentDir}/${baseName}`);

  const result = serverManager.extractZip(server.id, zipPath, destDirPath);
  if (result === null) { res.status(404).json({ error: "Zip file not found" }); return; }
  if (result === "exists") { res.status(409).json({ error: "A folder already exists at the destination" }); return; }

  res.json(result);
});

export default router;
