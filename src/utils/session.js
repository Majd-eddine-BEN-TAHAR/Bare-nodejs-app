function generateSessionId() {
  return Date.now() + "-" + Math.random().toString(36).substring(2, 15);
}

module.exports = { generateSessionId };
