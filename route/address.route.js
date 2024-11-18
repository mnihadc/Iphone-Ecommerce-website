const express = require("express");
const {
  getCreateAddressPage,
  CreateAddress,
} = require("../controller/address.controller");
const verifyToken = require("../middleware/verifyToken");
const router = express.Router();

router.get("/get-create-address", verifyToken, getCreateAddressPage);
router.post("/create-address", CreateAddress);

module.exports = router;
