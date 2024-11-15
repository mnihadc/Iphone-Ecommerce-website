const express = require("express");
const {
  addToCart,
  getCartPage,
  removeCartItem,
  updateQuantity,
} = require("../controller/cart.controller");
const verifyToken = require("../middleware/verifyToken");
const router = express.Router();

router.post("/addtocart/:productId", verifyToken, addToCart);
router.get("/get-cart", verifyToken, getCartPage);
router.delete("/remove-cart/:productId", verifyToken, removeCartItem);
router.patch(
  "/update-quantity/:productId/:quantity",
  verifyToken,
  updateQuantity
);

module.exports = router;
