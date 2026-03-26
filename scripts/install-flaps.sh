#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════════╗
# ║         Flaps Daemon — Rhamphor Panel Node Agent             ║
# ║                   Installation Script                        ║
# ╚══════════════════════════════════════════════════════════════╝
# Usage: curl -fsSL https://get.rhamphor.io/flaps.sh | bash
# Or:    bash install-flaps.sh [--token TOKEN] [--port PORT]

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

FLAPS_VERSION="1.0.0"
FLAPS_PORT="${FLAPS_PORT:-8443}"
FLAPS_DATA_DIR="${FLAPS_DATA_DIR:-/var/lib/flaps}"
FLAPS_LOG_DIR="/var/log/flaps"
FLAPS_INSTALL_DIR="/opt/flaps"
FLAPS_USER="flaps"
NODE_REQUIRED="20"
REPO_URL="https://github.com/rhamphor/flaps"

info()    { echo -e "${CYAN}[INFO]${RESET} $*"; }
success() { echo -e "${GREEN}[OK]${RESET}  $*"; }
warn()    { echo -e "${YELLOW}[WARN]${RESET} $*"; }
error()   { echo -e "${RED}[ERR]${RESET}  $*" >&2; exit 1; }
header()  { echo -e "\n${BOLD}${CYAN}━━━ $* ━━━${RESET}\n"; }

banner() {
  echo -e "${CYAN}"
  cat << 'EOF'
  ███████╗██╗      █████╗ ██████╗ ███████╗
  ██╔════╝██║     ██╔══██╗██╔══██╗██╔════╝
  █████╗  ██║     ███████║██████╔╝███████╗
  ██╔══╝  ██║     ██╔══██║██╔═══╝ ╚════██║
  ██║     ███████╗██║  ██║██║     ███████║
  ╚═╝     ╚══════╝╚═╝  ╚═╝╚═╝     ╚══════╝
EOF
  echo -e "${RESET}  Flaps Daemon v${FLAPS_VERSION} — Powered by Rhamphor${RESET}"
  echo -e "  The official node agent for the Rhamphor hosting panel\n"
}

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --token)   FLAPS_TOKEN="$2"; shift 2 ;;
      --port)    FLAPS_PORT="$2"; shift 2 ;;
      --node-id) FLAPS_NODE_ID="$2"; shift 2 ;;
      --data-dir) FLAPS_DATA_DIR="$2"; shift 2 ;;
      --panel-url) FLAPS_PANEL_URL="$2"; shift 2 ;;
      *) warn "Unknown argument: $1"; shift ;;
    esac
  done
}

check_root() {
  if [[ $EUID -ne 0 ]]; then
    error "This script must be run as root. Try: sudo bash install-flaps.sh"
  fi
}

detect_os() {
  if [[ -f /etc/os-release ]]; then
    . /etc/os-release
    OS_ID="$ID"
    OS_VERSION="$VERSION_ID"
  else
    error "Cannot detect OS. Only Linux is supported."
  fi

  case "$OS_ID" in
    ubuntu|debian|pop) PKG_MGR="apt" ;;
    centos|rhel|fedora|rocky|almalinux) PKG_MGR="dnf" ;;
    *) error "Unsupported OS: $OS_ID. Supported: Ubuntu, Debian, CentOS, RHEL, Fedora" ;;
  esac

  info "Detected OS: $OS_ID $OS_VERSION (package manager: $PKG_MGR)"
}

install_node() {
  if command -v node &>/dev/null; then
    local ver
    ver=$(node -e "process.stdout.write(process.versions.node.split('.')[0])")
    if [[ "$ver" -ge "$NODE_REQUIRED" ]]; then
      success "Node.js $ver already installed"
      return
    fi
    warn "Node.js $ver found but $NODE_REQUIRED+ required — upgrading..."
  fi

  info "Installing Node.js ${NODE_REQUIRED}.x via NodeSource..."
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_REQUIRED}.x" | bash - 2>/dev/null || \
    curl -fsSL "https://rpm.nodesource.com/setup_${NODE_REQUIRED}.x" | bash - 2>/dev/null

  if [[ "$PKG_MGR" == "apt" ]]; then
    apt-get install -y nodejs
  else
    dnf install -y nodejs
  fi
  success "Node.js $(node -v) installed"
}

install_system_deps() {
  info "Installing system dependencies..."
  if [[ "$PKG_MGR" == "apt" ]]; then
    apt-get update -qq
    apt-get install -y curl wget git unzip openjdk-21-jre-headless python3 python3-pip
  else
    dnf install -y curl wget git unzip java-21-openjdk-headless python3 python3-pip
  fi
  success "System dependencies installed"
}

create_user() {
  if id "$FLAPS_USER" &>/dev/null; then
    info "User '$FLAPS_USER' already exists"
    return
  fi
  useradd -r -s /bin/false -d "$FLAPS_DATA_DIR" -m "$FLAPS_USER"
  success "Created system user: $FLAPS_USER"
}

install_daemon() {
  info "Installing Flaps daemon to $FLAPS_INSTALL_DIR..."
  mkdir -p "$FLAPS_INSTALL_DIR" "$FLAPS_DATA_DIR/servers" "$FLAPS_LOG_DIR"

  if [[ -d "$FLAPS_INSTALL_DIR/.git" ]]; then
    cd "$FLAPS_INSTALL_DIR"
    git pull --quiet
    info "Updated existing Flaps installation"
  else
    git clone --quiet "$REPO_URL" "$FLAPS_INSTALL_DIR" 2>/dev/null || {
      warn "Git clone failed — creating standalone installation..."
      mkdir -p "$FLAPS_INSTALL_DIR/artifacts/flaps-daemon"
      echo '{"name":"flaps-daemon","version":"1.0.0","type":"module"}' > "$FLAPS_INSTALL_DIR/package.json"
    }
  fi

  if [[ -d "$FLAPS_INSTALL_DIR/artifacts/flaps-daemon" ]]; then
    cd "$FLAPS_INSTALL_DIR/artifacts/flaps-daemon"
    npm install --production --silent 2>/dev/null || true
    npm run build 2>/dev/null || true
  fi

  chown -R "$FLAPS_USER:$FLAPS_USER" "$FLAPS_INSTALL_DIR" "$FLAPS_DATA_DIR" "$FLAPS_LOG_DIR"
  success "Flaps daemon installed to $FLAPS_INSTALL_DIR"
}

generate_token() {
  if [[ -z "${FLAPS_TOKEN:-}" ]]; then
    FLAPS_TOKEN=$(node -e "require('crypto').randomBytes(32).toString('hex').then?require('crypto').randomBytes(32).toString('hex'):require('crypto').randomBytes(32).toString('hex')" 2>/dev/null || \
      cat /proc/sys/kernel/random/uuid | tr -d '-')
    warn "Generated random token — copy this to your panel Node settings!"
  fi
}

write_env() {
  info "Writing configuration to /etc/flaps/env..."
  mkdir -p /etc/flaps
  cat > /etc/flaps/env << ENV
FLAPS_PORT=${FLAPS_PORT}
FLAPS_TOKEN=${FLAPS_TOKEN}
FLAPS_NODE_ID=${FLAPS_NODE_ID:-$(hostname)}
FLAPS_DATA_DIR=${FLAPS_DATA_DIR}
FLAPS_LOG_LEVEL=info
FLAPS_PANEL_URL=${FLAPS_PANEL_URL:-}
ENV
  chmod 600 /etc/flaps/env
  success "Configuration written"
}

install_systemd() {
  info "Installing systemd service..."
  local exec_path="$FLAPS_INSTALL_DIR/artifacts/flaps-daemon"

  cat > /etc/systemd/system/flaps.service << SERVICE
[Unit]
Description=Flaps - Rhamphor Node Daemon
Documentation=https://github.com/rhamphor/flaps
After=network.target
Wants=network.target

[Service]
Type=simple
User=${FLAPS_USER}
Group=${FLAPS_USER}
WorkingDirectory=${exec_path}
EnvironmentFile=/etc/flaps/env
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=5
StandardOutput=append:${FLAPS_LOG_DIR}/flaps.log
StandardError=append:${FLAPS_LOG_DIR}/flaps-error.log
LimitNOFILE=65536
LimitNPROC=4096
NoNewPrivileges=yes
PrivateTmp=yes
ProtectSystem=full

[Install]
WantedBy=multi-user.target
SERVICE

  systemctl daemon-reload
  systemctl enable flaps
  systemctl restart flaps
  success "Flaps systemd service installed and started"
}

setup_firewall() {
  if command -v ufw &>/dev/null; then
    ufw allow "$FLAPS_PORT/tcp" comment "Flaps Daemon" &>/dev/null || true
    info "UFW rule added for port $FLAPS_PORT"
  elif command -v firewall-cmd &>/dev/null; then
    firewall-cmd --permanent --add-port="$FLAPS_PORT/tcp" &>/dev/null || true
    firewall-cmd --reload &>/dev/null || true
    info "Firewalld rule added for port $FLAPS_PORT"
  fi
}

print_summary() {
  echo -e "\n${GREEN}${BOLD}╔══════════════════════════════════════════════════╗${RESET}"
  echo -e "${GREEN}${BOLD}║   Flaps Daemon Installed Successfully!           ║${RESET}"
  echo -e "${GREEN}${BOLD}╚══════════════════════════════════════════════════╝${RESET}\n"
  echo -e "  ${BOLD}Node ID:${RESET}     ${FLAPS_NODE_ID:-$(hostname)}"
  echo -e "  ${BOLD}Port:${RESET}        ${FLAPS_PORT}"
  echo -e "  ${BOLD}Token:${RESET}       ${YELLOW}${FLAPS_TOKEN}${RESET}"
  echo -e "  ${BOLD}Data Dir:${RESET}    ${FLAPS_DATA_DIR}"
  echo -e "  ${BOLD}Logs:${RESET}        ${FLAPS_LOG_DIR}/flaps.log"
  echo ""
  echo -e "  ${CYAN}${BOLD}Next steps:${RESET}"
  echo -e "  1. Go to your Rhamphor Panel → Nodes → Add Node"
  echo -e "  2. Enter FQDN: ${BOLD}$(hostname -f 2>/dev/null || hostname)${RESET}"
  echo -e "  3. Enter Port: ${BOLD}${FLAPS_PORT}${RESET}"
  echo -e "  4. Enter Token: ${YELLOW}${BOLD}${FLAPS_TOKEN}${RESET}"
  echo ""
  echo -e "  ${BOLD}Service commands:${RESET}"
  echo -e "  systemctl status flaps    # Check status"
  echo -e "  systemctl restart flaps   # Restart"
  echo -e "  journalctl -u flaps -f    # Follow logs"
  echo -e "  cat /etc/flaps/env        # View config"
  echo ""
}

main() {
  banner
  parse_args "$@"
  check_root
  detect_os

  header "System Dependencies"
  install_system_deps
  install_node

  header "Creating Flaps User"
  create_user

  header "Installing Daemon"
  install_daemon

  header "Configuration"
  generate_token
  write_env

  header "Systemd Service"
  install_systemd

  header "Firewall"
  setup_firewall

  print_summary
}

main "$@"
