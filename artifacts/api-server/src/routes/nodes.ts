import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { nodesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { CreateNodeBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/nodes", async (req, res) => {
  const nodes = await db.select().from(nodesTable).orderBy(nodesTable.createdAt);

  const serversCount = await db.query.serversTable.findMany({
    columns: { nodeId: true },
  });

  const countMap: Record<string, number> = {};
  for (const s of serversCount) {
    countMap[s.nodeId] = (countMap[s.nodeId] ?? 0) + 1;
  }

  const result = nodes.map((n) => ({ ...n, serversCount: countMap[n.id] ?? 0 }));
  res.json(result);
});

router.post("/nodes", async (req, res) => {
  const parsed = CreateNodeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { name, fqdn, port, memory, disk, location } = parsed.data;
  const id = uuidv4();

  const [node] = await db
    .insert(nodesTable)
    .values({ id, name, fqdn, port, memory, disk, location: location ?? null, status: "online" })
    .returning();

  res.status(201).json({ ...node, serversCount: 0 });
});

router.get("/nodes/:id", async (req, res) => {
  const node = await db.select().from(nodesTable).where(eq(nodesTable.id, req.params.id)).limit(1);

  if (!node.length) {
    res.status(404).json({ error: "Node not found" });
    return;
  }

  const serversCount = await db.query.serversTable.findMany({
    where: (s, { eq: eqFn }) => eqFn(s.nodeId, req.params.id),
    columns: { id: true },
  });

  res.json({ ...node[0], serversCount: serversCount.length });
});

router.delete("/nodes/:id", async (req, res) => {
  const node = await db.select().from(nodesTable).where(eq(nodesTable.id, req.params.id)).limit(1);
  if (!node.length) {
    res.status(404).json({ error: "Node not found" });
    return;
  }
  await db.delete(nodesTable).where(eq(nodesTable.id, req.params.id));
  res.json({ message: "Node deleted successfully" });
});

export default router;
