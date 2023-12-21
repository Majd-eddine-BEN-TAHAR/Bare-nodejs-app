const db = require("./../db/database");

function validateSession(req, res, next) {
  const sessionId = req.cookies.sessionId;

  if (!sessionId) {
    next();
    return;
  }

  db.get(
    "SELECT * FROM sessions WHERE sessionId = ? AND expires > ?",
    [sessionId, Date.now()],
    (err, row) => {
      if (err || !row) {
        next();
      } else {
        req.user = {
          sessionId: sessionId,
          userId: row.userId,
        };
        next();
      }
    }
  );
}

module.exports = { validateSession };
