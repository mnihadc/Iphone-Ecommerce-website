const express = require("express");
const {
  getHomePage,
  getShopPage,
  searchSuggestions,
} = require("../controller/home.controller");
const router = express.Router();

router.get("/", getHomePage);
router.get("/shop", getShopPage);
router.get("/search-suggestions", searchSuggestions);

module.exports = router;
