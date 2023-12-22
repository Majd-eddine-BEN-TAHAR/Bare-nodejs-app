const navbar = require("./navbar");

function header(isLoggedIn) {
  let searchBar = "";
  if (isLoggedIn) {
    searchBar = `
      <form action="/search" method="GET" class="search-form">
        <input type="text" name="q" placeholder="Search posts">
        <button type="submit">Search</button>
      </form>
    `;
  }

  return `
        <header>
          ${navbar(isLoggedIn)}
          ${searchBar}
        </header>
    `;
}

module.exports = header;
