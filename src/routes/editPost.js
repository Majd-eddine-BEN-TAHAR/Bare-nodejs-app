const db = require("../db/database");
const baseLayout = require("../views/layouts/baseLayout");

function editPost(req, res) {
  if (!req.isLoggedIn) {
    redirect(res, "/login");
  }

  if (req.method === "GET") {
    GET(req, res);
  } else if (req.method === "POST") {
    POST(req, res);
  }
}

function GET(req, res) {
  const postId = req.params.id;

  // Fetch the post from the database
  const sql = `SELECT * FROM posts WHERE id = ? AND user_id = ?`;
  db.get(sql, [postId, req.user.userId], (err, post) => {
    if (err) {
      serverError(req, res, err);
      return;
    }

    if (!post) {
      redirect(res, "/posts");
      return;
    }
    const content = `
      <h2>Edit Post</h2>
      <form action="/posts/${post.id}" method="POST">
          <input type="text" name="title" placeholder="Enter post title" value="${
            post.title
          }" minLength="2" required>
          <textarea name="content" placeholder="Enter post content" required>${
            post.content
          }</textarea>
          <label>
            <input type="checkbox" name="is_public" ${
              post.is_public ? "checked" : ""
            }> Public
          </label>
          <button type="submit">Update Post</button>
      </form>`;
    res.status = 200;
    res.end(baseLayout(content, req.isLoggedIn));
  });
}

function POST(req, res) {
  // Parse the POST request data
  let body = "";
  req.on("data", (chunk) => {
    body += chunk.toString();
  });

  req.on("end", () => {
    try {
      const postData = new URLSearchParams(body);

      // Extract the values from the form
      const title = postData.get("title");
      const content = postData.get("content");
      const is_public = postData.get("is_public") === "on" ? 1 : 0;

      // Update the post in the database
      const postId = req.params.id;
      const sql = `UPDATE posts SET title = ?, content = ?, is_public = ? WHERE id = ? AND user_id = ?`;
      db.run(
        sql,
        [title, content, is_public, postId, req.user.userId],
        (err) => {
          if (err) {
            serverError(req, res, err);
            return;
          }

          // Redirect to the edited post or any other desired location
          redirect(res, "/posts");
        }
      );
    } catch (error) {
      // Handle any parsing errors here
      serverError(req, res, error);
    }
  });
}

// Function to perform a redirection
function redirect(res, location) {
  res.writeHead(302, { Location: location });
  res.end();
  return;
}

module.exports = editPost;
