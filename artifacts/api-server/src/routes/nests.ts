import { Router } from "express";
import { db, nests, eggs } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../lib/middleware.js";
import { auditFromReq } from "../lib/auditLogger.js";

const router = Router();

router.get("/nests", requireAuth, async (_req, res) => {
  const rows = await db.select().from(nests).orderBy(nests.createdAt);
  res.json(rows);
});

router.post("/nests", requireAuth, requireAdmin, async (req, res) => {
  const { name, description, author } = req.body as any;
  const [nest] = await db.insert(nests).values({ name, description: description ?? "", author: author ?? "VortexPanel" }).returning();
  await auditFromReq(req, { action: "nest.create", resourceType: "nest", resourceId: nest.id, resourceName: name });
  res.status(201).json(nest);
});

router.patch("/nests/:id", requireAuth, requireAdmin, async (req, res) => {
  const { name, description, author } = req.body as any;
  const updates: any = {};
  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (author !== undefined) updates.author = author;
  const [nest] = await db.update(nests).set(updates).where(eq(nests.id, req.params.id)).returning();
  if (!nest) return res.status(404).json({ error: "Nest not found" });
  res.json(nest);
});

router.delete("/nests/:id", requireAuth, requireAdmin, async (req, res) => {
  await db.delete(nests).where(eq(nests.id, req.params.id));
  await auditFromReq(req, { action: "nest.delete", resourceType: "nest", resourceId: req.params.id });
  res.json({ message: "Nest deleted" });
});

router.get("/nests/:id/eggs", requireAuth, async (req, res) => {
  const rows = await db.select().from(eggs).where(eq(eggs.nestId, req.params.id)).orderBy(eggs.createdAt);
  res.json(rows);
});

router.get("/eggs", requireAuth, async (_req, res) => {
  const rows = await db.select().from(eggs).orderBy(eggs.createdAt);
  res.json(rows);
});

router.post("/nests/:id/eggs", requireAuth, requireAdmin, async (req, res) => {
  const { name, description, dockerImage, startupCommand, configFiles, variables, features } = req.body as any;
  const [egg] = await db.insert(eggs).values({
    nestId: req.params.id,
    name,
    description: description ?? "",
    dockerImage: dockerImage ?? "",
    startupCommand: startupCommand ?? "",
    configFiles: configFiles ? JSON.stringify(configFiles) : "{}",
    variables: variables ? JSON.stringify(variables) : "[]",
    features: features ? JSON.stringify(features) : "[]",
  }).returning();
  await auditFromReq(req, { action: "egg.create", resourceType: "egg", resourceId: egg.id, resourceName: name });
  res.status(201).json(egg);
});

router.patch("/eggs/:id", requireAuth, requireAdmin, async (req, res) => {
  const { name, description, dockerImage, startupCommand, configFiles, variables, features } = req.body as any;
  const updates: any = {};
  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (dockerImage !== undefined) updates.dockerImage = dockerImage;
  if (startupCommand !== undefined) updates.startupCommand = startupCommand;
  if (configFiles !== undefined) updates.configFiles = JSON.stringify(configFiles);
  if (variables !== undefined) updates.variables = JSON.stringify(variables);
  if (features !== undefined) updates.features = JSON.stringify(features);
  const [egg] = await db.update(eggs).set(updates).where(eq(eggs.id, req.params.id)).returning();
  if (!egg) return res.status(404).json({ error: "Egg not found" });
  res.json(egg);
});

router.delete("/eggs/:id", requireAuth, requireAdmin, async (req, res) => {
  await db.delete(eggs).where(eq(eggs.id, req.params.id));
  await auditFromReq(req, { action: "egg.delete", resourceType: "egg", resourceId: req.params.id });
  res.json({ message: "Egg deleted" });
});

export default router;
