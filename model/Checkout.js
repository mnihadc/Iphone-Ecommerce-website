const mongoose = require("mongoose");

// Define the Cart Schema
const checkoutSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  items: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      productName: {
        type: String,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,
      },
      totalPrice: {
        type: Number,
        required: true,
      },
      offerCode: {
        type: String,
        default: null,
      },
      delivery: {
        type: String,
        enum: ["Standard-Delivery", "Express-Delivery"],
        default: "Standard-Delivery",
      },
      dateAdded: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  totalPrice: {
    type: Number,
    required: true,
    default: 0,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Checkout = mongoose.model("Checkout", checkoutSchema);

module.exports = Checkout;
