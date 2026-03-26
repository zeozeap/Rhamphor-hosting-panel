import { db, auditLogs } from "@workspace/db";
import type { Request } from "express";

export interface AuditEvent {
  userId?: string | null;
  username?: string | null;
  action: string;
  resourceType?: string;
  resourceId?: string;
  resourceName?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  level?: "info" | "warn" | "error";
}

const activityListeners = new Set<(event: object) => void>();

export function onActivity(fn: (event: object) => void) {
  activityListeners.add(fn);
  return () => activityListeners.delete(fn);
}

function broadcast(event: object) {
  for (const fn of activityListeners) {
    try { fn(event); } catch (_) {}
  }
}

export async function logAudit(event: AuditEvent): Promise<void> {
  try {
    const [row] = await db.insert(auditLogs).values({
      userId: event.userId ?? null,
      username: event.username ?? null,
      action: event.action,
      resourceType: event.resourceType ?? null,
      resourceId: event.resourceId ?? null,
      resourceName: event.resourceName ?? null,
      metadata: JSON.stringify(event.metadata ?? {}),
      ip: event.ip ?? null,
      level: event.level ?? "info",
    }).returning();
    broadcast({ ...row, metadata: event.metadata ?? {} });
  } catch (_) {}
}

export function auditFromReq(req: Request, event: Omit<AuditEvent, "userId" | "username" | "ip">) {
  const sess = req.session as any;
  return logAudit({
    ...event,
    userId: sess?.user?.id ?? null,
    username: sess?.user?.username ?? null,
    ip: req.ip ?? null,
  });
}
