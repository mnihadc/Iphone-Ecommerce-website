const express = require("express");
const authenticateUser = require("../middleware/verifyToken");
const { addtoWishList } = require("../controller/wishlist.controller");
const router = express.Router();

router.post("/addtowishlist/:id", authenticateUser, addtoWishList);
module.exports = router;
