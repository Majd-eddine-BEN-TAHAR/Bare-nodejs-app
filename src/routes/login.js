const { comparePassword } = require("../utils/hashing");
const serverError = require("../utils/serverError");
const baseLayout = require("../views/layouts/baseLayout");
const { generateSessionId } = require("../utils/session");
const db = require("../db/database");

function login(req, res) {
  // Check if the user is already logged in, if so, redirect to the home page
  if (req.isLoggedIn) {
    redirect(res, "/");
  }

  if (req.method === "GET") {
    GET(req, res);
  } else if (req.method === "POST") {
    POST(req, res);
  }
}

function GET(req, res) {
  // Generate the login page content
  const content = loginPageContent();
  res.setHeader("Content-Type", "text/html");
  res.end(baseLayout(content, req.isLoggedIn));
}

function POST(req, res) {
  // Initialize an empty string to store the request body
  let body = "";
  req.on("data", (chunk) => {
    body += chunk.toString();
  });

  req.on("end", () => {
    // Parse the request body to extract the username and password
    const username = new URLSearchParams(body).get("username");
    const password = new URLSearchParams(body).get("password");

    // Validate the username and password length
    if (username.length < 4 || password.length < 4) {
      // If validation fails, generate an error message and display it to the user
      const errorMessage = `<p class="error-message">Error: Username and password must be at least 4 characters long.</p>`;
      const content = loginPageContent(errorMessage);

      res.statusCode = 400; // Set the Content-Type header to indicate that the response is HTML
      res.setHeader("Content-Type", "text/html"); // Send the error message to the client
      res.end(baseLayout(content, req.isLoggedIn));
    } else {
      // Check if the user exists and the password is correct
      db.get(
        "SELECT * FROM users WHERE username = ?",
        [username],
        async (err, row) => {
          if (err) {
            serverError(req, res, err);
          } else if (!row || !(await comparePassword(password, row.password))) {
            // If user doesn't exist or password is incorrect, generate an error message
            const errorMessage = `<p class="error-message">Error: Wrong credentials.</p>`;
            const content = loginPageContent(errorMessage);

            res.statusCode = 401;
            res.setHeader("Content-Type", "text/html");
            res.end(baseLayout(content, req.isLoggedIn));
          } else {
            // User exists and password is correct
            // Create a session for the user
            const sessionId = generateSessionId();
            const expiry = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days from now

            db.run(
              "INSERT INTO sessions (sessionId, userId, expires) VALUES (?, ?, ?)",
              [sessionId, row.id, expiry],
              (err) => {
                if (err) {
                  serverError(req, res, err);
                } else {
                  // Set a cookie for the user's session and redirect to the home page
                  res.setHeader(
                    "Set-Cookie",
                    `sessionId=${sessionId}; HttpOnly; Max-Age=604800`
                  ); // 604800 seconds = 7 days
                  redirect(res, "/");
                }
              }
            );
          }
        }
      );
    }
  });
}

// Function to generate the content for the login page
function loginPageContent(message = "") {
  return `
    <h1>Login</h1>
    ${message}
    <form action="/login" method="post">
      <input type="text" name="username" placeholder="Enter username" required>
      <input type="password" name="password" placeholder="Enter password" required>
      <button type="submit">Login</button>
    </form>
  `;
}

// Function to perform a redirection
function redirect(res, location) {
  res.writeHead(302, { Location: location });
  res.end();
  return;
}

module.exports = login;
