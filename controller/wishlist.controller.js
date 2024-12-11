const Product = require("../model/Product");
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

const getWishList = async (req, res, next) => {
  try {
    const user = req.user;

    // Ensure user is authenticated
    if (!user || !user.userId) {
      return res
        .status(401)
        .json({ message: "Unauthorized access. Please log in." });
    }

    const userId = user.userId;

    // Fetch wishlist items for the user
    const wishListItems = await WishList.find({ userId });

    // Check if the wishlist is empty
    if (!wishListItems || wishListItems.length === 0) {
      return res.status(404).json({ message: "Your wishlist is empty." });
    }

    // Get product IDs from the wishlist
    const productIds = wishListItems.map((item) => item.productId);

    // Fetch product details for the wishlist items
    const products = await Product.find({ _id: { $in: productIds } });

    // Render the wishlist page with data
    res.render("WishList", {
      title: "WishList",
      items: products, // Pass the product details to the view
      WishListPage: true,
    });
  } catch (error) {
    // Handle any server errors
    console.error("Error fetching wishlist:", error);
    next(error);
  }
};

module.exports = { addtoWishList, getWishList };
