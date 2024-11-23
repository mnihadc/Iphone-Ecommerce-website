const express = require("express");
const {
  getProfile,
  deleteUser,
  updateUser,
} = require("../controller/profile.controller");
const authenticateUser = require("../middleware/verifyToken");
const router = express.Router();

router.get("/user", authenticateUser, getProfile);
router.get("/delete-user/:id", authenticateUser, deleteUser);
router.post("/update-user/:id", authenticateUser, updateUser);
module.exports = router;
