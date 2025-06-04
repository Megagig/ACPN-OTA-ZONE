#!/bin/bash
# start-with-caching.sh
# Start both frontend and backend with full caching enabled

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting ACPN Ota Zone with caching enabled...${NC}"
echo

# Check if Redis is running
redis-cli ping > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo -e "${RED}Redis server is not running. Starting Redis...${NC}"
  redis-server &
  sleep 2
fi

# Create tmux session
tmux new-session -d -s acpn-ota-zone

# Split window horizontally
tmux split-window -h -t acpn-ota-zone

# Start backend in first pane
tmux send-keys -t acpn-ota-zone:0.0 "cd /home/megagig/PROJECTS/MERN/acpn-ota-zone/backend && REDIS_ENABLED=true npm run dev" C-m

# Start frontend in second pane
tmux send-keys -t acpn-ota-zone:0.1 "cd /home/megagig/PROJECTS/MERN/acpn-ota-zone/frontend && npm run dev" C-m

# Attach to the session
tmux attach-session -t acpn-ota-zone

echo -e "${GREEN}Servers are starting...${NC}"
echo "You can detach from the tmux session with Ctrl+B followed by D"
echo "To reattach later, run: tmux attach-session -t acpn-ota-zone"
