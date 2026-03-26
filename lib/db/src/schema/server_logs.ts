import { pgTable, text, timestamp, serial } from "drizzle-orm/pg-core";
import { serversTable } from "./servers";

export const serverLogsTable = pgTable("server_logs", {
  id: serial("id").primaryKey(),
  serverId: text("server_id").notNull().references(() => serversTable.id, { onDelete: "cascade" }),
  line: text("line").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type ServerLog = typeof serverLogsTable.$inferSelect;
