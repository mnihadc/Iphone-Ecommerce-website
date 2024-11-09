const express = require("express");
const {
  getProfile,
  deleteUser,
  updateUser,
} = require("../controller/profile.controller");
const router = express.Router();

router.get("/user", getProfile);
router.post("/delete-user/:id", deleteUser);
router.post("/update-user/:id", updateUser);

module.exports = router;
