import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { serversTable, serverPluginsTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { requireAuth, requireServerAccess } from "../lib/middleware.js";

const router: IRouter = Router();

const POPULAR_PLUGINS: Record<string, { description: string; author: string; latestVersion: string }> = {
  "EssentialsX": { description: "Essential commands for Spigot/Paper servers", author: "EssentialsX Team", latestVersion: "2.20.1" },
  "WorldGuard": { description: "Protect your worlds and regions", author: "sk89q", latestVersion: "7.0.11" },
  "WorldEdit": { description: "In-game map editor for Minecraft", author: "sk89q", latestVersion: "7.3.4" },
  "LuckPerms": { description: "A permissions plugin for Minecraft servers", author: "Luck", latestVersion: "5.4.131" },
  "Vault": { description: "Economy & Permissions API", author: "MilkBowl", latestVersion: "1.7.3" },
  "ProtocolLib": { description: "Protocol library for Bukkit plugins", author: "dmulloy2", latestVersion: "5.1.0" },
  "ViaVersion": { description: "Allow newer clients to connect to older server versions", author: "ViaVersion", latestVersion: "4.9.2" },
  "CoreProtect": { description: "Fast, efficient block logging with rollback support", author: "Intelli", latestVersion: "22.4" },
  "GriefPrevention": { description: "Stop griefing in its tracks!", author: "BigScary", latestVersion: "16.18.2" },
  "PlaceholderAPI": { description: "A plugin to create custom placeholder variables", author: "extended_clip", latestVersion: "2.11.5" },
  "Citizens": { description: "The original Minecraft NPC plugin", author: "fullwall", latestVersion: "2.0.33" },
  "DiscordSRV": { description: "Discord-Minecraft link plugin", author: "scarsz", latestVersion: "1.27.0" },
};

router.get("/servers/:id/plugins", requireAuth, requireServerAccess, async (req, res) => {
  const servers = await db.select().from(serversTable).where(eq(serversTable.id, req.params.id)).limit(1);
  if (!servers.length) { res.status(404).json({ error: "Server not found" }); return; }

  const plugins = await db.select().from(serverPluginsTable).where(eq(serverPluginsTable.serverId, req.params.id));
  res.json(plugins);
});

router.post("/servers/:id/plugins", requireAuth, requireServerAccess, async (req, res) => {
  const servers = await db.select().from(serversTable).where(eq(serversTable.id, req.params.id)).limit(1);
  if (!servers.length) { res.status(404).json({ error: "Server not found" }); return; }

  const { name, version } = req.body;
  if (!name) { res.status(400).json({ error: "name is required" }); return; }

  const meta = POPULAR_PLUGINS[name];
  const resolvedVersion = version || meta?.latestVersion || "1.0.0";
  const filename = `${name}-${resolvedVersion}.jar`;
  const fileSize = Math.floor(Math.random() * 2000000) + 100000;

  const [plugin] = await db.insert(serverPluginsTable).values({
    id: uuidv4(),
    serverId: req.params.id,
    name,
    version: resolvedVersion,
    description: meta?.description ?? null,
    author: meta?.author ?? null,
    filename,
    fileSize,
    enabled: true,
  }).returning();

  res.status(201).json(plugin);
});

router.patch("/servers/:id/plugins/:pluginId", requireAuth, requireServerAccess, async (req, res) => {
  const servers = await db.select().from(serversTable).where(eq(serversTable.id, req.params.id)).limit(1);
  if (!servers.length) { res.status(404).json({ error: "Server not found" }); return; }

  const { enabled } = req.body;
  if (typeof enabled !== "boolean") { res.status(400).json({ error: "enabled (boolean) is required" }); return; }

  const [plugin] = await db
    .update(serverPluginsTable)
    .set({ enabled })
    .where(and(eq(serverPluginsTable.id, req.params.pluginId), eq(serverPluginsTable.serverId, req.params.id)))
    .returning();

  if (!plugin) { res.status(404).json({ error: "Plugin not found" }); return; }
  res.json(plugin);
});

router.delete("/servers/:id/plugins/:pluginId", requireAuth, requireServerAccess, async (req, res) => {
  const servers = await db.select().from(serversTable).where(eq(serversTable.id, req.params.id)).limit(1);
  if (!servers.length) { res.status(404).json({ error: "Server not found" }); return; }

  const plugins = await db.select().from(serverPluginsTable)
    .where(and(eq(serverPluginsTable.id, req.params.pluginId), eq(serverPluginsTable.serverId, req.params.id)))
    .limit(1);
  if (!plugins.length) { res.status(404).json({ error: "Plugin not found" }); return; }

  await db.delete(serverPluginsTable)
    .where(and(eq(serverPluginsTable.id, req.params.pluginId), eq(serverPluginsTable.serverId, req.params.id)));

  res.json({ message: "Plugin removed successfully" });
});

export default router;
