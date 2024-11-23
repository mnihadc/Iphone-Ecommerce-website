const express = require("express");
const {
  addToCart,
  getCartPage,
  removeCartItem,
  updateQuantity,
} = require("../controller/cart.controller");
const authenticateUser = require("../middleware/verifyToken");
const router = express.Router();

router.post("/addtocart/:productId", addToCart);
router.get("/get-cart", authenticateUser, getCartPage);
router.delete("/remove-cart/:productId", authenticateUser, removeCartItem);
router.put(
  "/update-quantity/:productId/:quantity",
  authenticateUser,
  updateQuantity
);

module.exports = router;
