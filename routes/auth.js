//now we will put all the routes related to authentication here
const express = require("express");

//now we will create mini app using express router
const router = express.Router();

//import the various controllers
const {
  register,
  registerActivate,
  login,
  requireSignIn,
  forgotPassword,
  resetPassword,
} = require("../controllers/auth");
const {
  userRegisterValidator,
  userLoginValidator,
  resetPasswordValidator,
  forgotPasswordValidator,
} = require("../validators/auth");
const { runValidation } = require("../validators/index");
//now we will create the end point
router.post("/register", userRegisterValidator, runValidation, register);
router.post("/register/activate", registerActivate);
router.post("/login", userLoginValidator, runValidation, login);
router.put(
  "/forgot-password",
  forgotPasswordValidator,
  runValidation,
  forgotPassword
);
router.put(
  "/reset-password",
  resetPasswordValidator,
  runValidation,
  resetPassword
);

//Dummy API response
// router.get("/secret", requireSignIn, (req, res) => {
//   res.status(200).json({ message: "You are there in secret route" });
// });

//now we need to export this route
module.exports = router;
