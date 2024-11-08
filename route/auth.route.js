const express = require("express");
const {
  getLoginPage,
  SignUp,
  Login,
  Logout,
} = require("../controller/auth.controller");
const router = express.Router();

router.get("/login", getLoginPage);
router.post("/signup", SignUp);
router.post("/login", Login);
router.get("/logout", Logout);

module.exports = router;
