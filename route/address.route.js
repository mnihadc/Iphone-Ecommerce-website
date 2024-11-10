const express = require("express");
const {
  getCreateAddressPage,
  CreateAddress,
} = require("../controller/address.controller");
const router = express.Router();

router.get("/get-create-address", getCreateAddressPage);
router.post("/create-address", CreateAddress);

module.exports = router;
