const express = require("express");
const {
  addToCart,
  getCartPage,
  removeCartItem,
} = require("../controller/cart.controller");
const verifyToken = require("../middleware/verifyToken");
const router = express.Router();

router.post("/addtocart/:productId", verifyToken, addToCart);
router.get("/get-cart", verifyToken, getCartPage);
router.delete("/remove-cart/:productId", verifyToken, removeCartItem);

module.exports = router;
