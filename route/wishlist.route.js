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
router.delete("/delete-towishlist/:id", authenticateUser, removeWishList);

module.exports = router;
