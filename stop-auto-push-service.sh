#!/bin/bash

# Stop the auto-push service
# This script stops the background service that automatically commits and pushes
# changes to GitHub.

echo "=== Stopping GitHub Auto-Push Service ==="

# Check if PID file exists
if [ -f ".auto-push-service.pid" ]; then
    # Read PID from file
    SERVICE_PID=$(cat .auto-push-service.pid)
    
    # Check if process is still running
    if ps -p $SERVICE_PID > /dev/null; then
        echo "Stopping Auto-Push Service with PID: $SERVICE_PID"
        kill $SERVICE_PID
        
        # Wait for process to stop
        sleep 1
        
        if ps -p $SERVICE_PID > /dev/null; then
            echo "Process still running, sending SIGKILL..."
            kill -9 $SERVICE_PID
        fi
        
        echo "Auto-Push Service stopped successfully"
    else
        echo "Auto-Push Service is not running (PID $SERVICE_PID not found)"
    fi
    
    # Remove PID file
    rm .auto-push-service.pid
else
    # Try to find and kill any auto-push-service processes
    echo "PID file not found. Attempting to stop any running auto-push services..."
    pkill -f "node auto-push-service.js"
    echo "Any running Auto-Push Services have been stopped"
fi

echo "To restart the service, run: bash start-auto-push-service.sh"