#!/bin/bash

# Start the auto-push service in the background
# This script starts a background service that automatically commits and pushes
# changes to GitHub every 5 minutes.

echo "=== Starting GitHub Auto-Push Service ==="

# Kill any existing instances that might be running
pkill -f "node auto-push-service.js" >/dev/null 2>&1

# Start the service in the background
nohup node auto-push-service.js > auto-push.log 2>&1 &

# Get process ID
SERVICE_PID=$!

# Store PID in a file for later reference
echo $SERVICE_PID > .auto-push-service.pid

echo "Auto-Push Service started with PID: $SERVICE_PID"
echo "The service will automatically commit and push changes to GitHub every 5 minutes."
echo "To stop the service, run: bash stop-auto-push-service.sh"
echo "Log file: auto-push.log"