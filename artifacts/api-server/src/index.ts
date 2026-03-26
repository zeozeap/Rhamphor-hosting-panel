import http from "http";
import { WebSocketServer, type WebSocket } from "ws";
import app from "./app.js";
import { logger } from "./lib/logger.js";
import * as serverManager from "./lib/serverManager.js";
import { onActivity } from "./lib/auditLogger.js";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

const activityClients = new Set<WebSocket>();

onActivity((event) => {
  const payload = JSON.stringify({ type: "activity", event });
  for (const ws of activityClients) {
    try {
      if (ws.readyState === 1) ws.send(payload);
    } catch (_) {}
  }
});

wss.on("connection", (ws, req) => {
  const url = req.url ?? "";

  if (url === "/ws/activity") {
    activityClients.add(ws);
    ws.send(JSON.stringify({ type: "connected", message: "Real-time activity feed connected" }));
    ws.on("close", () => activityClients.delete(ws));
    return;
  }

  const match = url.match(/\/ws\/servers\/([^/]+)\/console/);
  if (!match) {
    ws.close(1008, "Invalid WebSocket path");
    return;
  }

  const serverId = match[1];
  serverManager.addClient(serverId, ws);

  const logs = serverManager.getLogs(serverId, 100);
  for (const line of logs) {
    ws.send(JSON.stringify({ type: "log", line }));
  }

  ws.on("message", async (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === "command" && msg.command) {
        await serverManager.sendCommand(serverId, msg.command);
      }
    } catch (_e) {}
  });

  ws.on("close", () => {
    serverManager.removeClient(serverId, ws);
  });
});

server.listen(port, (err?: Error) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }
  logger.info({ port }, "Server listening");
});
