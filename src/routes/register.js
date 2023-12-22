// Import necessary modules and dependencies
const baseLayout = require("../views/layouts/baseLayout");
const { hashPassword } = require("../utils/hashing");
const serverError = require("../utils/serverError");
const db = require("../db/database");

function register(req, res) {
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

// Function to handle GET requests for the registration page
function GET(req, res) {
  // Generate the registration page content
  const content = registerPageContent();
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/html");
  // Send the HTML content to the client, using the baseLayout function to wrap it
  res.end(baseLayout(content, req.isLoggedIn));
}

// Function to handle POST requests for user registration
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
      const content = registerPageContent(errorMessage);

      res.statusCode = 400;
      res.setHeader("Content-Type", "text/html");
      res.end(baseLayout(content, req.isLoggedIn));
    } else {
      // Check if the user exists in the database
      db.get(
        "SELECT * FROM users WHERE username = ?",
        [username],
        (err, row) => {
          if (row) {
            // If the user already exists, generate an error message and display it
            const errorMessage = `<p class="error-message">Error: Username already exists.</p>`;
            const content = registerPageContent(errorMessage);

            res.statusCode = 409;
            res.setHeader("Content-Type", "text/html");
            res.end(baseLayout(content, req.isLoggedIn));
          } else {
            // If the user does not exist, hash the password and register the new user
            hashPassword(password).then((hashedPassword) => {
              db.run(
                "INSERT INTO users (username, password) VALUES (?, ?)",
                [username, hashedPassword],
                (err) => {
                  if (err) {
                    // Handle database error
                    serverError(req, res, err);
                  } else {
                    // Registration successful
                    const successMessage = `<p class="success-message">Registration successful!</p>`;
                    const content = registerPageContent(successMessage);

                    res.statusCode = 201; // Set the Content-Type header to indicate that the response is HTML
                    res.setHeader("Content-Type", "text/html");
                    res.end(baseLayout(content, req.isLoggedIn));
                  }
                }
              );
            });
          }
        }
      );
    }
  });
}

// Function to generate the content for the registration page
function registerPageContent(message = "") {
  return `
    <h1>Register</h1>
    ${message}
    <form action="/register" method="post">
      <input type="text" name="username" placeholder="Enter username" required>
      <input type="password" name="password" placeholder="Enter password" required>
      <button type="submit">Register</button>
    </form>
  `;
}

// Function to perform a redirection
function redirect(res, location) {
  res.writeHead(302, { Location: location });
  res.end();
  return;
}

module.exports = register;
