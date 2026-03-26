import { Router } from "express";
import { getSystemStats } from "../lib/systemInfo.js";
import { config } from "../config.js";
import { getAllProcesses } from "../lib/processManager.js";

const router = Router();

router.get("/health", async (_req, res) => {
  const stats = await getSystemStats();
  res.json({
    success: true,
    data: {
      status: "online",
      nodeId: config.nodeId,
      version: "1.0.0",
      daemon: "Flaps",
      panel: "Rhamphor",
      uptime: stats.uptime,
      cpu: stats.cpu.usage,
      memory: stats.memory.usedPercent,
    },
  });
});

router.get("/stats", async (_req, res) => {
  const stats = await getSystemStats();
  const procs = getAllProcesses();

  const serverStats = procs.map((p) => ({
    id: p.id,
    name: p.config.name,
    status: p.status,
    pid: p.pid,
    cpu: p.cpuUsage,
    memory: p.memoryUsage,
    playerCount: p.playerCount,
  }));

  res.json({
    success: true,
    data: {
      ...stats,
      nodeId: config.nodeId,
      servers: serverStats,
      serverCount: procs.length,
      runningCount: procs.filter((p) => p.status === "running").length,
    },
  });
});

router.get("/version", (_req, res) => {
  res.json({
    success: true,
    data: {
      daemon: "Flaps",
      version: "1.0.0",
      panel: "Rhamphor",
      node: process.version,
      platform: process.platform,
      arch: process.arch,
    },
  });
});

export default router;
