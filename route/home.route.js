const express = require("express");
const {
  getHomePage,
  getShopPage,
  searchSuggestions,
  getViewProduct,
} = require("../controller/home.controller");
const router = express.Router();

router.get("/", getHomePage);
router.get("/shop", getShopPage);
router.get("/search-suggestions", searchSuggestions);
router.get("/product-view/:productId", getViewProduct);

module.exports = router;
