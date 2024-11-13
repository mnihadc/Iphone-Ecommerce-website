const express = require("express");
const { addToCart } = require("../controller/cart.controller");
const router = express.Router();

router.post("/addtocart/:id", addToCart);

module.exports = router;
