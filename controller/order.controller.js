const Checkout = require("../model/Checkout");
const Cart = require("../model/Cart");
const Product = require("../model/Product");

const checkout = async (req, res, next) => {
  try {
    const { offerCode, shippingMethod, totalPrice, items } = req.body;
    const user = req.session.user;
    const userId = user.id;

    if (!userId || userId === "") {
      return res
        .status(400)
        .json({ message: "User ID is required and cannot be empty" });
    }

    const cart = await Cart.find({ userId: userId }).populate("productId");
    if (!cart || cart.length === 0) {
      return res.status(400).json({ message: "Cart not found for the user" });
    }

    let discount = 0;
    let finalTotalPrice = totalPrice; // Make sure it's declared with 'let' to allow modification

    // Apply discount based on offer code
    if (offerCode) {
      if (offerCode === "DISCOUNT10") {
        discount = totalPrice * 0.1; // 10% discount
        finalTotalPrice -= discount; // Modify finalTotalPrice
      }
    }

    // Add shipping cost based on shipping method
    const shippingCost = shippingMethod === "Express-Delivery" ? 10 : 5;
    finalTotalPrice += shippingCost;

    const checkoutItems = [];
    for (const item of items) {
      const product = cart.find(
        (c) => c.productId._id.toString() === item.productId
      );
      if (product) {
        const productDetails = product.productId;
        const unitPrice = productDetails.unitPrice;
        const itemPrice = unitPrice * item.quantity;
        checkoutItems.push({
          productId: item.productId,
          productName: productDetails.name,
          quantity: item.quantity,
          totalPrice: itemPrice,
        });
      }
    }

    finalTotalPrice += shippingCost; // Add shipping to the final price
    
    const newCheckout = new Checkout({
      userId: userId,
      items: checkoutItems,
      totalPrice: finalTotalPrice,
      offerCode: offerCode || null,
      delivery: shippingMethod,
      updatedAt: Date.now(),
    });

    await newCheckout.save();
    await Cart.deleteMany({ userId: userId });

    res
      .status(200)
      .json({ message: "Checkout successful", checkout: newCheckout });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error during checkout", error: err });
  }
};

module.exports = checkout;
