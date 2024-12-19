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
  getChatBot,
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
router.get("/get-chat-bot", getChatBot);

module.exports = router;
