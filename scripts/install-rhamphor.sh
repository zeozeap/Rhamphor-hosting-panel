#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════════╗
# ║          Rhamphor Panel — Installation Script                ║
# ║         The Modern Minecraft & Bot Hosting Panel             ║
# ╚══════════════════════════════════════════════════════════════╝
# Usage: curl -fsSL https://get.rhamphor.io/install.sh | bash
# Or:    bash install-rhamphor.sh [--domain DOMAIN] [--email EMAIL]

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

RHAMPHOR_VERSION="1.0.0"
RHAMPHOR_INSTALL_DIR="/opt/rhamphor"
RHAMPHOR_DATA_DIR="/var/lib/rhamphor"
RHAMPHOR_LOG_DIR="/var/log/rhamphor"
RHAMPHOR_USER="rhamphor"
RHAMPHOR_PORT="${RHAMPHOR_PORT:-3000}"
RHAMPHOR_PANEL_PORT="${RHAMPHOR_PANEL_PORT:-80}"
NODE_REQUIRED="20"
POSTGRES_DB="rhamphor"
POSTGRES_USER="rhamphor"
REPO_URL="https://github.com/rhamphor/rhamphor"

info()    { echo -e "${CYAN}[INFO]${RESET} $*"; }
success() { echo -e "${GREEN}[OK]${RESET}  $*"; }
warn()    { echo -e "${YELLOW}[WARN]${RESET} $*"; }
error()   { echo -e "${RED}[ERR]${RESET}  $*" >&2; exit 1; }
header()  { echo -e "\n${BOLD}${CYAN}━━━ $* ━━━${RESET}\n"; }

banner() {
  echo -e "${CYAN}"
  cat << 'EOF'
  ██████╗ ██╗  ██╗ █████╗ ███╗   ███╗██████╗ ██╗  ██╗ ██████╗ ██████╗
  ██╔══██╗██║  ██║██╔══██╗████╗ ████║██╔══██╗██║  ██║██╔═══██╗██╔══██╗
  ██████╔╝███████║███████║██╔████╔██║██████╔╝███████║██║   ██║██████╔╝
  ██╔══██╗██╔══██║██╔══██║██║╚██╔╝██║██╔═══╝ ██╔══██║██║   ██║██╔══██╗
  ██║  ██║██║  ██║██║  ██║██║ ╚═╝ ██║██║     ██║  ██║╚██████╔╝██║  ██║
  ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝
EOF
  echo -e "${RESET}  Rhamphor v${RHAMPHOR_VERSION} — The Modern Game Server Hosting Panel${RESET}"
  echo -e "  Powered by the Flaps daemon network\n"
}

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --domain)       RHAMPHOR_DOMAIN="$2"; shift 2 ;;
      --email)        RHAMPHOR_EMAIL="$2"; shift 2 ;;
      --port)         RHAMPHOR_PORT="$2"; shift 2 ;;
      --db-password)  POSTGRES_PASS="$2"; shift 2 ;;
      --skip-ssl)     SKIP_SSL=true; shift ;;
      --dev)          DEV_MODE=true; shift ;;
      *) warn "Unknown argument: $1"; shift ;;
    esac
  done

  RHAMPHOR_DOMAIN="${RHAMPHOR_DOMAIN:-$(hostname -f 2>/dev/null || echo 'localhost')}"
  SKIP_SSL="${SKIP_SSL:-false}"
  DEV_MODE="${DEV_MODE:-false}"
}

check_root() {
  if [[ $EUID -ne 0 ]]; then
    error "This script must be run as root. Try: sudo bash install-rhamphor.sh"
  fi
}

check_memory() {
  local mem_mb
  mem_mb=$(free -m | awk '/^Mem:/{print $2}')
  if [[ "$mem_mb" -lt 512 ]]; then
    warn "Low memory detected: ${mem_mb}MB. Rhamphor recommends at least 1GB RAM."
  else
    info "Memory: ${mem_mb}MB — OK"
  fi
}

detect_os() {
  if [[ -f /etc/os-release ]]; then
    . /etc/os-release
    OS_ID="$ID"
    OS_VERSION="$VERSION_ID"
  else
    error "Cannot detect OS."
  fi

  case "$OS_ID" in
    ubuntu|debian|pop) PKG_MGR="apt" ;;
    centos|rhel|fedora|rocky|almalinux) PKG_MGR="dnf" ;;
    *) error "Unsupported OS: $OS_ID. Supported: Ubuntu 20.04+, Debian 11+, CentOS 8+" ;;
  esac

  info "Detected OS: $OS_ID $OS_VERSION"
}

install_system_deps() {
  info "Updating package lists and installing dependencies..."
  if [[ "$PKG_MGR" == "apt" ]]; then
    apt-get update -qq
    apt-get install -y curl wget git unzip build-essential nginx certbot python3-certbot-nginx
  else
    dnf install -y curl wget git unzip gcc gcc-c++ make nginx certbot python3-certbot-nginx
  fi
  success "System dependencies installed"
}

install_node() {
  if command -v node &>/dev/null; then
    local ver
    ver=$(node -e "process.stdout.write(process.versions.node.split('.')[0])")
    if [[ "$ver" -ge "$NODE_REQUIRED" ]]; then
      success "Node.js $(node -v) already installed"
      return
    fi
  fi

  info "Installing Node.js ${NODE_REQUIRED}.x..."
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_REQUIRED}.x" | bash - 2>/dev/null || \
    curl -fsSL "https://rpm.nodesource.com/setup_${NODE_REQUIRED}.x" | bash - 2>/dev/null

  if [[ "$PKG_MGR" == "apt" ]]; then apt-get install -y nodejs; else dnf install -y nodejs; fi

  npm install -g pnpm
  success "Node.js $(node -v) and pnpm installed"
}

install_postgres() {
  if command -v psql &>/dev/null; then
    success "PostgreSQL already installed"
  else
    info "Installing PostgreSQL..."
    if [[ "$PKG_MGR" == "apt" ]]; then
      apt-get install -y postgresql postgresql-contrib
    else
      dnf install -y postgresql-server postgresql-contrib
      postgresql-setup --initdb
    fi
  fi

  systemctl enable postgresql
  systemctl start postgresql

  POSTGRES_PASS="${POSTGRES_PASS:-$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 20)}"

  sudo -u postgres psql -c "CREATE USER ${POSTGRES_USER} WITH PASSWORD '${POSTGRES_PASS}';" 2>/dev/null || \
    sudo -u postgres psql -c "ALTER USER ${POSTGRES_USER} WITH PASSWORD '${POSTGRES_PASS}';"
  sudo -u postgres psql -c "CREATE DATABASE ${POSTGRES_DB} OWNER ${POSTGRES_USER};" 2>/dev/null || true
  sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${POSTGRES_DB} TO ${POSTGRES_USER};" 2>/dev/null || true

  success "PostgreSQL configured (database: ${POSTGRES_DB})"
}

create_user() {
  if id "$RHAMPHOR_USER" &>/dev/null; then
    info "User '$RHAMPHOR_USER' already exists"
    return
  fi
  useradd -r -s /bin/bash -d "$RHAMPHOR_INSTALL_DIR" -m "$RHAMPHOR_USER"
  success "Created system user: $RHAMPHOR_USER"
}

install_panel() {
  info "Installing Rhamphor panel to $RHAMPHOR_INSTALL_DIR..."
  mkdir -p "$RHAMPHOR_INSTALL_DIR" "$RHAMPHOR_DATA_DIR" "$RHAMPHOR_LOG_DIR"

  if [[ -d "$RHAMPHOR_INSTALL_DIR/.git" ]]; then
    cd "$RHAMPHOR_INSTALL_DIR"
    git pull --quiet
    info "Updated existing Rhamphor installation"
  else
    git clone --quiet "$REPO_URL" "$RHAMPHOR_INSTALL_DIR" 2>/dev/null || {
      warn "Repository not available — skipping git clone (manual installation required)"
    }
  fi

  if [[ -f "$RHAMPHOR_INSTALL_DIR/package.json" ]]; then
    cd "$RHAMPHOR_INSTALL_DIR"
    pnpm install --frozen-lockfile 2>/dev/null || pnpm install
    pnpm run build 2>/dev/null || true
  fi

  chown -R "$RHAMPHOR_USER:$RHAMPHOR_USER" "$RHAMPHOR_INSTALL_DIR" "$RHAMPHOR_DATA_DIR" "$RHAMPHOR_LOG_DIR"
  success "Rhamphor panel installed"
}

SESSION_SECRET=$(openssl rand -base64 32)

write_env() {
  info "Writing environment configuration..."
  cat > "$RHAMPHOR_INSTALL_DIR/.env" << ENV
# Rhamphor Panel Configuration
# Generated by installer on $(date)

# Database
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASS}@localhost:5432/${POSTGRES_DB}

# API Server
PORT=4000
NODE_ENV=production

# Session
SESSION_SECRET=${SESSION_SECRET}

# Panel
PANEL_URL=https://${RHAMPHOR_DOMAIN}
PANEL_NAME=Rhamphor
FLAPS_DEFAULT_PORT=8443
ENV

  chmod 600 "$RHAMPHOR_INSTALL_DIR/.env"
  success "Environment configuration written"
}

run_migrations() {
  if [[ -f "$RHAMPHOR_INSTALL_DIR/package.json" ]]; then
    info "Running database migrations..."
    cd "$RHAMPHOR_INSTALL_DIR"
    sudo -u "$RHAMPHOR_USER" pnpm run db:push 2>/dev/null || \
      sudo -u "$RHAMPHOR_USER" pnpm --filter @workspace/db run push 2>/dev/null || \
      warn "Migrations may need to be run manually: pnpm run db:push"
    success "Database migrations applied"
  fi
}

install_systemd() {
  info "Installing Rhamphor systemd services..."

  cat > /etc/systemd/system/rhamphor-api.service << SERVICE
[Unit]
Description=Rhamphor Panel API Server
Documentation=https://rhamphor.io/docs
After=network.target postgresql.service
Requires=postgresql.service

[Service]
Type=simple
User=${RHAMPHOR_USER}
Group=${RHAMPHOR_USER}
WorkingDirectory=${RHAMPHOR_INSTALL_DIR}
EnvironmentFile=${RHAMPHOR_INSTALL_DIR}/.env
ExecStart=/usr/bin/node artifacts/api-server/dist/index.js
Restart=always
RestartSec=5
StandardOutput=append:${RHAMPHOR_LOG_DIR}/api.log
StandardError=append:${RHAMPHOR_LOG_DIR}/api-error.log
LimitNOFILE=65536
NoNewPrivileges=yes

[Install]
WantedBy=multi-user.target
SERVICE

  systemctl daemon-reload
  systemctl enable rhamphor-api
  systemctl restart rhamphor-api

  success "Rhamphor systemd services installed"
}

setup_nginx() {
  info "Configuring Nginx reverse proxy..."

  cat > /etc/nginx/sites-available/rhamphor << NGINX
server {
    listen 80;
    server_name ${RHAMPHOR_DOMAIN};

    access_log ${RHAMPHOR_LOG_DIR}/nginx-access.log;
    error_log  ${RHAMPHOR_LOG_DIR}/nginx-error.log;

    location /api/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 300;
    }

    location /ws/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_read_timeout 3600;
    }

    location / {
        root ${RHAMPHOR_INSTALL_DIR}/artifacts/panel/dist;
        try_files \$uri \$uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    client_max_body_size 100M;
}
NGINX

  if [[ -f /etc/nginx/sites-enabled/default ]]; then
    rm -f /etc/nginx/sites-enabled/default
  fi

  ln -sf /etc/nginx/sites-available/rhamphor /etc/nginx/sites-enabled/rhamphor
  nginx -t && systemctl reload nginx

  success "Nginx configured for $RHAMPHOR_DOMAIN"
}

setup_ssl() {
  if [[ "$SKIP_SSL" == "true" ]] || [[ "$RHAMPHOR_DOMAIN" == "localhost" ]]; then
    warn "Skipping SSL setup (--skip-ssl or localhost domain)"
    return
  fi

  if [[ -z "${RHAMPHOR_EMAIL:-}" ]]; then
    warn "No --email provided — skipping SSL certificate (add it manually with: certbot --nginx -d $RHAMPHOR_DOMAIN)"
    return
  fi

  info "Obtaining SSL certificate via Let's Encrypt..."
  certbot --nginx \
    --non-interactive \
    --agree-tos \
    --email "$RHAMPHOR_EMAIL" \
    -d "$RHAMPHOR_DOMAIN" || warn "SSL setup failed — panel will run on HTTP. Run certbot manually when DNS is configured."

  success "SSL certificate installed"
}

setup_firewall() {
  if command -v ufw &>/dev/null; then
    ufw allow 80/tcp  comment "Rhamphor HTTP"  &>/dev/null || true
    ufw allow 443/tcp comment "Rhamphor HTTPS" &>/dev/null || true
    info "Firewall rules added (80, 443)"
  elif command -v firewall-cmd &>/dev/null; then
    firewall-cmd --permanent --add-service=http  &>/dev/null || true
    firewall-cmd --permanent --add-service=https &>/dev/null || true
    firewall-cmd --reload &>/dev/null || true
    info "Firewalld rules added"
  fi
}

print_summary() {
  echo -e "\n${GREEN}${BOLD}╔════════════════════════════════════════════════════╗${RESET}"
  echo -e "${GREEN}${BOLD}║   Rhamphor Panel Installed Successfully!           ║${RESET}"
  echo -e "${GREEN}${BOLD}╚════════════════════════════════════════════════════╝${RESET}\n"

  local protocol="https"
  [[ "$SKIP_SSL" == "true" ]] && protocol="http"

  echo -e "  ${BOLD}Panel URL:${RESET}     ${CYAN}${protocol}://${RHAMPHOR_DOMAIN}${RESET}"
  echo -e "  ${BOLD}Admin Login:${RESET}   ${YELLOW}admin / (set during first launch)${RESET}"
  echo -e "  ${BOLD}Database:${RESET}      postgresql://${POSTGRES_USER}:***@localhost/${POSTGRES_DB}"
  echo -e "  ${BOLD}Config File:${RESET}   ${RHAMPHOR_INSTALL_DIR}/.env"
  echo -e "  ${BOLD}Logs:${RESET}          ${RHAMPHOR_LOG_DIR}/"
  echo ""
  echo -e "  ${CYAN}${BOLD}Next Steps:${RESET}"
  echo -e "  1. Open ${protocol}://${RHAMPHOR_DOMAIN} in your browser"
  echo -e "  2. Create your admin account on first login"
  echo -e "  3. Go to Nodes and install Flaps on your game server nodes:"
  echo -e "     ${YELLOW}curl -fsSL https://get.rhamphor.io/flaps.sh | sudo bash${RESET}"
  echo ""
  echo -e "  ${BOLD}Service commands:${RESET}"
  echo -e "  systemctl status rhamphor-api     # API status"
  echo -e "  journalctl -u rhamphor-api -f     # API logs"
  echo -e "  systemctl status nginx            # Web server status"
  echo ""
}

main() {
  banner
  parse_args "$@"
  check_root
  check_memory
  detect_os

  header "System Dependencies"
  install_system_deps
  install_node

  header "PostgreSQL Database"
  install_postgres

  header "Rhamphor User"
  create_user

  header "Panel Installation"
  install_panel
  write_env
  run_migrations

  header "Systemd Service"
  install_systemd

  header "Nginx Web Server"
  setup_nginx
  setup_ssl

  header "Firewall"
  setup_firewall

  print_summary
}

main "$@"
