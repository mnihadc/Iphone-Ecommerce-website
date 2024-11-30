const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const adminSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    profileImage: {
      type: String,
      default: "https://example.com/default-profile.png",
    },
    role: {
      type: String,
      enum: ["Super Admin", "Admin"],
      default: "Admin",
    },
    dateJoined: {
      type: Date,
      default: Date.now,
    },
    lastLogin: {
      type: Date,
    },
    firstPageBannerImageURL: {
      type: String,
      default: null,
    },
    mainStatus: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Admin = mongoose.model("Admin", adminSchema);

module.exports = Admin;
