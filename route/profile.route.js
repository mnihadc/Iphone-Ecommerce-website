const express = require("express");
const {
  getProfile,
  deleteUser,
  updateUser,
} = require("../controller/profile.controller");
const verifyToken = require("../middleware/verifyToken");
const router = express.Router();

router.get("/user", verifyToken, getProfile);
router.post("/delete-user/:id", verifyToken, deleteUser);
router.get("/user", verifyToken, updateUser);
router.post("/update-user/:id", verifyToken, updateUser);

module.exports = router;
