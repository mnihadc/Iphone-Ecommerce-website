const express = require("express");
const checkout = require("../controller/Order.controller");

const router = express.Router();

router.post("/checkout", checkout);

module.exports = router;
