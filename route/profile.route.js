const express = require("express");
const { getProfile } = require("../controller/profile.controller");
const router = express.Router();

router.get("/user", getProfile);

module.exports = router;
