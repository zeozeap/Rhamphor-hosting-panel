import { spawn, type ChildProcess } from "child_process";
import path from "path";
import fs from "fs";
import { config, log } from "../config.js";
import type { ServerConfig, ServerProcess } from "../types.js";

const processes = new Map<string, ServerProcess>();
const MAX_CONSOLE_LINES = 1000;

function getServerDir(serverId: string): string {
  return path.join(config.dataDir, "servers", serverId);
}

function ensureServerDir(serverId: string): string {
  const dir = getServerDir(serverId);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function buildStartCommand(cfg: ServerConfig): { cmd: string; args: string[] } {
  const type = cfg.serverType?.toLowerCase() ?? "java";

  if (type === "java" || type === "minecraft" || ["paper", "spigot", "forge", "vanilla", "fabric", "purpur"].includes(type)) {
    const javaPath = cfg.javaVersion === "21" ? "java21" : cfg.javaVersion === "8" ? "java8" : "java";
    const memory = cfg.memory ?? 1024;
    const jar = "server.jar";
    return {
      cmd: javaPath,
      args: [
        `-Xms${Math.floor(memory * 0.5)}M`,
        `-Xmx${memory}M`,
        "-XX:+UseG1GC",
        "-XX:+ParallelRefProcEnabled",
        "-XX:MaxGCPauseMillis=200",
        "-XX:+UnlockExperimentalVMOptions",
        "-XX:+DisableExplicitGC",
        "-jar",
        jar,
        "--nogui",
      ],
    };
  }

  if (type === "nodejs" || type === "node" || type === "discord.js" || type === "bot") {
    return { cmd: "node", args: [cfg.startCommand ?? "index.js"] };
  }

  if (type === "python" || type === "discord.py") {
    return { cmd: "python3", args: [cfg.startCommand ?? "main.py"] };
  }

  if (type === "go") {
    return { cmd: "./server", args: [] };
  }

  const parts = (cfg.startCommand ?? "bash start.sh").split(" ");
  return { cmd: parts[0], args: parts.slice(1) };
}

export function getProcess(id: string): ServerProcess | undefined {
  return processes.get(id);
}

export function getAllProcesses(): ServerProcess[] {
  return Array.from(processes.values());
}

export function initServer(cfg: ServerConfig): ServerProcess {
  if (processes.has(cfg.id)) return processes.get(cfg.id)!;

  const proc: ServerProcess = {
    id: cfg.id,
    config: cfg,
    status: "stopped",
    cpuUsage: 0,
    memoryUsage: 0,
    playerCount: 0,
    consoleBuf: [],
    consoleListeners: new Set(),
  };

  processes.set(cfg.id, proc);
  ensureServerDir(cfg.id);
  log("debug", `Initialized server slot`, { id: cfg.id, name: cfg.name });
  return proc;
}

export function removeServer(id: string): void {
  const proc = processes.get(id);
  if (proc) {
    killServer(id);
    processes.delete(id);
  }
}

function pushLine(proc: ServerProcess, line: string): void {
  const ts = new Date().toISOString();
  const entry = `[${ts}] ${line}`;
  proc.consoleBuf.push(entry);
  if (proc.consoleBuf.length > MAX_CONSOLE_LINES) {
    proc.consoleBuf.shift();
  }
  for (const listener of proc.consoleListeners) {
    try { listener(entry); } catch {}
  }
}

export function subscribeConsole(id: string, fn: (line: string) => void): () => void {
  const proc = processes.get(id);
  if (!proc) return () => {};
  proc.consoleListeners.add(fn);
  return () => proc.consoleListeners.delete(fn);
}

export function getConsoleHistory(id: string, lines = 100): string[] {
  const proc = processes.get(id);
  if (!proc) return [];
  return proc.consoleBuf.slice(-lines);
}

export function startServer(id: string): boolean {
  const proc = processes.get(id);
  if (!proc) return false;
  if (proc.status === "running" || proc.status === "starting") return false;

  const dir = ensureServerDir(id);
  const { cmd, args } = buildStartCommand(proc.config);

  proc.status = "starting";
  proc.startedAt = new Date();
  proc.consoleBuf = [];
  pushLine(proc, `[Flaps] Starting server '${proc.config.name}' with: ${cmd} ${args.join(" ")}`);

  let child: ChildProcess;
  try {
    child = spawn(cmd, args, {
      cwd: dir,
      env: { ...process.env, ...proc.config.environment },
      stdio: ["pipe", "pipe", "pipe"],
    });
  } catch (err: any) {
    proc.status = "crashed";
    pushLine(proc, `[Flaps] Failed to start: ${err.message}`);
    log("error", "Failed to spawn process", { id, error: err.message });
    return false;
  }

  proc.pid = child.pid;
  proc.status = "running";

  child.stdout?.on("data", (data: Buffer) => {
    const lines = data.toString().split(/\r?\n/).filter(Boolean);
    for (const line of lines) {
      pushLine(proc, line);
      if (line.includes("players online")) {
        const match = line.match(/There are (\d+)/);
        if (match) proc.playerCount = parseInt(match[1]);
      }
      if (line.includes("joined the game")) proc.playerCount++;
      if (line.includes("left the game")) proc.playerCount = Math.max(0, proc.playerCount - 1);
    }
  });

  child.stderr?.on("data", (data: Buffer) => {
    const lines = data.toString().split(/\r?\n/).filter(Boolean);
    for (const line of lines) pushLine(proc, `[ERR] ${line}`);
  });

  child.on("exit", (code, signal) => {
    proc.pid = undefined;
    proc.stoppedAt = new Date();
    proc.playerCount = 0;
    proc.cpuUsage = 0;
    proc.memoryUsage = 0;
    if (proc.status !== "stopping") {
      proc.status = "crashed";
      pushLine(proc, `[Flaps] Process exited unexpectedly (code=${code}, signal=${signal})`);
      log("warn", "Server crashed", { id, code, signal });
    } else {
      proc.status = "stopped";
      pushLine(proc, `[Flaps] Server stopped gracefully`);
    }
  });

  child.on("error", (err) => {
    proc.status = "crashed";
    pushLine(proc, `[Flaps] Process error: ${err.message}`);
    log("error", "Process error", { id, error: err.message });
  });

  (proc as any)._child = child;

  log("info", "Server started", { id, name: proc.config.name, pid: proc.pid });
  pushLine(proc, `[Flaps] Server started with PID ${proc.pid}`);
  return true;
}

export function stopServer(id: string): boolean {
  const proc = processes.get(id);
  if (!proc || proc.status === "stopped") return false;

  const child: ChildProcess | undefined = (proc as any)._child;
  proc.status = "stopping";
  pushLine(proc, "[Flaps] Sending stop signal...");

  if (child && child.stdin) {
    child.stdin.write("stop\n");
  }

  setTimeout(() => {
    if (proc.status === "stopping" && child) {
      pushLine(proc, "[Flaps] Graceful stop timed out — sending SIGTERM");
      child.kill("SIGTERM");
    }
  }, 15000);

  return true;
}

export function killServer(id: string): boolean {
  const proc = processes.get(id);
  if (!proc) return false;

  const child: ChildProcess | undefined = (proc as any)._child;
  proc.status = "stopping";
  pushLine(proc, "[Flaps] Force killing process...");

  if (child) {
    child.kill("SIGKILL");
  }

  proc.status = "stopped";
  proc.pid = undefined;
  proc.playerCount = 0;
  proc.cpuUsage = 0;
  proc.memoryUsage = 0;
  return true;
}

export function restartServer(id: string): boolean {
  const proc = processes.get(id);
  if (!proc) return false;

  pushLine(proc, "[Flaps] Restarting server...");

  if (proc.status === "running") {
    stopServer(id);
    const wait = () => {
      setTimeout(() => {
        if (proc.status === "stopped" || proc.status === "crashed") {
          startServer(id);
        } else {
          wait();
        }
      }, 500);
    };
    wait();
  } else {
    startServer(id);
  }

  return true;
}

export function sendCommand(id: string, command: string): boolean {
  const proc = processes.get(id);
  if (!proc || proc.status !== "running") return false;

  const child: ChildProcess | undefined = (proc as any)._child;
  if (child?.stdin) {
    child.stdin.write(command + "\n");
    pushLine(proc, `> ${command}`);
    return true;
  }
  return false;
}

export function getProcessStats(id: string): { cpu: number; memory: number; pid?: number } {
  const proc = processes.get(id);
  if (!proc) return { cpu: 0, memory: 0 };
  return {
    cpu: proc.cpuUsage,
    memory: proc.memoryUsage,
    pid: proc.pid,
  };
}
