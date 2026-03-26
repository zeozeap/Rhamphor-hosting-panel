import { Router } from "express";
import * as fm from "../lib/fileManager.js";
import { log } from "../config.js";

const router = Router();

router.get("/servers/:id/files", (req, res) => {
  const dirPath = (req.query.path as string) ?? "/";
  try {
    const entries = fm.listFiles(req.params.id, dirPath);
    res.json({ success: true, data: { path: dirPath, entries } });
  } catch (err: any) {
    log("warn", "List files error", { id: req.params.id, path: dirPath, error: err.message });
    res.status(400).json({ success: false, error: err.message });
  }
});

router.get("/servers/:id/files/read", (req, res) => {
  const filePath = req.query.path as string;
  if (!filePath) {
    res.status(400).json({ success: false, error: "path query param required" });
    return;
  }
  try {
    const result = fm.readFile(req.params.id, filePath);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.put("/servers/:id/files/write", (req, res) => {
  const { path: filePath, content } = req.body;
  if (!filePath || content === undefined) {
    res.status(400).json({ success: false, error: "path and content are required" });
    return;
  }
  try {
    fm.writeFile(req.params.id, filePath, content);
    log("info", "File written", { id: req.params.id, path: filePath });
    res.json({ success: true, data: { path: filePath, written: true } });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.delete("/servers/:id/files", (req, res) => {
  const { path: filePath } = req.body;
  if (!filePath) {
    res.status(400).json({ success: false, error: "path is required" });
    return;
  }
  try {
    fm.deleteFile(req.params.id, filePath);
    log("info", "File deleted", { id: req.params.id, path: filePath });
    res.json({ success: true, data: { path: filePath, deleted: true } });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post("/servers/:id/files/mkdir", (req, res) => {
  const { path: dirPath } = req.body;
  if (!dirPath) {
    res.status(400).json({ success: false, error: "path is required" });
    return;
  }
  try {
    fm.createDirectory(req.params.id, dirPath);
    res.json({ success: true, data: { path: dirPath, created: true } });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post("/servers/:id/files/rename", (req, res) => {
  const { from, to } = req.body;
  if (!from || !to) {
    res.status(400).json({ success: false, error: "from and to are required" });
    return;
  }
  try {
    fm.renameEntry(req.params.id, from, to);
    log("info", "File renamed", { id: req.params.id, from, to });
    res.json({ success: true, data: { from, to, renamed: true } });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

export default router;
