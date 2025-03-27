const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.resolve(process.cwd(), 'logs');
console.log('Creating logs directory at:', logsDir);

try {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
    console.log('Logs directory created successfully');
  }
} catch (error) {
  console.error('Error creating logs directory:', error);
}

// Function to log to file and console
const logToFile = (message) => {
  try {
    const logPath = path.join(logsDir, 'upload.log');
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp}: ${message}\n`;
    fs.appendFileSync(logPath, logMessage);
    console.log('LOG:', message);
  } catch (error) {
    console.error('Error writing to log file:', error);
  }
};

module.exports = { logToFile };
