const path = require("path");
const serveStaticFile = require("./serveStaticFile");

function handleStaticFileRequest(basePath, req, res, url) {
  if (url.pathname.startsWith(basePath)) {
    const filePath = path.join(
      __dirname,
      "..",
      "..",
      url.pathname.replace(new RegExp(`^${basePath}`), basePath.substring(1))
    );
    serveStaticFile(req, res, filePath);
    return true;
  }
  return false;
}

module.exports = handleStaticFileRequest;
