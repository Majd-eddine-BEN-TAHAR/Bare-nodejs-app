const navbar = require("./navbar");

function header(isLoggedIn) {
  return `
        <header>
          ${navbar(isLoggedIn)}
        </header>
    `;
}

module.exports = header;
