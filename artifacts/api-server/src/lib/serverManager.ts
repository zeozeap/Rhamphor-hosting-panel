import { EventEmitter } from "events";
import { db } from "@workspace/db";
import { serversTable, serverLogsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { WebSocket } from "ws";

interface ServerProcess {
  status: "starting" | "running" | "stopping" | "stopped" | "crashed";
  startedAt?: Date;
  cpuPercent: number;
  memoryUsed: number;
  playerCount: number;
  networkRx: number;
  networkTx: number;
  logBuffer: string[];
  statsInterval?: ReturnType<typeof setInterval>;
}

const processes = new Map<string, ServerProcess>();
const consoleClients = new Map<string, Set<WebSocket>>();
const emitter = new EventEmitter();

export function getProcess(serverId: string): ServerProcess | undefined {
  return processes.get(serverId);
}

export function initServer(serverId: string) {
  if (!processes.has(serverId)) {
    processes.set(serverId, {
      status: "stopped",
      cpuPercent: 0,
      memoryUsed: 0,
      playerCount: 0,
      networkRx: 0,
      networkTx: 0,
      logBuffer: [],
    });
  }
}

function broadcastLog(serverId: string, line: string) {
  const clients = consoleClients.get(serverId);
  if (!clients) return;
  const msg = JSON.stringify({ type: "log", line });
  for (const ws of clients) {
    if (ws.readyState === ws.OPEN) {
      ws.send(msg);
    }
  }
}

function broadcastStatus(serverId: string, status: string) {
  const clients = consoleClients.get(serverId);
  if (!clients) return;
  const msg = JSON.stringify({ type: "status", status });
  for (const ws of clients) {
    if (ws.readyState === ws.OPEN) {
      ws.send(msg);
    }
  }
}

async function appendLog(serverId: string, line: string) {
  const proc = processes.get(serverId);
  if (!proc) return;
  proc.logBuffer.push(line);
  if (proc.logBuffer.length > 1000) proc.logBuffer.shift();

  broadcastLog(serverId, line);

  try {
    await db.insert(serverLogsTable).values({ serverId, line });
  } catch (_e) {
  }
}

function simulateStats(serverId: string, proc: ServerProcess) {
  proc.statsInterval = setInterval(() => {
    if (proc.status === "running") {
      proc.cpuPercent = Math.random() * 40 + 5;
      proc.memoryUsed = Math.random() * 512 + 256;
      proc.networkRx = Math.random() * 50;
      proc.networkTx = Math.random() * 20;
      proc.playerCount = Math.floor(Math.random() * 5);
    }
  }, 2000);
}

export async function startServer(serverId: string, memory: number) {
  let proc = processes.get(serverId);
  if (!proc) {
    proc = { status: "stopped", cpuPercent: 0, memoryUsed: 0, playerCount: 0, networkRx: 0, networkTx: 0, logBuffer: [] };
    processes.set(serverId, proc);
  }

  if (proc.status === "running" || proc.status === "starting") return;

  proc.status = "starting";
  proc.startedAt = new Date();
  broadcastStatus(serverId, "starting");

  await db.update(serversTable).set({ status: "starting", updatedAt: new Date() }).where(eq(serversTable.id, serverId));

  await appendLog(serverId, `[${new Date().toISOString()}] [INFO] Starting Minecraft server...`);
  await appendLog(serverId, `[${new Date().toISOString()}] [INFO] Loading environment...`);

  setTimeout(async () => {
    if (!proc) return;
    proc.status = "running";
    proc.memoryUsed = memory * 0.3;
    broadcastStatus(serverId, "running");
    await db.update(serversTable).set({ status: "running", updatedAt: new Date() }).where(eq(serversTable.id, serverId));
    await appendLog(serverId, `[${new Date().toISOString()}] [INFO] Done! For help, type "help"`);
    await appendLog(serverId, `[${new Date().toISOString()}] [INFO] Starting remote control listener`);

    if (!proc.statsInterval) simulateStats(serverId, proc);

    const phrases = [
      "Preparing level \"world\"",
      "Preparing start region for dimension minecraft:overworld",
      "Time elapsed: 3842ms",
      "Done (3.842s)! For help, type \"help\"",
    ];

    for (let i = 0; i < phrases.length; i++) {
      setTimeout(() => appendLog(serverId, `[${new Date().toISOString()}] [INFO] ${phrases[i]}`), i * 300);
    }
  }, 3000);
}

export async function stopServer(serverId: string) {
  const proc = processes.get(serverId);
  if (!proc || proc.status === "stopped") return;

  proc.status = "stopping";
  broadcastStatus(serverId, "stopping");
  await db.update(serversTable).set({ status: "stopping", updatedAt: new Date() }).where(eq(serversTable.id, serverId));
  await appendLog(serverId, `[${new Date().toISOString()}] [INFO] Stopping the server...`);
  await appendLog(serverId, `[${new Date().toISOString()}] [INFO] Saving players...`);
  await appendLog(serverId, `[${new Date().toISOString()}] [INFO] Saving worlds...`);

  setTimeout(async () => {
    if (!proc) return;
    proc.status = "stopped";
    proc.cpuPercent = 0;
    proc.memoryUsed = 0;
    proc.playerCount = 0;
    if (proc.statsInterval) {
      clearInterval(proc.statsInterval);
      proc.statsInterval = undefined;
    }
    broadcastStatus(serverId, "stopped");
    await db.update(serversTable).set({ status: "stopped", updatedAt: new Date() }).where(eq(serversTable.id, serverId));
    await appendLog(serverId, `[${new Date().toISOString()}] [INFO] Server stopped.`);
  }, 2000);
}

export async function restartServer(serverId: string, memory: number) {
  await stopServer(serverId);
  setTimeout(() => startServer(serverId, memory), 3000);
}

export async function killServer(serverId: string) {
  const proc = processes.get(serverId);
  if (!proc) return;
  if (proc.statsInterval) {
    clearInterval(proc.statsInterval);
    proc.statsInterval = undefined;
  }
  proc.status = "stopped";
  proc.cpuPercent = 0;
  proc.memoryUsed = 0;
  proc.playerCount = 0;
  broadcastStatus(serverId, "stopped");
  await db.update(serversTable).set({ status: "stopped", updatedAt: new Date() }).where(eq(serversTable.id, serverId));
  await appendLog(serverId, `[${new Date().toISOString()}] [WARN] Server process killed.`);
}

export async function sendCommand(serverId: string, command: string) {
  const proc = processes.get(serverId);
  if (!proc || proc.status !== "running") return;
  await appendLog(serverId, `> ${command}`);

  if (command === "list") {
    await appendLog(serverId, `[${new Date().toISOString()}] [INFO] There are ${proc.playerCount} of a max of 20 players online: ${proc.playerCount > 0 ? "Player1" : ""}`);
  } else if (command.startsWith("say ")) {
    const msg = command.replace("say ", "");
    await appendLog(serverId, `[${new Date().toISOString()}] [INFO] [Server] ${msg}`);
  } else if (command === "stop") {
    await stopServer(serverId);
  } else {
    await appendLog(serverId, `[${new Date().toISOString()}] [INFO] Unknown or custom command: ${command}`);
  }
}

export function getLogs(serverId: string, lines = 100): string[] {
  const proc = processes.get(serverId);
  if (!proc) return [];
  return proc.logBuffer.slice(-lines);
}

export function getStats(serverId: string, diskLimit: number, memoryLimit: number) {
  const proc = processes.get(serverId);
  if (!proc) {
    return { serverId, cpuPercent: 0, memoryUsed: 0, memoryLimit, diskUsed: 0, diskLimit, networkRx: 0, networkTx: 0, uptime: 0, playerCount: 0 };
  }
  const uptime = proc.startedAt && proc.status === "running"
    ? Math.floor((Date.now() - proc.startedAt.getTime()) / 1000)
    : 0;
  return {
    serverId,
    cpuPercent: proc.cpuPercent,
    memoryUsed: proc.memoryUsed,
    memoryLimit,
    diskUsed: Math.random() * diskLimit * 0.3,
    diskLimit,
    networkRx: proc.networkRx,
    networkTx: proc.networkTx,
    uptime,
    playerCount: proc.playerCount,
  };
}

export function registerConsoleClient(serverId: string, ws: WebSocket) {
  if (!consoleClients.has(serverId)) {
    consoleClients.set(serverId, new Set());
  }
  consoleClients.get(serverId)!.add(ws);

  ws.on("close", () => {
    consoleClients.get(serverId)?.delete(ws);
  });
}

export { emitter };
