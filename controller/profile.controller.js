const User = require("../model/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Address = require("../model/Address");
const Checkout = require("../model/Checkout");

const getProfile = async (req, res, next) => {
  const user = req.user;

  // Check if the user is logged in
  if (!user) {
    // Redirect unauthorized users to the homepage
    return res.redirect("/");
  }

  try {
    // Fetch user data
    const userData = await User.findById(user.userId);
    if (!userData) {
      // Redirect if user data is not found
      return res.redirect("/");
    }

    // Fetch user's primary address
    const address = await Address.findOne({
      userId: user.userId,
      select: true,
    });

    // Fetch user's order history and calculate total order value
    const orders = await Checkout.find({ userId: user.userId });
    const totalOrderValue = orders.reduce(
      (sum, order) => sum + order.totalPrice,
      0
    );

    // Membership level calculations
    let membershipLevel = {
      newBuyer: 0,
      engagedShopper: 0,
      premiumMember: 0,
      superPremiumMember: 0,
    };

    if (totalOrderValue <= 100000) {
      membershipLevel.newBuyer = 100;
    } else if (totalOrderValue <= 500000) {
      membershipLevel.newBuyer = 100;
      membershipLevel.engagedShopper =
        ((totalOrderValue - 100000) / (500000 - 100000)) * 100;
    } else if (totalOrderValue <= 2500000) {
      membershipLevel.newBuyer = 100;
      membershipLevel.engagedShopper = 100;
      membershipLevel.premiumMember =
        ((totalOrderValue - 500000) / (2500000 - 500000)) * 100;
    } else if (totalOrderValue <= 5000000) {
      membershipLevel.newBuyer = 100;
      membershipLevel.engagedShopper = 100;
      membershipLevel.premiumMember = 100;
      membershipLevel.superPremiumMember =
        ((totalOrderValue - 2500000) / (5000000 - 2500000)) * 100;
    } else {
      membershipLevel.newBuyer = 100;
      membershipLevel.engagedShopper = 100;
      membershipLevel.premiumMember = 100;
      membershipLevel.superPremiumMember = 100;
    }

    // Render the profile page
    res.render("users/Profile", {
      title: "Profile Page",
      isProfilePage: true,
      id: userData._id,
      email: userData.email,
      user,
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
      membershipLevel,
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
    // Redirect to home if there's an internal server error
    return res.redirect("/");
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const userId = req.user.userId; // Extract userId from the token

    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.clearCookie("authToken"); // Clear the JWT cookie
    res.redirect("/auth/login");
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const userId = req.user.userId; // Extract userId from the token

    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return res.status(404).json({ message: "User not found." });
    }

    let updatedData = { username, email };
    if (password) {
      const isPasswordMatch = await bcrypt.compare(
        password,
        existingUser.password
      );
      if (!isPasswordMatch) {
        const hashedPassword = await bcrypt.hash(password, 10);
        updatedData.password = hashedPassword;
      }
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updatedData, {
      new: true,
    });

    // Regenerate the JWT token with updated user details
    const newToken = jwt.sign(
      { userId: updatedUser._id, email: updatedUser.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie("authToken", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3600000,
    });

    res.redirect("/profile/user");
  } catch (error) {
    next(error);
  }
};

module.exports = { getProfile, deleteUser, updateUser };
