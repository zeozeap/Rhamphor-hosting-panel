import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq, or } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { LoginBody, UpdateProfileBody } from "@workspace/api-zod";
import { logAudit } from "../lib/auditLogger.js";

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

const router: IRouter = Router();

router.post("/auth/login", async (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { login, password } = parsed.data;

  const users = await db
    .select()
    .from(usersTable)
    .where(or(eq(usersTable.email, login), eq(usersTable.username, login)))
    .limit(1);

  if (!users.length) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const user = users[0];
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  req.session.userId = user.id;

  logAudit({
    userId: user.id,
    username: user.username,
    action: "user.login",
    resourceType: "user",
    resourceId: user.id,
    resourceName: user.username,
    ip: req.ip ?? undefined,
    level: "info",
  });

  res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  });
});

router.post("/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ message: "Logged out successfully" });
  });
});

router.get("/auth/me", async (req, res) => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const users = await db
    .select({
      id: usersTable.id,
      username: usersTable.username,
      email: usersTable.email,
      role: usersTable.role,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .where(eq(usersTable.id, req.session.userId))
    .limit(1);

  if (!users.length) {
    req.session.destroy(() => {});
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  res.json(users[0]);
});

router.patch("/auth/profile", async (req, res) => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const updates: Partial<typeof usersTable.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (parsed.data.username) updates.username = parsed.data.username;
  if (parsed.data.email) updates.email = parsed.data.email;
  if (parsed.data.password) {
    updates.passwordHash = await bcrypt.hash(parsed.data.password, 10);
  }

  const [updated] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, req.session.userId))
    .returning({
      id: usersTable.id,
      username: usersTable.username,
      email: usersTable.email,
      role: usersTable.role,
      createdAt: usersTable.createdAt,
    });

  res.json(updated);
});

export default router;
