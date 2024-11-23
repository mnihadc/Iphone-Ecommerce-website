const mongoose = require("mongoose");
const Cart = require("../model/Cart");
const Product = require("../model/Product");

const getCartPage = async (req, res, next) => {
  try {
    const user = req.user;
    const userId = user.userId;

    const cartItems = await Cart.find({ userId });

    let products = await Product.find({
      _id: { $in: cartItems.map((item) => item.productId) },
    });

    products = products.map((product) => {
      const cartItem = cartItems.find(
        (item) => item.productId.toString() === product._id.toString()
      );
      return {
        ...product.toObject(),
        firstImage: product.productImages && product.productImages[0],
        finalPrice: (product.offerPrice || product.price) * cartItem.quantity,
        category: product.category ? product.category.name : "",
        name: product.name,
        _id: product._id,
        newQuantity: cartItem.quantity,
        unitPrice: product.offerPrice || product.price,
      };
    });

    const totalPrice = products.reduce((total, product) => {
      return total + product.finalPrice;
    }, 0);

    res.render("users/Cart", {
      title: "Cart Page",
      isHomePage: true,
      user: user,
      cartItems: cartItems,
      products: products,
      totalPrice: totalPrice,
      allowProtoAccess: true,
    });
  } catch (error) {
    console.error("Error fetching cart details:", error);
    next(error);
  }
};

const addToCart = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const userId = req.user.userId;

    if (!userId) {
      return res.status(401).json({ message: "User not logged in" });
    }

    const existingCartItem = await Cart.findOne({ userId, productId });
    if (existingCartItem) {
      return res.status(400).json({ message: "Item already in cart" });
    }

    const newCartItem = new Cart({ userId, productId });
    await newCartItem.save();

    res.status(201).json({ message: "Item added to cart successfully" });
  } catch (error) {
    next(error);
  }
};

const removeCartItem = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const user = req.user;
    const userId = user.userId;
    if (!userId) {
      return res.status(401).json({ message: "User not logged in" });
    }
    await Cart.deleteOne({ userId, productId });
    res.status(200).json({ message: "Item removed from cart successfully" });
  } catch (error) {
    next(error);
  }
};

const updateQuantity = async (req, res) => {
  try {
    const { productId, quantity } = req.params;
    const userId = req.user.userId;

    if (!userId) {
      return res.status(401).json({ message: "User not logged in" });
    }

    const updatedQuantity = parseInt(quantity, 10);
    if (isNaN(updatedQuantity) || updatedQuantity < 1) {
      return res.status(400).json({ message: "Invalid quantity" });
    }

    const cartItem = await Cart.findOneAndUpdate(
      { userId, productId },
      { quantity: updatedQuantity },
      { new: true }
    );

    if (!cartItem) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    const product = await Product.findById(productId);
    const unitPrice = product.offerPrice || product.price;
    const finalPrice = unitPrice * updatedQuantity;

    res.status(200).json({
      message: "Quantity updated successfully",
      finalPrice: finalPrice.toFixed(2),
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating quantity", error });
  }
};

module.exports = { addToCart, getCartPage, removeCartItem, updateQuantity };
