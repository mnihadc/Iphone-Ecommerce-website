const mongoose = require("mongoose");
const Cart = require("../model/Cart");
const Product = require("../model/Product");

const getCartPage = async (req, res, next) => {
  try {
    const user = req.session.user;
    const userId = user.id;
    const cartItems = await Cart.find({ userId });
    const products = await Product.find({
      _id: { $in: cartItems.map((item) => item.productId) },
    });

    res.render("users/Cart", {
      title: "Cart Page",
      isHomePage: true,
      user: user,
      products: products,
    });
  } catch (error) {
    console.error("Error fetching cart details:", error);
    next(error);
  }
};

const addToCart = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const userId = req.session?.user?.id;

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

module.exports = { addToCart, getCartPage };
