const express = require("express");
const {
  checkout,
  getCheckoutSummery,
  CancelOrder,
} = require("../controller/order.controller");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();

router.post("/checkout", verifyToken, checkout);
router.get("/checkout-summery", verifyToken, getCheckoutSummery);
router.post("/cancel-order/:id", verifyToken, CancelOrder);
module.exports = router;
