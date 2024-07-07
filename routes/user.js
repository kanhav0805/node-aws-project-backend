const express = require("express");
const router = express.Router();

//add the required middleware
const {
  requireSignIn,
  authMiddleware,
  adminMiddleware,
} = require("../controllers/auth");

//now we will add the controller method to read the user information
const { read } = require("../controllers/user");

//add the user route
router.get("/user", requireSignIn, authMiddleware, read);
router.get("/admin", requireSignIn, adminMiddleware, read);
module.exports = router;
