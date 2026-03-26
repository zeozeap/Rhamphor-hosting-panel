export const config = {
  port: Number(process.env.FLAPS_PORT ?? 8443),
  token: process.env.FLAPS_TOKEN ?? "change-me-in-production",
  nodeId: process.env.FLAPS_NODE_ID ?? "node-local",
  panelUrl: process.env.FLAPS_PANEL_URL ?? "",
  logLevel: (process.env.FLAPS_LOG_LEVEL ?? "info") as "debug" | "info" | "warn" | "error",
  maxServers: Number(process.env.FLAPS_MAX_SERVERS ?? 50),
  dataDir: process.env.FLAPS_DATA_DIR ?? "/var/lib/flaps",
};

export function log(level: "debug" | "info" | "warn" | "error", msg: string, meta?: Record<string, unknown>) {
  const levels = { debug: 0, info: 1, warn: 2, error: 3 };
  if (levels[level] < levels[config.logLevel]) return;
  const ts = new Date().toISOString();
  const metaStr = meta ? " " + JSON.stringify(meta) : "";
  console.log(`[${ts}] [FLAPS] [${level.toUpperCase()}] ${msg}${metaStr}`);
}
