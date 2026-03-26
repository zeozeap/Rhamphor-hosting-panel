import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const nests = pgTable("nests", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description").default("").notNull(),
  author: text("author").default("VortexPanel").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const eggs = pgTable("eggs", {
  id: uuid("id").defaultRandom().primaryKey(),
  nestId: uuid("nest_id").references(() => nests.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  description: text("description").default("").notNull(),
  dockerImage: text("docker_image").default("").notNull(),
  startupCommand: text("startup_command").default("").notNull(),
  configFiles: text("config_files").default("{}").notNull(),
  variables: text("variables").default("[]").notNull(),
  features: text("features").default("[]").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
