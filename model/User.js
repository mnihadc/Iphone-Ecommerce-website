const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    minlength: 5,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    minlength: 8, // Only required for non-OAuth users
  },
  googleId: {
    type: String, // Stores Google profile ID
    unique: true, // Ensures uniqueness for Google logins
    sparse: true, // Allows null/undefined for non-Google users
  },
  profileImage: {
    type: String, // Stores the user's Google profile picture URL
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
