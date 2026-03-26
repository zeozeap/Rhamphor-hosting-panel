# Dashboard

The Dashboard is the home page for **admin users**. It provides an at-a-glance overview of the entire panel.

> **Admin only.** Regular users are redirected to [My Servers](servers.md) when they log in.

---

## What's Shown

### Summary Cards

| Card | Description |
|------|-------------|
| Total Servers | Count of all server records in the database |
| Running Servers | Count of servers currently in a running/online state |
| Total Nodes | Count of registered game nodes |
| Total Users | Count of all user accounts |

### Node Health

A list of all registered nodes with their current reachability status. The panel pings each node's Flaps daemon to determine if it is online.

### Recent Activity

The last 10 audit log entries, showing who did what and when. Links to the full [Activity Log](activity-log.md).

### Server List Preview

A condensed list of recently active servers with quick-access power controls.

---

## Navigation

From the Dashboard, admins can navigate to any section via the sidebar:

- **All Servers** — full server list with create/manage controls
- **Nodes** — add and manage game server nodes
- **Users** — create and manage user accounts
- **Nests** — manage server type groups and eggs
- **Activity Log** — full audit trail
- **Settings** — panel personalization and security

---

## Access Control

- Route: `/` (root)
- Requires: Admin role
- Non-admins: Redirected to `/my-servers`
