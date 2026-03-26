import type { Request, Response, NextFunction } from "express";
import { db, usersTable, serversTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const rows = await db.select({ role: usersTable.role }).from(usersTable).where(eq(usersTable.id, req.session.userId)).limit(1);
  if (!rows.length || rows[0].role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
}

export async function getUserRole(userId: string): Promise<"admin" | "user" | null> {
  const rows = await db.select({ role: usersTable.role }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!rows.length) return null;
  return rows[0].role as "admin" | "user";
}

export async function requireServerAccess(req: Request, res: Response, next: NextFunction): Promise<void> {
  const userId = req.session.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const role = await getUserRole(userId);
  if (!role) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  if (role === "admin") {
    next();
    return;
  }
  const serverId = req.params.id;
  if (!serverId) {
    next();
    return;
  }
  const servers = await db.select({ userId: serversTable.userId }).from(serversTable).where(eq(serversTable.id, serverId)).limit(1);
  if (!servers.length) {
    res.status(404).json({ error: "Server not found" });
    return;
  }
  if (servers[0].userId !== userId) {
    res.status(403).json({ error: "You do not have access to this server" });
    return;
  }
  next();
}
