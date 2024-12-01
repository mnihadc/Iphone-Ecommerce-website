const mongoose = require("mongoose");

function calculateExpiry(durationInDays) {
  const now = new Date();
  return new Date(now.setDate(now.getDate() + durationInDays));
}

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  validUntil: {
    type: Date,
    required: true,
    default: () => calculateExpiry(30),
  },
});

couponSchema.pre("save", function (next) {
  if (!this.validUntil) {
    this.validUntil = calculateExpiry(30);
  }
  next();
});

const Coupon = mongoose.model("Coupon", couponSchema);

module.exports = Coupon;
