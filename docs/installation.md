# Installation

This guide covers installing Rhamphor and Flaps on a production Linux server.

---

## Panel Installation (`install-rhamphor.sh`)

The panel install script sets up the Rhamphor control plane (API + frontend) on your web server.

### What it installs

- Node.js 20 via NodeSource
- PostgreSQL 15
- Nginx (reverse proxy)
- Certbot + Let's Encrypt SSL
- Rhamphor as a systemd service

### Usage

```bash
curl -fsSL https://raw.githubusercontent.com/yourorg/rhamphor/main/scripts/install-rhamphor.sh \
  | sudo bash -s -- --domain panel.yourdomain.com --email admin@yourdomain.com
```

Or download and run locally:

```bash
wget https://raw.githubusercontent.com/yourorg/rhamphor/main/scripts/install-rhamphor.sh
chmod +x install-rhamphor.sh
sudo ./install-rhamphor.sh --domain panel.yourdomain.com --email admin@yourdomain.com
```

### Script flags

| Flag | Required | Description |
|------|----------|-------------|
| `--domain` | Yes | FQDN for the panel (e.g. `panel.example.com`) |
| `--email` | Yes | Email for Let's Encrypt certificate renewal |
| `--db-name` | No | PostgreSQL database name (default: `rhamphor`) |
| `--db-user` | No | PostgreSQL user (default: `rhamphor`) |
| `--skip-ssl` | No | Skip Certbot/SSL setup (for testing only) |

### Supported OS

- Ubuntu 20.04, 22.04, 24.04
- Debian 11, 12
- CentOS 8, 9 / RHEL 8, 9

### Post-install

1. The script prints the auto-generated admin password — save it immediately.
2. Visit `https://panel.yourdomain.com` to confirm the panel loads.
3. Proceed to install the Flaps daemon on your game server nodes.

---

## Node Daemon Installation (`install-flaps.sh`)

The Flaps install script sets up the game server agent on each game node.

### What it installs

- Node.js 20 via NodeSource
- Flaps daemon source code (cloned to `/opt/flaps`)
- Flaps as a systemd service (`flaps.service`)
- Firewall rules: opens the Flaps port (default 8443)

### Usage

```bash
curl -fsSL https://raw.githubusercontent.com/yourorg/rhamphor/main/scripts/install-flaps.sh \
  | sudo bash -s -- --token YOUR_SECRET_TOKEN
```

Or with all options:

```bash
sudo ./install-flaps.sh \
  --token YOUR_SECRET_TOKEN \
  --port 8443 \
  --node-id game-node-1 \
  --data-dir /var/lib/flaps \
  --panel-url https://panel.yourdomain.com
```

### Script flags

| Flag | Required | Description |
|------|----------|-------------|
| `--token` | Yes | Shared secret token (must match what you enter in the panel) |
| `--port` | No | Port for the Flaps HTTP/WS server (default: `8443`) |
| `--node-id` | No | Identifier for this node (default: hostname) |
| `--data-dir` | No | Directory for server files (default: `/var/lib/flaps`) |
| `--panel-url` | No | Rhamphor panel URL (for callbacks) |

### Post-install

1. In the Rhamphor panel, go to **Nodes → Add Node**.
2. Enter the node's FQDN, the port, and the token you used above.
3. Rhamphor will ping the node to confirm connectivity.

---

## Nginx Configuration

The install script generates an Nginx config at `/etc/nginx/sites-available/rhamphor` that:

- Proxies `/` to the Vite-built panel static files
- Proxies `/api` to the Express API server (port 4000)
- Proxies `/ws` for WebSocket upgrade
- Adds SSL via Certbot with auto-renewal

---

## Systemd Services

After installation, two services are created:

| Service | Description |
|---------|-------------|
| `rhamphor.service` | API server (panel + API) |
| `flaps.service` | Flaps daemon (game node) |

```bash
# Check status
sudo systemctl status rhamphor
sudo systemctl status flaps

# View logs
sudo journalctl -u rhamphor -f
sudo journalctl -u flaps -f

# Restart
sudo systemctl restart rhamphor
sudo systemctl restart flaps
```
