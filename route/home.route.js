const express = require("express");
const { getHomePage, getProfile } = require("../controller/home.controller");
const router = express.Router();

router.get("/", getHomePage);

module.exports = router;
