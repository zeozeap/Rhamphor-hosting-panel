import { pgTable, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const nodeStatusEnum = pgEnum("node_status", ["online", "offline", "maintenance"]);

export const nodesTable = pgTable("nodes", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  fqdn: text("fqdn").notNull(),
  port: integer("port").notNull().default(8080),
  memory: integer("memory").notNull(),
  disk: integer("disk").notNull(),
  status: nodeStatusEnum("status").notNull().default("offline"),
  location: text("location"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertNodeSchema = createInsertSchema(nodesTable).omit({ createdAt: true, updatedAt: true });
export type InsertNode = z.infer<typeof insertNodeSchema>;
export type Node = typeof nodesTable.$inferSelect;
