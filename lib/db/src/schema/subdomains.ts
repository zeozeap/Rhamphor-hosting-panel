import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { serversTable } from "./servers";

export const subdomainsTable = pgTable("subdomains", {
  id: text("id").primaryKey(),
  serverId: text("server_id").notNull().references(() => serversTable.id, { onDelete: "cascade" }),
  subdomain: text("subdomain").notNull().unique(),
  targetPort: text("target_port").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSubdomainSchema = createInsertSchema(subdomainsTable).omit({ createdAt: true });
export type InsertSubdomain = z.infer<typeof insertSubdomainSchema>;
export type Subdomain = typeof subdomainsTable.$inferSelect;
