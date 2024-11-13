const Cart = require("../model/Cart");

const addToCart = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const userId = req.session.user.id;
    const existingCartItem = await Cart.findOne({ userId, productId });

    if (existingCartItem) {
      return res.status(400).json({ message: "Item already in cart" });
    }
    const newCartItem = new Cart({
      userId,
      productId,
    });

    await newCartItem.save();

    res.status(201).json({ message: "Item added to cart successfully" });
  } catch (error) {
    next(error);
  }
};

module.exports = { addToCart };
