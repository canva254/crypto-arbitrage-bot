/**
 * Auto-Push GitHub Service
 * 
 * This service periodically commits and pushes changes to GitHub.
 * It is designed to run in the background as a persistent service.
 * 
 * Usage: node auto-push-service.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const GITHUB_TOKEN_ENV = 'GITHUB_TOKEN';
const PUSH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const LOG_FILE = path.join(__dirname, 'auto-push.log');

// Ensure we have the GitHub token
if (!process.env[GITHUB_TOKEN_ENV]) {
  console.error(`Error: ${GITHUB_TOKEN_ENV} environment variable is not set.`);
  process.exit(1);
}

// Setup logging
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  
  console.log(logMessage.trim());
  
  // Also write to log file
  fs.appendFileSync(LOG_FILE, logMessage);
}

// Configure Git (only needs to be done once)
function configureGit() {
  try {
    execSync('git config --global user.name "canva254"');
    execSync('git config --global user.email "your-email@example.com"');
    execSync('git config --global credential.helper store');
    
    // Create credentials file with GitHub token
    const gitCredentials = `https://canva254:${process.env[GITHUB_TOKEN_ENV]}@github.com`;
    const gitCredentialsPath = path.join(process.env.HOME || process.env.USERPROFILE, '.git-credentials');
    
    fs.writeFileSync(gitCredentialsPath, gitCredentials);
    execSync(`chmod 600 ${gitCredentialsPath}`);
    
    log('Git credentials configured successfully');
  } catch (error) {
    log(`Error configuring Git: ${error.message}`);
    process.exit(1);
  }
}

// Push changes to GitHub
function pushChanges() {
  try {
    // Add all changes
    execSync('git add .');
    
    // Check if there are changes to commit
    const statusOutput = execSync('git status --porcelain').toString();
    
    if (!statusOutput.trim()) {
      log('No changes to commit');
      return;
    }
    
    // Commit with timestamp
    const timestamp = new Date().toISOString();
    execSync(`git commit -m "Auto-update: ${timestamp}"`);
    
    // Push to GitHub
    execSync('git push origin main');
    
    log('Successfully pushed changes to GitHub');
  } catch (error) {
    log(`Error pushing changes: ${error.message}`);
  }
}

// Main function
function main() {
  log('Starting Auto-Push Service');
  
  // Configure Git once at startup
  configureGit();
  
  // Run immediately once
  pushChanges();
  
  // Set up interval for periodic pushing
  log(`Setting up auto-push interval for every ${PUSH_INTERVAL_MS/1000} seconds`);
  setInterval(pushChanges, PUSH_INTERVAL_MS);
}

// Start the service
main();

// Handle graceful shutdown
process.on('SIGINT', function() {
  log('Auto-Push Service stopped');
  process.exit(0);
});