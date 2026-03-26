import { Router } from "express";
import { db, auditLogs } from "@workspace/db";
import { desc, and, gte, eq, like, or } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../lib/middleware.js";

const router = Router();

router.get("/audit", requireAuth, requireAdmin, async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const page = Math.max(Number(req.query.page) || 1, 1);
  const offset = (page - 1) * limit;
  const action = req.query.action as string | undefined;
  const resourceType = req.query.resourceType as string | undefined;
  const userId = req.query.userId as string | undefined;

  const conditions = [];
  if (action) conditions.push(like(auditLogs.action, `%${action}%`));
  if (resourceType) conditions.push(eq(auditLogs.resourceType, resourceType));
  if (userId) conditions.push(eq(auditLogs.userId, userId));

  const query = conditions.length > 0
    ? db.select().from(auditLogs).where(and(...conditions))
    : db.select().from(auditLogs);

  const rows = await query.orderBy(desc(auditLogs.createdAt)).limit(limit).offset(offset);

  res.json({ logs: rows, page, limit });
});

export default router;
