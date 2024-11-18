const express = require("express");
const {
  checkout,
  getCheckoutSummery,
} = require("../controller/order.controller");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();

router.post("/checkout", verifyToken, checkout);
router.get("/checkout-summery", verifyToken, getCheckoutSummery);

module.exports = router;
