const express = require("express");
const { addToCart, getCartPage } = require("../controller/cart.controller");
const router = express.Router();

router.post("/addtocart/:productId", addToCart);
router.get("/get-cart", getCartPage);

module.exports = router;
