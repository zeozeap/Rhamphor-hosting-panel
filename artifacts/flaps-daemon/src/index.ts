import express from "express";
import cors from "cors";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import { URL } from "url";
import { config, log } from "./config.js";
import { authMiddleware, wsAuth } from "./auth.js";
import serverRoutes from "./routes/servers.js";
import fileRoutes from "./routes/files.js";
import systemRoutes from "./routes/system.js";
import { subscribeConsole, getConsoleHistory, getProcess } from "./lib/processManager.js";
import { getSystemStats } from "./lib/systemInfo.js";

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"] }));
app.use(express.json({ limit: "10mb" }));

app.get("/", (_req, res) => {
  res.json({
    daemon: "Flaps",
    panel: "Rhamphor",
    version: "1.0.0",
    status: "online",
    docs: "https://github.com/rhamphor/flaps",
  });
});

app.use("/api", systemRoutes);
app.use("/api", authMiddleware, serverRoutes);
app.use("/api", authMiddleware, fileRoutes);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  log("error", "Unhandled error", { error: err.message, stack: err.stack });
  res.status(500).json({ success: false, error: "Internal server error" });
});

const wss = new WebSocketServer({ server, path: "/ws" });

wss.on("connection", (ws: WebSocket, req) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
  const token = url.searchParams.get("token") ?? undefined;
  const serverId = url.searchParams.get("server") ?? undefined;
  const type = url.searchParams.get("type") ?? "console";

  if (!wsAuth(token)) {
    ws.close(4001, "Unauthorized");
    log("warn", "WS rejected - invalid token", { ip: req.socket.remoteAddress });
    return;
  }

  log("debug", "WS client connected", { type, serverId, ip: req.socket.remoteAddress });

  if (type === "console" && serverId) {
    const proc = getProcess(serverId);
    if (!proc) {
      ws.send(JSON.stringify({ type: "error", message: "Server not found on this node" }));
      ws.close(4004, "Server not found");
      return;
    }

    const history = getConsoleHistory(serverId, 100);
    for (const line of history) {
      ws.send(JSON.stringify({ type: "history", data: line }));
    }

    const unsub = subscribeConsole(serverId, (line) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "line", data: line }));
      }
    });

    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === "command" && msg.data) {
          const { sendCommand } = require("./lib/processManager.js");
          sendCommand(serverId, msg.data);
        }
      } catch {}
    });

    ws.on("close", () => {
      unsub();
      log("debug", "WS console client disconnected", { serverId });
    });
    return;
  }

  if (type === "stats") {
    const interval = setInterval(async () => {
      if (ws.readyState !== WebSocket.OPEN) {
        clearInterval(interval);
        return;
      }
      try {
        const stats = await getSystemStats();
        ws.send(JSON.stringify({ type: "stats", data: stats }));
      } catch {}
    }, 2000);

    ws.on("close", () => {
      clearInterval(interval);
      log("debug", "WS stats client disconnected");
    });
    return;
  }

  ws.close(4000, "Unknown connection type");
});

server.listen(config.port, "0.0.0.0", () => {
  log("info", `Flaps daemon started`, {
    port: config.port,
    nodeId: config.nodeId,
    dataDir: config.dataDir,
    panel: "Rhamphor",
  });
  log("info", "WebSocket console streaming active at /ws?type=console&server=<id>&token=<token>");
  log("info", "WebSocket stats streaming active at /ws?type=stats&token=<token>");
  log("info", "REST API available at /api/...");
});

process.on("SIGTERM", () => {
  log("info", "Received SIGTERM, shutting down gracefully...");
  server.close(() => {
    log("info", "Flaps daemon stopped");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  log("info", "Received SIGINT, shutting down...");
  server.close(() => process.exit(0));
});

process.on("uncaughtException", (err) => {
  log("error", "Uncaught exception", { error: err.message, stack: err.stack });
});
