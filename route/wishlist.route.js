const express = require("express");
const authenticateUser = require("../middleware/verifyToken");
const {
  addtoWishList,
  getWishList,
  removeWishList,
  getCoupon,
} = require("../controller/wishlist.controller");
const router = express.Router();

router.post("/addtowishlist/:id", authenticateUser, addtoWishList);
router.get("/gettowishlist", authenticateUser, getWishList);
router.delete("/remove/:id", authenticateUser, removeWishList);
router.get("/get-coupons", authenticateUser, getCoupon);

module.exports = router;
