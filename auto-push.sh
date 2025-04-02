#!/bin/bash

# Auto-push script for Replit to GitHub synchronization
# This script checks for changes, commits them, and pushes to GitHub

# Change to the project directory
cd "$(dirname "$0")"

# Configure git credentials if not already done
if ! git config --get user.name > /dev/null; then
  git config --global user.name "canva254"
  git config --global user.email "your-email@example.com"
fi

# Make sure git credential helper is set up
if ! git config --get credential.helper > /dev/null; then
  git config --global credential.helper store
  # Create credentials file if it doesn't exist
  if [ ! -f ~/.git-credentials ]; then
    echo "https://canva254:${GITHUB_TOKEN}@github.com" > ~/.git-credentials
    chmod 600 ~/.git-credentials
  fi
fi

# Add all changes
git add .

# Check if there are changes to commit
if git diff-index --quiet HEAD --; then
  echo "No changes detected. Nothing to commit."
  exit 0
else
  # Get the current timestamp
  TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
  
  # Commit with a timestamp message
  git commit -m "Auto-update: ${TIMESTAMP}"
  
  # Push to GitHub
  git push origin main
  
  echo "Changes committed and pushed to GitHub at ${TIMESTAMP}"
fi