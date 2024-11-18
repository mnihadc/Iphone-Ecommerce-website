const User = require("../model/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Address = require("../model/Address");

const getProfile = async (req, res, next) => {
  const user = req.session.user;
  if (!user) {
    return res.status(401).json({ message: "User is not logged in." });
  }

  try {
    const userData = await User.findOne({ email: user.email });
    if (!userData) {
      return res.status(404).json({ message: "User not found." });
    }
    const address = await Address.findOne({ userId: user.id });
    res.render("users/Profile", {
      title: "Profile Page",
      isProfilePage: true,
      id: userData._id,
      email: userData.email,
      user: req.session.user,
      username: userData.username,
      password: userData.password,
      address: address
        ? {
            fullName: address.fullName,
            email: address.email,
            street: address.street,
            city: address.city,
            dob: address.dob,
            address: address.address,
            district: address.district,
            state: address.state,
            postalCode: address.postalCode,
            phone: address.phone,
            gender: address.gender,
          }
        : null,
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const dataId = req.params.id;

    const user = await User.findByIdAndDelete(dataId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    req.session.destroy();
    res.clearCookie("authToken");
    res.clearCookie("connect.sid");
    res.redirect("/auth/login");
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const userId = req.params.id;

    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return res.status(404).json({ message: "User not found." });
    }
    let updatedData = { username, email };
    if (password && password !== existingUser.password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updatedData.password = hashedPassword;
    } else {
      updatedData.password = existingUser.password;
    }
    const updatedUser = await User.findByIdAndUpdate(userId, updatedData, {
      new: true,
    });
    req.session.user = {
      id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
    };

    res.redirect("/profile/user");
  } catch (error) {
    next(error);
  }
};

module.exports = { getProfile, deleteUser, updateUser };
