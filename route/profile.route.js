const express = require("express");
const {
  getProfile,
  deleteUser,
  updateUser,
} = require("../controller/profile.controller");
const verifyToken = require("../middleware/verifyToken");
const router = express.Router();

router.get("/user", verifyToken, getProfile);
router.get("/delete-user/:id", verifyToken, deleteUser);
router.post("/update-user/:id", verifyToken, updateUser);
module.exports = router;
