const mongoose = require("mongoose");
const Cart = require("../model/Cart");
const Product = require("../model/Product");

const getCartPage = async (req, res, next) => {
  try {
    const user = req.session.user;
    const userId = user.id;

    const cartItems = await Cart.find({ userId });

    let products = await Product.find({
      _id: { $in: cartItems.map((item) => item.productId) },
    });

    products = products.map((product) => {
      return {
        ...product.toObject(),
        firstImage: product.productImages && product.productImages[0],
        finalPrice: product.offerPrice || product.price,
        categoryName: product.category ? product.category.name : "",
        productName: product.name,
      };
    });

    const totalPrice = products.reduce((total, product) => {
      return total + product.finalPrice;
    }, 0);

    res.render("users/Cart", {
      title: "Cart Page",
      isHomePage: true,
      user: user,
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

const removeCartItem = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const user = req.session.user;
    const userId = user.id;
    if (!userId) {
      return res.status(401).json({ message: "User not logged in" });
    }
    await Cart.deleteOne({ userId, productId });
    res.status(200).json({ message: "Item removed from cart successfully" });
  } catch (error) {
    next(error);
  }
};
module.exports = { addToCart, getCartPage, removeCartItem };
