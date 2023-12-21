const { promisify } = require("util"); // Utility to convert callback-based functions to promises
const fs = require("fs"); // File system operations

// Convert fs.mkdir, and fs.exists to their promise-based counterparts
const mkdirAsync = promisify(fs.mkdir);
const existsAsync = promisify(fs.exists);

async function ensureUploadsDir(uploadDirectory) {
  if (!(await existsAsync(uploadDirectory))) {
    // Check if the directory exists
    await mkdirAsync(uploadDirectory); // Create the directory if it does not exist
  }
}

module.exports = ensureUploadsDir;
