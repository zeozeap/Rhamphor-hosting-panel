import { pgTable, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { serversTable } from "./servers";

export const serverPluginsTable = pgTable("server_plugins", {
  id: text("id").primaryKey(),
  serverId: text("server_id").notNull().references(() => serversTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  version: text("version").notNull().default("1.0.0"),
  description: text("description"),
  author: text("author"),
  filename: text("filename").notNull(),
  fileSize: integer("file_size").notNull().default(0),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertServerPluginSchema = createInsertSchema(serverPluginsTable).omit({ createdAt: true });
export type InsertServerPlugin = z.infer<typeof insertServerPluginSchema>;
export type ServerPlugin = typeof serverPluginsTable.$inferSelect;
