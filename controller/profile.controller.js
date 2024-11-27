const User = require("../model/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Address = require("../model/Address");

const getProfile = async (req, res, next) => {
  const user = req.user;
  // Extracted from middleware
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
