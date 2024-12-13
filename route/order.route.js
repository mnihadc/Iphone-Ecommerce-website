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
  updateOrderAddress,
  confirmOrderCOD,
  generateInvoice,
} = require("../controller/order.controller");
const authenticateUser = require("../middleware/verifyToken");

const router = express.Router();

router.post("/checkout", authenticateUser, checkout);
router.get("/checkout-summery", authenticateUser, getCheckoutSummery);
router.post("/cancel-order/:id", authenticateUser, CancelOrder);
router.get("/get-orders", authenticateUser, getOrder);
router.post("/initiate-payment", initiatePayment);
router.get("/success", authenticateUser, handlePaymentSuccess);
router.get("/cancel", authenticateUser, handlePaymentCancel);
router.post("/initiate-payment-order/:orderId", initiatePaymentOrder);
router.patch("/update-order-address", authenticateUser, updateOrderAddress);
router.post("/confirm-cod-order", authenticateUser, confirmOrderCOD);
router.get("/download-invoice/:orderId", generateInvoice);
module.exports = router;
