const express = require("express");
const {
  checkout,
  getCheckoutSummery,
  CancelOrder,
  getOrder,
} = require("../controller/order.controller");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();

router.post("/checkout", verifyToken, checkout);
router.get("/checkout-summery", verifyToken, getCheckoutSummery);
router.post("/cancel-order/:id", verifyToken, CancelOrder);
router.get("/get-orders", verifyToken, getOrder);
module.exports = router;
