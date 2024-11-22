const express = require("express");
const {
  checkout,
  getCheckoutSummery,
  CancelOrder,
  getOrder,
  initiatePayment,
  handlePaymentSuccess,
  handlePaymentCancel,
  initiatePaymentOrder,
} = require("../controller/order.controller");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();

router.post("/checkout", verifyToken, checkout);
router.get("/checkout-summery", verifyToken, getCheckoutSummery);
router.post("/cancel-order/:id", verifyToken, CancelOrder);
router.get("/get-orders", verifyToken, getOrder);
router.post("/initiate-payment", initiatePayment);
router.get("/success", handlePaymentSuccess);
router.get("/cancel", handlePaymentCancel);
router.post("/initiate-payment-order/:orderId", initiatePaymentOrder);

module.exports = router;
