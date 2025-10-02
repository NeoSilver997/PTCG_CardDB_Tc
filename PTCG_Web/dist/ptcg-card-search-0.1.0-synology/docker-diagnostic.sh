#!/bin/bash

# Docker Diagnostic Script for Synology NAS
# Run this script to diagnose Docker issues

echo "=== Docker Diagnostic Report ==="
echo "Date: $(date)"
echo ""

echo "1. Docker Installation Check:"
if command -v docker &> /dev/null; then
    echo "✓ Docker is installed: $(docker --version)"
else
    echo "✗ Docker is NOT installed"
    echo "  Please install Docker from Synology Package Center"
    exit 1
fi
echo ""

echo "2. Docker Service Status:"
if sudo systemctl is-active --quiet docker; then
    echo "✓ Docker service is running"
else
    echo "✗ Docker service is NOT running"
    echo "  Try: sudo systemctl start docker"
fi
echo ""

echo "3. Docker Permissions:"
if groups $USER | grep -q docker; then
    echo "✓ User '$USER' is in docker group"
else
    echo "✗ User '$USER' is NOT in docker group"
    echo "  Try: sudo usermod -aG docker $USER (then logout and login again)"
fi
echo ""

echo "4. System Resources:"
echo "Memory: $(free -h | grep '^Mem:' | awk '{print $3 "/" $2}')"
echo "Disk space: $(df -h / | tail -1 | awk '{print $4 " available"}')"
echo ""

echo "5. Port 3000 Status:"
if netstat -tlnp 2>/dev/null | grep -q :3000; then
    echo "✗ Port 3000 is already in use by:"
    netstat -tlnp | grep :3000
else
    echo "✓ Port 3000 is available"
fi
echo ""

echo "6. Docker Images:"
docker images 2>/dev/null | head -10 || echo "Cannot access Docker (permission issue?)"
echo ""

echo "7. Running Containers:"
docker ps 2>/dev/null | head -10 || echo "Cannot access Docker (permission issue?)"
echo ""

echo "=== End Report ==="
echo ""
echo "If you see permission errors, try running with sudo:"
echo "sudo $0"