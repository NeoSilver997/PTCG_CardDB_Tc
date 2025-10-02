# PTCG Card Search - Synology NAS Deployment Package

## 📦 Package Contents

This deployment package contains the PTCG Card Search web application optimized for Synology NAS with Node.js v20.

### Files Included:
- `package.json` & `package-lock.json` - Node.js dependencies
- `next.config.js` - Next.js configuration
- `src/` - Application source code
- `public/` - Static assets
- `data/` - Application data (inventory, market prices, etc.)
- `Dockerfile` - Docker container configuration
- `docker-compose.yml` - Docker Compose setup
- `start.sh` - Startup script
- `synology-config.conf` - Synology-specific configuration
- `synology-install.sh` - Installation script for direct deployment

### Files NOT Included (Copy Separately):
- `cards/` directory (~2GB) - Card images
- `node_modules/` - Dependencies (will be installed during deployment)

## 🚀 Deployment Options

### Option 1: Docker (Recommended)

1. **Install Docker** on your Synology NAS via Package Center
2. **Copy the package** to your NAS (excluding the large `cards/` directory)
3. **Copy card images** separately to the `cards/` directory
4. **Run Docker Compose**:
   ```bash
   docker-compose up -d
   ```
5. **Access** at `http://your-nas-ip:3000`

### Option 2: Direct Installation

1. **SSH into your NAS** as admin
2. **Copy files** to a directory (e.g., `/volume1/docker/ptcg-card-search`)
3. **Copy card images** to the `cards/` subdirectory
4. **Run installation**:
   ```bash
   chmod +x synology-install.sh
   sudo ./synology-install.sh install
   ```
5. **Access** at `http://your-nas-ip:3000`

## 📋 Prerequisites

- **Synology NAS** with DSM 7.x or later
- **Node.js v20.x** (install via Synology Package Center)
- **500MB free space** (plus ~2GB for card images)
- **Port 3000** available (or configure custom port)

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the application directory:

```bash
# Application Configuration
NODE_ENV=production
PORT=3000

# Memory Configuration (adjust for your NAS)
NODE_OPTIONS=--max-old-space-size=512
```

### Custom Port

To use a different port, set the PORT environment variable:
```bash
export PORT=8080
```

## 📊 Features

- **Card Search**: Search Pokemon TCG cards by name, type, rarity
- **Inventory Management**: Track your card collection with sorting
- **Market Prices**: View current market prices in HKD
- **Deck Builder**: Create and manage Pokemon decks
- **Multi-language**: English and Chinese support

## 🔧 Management

### Docker Commands
```bash
# View logs
docker-compose logs -f

# Restart
docker-compose restart

# Stop
docker-compose down

# Update (after copying new files)
docker-compose pull && docker-compose up -d
```

### Direct Installation Commands
```bash
# Check status
sudo ./synology-install.sh status

# Restart service
sudo ./synology-install.sh restart

# Stop service
sudo systemctl stop ptcg-card-search
```

## 📁 Data Management

### Important Directories
- `data/` - Application data (inventory, market prices, etc.)
- `cards/` - Card images (copy separately due to size)
- `logs/` - Application logs

### Backup
Regularly backup the `data/` directory to preserve your inventory.

## 🐛 Troubleshooting

### Docker Won't Start

#### Quick Diagnostic
Run the included diagnostic script:
```bash
chmod +x docker-diagnostic.sh
./docker-diagnostic.sh
```

#### Manual Checks
```bash
# Check if Docker is installed
docker --version

# Check if Docker service is running
sudo systemctl status docker
```

#### 2. Start Docker Service
```bash
# Start Docker service
sudo systemctl start docker

# Enable Docker to start on boot
sudo systemctl enable docker
```

#### 3. Check Docker Permissions
```bash
# Add your user to docker group (log out and back in after)
sudo usermod -aG docker $USER

# Or run with sudo
sudo docker --version
```

#### 4. Check Available Resources
```bash
# Check memory
free -h

# Check disk space
df -h

# Check if port 3000 is available
netstat -tlnp | grep :3000
```

#### 5. Clean Up and Retry
```bash
# Stop all containers
docker stop $(docker ps -aq)

# Remove all containers
docker rm $(docker ps -aq)

# Remove unused images
docker image prune -f

# Try starting again
docker-compose up -d
```

### Application Won't Start in Docker

#### Check Container Logs
```bash
# View container logs
docker-compose logs -f ptcg-card-search

# Or check specific container
docker logs ptcg-card-search
```

#### Common Issues:
- **Port already in use**: Change port in `docker-compose.yml`
- **Memory issues**: Reduce `NODE_OPTIONS=--max-old-space-size=256`
- **Missing volumes**: Ensure `data/` and `cards/` directories exist

### Application Won't Start
1. Check Node.js v20.x is installed
2. Verify port 3000 is not in use
3. Check system logs: `journalctl -u ptcg-card-search -f`
4. Ensure sufficient memory (512MB recommended)

### Performance Issues
1. Increase Node.js memory: `NODE_OPTIONS=--max-old-space-size=1024`
2. Check system resources usage
3. Consider using SSD storage

### Port Conflicts
Change the default port in your `.env` file:
```
PORT=8080
```

## 📞 Support

For issues, check the application logs and ensure all prerequisites are met.

---

**Package Version**: 0.1.0
**Node.js Requirement**: 20.0.0+
**Estimated Size**: ~50MB (plus ~2GB for card images)
**Last Updated**: October 1, 2025