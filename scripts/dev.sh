#!/usr/bin/env bash
# Development script to run both Vite PWA and Node Bridge using tsx natively

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🏠 Booting Digital Sanctuary [DEV MODE]...${NC}"

# Kill spawned processes on exit
trap "kill 0" EXIT

# Start server node
echo -e "${BLUE}▶ Starting Mock Gateway Bridge (Port 3001)...${NC}"
cd packages/server && npm run dev &

# Start vite client
echo -e "${BLUE}▶ Starting Vite React Client (Port 5173)...${NC}"
cd packages/client && npm run dev &

wait
