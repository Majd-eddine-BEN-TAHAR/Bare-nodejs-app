const db = require("../db/database");
const serverError = require("../utils/serverError");

function logout(req, res) {
  res.setHeader("Set-Cookie", "sessionId=; max-age=0");
  res.writeHead(302, { Location: "/" });
  res.end();
}

module.exports = logout;

function logout(req, res) {
  if (req.isLoggedIn) {
    // Invalidate the session in the database
    db.run(
      "DELETE FROM sessions WHERE sessionId = ?",
      [req.user.sessionId],
      (err) => {
        //   handle server error
        if (err) {
          serverError(req, res, err);
        } else {
          // Clear the session cookie
          res.setHeader("Set-Cookie", "sessionId=;Max-Age=0");
          redirect(res, "/login");
        }
      }
    );
  } else {
    // If no session is found, just redirect to the login page
    redirect(res, "/login");
  }
}

function redirect(res, location) {
  res.writeHead(302, { Location: location });
  res.end();
  return;
}

module.exports = logout;
