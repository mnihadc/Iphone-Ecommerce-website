const Address = require("../model/Address");

const getCreateAddressPage = (req, res, next) => {
  res.render("users/CreateAddress", {
    title: "Address Page",
    isAddressPage: true,
    user: req.user,
  });
};

const CreateAddress = async (req, res, next) => {
  try {
    const {
      fullName,
      email,
      gender,
      dob,
      phone,
      address,
      city,
      district,
      state,
      postalCode,
    } = req.body;

    const newAddress = new Address({
      userId: req.user.userId,
      fullName,
      email,
      gender,
      dob,
      phone,
      address,
      city,
      district,
      state,
      postalCode,
    });
    await newAddress.save();

    res.redirect("/profile/user");
  } catch (error) {
    next(error);
  }
};
const getMultipleAddress = async (req, res, next) => {
  try {
    const user = req.user;
    const userId = user.userId;
    const addresses = await Address.find({ userId });
    if (!addresses || addresses.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No addresses found for the user.",
      });
    }
    res.render("users/MultiAddress", {
      title: "Multiple Address Page",
      user: req.user,
      addresses,
    });
  } catch (error) {
    next(error);
  }
};
const selectAddress = async (req, res, next) => {
  try {
    const { addressId } = req.body;
    const user = req.user;
    const userId = user.userId;
    const selectedAddress = await Address.findByIdAndUpdate(
      addressId,
      { selected: true },
      { new: true }
    );
    if (!selectedAddress) {
      return res.status(404).json({
        success: false,
        message: "Address not found.",
      });
    }
    res.redirect("/profile/user");
  } catch (error) {
    next(error);
  }
};
module.exports = {
  getCreateAddressPage,
  CreateAddress,
  getMultipleAddress,
  selectAddress,
};
