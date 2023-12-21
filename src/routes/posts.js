const db = require("../db/database");
const baseLayout = require("../views/layouts/baseLayout");
const serverError = require("./../utils/serverError.js");

function posts(req, res) {
  if (!req.isLoggedIn) {
    redirect(res, "/login");
    return;
  }

  if (req.method === "GET") {
    GET(req, res);
  } else if (req.method === "POST") {
    POST(req, res);
  }
}

function GET(req, res) {
  // Fetch posts from the database
  // SQL query to select the user's private posts and all public posts
  const sql = `
      SELECT id, title, content, is_public, user_id 
      FROM posts 
      WHERE user_id = ? OR is_public = 1
 `;
  db.all(sql, [req.user.userId], (err, posts) => {
    if (err) {
      serverError(re, res, err);
      return;
    }

    const content = `
      <h1>Posts page</h1>
      <h2 style="text-decoration:underline">New Post</h2>
      <form action="/posts" method="post">
          <input type="text" name="title" placeholder="Enter post title" minLength="2" required>
          <textarea name="content" placeholder="Enter post content" required></textarea>
          <label>
            <input type="checkbox" name="is_public">Public
          </label>
          <button type="submit">Add Post</button>
      </form>
      <h2 style="text-decoration:underline">My Posts</h2>
      <ul> 
          ${posts
            .filter((post) => post.user_id === req.user.userId)
            .map(
              (post) => `
                  <div class="post-card">
                    <div class="post-title">
                      <p>${post.title}</p>
                      <div>
                        <a href="/posts/edit/${post.id}" class="edit-button" style="text-decoration: none;">
                          Edit post
                        </a>
                        <a href="/posts/${post.id}" class="edit-button" style="text-decoration: none;">
                          View post
                        </a>
                      </div>
                    </div>
                    <div class="post-content">${post.content}</div>
                    <div class="post-privacy ${post.is_public ? "public" : ""}">
                      <p>Post written by <span style="font-size:18px;font-weight:900;text-decoration:underline;">YOU</span>
                      </p>
                      <p>
                        ${post.is_public ? "Public" : "Private"}
                      </p>
                    </div>
                  </div>
              `
            )
            .join("")}
      </ul>

      <h2 style="text-decoration:underline">Users Public Posts</h2>
      <ul> 
          ${posts
            .filter((post) => {
              return post.user_id !== req.user.userId;
            })
            .map(
              (post) => `
                <div class="post-card">
                  <div class="post-title">
                    ${post.title}
                    <div>
                    <a href="/posts/${post.id}" class="edit-button" style="text-decoration: none;">
                      View post
                    </a>
                  </div>
                  </div>
                  <div class="post-content">${post.content}</div>
                  <div class="post-privacy">
                    <p>
                      Post written by <span style="font-size:18px;font-weight:900;text-decoration:underline;">user #${post.user_id}</span>
                    </p>
                  </div>
                </div>
              `
            )
            .join("")}
      </ul>
    `;

    res.statusCode = 200;
    res.setHeader("Content-Type", "text/html");
    res.end(baseLayout(content, req.isLoggedIn));
  });
}

function POST(req, res) {
  let body = "";

  // Event listener for 'data' event
  // This event is emitted whenever a new chunk of data is received.
  // Node.js HTTP server interfaces with TCP to receive data.
  // TCP breaks down data into smaller packets (chunks) for transmission.
  // These chunks are then reassembled upon receipt.
  req.on("data", (chunk) => {
    // Each 'chunk' is a Buffer object, representing part of the data sent.
    // This chunking is a feature of TCP, ensuring reliable and ordered data transfer.
    // The HTTP protocol, being on top of TCP, receives data in this chunked manner.
    body += chunk.toString(); // Convert Buffer to string

    // Note: While HTTP itself doesn't require data chunking,
    // the underlying TCP protocol's nature of sending data in packets is reflected in how Node.js exposes data in the HTTP request.
  });

  // Event listener for 'end' event
  // Triggred when there are no more data chunks to be received.
  req.on("end", () => {
    // At this point, all TCP data packets have been received and reassembled.
    // 'body' now contains the complete data sent in the HTTP request.

    const formData = new URLSearchParams(body);
    const title = formData.get("title");
    const content = formData.get("content");
    const isPublic = formData.has("is_public") ? 1 : 0;

    // Insert the new post into the database
    const sql = `
      INSERT INTO posts (user_id, title, content, is_public) 
      VALUES (?, ?, ?, ?)
    `;
    db.run(sql, [req.user.userId, title, content, isPublic], (err) => {
      if (err) {
        // Handle error
        serverError(req, res, err);
      }

      redirect(res, "/posts");
    });
  });
}

function redirect(res, location) {
  res.writeHead(302, { Location: location });
  res.end();
  return;
}

module.exports = posts;
