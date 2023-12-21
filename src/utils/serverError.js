const baseLayout = require("../views/layouts/baseLayout");

function serverError(req, res, err) {
  console.log(err);
  const content = `<h1 style="color:red">500 Server error</h1>`;
  res.statusCode = 500;
  res.setHeader("Content-Type", "text/html");
  res.end(baseLayout(content, req.isLoggedIn));
}

module.exports = serverError;
