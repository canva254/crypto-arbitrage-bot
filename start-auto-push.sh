#!/bin/bash

# start-auto-push.sh - Script to start the auto-push background process
# To use this script:
# 1. Open a new terminal/shell in Replit
# 2. Run: bash start-auto-push.sh
# The script will run in the background and automatically push changes to GitHub

echo "Starting auto-push background service..."

# Make sure the script is executable
chmod +x auto-push.sh

# Run the Node.js auto-push runner
node auto-push-runner.js &

echo "Auto-push service started! It will automatically commit and push changes to GitHub every 5 minutes."
echo "You can leave this terminal window open to keep the service running."
echo "Press Ctrl+C to stop the service."