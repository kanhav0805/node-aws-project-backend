const express = require("express");
const router = express.Router();
//auth middlewares
const { adminMiddleware, requireSignIn } = require("../controllers/auth");
//category validators
const {
  categoryCreateValidator,
  categoryUpdateValidator,
} = require("../validators/category");
const { runValidation } = require("../validators");
//now we will create CRUD routes for category

const {
  create,
  list,
  read,
  remove,
  update,
} = require("../controllers/category");

router.post(
  "/category",
  categoryCreateValidator,
  runValidation,
  requireSignIn,
  adminMiddleware,
  create
);
router.get("/categories", list);
router.post("/category/:slug", read);
router.put(
  "/category/:slug",
  categoryUpdateValidator,
  runValidation,
  requireSignIn,
  adminMiddleware,
  update
);
router.delete("/category/:slug", requireSignIn, adminMiddleware, remove);

module.exports = router;
