const http = require("http");
const path = require("path");
const { URL } = require("url");
const routeHandlers = require("./routes");
const { parseCookies } = require("./utils/cookies.js");
const { validateSession } = require("./utils/middleware.js");
const handleDynamicRoutes = require("./utils/handleDynamicRoutes.js");
const ensureUploadsDir = require("./utils/ensureUploadsDir.js");
const handleStaticFileRequest = require("./utils/handleStaticFileRequest.js");
const UPLOADS_DIR = path.join(__dirname, "..", "uploads");

module.exports = UPLOADS_DIR;

// Ensure that the uploads directory exists
ensureUploadsDir(UPLOADS_DIR).catch(console.error);

const HOSTNAME = "127.0.0.1";
const PORT = 3000;

// Define static routes
const staticRoutes = {
  "/": routeHandlers.home,
  "/register": routeHandlers.register,
  "/login": routeHandlers.login,
  "/logout": routeHandlers.logout,
  "/posts": routeHandlers.posts,
  "/comments": routeHandlers.comments,
  "/profile": routeHandlers.profile,
};

// Define dynamic routes
const dynamicRoutes = {
  "/posts/:id": routeHandlers.viewPost,
  "/posts/edit/:id": routeHandlers.editPost,
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  req.cookies = parseCookies(req);

  if (handleStaticFileRequest("/uploads/", req, res, url)) return;
  if (handleStaticFileRequest("/public/", req, res, url)) return;

  validateSession(req, res, () => {
    req.isLoggedIn = req?.user?.sessionId;

    // First try dynamic routes
    if (handleDynamicRoutes(req, res, dynamicRoutes)) return;

    const routeHandler = staticRoutes[url.pathname];
    if (routeHandler) {
      routeHandler(req, res);
    } else {
      routeHandlers.notFound(req, res); // Handle not found
    }
  });
});

server.listen(PORT, HOSTNAME, () => {
  console.log(`Server running at http://${HOSTNAME}:${PORT}/`);
});
