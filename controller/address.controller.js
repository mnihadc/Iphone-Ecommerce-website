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

module.exports = {
  getCreateAddressPage,
  CreateAddress,
};
