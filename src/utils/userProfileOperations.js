const db = require("../db/database");
const { storeFiles } = require("./profileFormUtils");
const { hashPassword } = require("./hashing");

function profilePageContent(user, message = "") {
  const initials = user.username ? user.username.charAt(0).toUpperCase() : "?";
  return `
          <h1>Edit Profile</h1>
          ${message}
          <div class="profile-container">
              ${
                user.profile_pic
                  ? `<img src="${user.profile_pic}" alt="Profile Picture" class="profile-pic"/>`
                  : `<div class="profile-pic-placeholder">${initials}</div>`
              }
          </div>
          <form action="/profile" method="post" enctype="multipart/form-data">
              <input type="text" name="username" value="${
                user.username
              }" required>
              <input type="password" name="password" placeholder="New password (optional)">
              <input type="file" name="profilePic" accept="image/*">
              <button type="submit">Update Profile</button>
          </form>
      `;
}

function redirect(res, location) {
  res.writeHead(302, { Location: location });
  res.end();
}

function hasErrors(textInputsErrors, uploadErrors) {
  return Object.keys(textInputsErrors).length > 0 || uploadErrors.length > 0;
}

function renderErrors(textInputsErrors, uploadErrors) {
  const errorMessages = [
    ...Object.values(textInputsErrors),
    ...uploadErrors.map((error) => error.error),
  ];
  return `<div>${errorMessages
    .map((error) => `<p class="error-message">${error}</p>`)
    .join("")}</div>`;
}

async function handleProfileUpdate(req, res, textInputs, validFiles) {
  await storeFiles(validFiles);

  try {
    const updateResult = await updateUserProfile(
      req.user.userId,
      textInputs,
      validFiles,
      db
    );
    return updateResult; // Return the result instead of checking it here
  } catch (error) {
    serverError(req, res, error);
    return null; // Return null or a specific error indicator
  }
}

async function updateUserProfile(userId, textInputs, validFiles, db) {
  let sql = `UPDATE users SET username = ?`;
  const params = [textInputs.username];

  if (validFiles.length > 0) {
    sql += `, profile_pic = ?`;
    params.push(`uploads/${validFiles[0].savedAs}`);
  }

  if (textInputs.password) {
    const hashedPassword = await hashPassword(textInputs.password);
    sql += `, password = ?`;
    params.push(hashedPassword);
  }

  sql += ` WHERE id = ?`;
  params.push(userId);

  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this.changes);
    });
  });
}
module.exports = {
  profilePageContent,
  redirect,
  hasErrors,
  renderErrors,
  handleProfileUpdate,
};
