# Nests & Eggs

Route: `/nests`  
Access: Admin only

The Nests & Eggs system is inspired by [Pterodactyl Panel](https://pterodactyl.io/). It provides a structured, reusable way to define what types of game servers the panel can create.

---

## What Are Nests?

A **Nest** is a top-level category grouping related server types.

Examples:
- **Minecraft** — contains eggs for Paper, Spigot, Forge, Fabric, Vanilla
- **Discord Bots** — contains eggs for discord.js, discord.py
- **Other** — contains eggs for custom Go servers, Python scripts, Node.js apps

---

## What Are Eggs?

An **Egg** is a server type definition within a Nest. It defines exactly how Flaps should start the server.

| Field | Description |
|-------|-------------|
| Name | Display name (e.g. "Paper 1.21") |
| Description | Short description shown when creating a server |
| Nest | Which Nest this egg belongs to |
| Start command | The command Flaps runs to start the server (e.g. `java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar server.jar --nogui`) |
| Docker image | (Future) The container image to use |
| Default environment | Default env vars passed to the process at startup |
| Stop command | Command to gracefully stop the server (e.g. `stop` for Minecraft) |

---

## Supported Server Types (Built-in Flaps Support)

Flaps has native support for these server types:

| Type | Start command pattern |
|------|----------------------|
| Paper / Spigot | `java -jar paper.jar` |
| Forge | `java -jar forge.jar` |
| Fabric | `java -jar fabric-server-launch.jar` |
| Vanilla | `java -jar server.jar` |
| Node.js / discord.js | `node index.js` |
| Python / discord.py | `python bot.py` |
| Go server | `./server` |
| Custom | Any command specified in the egg's `startCommand` |

---

## Creating a Nest

1. Go to **Nests** in the sidebar
2. Click **New Nest**
3. Enter a name and optional description
4. Save

---

## Creating an Egg

1. Open a Nest
2. Click **New Egg**
3. Fill in the egg fields (name, start command, etc.)
4. Save

The egg immediately becomes available when creating new servers.

---

## Environment Variable Templating

Egg start commands can include template variables that are replaced at startup:

| Variable | Replaced with |
|----------|--------------|
| `{{SERVER_MEMORY}}` | Memory allocation in MB |
| `{{SERVER_NAME}}` | Server display name |
| `{{SERVER_ID}}` | Server UUID |

Example: `java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar server.jar --nogui`

---

## Editing and Deleting

- Eggs can be edited at any time. Changes affect new server starts but not currently running servers.
- Deleting an egg does not delete existing servers using that egg, but those servers will show a missing egg warning.
- Deleting a Nest also deletes all eggs within it.
