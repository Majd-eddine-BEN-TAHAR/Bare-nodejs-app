const baseLayout = require("../views/layouts/baseLayout");

function notFound(req, res) {
  const content = `<h1>404 : <span style="color:red">Not Found</span></h1>`;
  res.statusCode = 404;
  res.setHeader("Content-Type", "text/html");
  res.end(baseLayout(content, req.isLoggedIn));
}

module.exports = notFound;
