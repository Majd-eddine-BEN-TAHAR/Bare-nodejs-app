const db = require("../db/database");
const serverError = require("../utils/serverError");
const baseLayout = require("../views/layouts/baseLayout");

function viewPost(req, res) {
  if (!req.isLoggedIn) {
    redirect(res, "/login");
    return;
  }

  if (req.method === "GET") {
    GET(req, res);
  } else {
    // Handle other HTTP methods or return an error.
    res.statusCode = 405;
    res.end();
  }
}

function GET(req, res) {
  const postId = req.params.id;
  // Fetch the post and its comments from the database
  const postSql = `SELECT * FROM posts WHERE id = ?`;

  db.get(postSql, [postId], (err, post) => {
    if (err) {
      serverErrorrror(req, res, err);
      return;
    }

    if (!post) {
      redirect(res, "/posts");
      return;
    }

    const commentsSql = `
      SELECT c.*, u.username 
      FROM comments c 
      JOIN users u ON c.user_id = u.id 
      WHERE post_id = ?
    `;
    db.all(commentsSql, [postId], (err, comments) => {
      if (err) {
        serverError(req, res, err);
        return;
      }
      const content = renderPostWithComments(post, comments, req);
      res.statusCode = 200;
      res.end(baseLayout(content, req.isLoggedIn));
    });
  });
}

function renderPostWithComments(post, comments, req) {
  return `
        <div class="post-detail">
            <h2>${post.title}</h2>
            <p>${post.content}</p>
        </div>
        <div class="comments-section">
            <h3>Comments</h3>
            ${
              comments.length > 0
                ? comments
                    .map((comment) => {
                      return `<div class="comment">
                        <p><strong>${comment.username}:</strong> ${comment.content}</p>
                    </div>`;
                    })
                    .join("")
                : "<p>No comments yet.</p>"
            }
            <form action="/comments" method="post">
                <input type="hidden" name="post_id" value="${post.id}" />
                <textarea name="content" placeholder="Add a comment" required></textarea>
                <button type="submit">Post Comment</button>
            </form>
        </div>
    `;
}

function redirect(res, location) {
  res.writeHead(302, { Location: location });
  res.end();
  return;
}

module.exports = viewPost;
