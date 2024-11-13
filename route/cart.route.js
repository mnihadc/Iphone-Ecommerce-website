const express = require("express");
const { addToCart } = require("../controller/cart.controller");
const Cart = require("../model/Cart");
const router = express.Router();

router.post("/addtocart/:id", addToCart);
router.get("/cart", Cart);

module.exports = router;
