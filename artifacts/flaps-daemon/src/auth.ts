import type { Request, Response, NextFunction } from "express";
import { config, log } from "./config.js";

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    log("warn", "Unauthorized request - missing token", { ip: req.ip, path: req.path });
    res.status(401).json({ success: false, error: "Authorization token required" });
    return;
  }

  const token = authHeader.slice(7);
  if (token !== config.token) {
    log("warn", "Unauthorized request - invalid token", { ip: req.ip, path: req.path });
    res.status(403).json({ success: false, error: "Invalid authorization token" });
    return;
  }

  next();
}

export function wsAuth(token: string | undefined): boolean {
  return token === config.token;
}
