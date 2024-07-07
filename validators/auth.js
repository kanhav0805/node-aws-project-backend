const { check } = require("express-validator");

exports.userRegisterValidator = [
  check("name").not().isEmpty().withMessage("Name is Required"),
  check("email").isEmail().withMessage("Must enter a valid email address"),
  check("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  // check("categories")
  //   .isLength({ min: 6 })
  //   .withMessage("Pick at aleast one category"),
];

exports.userLoginValidator = [
  check("email").isEmail().withMessage("Must enter a valid email address"),
  check("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];

exports.forgotPasswordValidator = [
  check("email").isEmail().withMessage("Must enter a valid email address"),
];

exports.resetPasswordValidator = [
  check("newPassword")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  check("resetPasswordLink")
    .not()
    .isEmpty()
    .withMessage("Reset Password Link must be entered"),
];
