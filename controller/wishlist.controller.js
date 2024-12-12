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
    const products = await Product.find({ _id: { $in: productIds } }).lean(); // .lean() to allow direct object manipulation

    // Format products data
    // Format products data
    const formattedProducts = products.map((product) => {
      // Get the first color option from the product, if available
      const colorOption = product.colorOptions?.[0];

      return {
        ...product,
        colorName: colorOption?.colorName || "No Color Available", // Fallback to a default message
        colorCode: colorOption?.colorCode || "#ffffff", // Fallback to white if no color code is provided
        firstProductImage: product.productImages?.[0] || "", // Extract the first product image
        createdTime: new Date(
          product.createdTime || Date.now()
        ).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
      };
    });

    // Render the wishlist page with formatted data
    res.render("users/WishList", {
      title: "WishList",
      user,
      items: formattedProducts, // Pass the formatted product details to the view
      WishListPage: true,
    });
  } catch (error) {
    // Handle any server errors
    console.error("Error fetching wishlist:", error);
    next(error);
  }
};

const removeWishList = async (req, res, next) => {
  try {
    const productId = req.params.id; // Extract product ID from URL
    const user = req.user; // User data from authentication middleware
    const userId = user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "User not logged in" });
    }

    const result = await WishList.deleteOne({ userId, productId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Product not found in wishlist" });
    }

    return res.status(200).json({ message: "Product removed from wishlist" });
  } catch (error) {
    next(error); // Pass error to global error handler
  }
};

const getCoupon = (req, res, next) => {
  const user = req.user;
  const userId = user?.userId;
  res.render("users/Coupon", {
    title: "Coupon",
    user,
    getCouponPage: true,
  });
};
module.exports = { addtoWishList, getWishList, removeWishList, getCoupon };
