const express = require("express");
const { getCreateAddressPage } = require("../controller/address.controller");
const router = express.Router();

router.get("/get-create-address", getCreateAddressPage);

module.exports = router;
