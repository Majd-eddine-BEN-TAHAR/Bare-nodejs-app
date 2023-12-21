const { promisify } = require("util");
const db = require("../db/database");
const getAsync = promisify(db.get.bind(db));
const serverError = require("../utils/serverError");
const baseLayout = require("../views/layouts/baseLayout");
const {
  parseFormData,
  validateTextInputs,
  processFileUploads,
} = require("../utils/profileFormUtils");
const {
  profilePageContent,
  redirect,
  hasErrors,
  renderErrors,
  handleProfileUpdate,
} = require("../utils/userProfileOperations");

const MAX_TOTAL_REQUEST_SIZE = 20 * 1024 * 1024; // Max request size limit (20 MB)

async function profile(req, res) {
  if (!req.isLoggedIn) {
    redirect(res, "/login");
    return;
  }

  try {
    if (req.method === "GET") {
      await GET(req, res);
    } else if (req.method === "POST") {
      await POST(req, res);
    }
  } catch (error) {
    serverError(req, res, error);
  }
}

async function GET(req, res) {
  const user = await fetchUserProfile(req.user.userId);
  const content = profilePageContent(user);
  res.end(baseLayout(content, req.isLoggedIn));
}

async function POST(req, res) {
  const { files, textInputs } = await parseFormData(
    req,
    MAX_TOTAL_REQUEST_SIZE
  );

  const textInputsErrors = await validateTextInputs(
    textInputs,
    req.user.userId,
    db
  );

  const uploadResults = await processFileUploads(files);

  if (hasErrors(textInputsErrors, uploadResults.errors)) {
    const errorContent = renderErrors(textInputsErrors, uploadResults.errors);
    const user = await fetchUserProfile(req.user.userId);
    const profileContent = profilePageContent(user, errorContent);
    res.end(baseLayout(profileContent, req.isLoggedIn));
    return;
  }

  const updateResult = await handleProfileUpdate(
    req,
    res,
    textInputs,
    uploadResults.validFiles
  );
  if (updateResult) {
    redirect(res, "/profile");
    return;
  } else {
    serverError(req, res, new Error("Failed to update profile."));
  }
}

async function fetchUserProfile(userId) {
  const sql = `SELECT username, profile_pic FROM users WHERE id = ?`;
  try {
    const user = await getAsync(sql, [userId]);
    return user;
  } catch (error) {
    serverError(req, res, error);
  }
}

module.exports = profile;
