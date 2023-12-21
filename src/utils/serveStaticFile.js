const fs = require("fs");
const path = require("path");
const mimeTypes = require("./mimeTypes");

function serveStaticFile(req, res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === "ENOENT") {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found");
      } else {
        res.writeHead(500);
        res.end("Internal Server Error");
      }
      return;
    }

    const extension = path.extname(filePath);
    const contentType = mimeTypes[extension] || "application/octet-stream";

    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  });
}

module.exports = serveStaticFile;
