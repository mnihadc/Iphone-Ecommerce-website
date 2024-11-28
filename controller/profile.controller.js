const User = require("../model/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Address = require("../model/Address");
const Checkout = require("../model/Checkout");

const getProfile = async (req, res, next) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "User is not logged in." });
  }

  try {
    const userData = await User.findById(user.userId);
    if (!userData) {
      return res.status(404).json({ message: "User not found." });
    }

    const address = await Address.findOne({
      userId: user.userId,
      select: true,
    });

    // Get the total order value from the user's order history
    const orders = await Checkout.find({ userId: user.userId });
    const totalOrderValue = orders.reduce(
      (sum, order) => sum + order.totalPrice,
      0
    );

    let membershipLevel = {
      newBuyer: 0,
      engagedShopper: 0,
      premiumMember: 0,
      superPremiumMember: 0,
    };

    if (totalOrderValue <= 100000) {
      // New Buyer: 0 to 1 lakh
      membershipLevel.newBuyer = 100; // New Buyer is fully completed
    } else if (totalOrderValue <= 500000) {
      // Engaged Shopper: 1 lakh to 5 lakh
      membershipLevel.newBuyer = 100; // New Buyer is fully completed
      membershipLevel.engagedShopper =
        ((totalOrderValue - 100000) / (500000 - 100000)) * 100; // Linear progress within 1 lakh to 5 lakh
    } else if (totalOrderValue <= 2500000) {
      // Premium Member: 5 lakh to 25 lakh
      membershipLevel.newBuyer = 100; // New Buyer is fully completed
      membershipLevel.engagedShopper = 100; // Engaged Shopper is fully completed
      membershipLevel.premiumMember =
        ((totalOrderValue - 500000) / (2500000 - 500000)) * 100; // Linear progress within 5 lakh to 25 lakh
    } else if (totalOrderValue <= 5000000) {
      // Super Premium Member: 25 lakh to 50 lakh
      membershipLevel.newBuyer = 100; // New Buyer is fully completed
      membershipLevel.engagedShopper = 100; // Engaged Shopper is fully completed
      membershipLevel.premiumMember = 100; // Premium Member is fully completed
      membershipLevel.superPremiumMember =
        ((totalOrderValue - 2500000) / (5000000 - 2500000)) * 100; // Linear progress within 25 lakh to 50 lakh
    } else {
      // If the user exceeds 50 lakh, Super Premium is fully completed
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
      membershipLevel, // Send the membership levels to the frontend
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
    return res.status(500).json({ message: "Internal server error." });
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
