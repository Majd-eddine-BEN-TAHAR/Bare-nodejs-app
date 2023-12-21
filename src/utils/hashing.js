const bcrypt = require("bcrypt");
const saltRounds = 10;

async function hashPassword(password) {
  return bcrypt.hash(password, saltRounds);
}

async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

module.exports = { hashPassword, comparePassword };
