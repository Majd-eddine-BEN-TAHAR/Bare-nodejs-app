const db = require("../db/database");
const serverError = require("../utils/serverError");

function comments(req, res) {
  if (req.method === "POST") {
    POST(req, res);
  } else {
    // Handle other HTTP methods or return an error.
    res.statusCode = 405;
    res.end();
  }
}

function POST(req, res) {
  if (!req.isLoggedIn) {
    res.writeHead(302, { Location: "/login" });
    res.end();
    return;
  }

  let body = "";
  req.on("data", (chunk) => {
    body += chunk.toString();
  });

  req.on("end", () => {
    try {
      const formData = new URLSearchParams(body);
      const postId = formData.get("post_id");
      const content = formData.get("content");

      const sql = `
        INSERT INTO comments (post_id, user_id, content) 
        VALUES (?, ?, ?)
      `;
      db.run(sql, [postId, req.user.userId, content], (err) => {
        if (err) {
          serverError(req, res, err);
          return;
        }
        // Redirect back to the post page or wherever appropriate
        res.writeHead(302, { Location: `/posts/${postId}` });
        res.end();
      });
    } catch (error) {
      serverError(req, res, error);
    }
  });
}

module.exports = comments;
