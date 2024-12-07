const express = require("express");
const {
  getHomePage,
  getShopPage,
  searchSuggestions,
  getViewProduct,
  getAbout,
  getBlog,
  getContactUs,
  ContactUs,
} = require("../controller/home.controller");
const router = express.Router();

router.get("/", getHomePage);
router.get("/shop", getShopPage);
router.get("/search-suggestions", searchSuggestions);
router.get("/product-view/:productId", getViewProduct);
router.get("/about", getAbout);
router.get("/get-blogs", getBlog);
router.get("/get-contact-us", getContactUs);
router.post("/contact-us", ContactUs);

module.exports = router;
