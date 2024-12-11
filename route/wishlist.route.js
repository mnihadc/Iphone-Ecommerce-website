const express = require("express");
const authenticateUser = require("../middleware/verifyToken");
const {
  addtoWishList,
  getWishList,
} = require("../controller/wishlist.controller");
const router = express.Router();

router.post("/addtowishlist/:id", authenticateUser, addtoWishList);
router.get("/gettowishlist", authenticateUser, getWishList);

module.exports = router;
