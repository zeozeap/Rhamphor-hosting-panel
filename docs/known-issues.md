# Known Issues

This document tracks confirmed bugs, limitations, and rough edges in the current version of Rhamphor.

---

## Active Issues

### Port Conflict on Startup After Config Changes

**Symptom:** The API server fails with `EADDRINUSE: address already in use :::8080` after restarting workflows or changing the Flaps daemon's port configuration.

**Cause:** When the Flaps daemon was reconfigured from port 8080 to port 9000 (dev) / 8443 (prod), the old process may not be fully terminated before the API server starts and tries to claim port 8080.

**Fix:**
1. Find the process using the port: `lsof -i :8080` or `ss -tlnp | grep 8080`
2. Kill it: `kill -9 <PID>`
3. Restart the API server workflow

**Prevention:** Ensure `FLAPS_PORT` is set and confirmed before starting both workflows. In Replit's workflow runner, both workflows should not share the same port.

---

### HMR Transient Auth Errors After Large Merges

**Symptom:** After a large code merge triggers Vite's hot-module-replacement, the browser console shows:

```
Error: useAuth must be used within an AuthProvider
```

**Cause:** During HMR churn, React temporarily renders components before their context providers are fully re-hydrated. This is an HMR side-effect, not a production bug.

**Fix:** Hard-refresh the browser (`Ctrl+Shift+R`) after the HMR completes.

**Note:** This does not occur on a clean page load in production.

---

### File Extract Disabled — No Tooltip

**Symptom:** The "Extract here" option in the file manager right-click menu appears greyed out for non-zip files and folders, but there is no tooltip explaining why.

**Behavior (by design):** Extract is intentionally disabled (`opacity-50`, `cursor-not-allowed`, `disabled`) for:
- Directories
- Files that don't end in `.zip`

**Workaround:** None needed — the behavior is correct. A future improvement would add a tooltip on hover explaining the restriction.

---

### Flaps Does Not Resume Servers After Daemon Restart

**Symptom:** If the Flaps daemon process crashes or the game node is rebooted, all running game servers are stopped. The panel shows them as offline. Servers do not automatically restart.

**Cause:** Game server state (running/stopped) is stored only in memory in the current version. There is no persistent state file.

**Workaround:** After restarting the Flaps daemon, manually start each server from the panel's server console.

**Planned fix:** Store server running state in a JSON file in `FLAPS_DATA_DIR` and auto-resume on daemon startup.

---

### No WebSocket Auto-Reconnect in Panel

**Symptom:** If the WebSocket connection for console streaming or real-time stats drops (e.g. node restart, network blip), the panel console goes silent. No error is shown to the user. The user must navigate away and back to re-establish the stream.

**Cause:** The current WebSocket client implementation does not include reconnect logic.

**Workaround:** Navigate away from the server detail page and return to reconnect.

**Planned fix:** Implement exponential-backoff reconnect in the console WebSocket hook.

---

### Activity Log Does Not Persist Across Page Loads

**Symptom:** The real-time activity log on the Activity Log page streams events live but the buffer is cleared when you navigate away and return.

**Cause:** The log is held in component state. On unmount, the WebSocket closes and state is cleared.

**Workaround:** The full audit log is available via `GET /api/audit` with pagination — the live stream is for monitoring real-time activity only.

---

## Limitations

| Limitation | Details |
|------------|---------|
| Single-region | Flaps nodes must be reachable from the panel server over HTTP. No built-in VPN/tunnel support. |
| No Docker | Flaps manages processes directly via `child_process`. Docker isolation is not currently implemented. |
| No resource limits | CPU/RAM limits per server are not enforced at the OS level in the current version. |
| ZIP only | File compression only creates `.zip` archives. TAR/GZ support is not implemented. |
| No file upload UI | The file manager does not yet support browser-based file upload (drag and drop). Files must be placed on the node manually or via SFTP. |
| Plugin manager | The plugin installer is a metadata layer — it records plugins in the database but does not automatically download plugin JARs from Spigot/Modrinth. |

---

## Reporting New Issues

Please open a GitHub issue with:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Logs from the API server or Flaps daemon (with sensitive values redacted)
