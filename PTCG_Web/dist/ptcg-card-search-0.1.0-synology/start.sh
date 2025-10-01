#!/bin/bash

# PTCG Card Search - Synology NAS Deployment Script
# This script sets up and runs the PTCG Card Search application on Synology NAS

echo "🚀 Starting PTCG Card Search deployment on Synology NAS..."

# Set Node.js environment
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=512"

# Set the port (default to 3000, can be overridden by environment variable)
PORT=${PORT:-3000}
export PORT=$PORT

echo "📡 Starting server on port $PORT..."

# Change to the application directory
cd "$(dirname "$0")"

# Start the Next.js application
echo "🎯 Launching PTCG Card Search..."
exec npm start