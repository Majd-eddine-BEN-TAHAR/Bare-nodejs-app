const url = require("url"); // Import the url module
const db = require("../db/database");
const baseLayout = require("../views/layouts/baseLayout");

// routes/search.js
function search(req, res) {
  if (req.method === "GET") {
    GET(req, res);
  } else {
    res.statusCode = 405;
    res.end();
  }
}

function GET(req, res, url) {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);

  const query = new URLSearchParams(parsedUrl.search).get("q");

  if (!query) {
    res.end(baseLayout("Please enter a search query", req.isLoggedIn));
    return;
  }

  // SQL query to select public posts that match the search criteria
  // and private posts of the logged-in user that match the search criteria
  const sql = `
    SELECT * FROM posts 
    WHERE (is_public = 1 AND (title LIKE ? OR content LIKE ?))
    OR (user_id = ? AND (title LIKE ? OR content LIKE ?))
  `;
  const params = [
    `%${query}%`,
    `%${query}%`,
    req.user.userId,
    `%${query}%`,
    `%${query}%`,
  ];

  db.all(sql, params, (err, posts) => {
    if (err) {
      res.statusCode = 500;
      res.end(baseLayout("An error occurred", req.isLoggedIn));
      return;
    }

    const content = renderSearchResults(posts);
    res.end(baseLayout(content, req.isLoggedIn));
  });
}

// routes/search.js
function renderSearchResults(posts, req) {
  if (posts.length === 0) {
    return "<p>No posts found.</p>";
  }

  return `
    <h1>Search Results</h1>
    <ul>
      ${posts
        .map(
          (post) => `
        <div class="post-card">
          <div class="post-title">
            <h2>${post.title}</h2>
            <div>
              <a href="/posts/${
                post.id
              }" class="edit-button" style="text-decoration: none;">View post</a>
            </div>
          </div>
          <div class="post-content">${post.content}</div>
          <div class="post-privacy ${post.is_public ? "public" : ""}">
            <p>Post written by <span style="font-size:18px;font-weight:900;text-decoration:underline;">user #${
              post.user_id
            }</span></p>
            <p>${post.is_public ? "Public" : "Private"}</p>
          </div>
        </div>
      `
        )
        .join("")}
    </ul>
  `;
}
module.exports = search;
