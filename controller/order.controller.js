const Checkout = require("../models/Checkout"); // Assuming Checkout model is stored in models/Checkout.js
const Cart = require("../models/Cart"); // Assuming Cart model is stored in models/Cart.js

const checkout = async (req, res, next) => {
  try {
    const { userId, offerCode, shippingMethod } = req.body; // Get data from the request

    // Get the cart items for the user
    const cart = await Cart.findOne({ userId: userId });
    if (!cart) {
      return res.status(400).json({ message: "Cart not found for the user" });
    }

    // Calculate total price with shipping and offer code
    let totalPrice = cart.totalPrice;
    let discount = 0;

    // Check if offer code exists
    if (offerCode) {
      // Example: Apply 10% discount for the offer code "DISCOUNT10"
      if (offerCode === "DISCOUNT10") {
        discount = totalPrice * 0.1; // 10% discount
        totalPrice -= discount;
      }
    }

    // Add shipping cost
    const shippingCost = shippingMethod === "Express-Delivery" ? 10 : 5;
    totalPrice += shippingCost;

    // Create the checkout record
    const checkout = new Checkout({
      userId: userId,
      items: cart.items,
      totalPrice: totalPrice,
      updatedAt: Date.now(),
    });

    // Save the checkout record
    await checkout.save();

    // Optional: You may want to clear the cart after checkout
    // await Cart.deleteOne({ userId: userId });

    res.status(200).json({ message: "Checkout successful", checkout });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error during checkout" });
  }
};

module.exports = checkout;
