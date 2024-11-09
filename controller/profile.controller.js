const User = require("../model/User");
const bcrypt = require("bcrypt");

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

    res.render("users/Profile", {
      title: "Profile Page",
      isProfilePage: true,
      id: userData._id,
      email: userData.email,
      user: req.session.user,
      username: userData.username,
      password: userData.password,
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
    const { username, email, password } = req.body; // Get updated data from request body
    const userId = req.params.id; // Get the user ID from the URL parameter

    // Optional: Hash the new password if provided
    let updatedData = { username, email };
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10); // Hash the new password
      updatedData.password = hashedPassword; // Add the hashed password to the update data
    }

    // Find and update the user by their ID
    const updatedUser = await User.findByIdAndUpdate(userId, updatedData, {
      new: true,
    });

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    // Optionally, update session data if the logged-in user is the one being updated
    req.session.user = updatedUser; // Update the session with the new user data

    // Respond with a success message or redirect to the updated profile page
    res.redirect("/profile/user"); // Redirect to the user's profile page
  } catch (error) {
    next(error); // Pass the error to the next middleware (for error handling)
  }
};

module.exports = { getProfile, deleteUser, updateUser };
