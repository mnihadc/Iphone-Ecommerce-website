const express = require("express");
const { getProfile, deleteUser } = require("../controller/profile.controller");
const router = express.Router();

router.get("/user", getProfile);
router.delete("/delete-user/:id", deleteUser);

module.exports = router;
