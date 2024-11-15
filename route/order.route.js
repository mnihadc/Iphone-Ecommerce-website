const express = require("express");
const checkout = require("../controller/Order.controller"); // Assuming your controller is in 'controller/Order.controller.js'

const router = express.Router();

// Checkout Route
router.post("/checkout", checkout);

module.exports = router;
