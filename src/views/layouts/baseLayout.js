const header = require("../components/header");
const main = require("../components/main");
const footer = require("../components/footer");

function baseLayout(content, isLoggedIn) {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Document</title>
        <link rel="stylesheet" href="/public/styles.css">
      </head>
      <body>
        ${header(isLoggedIn)}
        ${main(content)}
        ${footer()}
      </body>
    </html>
    `;
}

module.exports = baseLayout;
