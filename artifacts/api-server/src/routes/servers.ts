import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { serversTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { CreateServerBody, ServerPowerActionBody, SendServerCommandBody } from "@workspace/api-zod";
import * as serverManager from "../lib/serverManager.js";

const router: IRouter = Router();

router.get("/servers", async (_req, res) => {
  const servers = await db.select().from(serversTable).orderBy(serversTable.createdAt);
  const result = servers.map((s) => {
    const proc = serverManager.getProcess(s.id);
    return {
      ...s,
      playerCount: proc?.playerCount ?? 0,
    };
  });
  res.json(result);
});

router.post("/servers", async (req, res) => {
  const parsed = CreateServerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const id = uuidv4();
  const data = parsed.data;

  const [server] = await db.insert(serversTable).values({
    id,
    name: data.name,
    description: data.description ?? null,
    version: data.version,
    serverType: data.serverType,
    port: data.port,
    memory: data.memory,
    disk: data.disk,
    maxPlayers: data.maxPlayers ?? 20,
    javaVersion: data.javaVersion ?? "17",
    nodeId: data.nodeId,
    userId: data.userId,
    status: "stopped",
  }).returning();

  serverManager.initServer(id);

  res.status(201).json({ ...server, playerCount: 0 });
});

router.get("/servers/:id", async (req, res) => {
  const servers = await db.select().from(serversTable).where(eq(serversTable.id, req.params.id)).limit(1);
  if (!servers.length) {
    res.status(404).json({ error: "Server not found" });
    return;
  }
  const s = servers[0];
  const proc = serverManager.getProcess(s.id);
  res.json({ ...s, playerCount: proc?.playerCount ?? 0 });
});

router.delete("/servers/:id", async (req, res) => {
  const servers = await db.select().from(serversTable).where(eq(serversTable.id, req.params.id)).limit(1);
  if (!servers.length) {
    res.status(404).json({ error: "Server not found" });
    return;
  }
  await serverManager.killServer(req.params.id);
  await db.delete(serversTable).where(eq(serversTable.id, req.params.id));
  res.json({ message: "Server deleted successfully" });
});

router.post("/servers/:id/power", async (req, res) => {
  const servers = await db.select().from(serversTable).where(eq(serversTable.id, req.params.id)).limit(1);
  if (!servers.length) {
    res.status(404).json({ error: "Server not found" });
    return;
  }
  const server = servers[0];

  const parsed = ServerPowerActionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid action" });
    return;
  }

  serverManager.initServer(server.id);

  const { action } = parsed.data;
  switch (action) {
    case "start":
      serverManager.startServer(server.id, server.memory);
      break;
    case "stop":
      serverManager.stopServer(server.id);
      break;
    case "restart":
      serverManager.restartServer(server.id, server.memory);
      break;
    case "kill":
      serverManager.killServer(server.id);
      break;
  }

  res.json({ message: `Action '${action}' sent to server` });
});

router.post("/servers/:id/command", async (req, res) => {
  const servers = await db.select().from(serversTable).where(eq(serversTable.id, req.params.id)).limit(1);
  if (!servers.length) {
    res.status(404).json({ error: "Server not found" });
    return;
  }

  const parsed = SendServerCommandBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  await serverManager.sendCommand(req.params.id, parsed.data.command);
  res.json({ message: "Command sent" });
});

router.get("/servers/:id/stats", async (req, res) => {
  const servers = await db.select().from(serversTable).where(eq(serversTable.id, req.params.id)).limit(1);
  if (!servers.length) {
    res.status(404).json({ error: "Server not found" });
    return;
  }
  const server = servers[0];
  const stats = serverManager.getStats(server.id, server.disk, server.memory);
  res.json(stats);
});

router.get("/servers/:id/logs", async (req, res) => {
  const servers = await db.select().from(serversTable).where(eq(serversTable.id, req.params.id)).limit(1);
  if (!servers.length) {
    res.status(404).json({ error: "Server not found" });
    return;
  }

  const lines = req.query.lines ? Number(req.query.lines) : 100;
  const logs = serverManager.getLogs(req.params.id, lines);
  res.json({ serverId: req.params.id, logs });
});

export default router;
