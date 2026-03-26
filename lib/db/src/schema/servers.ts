import { pgTable, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { nodesTable } from "./nodes";
import { usersTable } from "./users";

export const serverStatusEnum = pgEnum("server_status", ["starting", "running", "stopping", "stopped", "crashed"]);
export const serverTypeEnum = pgEnum("server_type", ["vanilla", "paper", "spigot", "forge", "fabric", "bungeecord"]);

export const serversTable = pgTable("servers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  status: serverStatusEnum("status").notNull().default("stopped"),
  version: text("version").notNull(),
  serverType: serverTypeEnum("server_type").notNull().default("paper"),
  port: integer("port").notNull(),
  memory: integer("memory").notNull(),
  disk: integer("disk").notNull(),
  maxPlayers: integer("max_players").notNull().default(20),
  javaVersion: text("java_version").default("17"),
  nodeId: text("node_id").notNull().references(() => nodesTable.id),
  userId: text("user_id").notNull().references(() => usersTable.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertServerSchema = createInsertSchema(serversTable).omit({ createdAt: true, updatedAt: true });
export type InsertServer = z.infer<typeof insertServerSchema>;
export type Server = typeof serversTable.$inferSelect;
