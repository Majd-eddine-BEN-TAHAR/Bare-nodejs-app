const fs = require("fs");
const path = require("path");
const { promisify } = require("util");
const fileType = require("file-type");
const writeFileAsync = promisify(fs.writeFile);
const existsAsync = promisify(fs.exists);

const MAX_FILE_SIZE = 1 * 1024 * 1024; // Max file size set to 1MB
const UPLOADS_DIR = path.join(__dirname, "..", "..", "uploads");

async function storeFiles(validFiles) {
  for (const file of validFiles) {
    try {
      const originalFilename = file.filename;
      const safeFilename = sanitizeFilename(originalFilename);
      const uniqueFilename = await generateUniqueFilename(safeFilename);
      const filePath = path.join(UPLOADS_DIR, uniqueFilename);

      await writeFileAsync(filePath, file.data);
      file.savedAs = uniqueFilename; // Store the saved filename for further reference
    } catch (error) {
      throw new Error(`Failed to save file ${file.filename}: ${error.message}`);
    }
  }
}

async function processFileUploads(fileParts) {
  const uploadResults = {
    validFiles: [],
    errors: [],
  };

  for (const part of fileParts) {
    if (part.filename) {
      // Validate file size

      if (part.data.length > MAX_FILE_SIZE) {
        uploadResults.errors.push({
          filename: part.filename,
          error: `File size exceeds limit (${bytesToKilobytes(
            MAX_FILE_SIZE
          )} KB)`,
        });
        continue;
      }
      // Check file type (assuming images only)
      const partFileType = await fileType.fromBuffer(part.data);

      if (!partFileType || !partFileType.mime.startsWith("image/")) {
        uploadResults.errors.push({
          filename: part.filename,
          error: "Invalid file type. Only image files are allowed.",
        });
        continue;
      }

      // File is valid, add to validFiles array
      part.fileType = partFileType.mime; // Store MIME type for further use
      uploadResults.validFiles.push(part);
    }
  }

  return uploadResults;
}

async function validateTextInputs(textInputs, userId, db) {
  const errors = {};

  if (!textInputs) {
    return { general: "No input received." };
  }

  if (!textInputs.username || textInputs.username.length < 4) {
    errors.username = "Username must be at least 4 characters long.";
  }

  if (textInputs.password && textInputs.password.length < 4) {
    errors.password = "Password must be at least 4 characters long.";
  }

  if (textInputs.username) {
    const usernameExists = await checkUsernameExists(
      textInputs.username,
      userId,
      db
    );
    if (usernameExists) {
      errors.usernameExists =
        "The username already exists. Please choose another one.";
    }
  }

  return errors;
}

async function checkUsernameExists(username, userId, db) {
  const sql = `SELECT COUNT(*) AS count FROM users WHERE username = ? AND id != ?`;
  return new Promise((resolve, reject) => {
    db.get(sql, [username, userId], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row.count > 0);
      }
    });
  });
}

async function parseFormData(req, MAX_TOTAL_REQUEST_SIZE) {
  // Extract the boundary from the Content-Type header
  const boundary = getBoundary(req.headers["content-type"]);
  const buffer = [];
  let totalSize = 0;

  // Read data chunks from the request
  for await (const chunk of req) {
    totalSize += chunk.length;
    if (totalSize > MAX_TOTAL_REQUEST_SIZE) {
      throw new Error("Total request size exceeds limit");
    }
    buffer.push(chunk);
  }

  // Combine all chunks to form the complete data
  const data = Buffer.concat(buffer);
  const parts = splitMultipart(data, boundary);

  // Separating file parts and text inputs
  let files = [];
  let textInputs = {};

  for (const part of parts) {
    if (part.filename) {
      // This is a file part
      files.push(part);
    } else {
      // This is a text input
      const contentDisposition = part.headers["content-disposition"];
      if (contentDisposition && contentDisposition.name) {
        const inputName = contentDisposition.name;
        textInputs[inputName] = part.data.toString("utf8");
      }
    }
  }

  return { files, textInputs };
}

// Function to extract the boundary from the Content-Type header
function getBoundary(contentType) {
  // Robust check for null or undefined contentType
  if (!contentType) {
    throw new Error("Content-Type header is missing or undefined");
  }

  // Using a more explicit search for the boundary key
  const boundaryPrefix = "boundary=";
  const boundaryIndex = contentType.indexOf(boundaryPrefix);
  if (boundaryIndex === -1) {
    throw new Error("Boundary not found in Content-Type header");
  }

  // Extracting the boundary value
  return contentType.substring(boundaryIndex + boundaryPrefix.length);
}

// Function to split multipart data into parts using the boundary
function splitMultipart(buffer, boundary) {
  try {
    const parts = []; // Create an array to store the individual parts
    const boundaryBuffer = Buffer.from(`--${boundary}`); // Convert the boundary string into a Buffer

    let start = buffer.indexOf(boundaryBuffer) + boundaryBuffer.length + 2; // Find the starting position of the first boundary in the buffer
    let end = buffer.indexOf(boundaryBuffer, start); // Find the ending position of the first part

    // Checking if the boundary is not found in the buffer
    if (start === boundaryBuffer.length + 1) {
      throw new Error("Boundary not found in the buffer");
    }

    // Iterate through the buffer to extract parts
    while (end > -1) {
      // Adding check for overlapping boundaries or incorrect parsing
      if (start >= end) {
        throw new Error("Overlapping boundaries or incorrect multipart format");
      }

      // Extract the part content between start and end
      const partBuffer = buffer.slice(start, end - 2); // -2 to remove trailing '\r\n'

      const part = parsePart(partBuffer); // Parse the part content using a function named parsePart
      parts.push(part); // Add the parsed part to the parts array

      start = end + boundaryBuffer.length + 2; // Move to the start of the next part
      end = buffer.indexOf(boundaryBuffer, start); // Find the ending position of the next part
    }

    return parts;
  } catch (error) {
    // Handle errors by re-throwing them with an additional message
    throw new Error(`Error parsing multipart data: ${error.message}`);
  }
}

// Function to parse a part of the multipart data
function parsePart(buffer) {
  const headersEnd = buffer.indexOf("\r\n\r\n"); // Find the end of the headers section
  const headersString = buffer.slice(0, headersEnd).toString(); // Extract the headers string
  const data = buffer.slice(headersEnd + 4); // Extract the data part, skipping the headers and two '\r\n'
  const headers = parseHeaders(headersString); // Parse the headers string into an object

  // Return an object containing the parsed headers, data, and filename (if present)
  return {
    headers: headers,
    data: data,
    filename: headers["content-disposition"]
      ? headers["content-disposition"].filename
      : null,
  };
}

// Function to parse the headers string into an object
// function parseHeaders(headersString) {
//   const headers = {}; // Object to hold the parsed headers
//   const lines = headersString.split("\r\n"); // Split the string into lines

//   // Iterate over each line to parse headers
//   lines.forEach((line) => {
//     const parts = line.split(": "); // Split each line into key and value
//     const header = parts[0].toLowerCase();
//     const value = parts[1];

//     // Check if the current header is 'Content-Disposition'
//     if (header === "content-disposition") {
//       const disposition = {}; // Initialize an empty object to store parsed key-value pairs

//       // Split the header value by '; ' to get individual properties
//       value.split("; ").forEach((item) => {
//         const itemParts = item.split("="); // Split each property into key and value
//         if (itemParts.length === 2) {
//           // Ensure that the property has both key and value
//           const key = itemParts[0].trim(); // Remove whitespace from the key
//           let val = itemParts[1].trim(); // Remove whitespace from the value

//           val = val.replace(/"/g, ""); // Remove any double quotes that might be wrapping the value
//           disposition[key] = val; // Add the parsed key-value pair to the 'disposition' object
//         }
//       });

//       // Add the 'disposition' object to the headers object with the key 'content-disposition'
//       headers[header] = disposition;
//     }
//   });

//   return headers; // Return the parsed headers object
// }

function parseHeaders(headersString) {
  const headers = {};
  headersString.split("\r\n").forEach((line) => {
    const [key, value] = line.split(": ");
    headers[key.toLowerCase()] = parseHeaderValue(value);
  });
  return headers;
}

function parseHeaderValue(value) {
  if (!value) return {};

  const parts = value.split("; ").reduce((acc, part) => {
    const equalsIndex = part.indexOf("=");
    if (equalsIndex !== -1) {
      const key = part.substring(0, equalsIndex).trim();
      let val = part.substring(equalsIndex + 1).trim();

      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.substring(1, val.length - 1);
      }
      acc[key] = val;
    }
    return acc;
  }, {});

  return parts;
}

function sanitizeFilename(filename) {
  // Remove potentially harmful characters from the filename
  return filename.replace(/[^a-z0-9.]/gi, "_");
}

async function generateUniqueFilename(filename) {
  let counter = 0;
  let uniqueFilename = filename;
  while (await existsAsync(path.join(UPLOADS_DIR, uniqueFilename))) {
    const extension = path.extname(filename);
    const name = path.basename(filename, extension);
    uniqueFilename = `${name}_${++counter}${extension}`;
  }
  return uniqueFilename;
}

function bytesToKilobytes(bytes) {
  return (bytes / 1024).toFixed(2); // Convert to KB and round to 2 decimal places
}
module.exports = {
  parseFormData,
  validateTextInputs,
  processFileUploads,
  storeFiles,
};
