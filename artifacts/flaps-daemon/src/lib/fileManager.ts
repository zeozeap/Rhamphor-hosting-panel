import fs from "fs";
import path from "path";
import { config } from "../config.js";

export interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  mtime: string;
  extension: string;
  permissions: string;
}

function getServerRoot(serverId: string): string {
  return path.join(config.dataDir, "servers", serverId);
}

function resolveSafe(serverId: string, filePath: string): string {
  const root = getServerRoot(serverId);
  const resolved = path.resolve(root, filePath.replace(/^\/+/, ""));
  if (!resolved.startsWith(root)) {
    throw new Error("Path traversal denied");
  }
  return resolved;
}

export function listFiles(serverId: string, dirPath: string): FileEntry[] {
  const fullPath = resolveSafe(serverId, dirPath);

  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }

  const stat = fs.statSync(fullPath);
  if (!stat.isDirectory()) {
    throw new Error("Not a directory");
  }

  const entries = fs.readdirSync(fullPath);
  return entries
    .map((name) => {
      const entryPath = path.join(fullPath, name);
      try {
        const s = fs.statSync(entryPath);
        const relPath = path.join(dirPath, name);
        return {
          name,
          path: relPath,
          isDirectory: s.isDirectory(),
          size: s.size,
          mtime: s.mtime.toISOString(),
          extension: path.extname(name).slice(1),
          permissions: (s.mode & 0o777).toString(8),
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean) as FileEntry[];
}

export function readFile(serverId: string, filePath: string): { content: string; size: number } {
  const fullPath = resolveSafe(serverId, filePath);
  const stat = fs.statSync(fullPath);

  if (stat.size > 5 * 1024 * 1024) {
    throw new Error("File too large (max 5MB)");
  }

  const content = fs.readFileSync(fullPath, "utf-8");
  return { content, size: stat.size };
}

export function writeFile(serverId: string, filePath: string, content: string): void {
  const fullPath = resolveSafe(serverId, filePath);
  const dir = path.dirname(fullPath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content, "utf-8");
}

export function deleteFile(serverId: string, filePath: string): void {
  const fullPath = resolveSafe(serverId, filePath);
  const stat = fs.statSync(fullPath);
  if (stat.isDirectory()) {
    fs.rmSync(fullPath, { recursive: true, force: true });
  } else {
    fs.unlinkSync(fullPath);
  }
}

export function createDirectory(serverId: string, dirPath: string): void {
  const fullPath = resolveSafe(serverId, dirPath);
  fs.mkdirSync(fullPath, { recursive: true });
}

export function renameEntry(serverId: string, oldPath: string, newPath: string): void {
  const fullOld = resolveSafe(serverId, oldPath);
  const fullNew = resolveSafe(serverId, newPath);
  const dir = path.dirname(fullNew);
  fs.mkdirSync(dir, { recursive: true });
  fs.renameSync(fullOld, fullNew);
}

export function getFileStats(serverId: string, filePath: string): fs.Stats {
  const fullPath = resolveSafe(serverId, filePath);
  return fs.statSync(fullPath);
}
