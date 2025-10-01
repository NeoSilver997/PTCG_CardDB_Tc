#!/bin/bash

# PTCG Card Search - Synology NAS Deployment Script
# Version: 0.1.0
# Compatible with: Synology DSM 7.x, Node.js 20.x

set -e

# Configuration
APP_NAME="ptcg-card-search"
APP_VERSION="0.1.0"
NODE_VERSION_REQUIRED="20.0.0"
INSTALL_DIR="/var/packages/${APP_NAME}/target"
DATA_DIR="/var/packages/${APP_NAME}/var"
LOG_DIR="/var/log/packages/${APP_NAME}"
TEMP_DIR="/tmp/${APP_NAME}_install"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check system requirements
check_requirements() {
    log_info "Checking system requirements..."

    # Check Node.js version
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi

    NODE_VERSION=$(node -v | sed 's/v//')
    if ! [ "$(printf '%s\n' "$NODE_VERSION_REQUIRED" "$NODE_VERSION" | sort -V | head -n1)" = "$NODE_VERSION_REQUIRED" ]; then
        log_error "Node.js version $NODE_VERSION is too old. Required: $NODE_VERSION_REQUIRED or higher"
        exit 1
    fi
    log_success "Node.js version: $NODE_VERSION"

    # Check available disk space
    AVAILABLE_SPACE=$(df / | tail -1 | awk '{print $4}')
    REQUIRED_SPACE=$((500*1024)) # 500MB in KB
    if [ "$AVAILABLE_SPACE" -lt "$REQUIRED_SPACE" ]; then
        log_error "Insufficient disk space. Required: 500MB, Available: $(($AVAILABLE_SPACE/1024))MB"
        exit 1
    fi
    log_success "Disk space check passed"

    # Check if port 3000 is available
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null; then
        log_warning "Port 3000 is already in use. The application may not start properly."
    fi
}

# Create directories
create_directories() {
    log_info "Creating directories..."

    mkdir -p "$INSTALL_DIR"
    mkdir -p "$DATA_DIR"
    mkdir -p "$LOG_DIR"
    mkdir -p "$TEMP_DIR"

    log_success "Directories created"
}

# Install dependencies
install_dependencies() {
    log_info "Installing Node.js dependencies..."

    cd "$INSTALL_DIR"

    # Copy package files
    cp -r /tmp/package*.json ./

    # Install production dependencies
    npm ci --only=production --no-audit --no-fund

    log_success "Dependencies installed"
}

# Setup application
setup_application() {
    log_info "Setting up application..."

    cd "$INSTALL_DIR"

    # Copy application files (excluding development files)
    rsync -av --exclude='node_modules' \
             --exclude='.git' \
             --exclude='.next' \
             --exclude='*.log' \
             --exclude='.DS_Store' \
             --exclude='*.tmp' \
             /tmp/ "$INSTALL_DIR/"

    # Build the application
    log_info "Building application..."
    npm run build

    # Set permissions
    chown -R ptcg:ptcg "$INSTALL_DIR"
    chown -R ptcg:ptcg "$DATA_DIR"
    chown -R ptcg:ptcg "$LOG_DIR"

    log_success "Application setup completed"
}

# Create systemd service
create_service() {
    log_info "Creating systemd service..."

    cat > "/usr/lib/systemd/system/${APP_NAME}.service" << EOF
[Unit]
Description=PTCG Card Search
After=network.target
Wants=network.target

[Service]
Type=simple
User=ptcg
Group=ptcg
WorkingDirectory=${INSTALL_DIR}
Environment=NODE_ENV=production
Environment=NODE_OPTIONS=--max-old-space-size=512
Environment=PORT=3000
ExecStart=${INSTALL_DIR}/start.sh
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=${APP_NAME}

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    systemctl enable "${APP_NAME}.service"

    log_success "Service created and enabled"
}

# Start application
start_application() {
    log_info "Starting application..."

    systemctl start "${APP_NAME}.service"

    # Wait for application to start
    sleep 10

    # Check if application is running
    if systemctl is-active --quiet "${APP_NAME}.service"; then
        log_success "Application started successfully"
    else
        log_error "Failed to start application"
        systemctl status "${APP_NAME}.service"
        exit 1
    fi
}

# Verify installation
verify_installation() {
    log_info "Verifying installation..."

    # Check if service is running
    if ! systemctl is-active --quiet "${APP_NAME}.service"; then
        log_error "Service is not running"
        return 1
    fi

    # Check if application is responding
    if curl -f -s "http://localhost:3000/api/test-currency" > /dev/null; then
        log_success "Application is responding correctly"
    else
        log_warning "Application is running but not responding to health check"
    fi

    log_success "Installation verification completed"
}

# Main installation function
main() {
    log_info "Starting PTCG Card Search installation for Synology NAS"
    log_info "Version: $APP_VERSION"
    log_info "Node.js requirement: $NODE_VERSION_REQUIRED"

    check_requirements
    create_directories
    install_dependencies
    setup_application
    create_service
    start_application
    verify_installation

    log_success "PTCG Card Search has been successfully installed!"
    log_info "Access the application at: http://$(hostname):3000"
    log_info "Service management: systemctl {start|stop|restart} ${APP_NAME}"
    log_info "Logs: journalctl -u ${APP_NAME} -f"
}

# Handle command line arguments
case "${1:-}" in
    "install")
        main
        ;;
    "uninstall")
        log_info "Uninstalling PTCG Card Search..."
        systemctl stop "${APP_NAME}.service" 2>/dev/null || true
        systemctl disable "${APP_NAME}.service" 2>/dev/null || true
        rm -f "/usr/lib/systemd/system/${APP_NAME}.service"
        systemctl daemon-reload
        rm -rf "$INSTALL_DIR"
        rm -rf "$DATA_DIR"
        rm -rf "$LOG_DIR"
        log_success "Uninstallation completed"
        ;;
    "status")
        systemctl status "${APP_NAME}.service"
        ;;
    "restart")
        systemctl restart "${APP_NAME}.service"
        ;;
    *)
        echo "Usage: $0 {install|uninstall|status|restart}"
        echo ""
        echo "Commands:"
        echo "  install   - Install PTCG Card Search"
        echo "  uninstall - Uninstall PTCG Card Search"
        echo "  status    - Show service status"
        echo "  restart   - Restart the service"
        exit 1
        ;;
esac