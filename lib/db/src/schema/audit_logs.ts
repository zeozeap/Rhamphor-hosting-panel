import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id"),
  username: text("username"),
  action: text("action").notNull(),
  resourceType: text("resource_type"),
  resourceId: text("resource_id"),
  resourceName: text("resource_name"),
  metadata: text("metadata").default("{}").notNull(),
  ip: text("ip"),
  level: text("level").default("info").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
