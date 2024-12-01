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
      select: true,
    });
    await Address.updateMany(
      { userId: req.user.userId, select: true },
      { select: false }
    );
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
    const userId = req.user.userId;

    const address = await Address.findOne({ _id: addressId, userId: userId });
    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found or doesn't belong to this user.",
      });
    }

    await Address.updateMany({ userId }, { select: false });

    const selectedAddress = await Address.findOneAndUpdate(
      { _id: addressId, userId: userId },
      { select: true },
      { new: true }
    );

    if (!selectedAddress) {
      return res.status(404).json({
        success: false,
        message: "Address not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Address selected successfully.",
    });
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
