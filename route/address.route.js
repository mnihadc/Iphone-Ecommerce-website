const express = require("express");
const {
  getCreateAddressPage,
  CreateAddress,
  getMultipleAddress,
  selectAddress,
} = require("../controller/address.controller");
const authenticateUser = require("../middleware/verifyToken");
const router = express.Router();

router.get("/get-create-address", authenticateUser, getCreateAddressPage);
router.post("/create-address", authenticateUser, CreateAddress);
router.get("/get-multi-address", authenticateUser, getMultipleAddress);
router.put("/selected-address", authenticateUser, selectAddress);

module.exports = router;
