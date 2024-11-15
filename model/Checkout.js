const mongoose = require("mongoose");

// Define the Checkout Schema
const checkoutSchema = new mongoose.Schema(
  {
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
        itemTotalPrice: {
          type: Number,
          required: true,
        },
      },
    ],
    delivery: {
      type: String,
      enum: ["Standard-Delivery", "Express-Delivery"],
      default: "Standard-Delivery",
    },
    offerCode: {
      type: String,
      default: null,
    },
    discount: {
      type: Number,
      default: 0,
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: true }
);

const Checkout = mongoose.model("Checkout", checkoutSchema);

module.exports = Checkout;
