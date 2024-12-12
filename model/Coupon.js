const mongoose = require("mongoose");

function calculateExpiry(durationInDays) {
  const now = new Date();
  return new Date(now.setDate(now.getDate() + durationInDays));
}

const couponSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true, // Ensures every coupon has a name
    trim: true,
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
  },
  discountPercentage: {
    type: Number,
    required: true,
    default: 10, // Default discount is 10%
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
  orderRange: {
    type: Number,
    default: 0, // Minimum order value required to use the coupon
  },
  totalOrderPriceRange: {
    type: Number,
    default: 0, // Minimum total order price value required to use the coupon
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
