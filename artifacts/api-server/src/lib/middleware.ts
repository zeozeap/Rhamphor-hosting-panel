import type { Request, Response, NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
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
  const users = await db.select({ role: usersTable.role }).from(usersTable).where(eq(usersTable.id, req.session.userId)).limit(1);
  if (!users.length || users[0].role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
}
