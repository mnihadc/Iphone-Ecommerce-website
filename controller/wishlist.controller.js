const WishList = require("../model/WishList");

const addtoWishList = async (req, res, next) => {
  try {
    const productId = req.params.id;
    const user = req.user;
    const userId = user?.userId;

    // Check if the user is authenticated
    if (!userId) {
      return res.status(401).json({ message: "User not logged in" });
    }

    // Check if the product is already in the wishlist
    const productalreadyisdb = await WishList.findOne({ userId, productId });
    if (productalreadyisdb) {
      return res.status(400).json({ message: "Product already in wishlist" });
    }

    // Add the product to the wishlist
    const newWishList = new WishList({ userId, productId });
    await newWishList.save();

    // Respond with success
    res.status(201).json({ message: "Item added to WishList successfully" });
  } catch (error) {
    next(error); // Pass error to error-handling middleware
  }
};

module.exports = { addtoWishList };
