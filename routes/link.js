const express = require("express");
const router = express.Router();
//auth middlewares
const {
  authMiddleware,
  requireSignIn,
  adminMiddleware,
  canUpdateDeleteLink,
} = require("../controllers/auth");
//category validators
const {
  linkCreateValidator,
  linkUpdateValidator,
} = require("../validators/link");
const { runValidation } = require("../validators");
//now we will create CRUD routes for category
// controllers
const {
  create,
  list,
  read,
  update,
  remove,
  clickCount,
} = require("../controllers/link");

// routes
router.post(
  "/link",
  linkCreateValidator,
  runValidation,
  requireSignIn,
  authMiddleware,
  create
);
router.post("/links", requireSignIn, adminMiddleware, list);
router.put("/click-count", clickCount);
router.get("/link/:id", read);
router.put(
  "/link/:id",
  linkUpdateValidator,
  runValidation,
  requireSignIn,
  authMiddleware,
  canUpdateDeleteLink,
  update
);
router.put(
  "/link/admin/:id",
  linkUpdateValidator,
  runValidation,
  requireSignIn,
  adminMiddleware,
  update
);
router.delete(
  "/link/:id",
  requireSignIn,
  authMiddleware,
  canUpdateDeleteLink,
  remove
);
router.delete("/link/admin/:id", requireSignIn, adminMiddleware, remove);

module.exports = router;

module.exports = router;
