# PTCG Card Search - Synology NAS Deployment Summary

## 📦 Deployment Package Created

Due to disk space constraints, I've created a deployment package structure with all necessary files except the large card images directory.

## 📁 Package Structure

```
ptcg-card-search-0.1.0-synology/
├── DEPLOYMENT_README.md          # Complete installation guide
├── Dockerfile                    # Docker container configuration
├── docker-compose.yml           # Docker Compose setup
├── package.json                 # Node.js dependencies
├── package-lock.json           # Dependency lock file
├── next.config.js              # Next.js configuration
├── start.sh                     # Startup script
├── synology-config.conf        # Synology configuration
├── synology-install.sh         # Installation script
├── src/                        # Application source code
├── public/                     # Static assets
├── data/                       # Application data files
└── cards/                      # ⚠️  COPY SEPARATELY (~2GB)
```

## 🚀 Quick Deployment Guide

### For Docker (Recommended):
1. **Install Docker** on your Synology NAS
2. **Copy the package** to your NAS (all files except `cards/`)
3. **Copy card images** from your `cards/` directory (~2GB)
4. **Run**: `docker-compose up -d`
5. **Access**: `http://your-nas-ip:3000`

### For Direct Installation:
1. **Install Node.js v20** on your Synology NAS
2. **Copy all files** to `/volume1/docker/ptcg-card-search/`
3. **Copy card images** to the `cards/` subdirectory
4. **Run**: `sudo ./synology-install.sh install`
5. **Access**: `http://your-nas-ip:3000`

## ⚙️ Key Configuration Files

### Environment Variables (.env)
```bash
NODE_ENV=production
PORT=3000
NODE_OPTIONS=--max-old-space-size=512
```

### Docker Compose (docker-compose.yml)
- Port mapping: `3000:3000`
- Volume mounts for data persistence
- Health checks included

### Synology Service (synology-install.sh)
- Systemd service creation
- Automatic startup configuration
- Log management

## 📊 Application Features

✅ **Card Search** - Search by name, type, rarity, ability
✅ **Inventory Management** - Track collection with sorting
✅ **Market Prices** - HKD pricing with real-time updates
✅ **Deck Builder** - Create and manage Pokemon decks
✅ **Multi-language** - English and Chinese support
✅ **Responsive Design** - Mobile-friendly interface

## 🔧 Technical Specifications

- **Framework**: Next.js 14.2.3 with App Router
- **Runtime**: Node.js 20.x required
- **Database**: JSON file-based (no external DB needed)
- **Memory**: 512MB minimum, 1GB recommended
- **Storage**: 500MB + 2GB for card images
- **Platform**: Synology DSM 7.x compatible

## 📋 Prerequisites Checklist

- [ ] Synology NAS with DSM 7.x or later
- [ ] Node.js v20.x installed (or Docker)
- [ ] 500MB free disk space (plus 2GB for images)
- [ ] Port 3000 available
- [ ] SSH access (for direct installation)

## 🐛 Troubleshooting

### Common Issues:
1. **Port 3000 in use** → Change PORT in .env file
2. **Memory issues** → Increase NODE_OPTIONS memory limit
3. **Permission errors** → Check file ownership (should be ptcg:ptcg)
4. **Images not loading** → Verify cards/ directory is copied correctly

### Log Locations:
- **Docker**: `docker-compose logs`
- **Direct**: `journalctl -u ptcg-card-search`
- **Application**: Check browser developer tools

## 🔄 Updates

To update the application:
1. Stop the current instance
2. Copy new files (except data/ and cards/)
3. Start the application
4. Data will be preserved automatically

## 📞 Support

The application includes comprehensive logging and health checks. Check the DEPLOYMENT_README.md file for detailed instructions.

---

**Ready for Synology NAS deployment!** 🚀

**Package Location**: `dist/ptcg-card-search-0.1.0-synology/`
**Documentation**: `DEPLOYMENT_README.md`
**Quick Start**: Use Docker method for easiest deployment