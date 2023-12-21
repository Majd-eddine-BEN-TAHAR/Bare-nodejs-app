const sqlite3 = require("sqlite3").verbose();

// Connect to the SQLite database
let db = new sqlite3.Database("./mydb.sqlite3", (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log("Connected to the SQLite database.");
});

// Create a new table for users
db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    profile_pic TEXT
  )`,
    (err) => {
      if (err) {
        console.error(err.message);
      } else {
        console.log("Created the users table.");
      }
    }
  );

  // Create Sessions Table
  db.run(
    `CREATE TABLE IF NOT EXISTS sessions (
      sessionId TEXT PRIMARY KEY,
      userId INTEGER,
      expires INTEGER,
      FOREIGN KEY(userId) REFERENCES users(id)
  )`,
    (err) => {
      if (err) {
        console.error(err.message);
      } else {
        console.log("Created the sessions table.");
      }
    }
  );

  // New posts Table
  // is_public INTEGER, -- 0 for private, 1 for public
  db.run(
    `CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      title TEXT,
      content TEXT,
      is_public INTEGER, 
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`,
    (err) => {
      if (err) {
        console.error(err.message);
      } else {
        console.log("Created the posts table.");
      }
    }
  );

  db.run(
    `CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER,
      user_id INTEGER,
      content TEXT,
      profile_pic TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(post_id) REFERENCES posts(id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`,
    (err) => {
      if (err) {
        console.error(err.message);
      } else {
        console.log("Created the comments table.");
      }
    }
  );
});

module.exports = db;
