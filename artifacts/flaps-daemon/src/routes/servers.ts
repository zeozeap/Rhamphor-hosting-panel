import { Router } from "express";
import * as pm from "../lib/processManager.js";
import type { ServerConfig } from "../types.js";
import { log } from "../config.js";

const router = Router();

router.get("/servers", (_req, res) => {
  const servers = pm.getAllProcesses().map((p) => ({
    id: p.id,
    name: p.config.name,
    status: p.status,
    pid: p.pid,
    cpuUsage: p.cpuUsage,
    memoryUsage: p.memoryUsage,
    playerCount: p.playerCount,
    startedAt: p.startedAt,
    stoppedAt: p.stoppedAt,
  }));
  res.json({ success: true, data: servers });
});

router.post("/servers", (req, res) => {
  const cfg = req.body as ServerConfig;
  if (!cfg.id || !cfg.name) {
    res.status(400).json({ success: false, error: "id and name are required" });
    return;
  }
  const proc = pm.initServer(cfg);
  res.status(201).json({
    success: true,
    data: { id: proc.id, name: proc.config.name, status: proc.status },
  });
});

router.get("/servers/:id", (req, res) => {
  const proc = pm.getProcess(req.params.id);
  if (!proc) {
    res.status(404).json({ success: false, error: "Server not found on this node" });
    return;
  }
  res.json({
    success: true,
    data: {
      id: proc.id,
      name: proc.config.name,
      status: proc.status,
      pid: proc.pid,
      cpuUsage: proc.cpuUsage,
      memoryUsage: proc.memoryUsage,
      playerCount: proc.playerCount,
      startedAt: proc.startedAt,
      stoppedAt: proc.stoppedAt,
      config: proc.config,
    },
  });
});

router.delete("/servers/:id", (req, res) => {
  const proc = pm.getProcess(req.params.id);
  if (!proc) {
    res.status(404).json({ success: false, error: "Server not found on this node" });
    return;
  }
  pm.removeServer(req.params.id);
  res.json({ success: true, data: { message: "Server removed from node" } });
});

router.post("/servers/:id/power", (req, res) => {
  const proc = pm.getProcess(req.params.id);
  if (!proc) {
    res.status(404).json({ success: false, error: "Server not found on this node" });
    return;
  }

  const action = req.body.action as string;
  let result = false;

  switch (action) {
    case "start":
      result = pm.startServer(req.params.id);
      break;
    case "stop":
      result = pm.stopServer(req.params.id);
      break;
    case "restart":
      result = pm.restartServer(req.params.id);
      break;
    case "kill":
      result = pm.killServer(req.params.id);
      break;
    default:
      res.status(400).json({ success: false, error: `Unknown action: ${action}` });
      return;
  }

  log("info", `Power action '${action}' on server ${req.params.id}`, { result });
  res.json({
    success: true,
    data: { action, result, status: pm.getProcess(req.params.id)?.status },
  });
});

router.post("/servers/:id/command", (req, res) => {
  const proc = pm.getProcess(req.params.id);
  if (!proc) {
    res.status(404).json({ success: false, error: "Server not found on this node" });
    return;
  }

  const { command } = req.body;
  if (!command) {
    res.status(400).json({ success: false, error: "command is required" });
    return;
  }

  const ok = pm.sendCommand(req.params.id, command);
  res.json({ success: ok, data: { sent: ok } });
});

router.get("/servers/:id/console", (req, res) => {
  const proc = pm.getProcess(req.params.id);
  if (!proc) {
    res.status(404).json({ success: false, error: "Server not found on this node" });
    return;
  }

  const lines = Number(req.query.lines ?? 200);
  res.json({ success: true, data: pm.getConsoleHistory(req.params.id, lines) });
});

router.get("/servers/:id/stats", (req, res) => {
  const proc = pm.getProcess(req.params.id);
  if (!proc) {
    res.status(404).json({ success: false, error: "Server not found on this node" });
    return;
  }

  res.json({
    success: true,
    data: {
      id: proc.id,
      status: proc.status,
      pid: proc.pid,
      ...pm.getProcessStats(req.params.id),
      playerCount: proc.playerCount,
      uptime: proc.startedAt ? Math.floor((Date.now() - proc.startedAt.getTime()) / 1000) : 0,
    },
  });
});

export default router;
