const { check } = require("express-validator");

exports.categoryCreateValidator = [
  check("name").not().isEmpty().withMessage("Name is Required"),
  check("image").not().isEmpty().withMessage("Image is required"),
  check("content")
    .isLength({ min: 20 })
    .withMessage(
      "Content is required and it should be minimum of 20 characters long"
    ),
];

exports.categoryUpdateValidator = [
  check("name").not().isEmpty().withMessage("Name is Required"),
  check("content")
    .isLength({ min: 20 })
    .withMessage(
      "Content is required and it should be minimum of 20 characters long"
    ),
];
