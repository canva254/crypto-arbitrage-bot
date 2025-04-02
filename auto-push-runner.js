/**
 * Auto-Push Runner
 * 
 * This script sets up a timer to periodically run the auto-push.sh script,
 * which commits and pushes changes to GitHub.
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Check if the auto-push.sh script exists
const scriptPath = path.join(__dirname, 'auto-push.sh');
if (!fs.existsSync(scriptPath)) {
  console.error('Error: auto-push.sh script not found');
  process.exit(1);
}

// Function to run the auto-push.sh script
function runAutoPush() {
  console.log(`[${new Date().toISOString()}] Running auto-push script...`);
  
  exec(`bash ${scriptPath}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing auto-push script: ${error.message}`);
      return;
    }
    
    if (stderr) {
      console.error(`Auto-push script stderr: ${stderr}`);
    }
    
    console.log(`Auto-push script output: ${stdout}`);
  });
}

// Run the script immediately once
runAutoPush();

// Set interval to run the script every 5 minutes (300000 ms)
const interval = 5 * 60 * 1000; // 5 minutes in milliseconds
setInterval(runAutoPush, interval);

console.log(`Auto-push runner started. Will push changes every ${interval/1000} seconds.`);

// Keep the script running
process.stdin.resume();

// Handle graceful shutdown
process.on('SIGINT', function() {
  console.log('Auto-push runner stopped.');
  process.exit(0);
});