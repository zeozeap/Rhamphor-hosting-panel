import si from "systeminformation";
import type { SystemStats } from "../types.js";
import { log } from "../config.js";

let cachedStats: SystemStats | null = null;
let lastFetch = 0;
const CACHE_TTL = 2000;

export async function getSystemStats(): Promise<SystemStats> {
  const now = Date.now();
  if (cachedStats && now - lastFetch < CACHE_TTL) return cachedStats;

  try {
    const [cpu, mem, disk, net, load] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.fsSize(),
      si.networkStats(),
      si.currentLoad(),
    ]);

    const cpuInfo = await si.cpu();
    const diskMain = disk[0] ?? { size: 0, used: 0, available: 0 };
    const netMain = net[0] ?? { rx_bytes: 0, tx_bytes: 0 };

    cachedStats = {
      cpu: {
        usage: Math.round(cpu.currentLoad * 10) / 10,
        cores: cpuInfo.physicalCores ?? 1,
        model: cpuInfo.brand ?? "Unknown",
        speed: cpuInfo.speed ?? 0,
      },
      memory: {
        total: mem.total,
        used: mem.active,
        free: mem.available,
        usedPercent: Math.round((mem.active / mem.total) * 100 * 10) / 10,
      },
      disk: {
        total: diskMain.size,
        used: diskMain.used,
        free: diskMain.available,
        usedPercent: Math.round((diskMain.used / diskMain.size) * 100 * 10) / 10,
      },
      network: {
        rx: netMain.rx_bytes ?? 0,
        tx: netMain.tx_bytes ?? 0,
      },
      uptime: Math.floor(process.uptime()),
      loadAvg: load.avgLoad !== undefined ? [load.avgLoad, load.avgLoad, load.avgLoad] : [0, 0, 0],
    };

    lastFetch = now;
    return cachedStats;
  } catch (err: any) {
    log("warn", "Failed to get system stats", { error: err.message });
    return {
      cpu: { usage: 0, cores: 1, model: "Unknown", speed: 0 },
      memory: { total: 0, used: 0, free: 0, usedPercent: 0 },
      disk: { total: 0, used: 0, free: 0, usedPercent: 0 },
      network: { rx: 0, tx: 0 },
      uptime: Math.floor(process.uptime()),
      loadAvg: [0, 0, 0],
    };
  }
}
