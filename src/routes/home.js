const baseLayout = require("../views/layouts/baseLayout");

function home(req, res) {
  const content = `
      <section class="welcome-section">
        <h1>Welcome to Posts!!!</h1>
        <p>Discover and share insights, stories, and ideas.</p>
        <a href="/posts" class="btn">Explore Posts</a>
      </section>
  `;

  res.setHeader("Content-Type", "text/html");
  res.end(baseLayout(content, req.isLoggedIn));
}

module.exports = home;
