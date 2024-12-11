const express = require("express");
const authenticateUser = require("../middleware/verifyToken");
const {
  addtoWishList,
  getWishList,
  removeWishList,
} = require("../controller/wishlist.controller");
const router = express.Router();

router.post("/addtowishlist/:id", authenticateUser, addtoWishList);
router.get("/gettowishlist", authenticateUser, getWishList);
router.delete("/remove/:id", authenticateUser, removeWishList);

module.exports = router;
