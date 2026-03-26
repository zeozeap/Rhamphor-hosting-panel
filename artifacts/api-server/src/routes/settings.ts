import { Router } from "express";
import { db, panelSettings } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../lib/middleware.js";

const router = Router();

const DEFAULTS: Record<string, string> = {
  panelName: "VortexPanel",
  panelTagline: "Minecraft Hosting Platform",
  primaryColor: "#00BCD4",
  accentColor: "#0097A7",
  logoUrl: "",
  faviconUrl: "",
  loginBg: "",
  loginTitle: "Welcome Back",
  loginSubtitle: "Sign in to your hosting account",
  loginLogoUrl: "",
  recaptchaEnabled: "false",
  recaptchaSiteKey: "",
  recaptchaSecretKey: "",
  customCss: "",
};

async function getAll(): Promise<Record<string, string>> {
  const rows = await db.select().from(panelSettings);
  const map: Record<string, string> = { ...DEFAULTS };
  for (const row of rows) map[row.key] = row.value;
  return map;
}

router.get("/settings/public", async (req, res) => {
  const all = await getAll();
  const { recaptchaSecretKey: _secret, ...safe } = all;
  res.json(safe);
});

router.get("/settings", requireAuth, requireAdmin, async (req, res) => {
  const all = await getAll();
  res.json(all);
});

router.put("/settings", requireAuth, requireAdmin, async (req, res) => {
  const updates: Record<string, string> = req.body;
  for (const [key, value] of Object.entries(updates)) {
    if (typeof value !== "string") continue;
    await db
      .insert(panelSettings)
      .values({ key, value, updatedAt: new Date() })
      .onConflictDoUpdate({ target: panelSettings.key, set: { value, updatedAt: new Date() } });
  }
  const all = await getAll();
  const { recaptchaSecretKey: _secret, ...safe } = all;
  res.json(safe);
});

export default router;
