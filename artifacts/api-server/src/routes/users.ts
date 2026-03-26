import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import { CreateUserBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/users", async (_req, res) => {
  const users = await db.select({
    id: usersTable.id,
    username: usersTable.username,
    email: usersTable.email,
    role: usersTable.role,
    createdAt: usersTable.createdAt,
  }).from(usersTable).orderBy(usersTable.createdAt);

  res.json(users);
});

router.post("/users", async (req, res) => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { username, email, password, role } = parsed.data;

  const existing = await db.select().from(usersTable)
    .where(eq(usersTable.email, email)).limit(1);

  if (existing.length) {
    res.status(409).json({ error: "User with this email already exists" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const id = uuidv4();

  const [user] = await db.insert(usersTable).values({
    id,
    username,
    email,
    passwordHash,
    role: (role as "admin" | "user") ?? "user",
  }).returning({
    id: usersTable.id,
    username: usersTable.username,
    email: usersTable.email,
    role: usersTable.role,
    createdAt: usersTable.createdAt,
  });

  res.status(201).json(user);
});

router.get("/users/:id", async (req, res) => {
  const users = await db.select({
    id: usersTable.id,
    username: usersTable.username,
    email: usersTable.email,
    role: usersTable.role,
    createdAt: usersTable.createdAt,
  }).from(usersTable).where(eq(usersTable.id, req.params.id)).limit(1);

  if (!users.length) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(users[0]);
});

router.delete("/users/:id", async (req, res) => {
  const users = await db.select().from(usersTable).where(eq(usersTable.id, req.params.id)).limit(1);
  if (!users.length) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  await db.delete(usersTable).where(eq(usersTable.id, req.params.id));
  res.json({ message: "User deleted successfully" });
});

export default router;
