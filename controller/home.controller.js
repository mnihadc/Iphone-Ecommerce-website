const Product = require("../model/Product");

const getHomePage = async (req, res, next) => {
  try {
    const products = await Product.aggregate([
      {
        $project: {
          _id: 1,
          name: 1,
          productImages: { $arrayElemAt: ["$productImages", 0] },
          offerPrice: 1,
          price: 1,
          category: 1,
        },
      },
    ]);
    res.render("users/Home", {
      title: "Home Page",
      isHomePage: true,
      user: req.session.user,
      products: products,
    });
  } catch (error) {
    next(error);
  }
};

const getShopPage = async (req, res, next) => {
  try {
    // Extract filters from query parameters
    const { search, category, priceRange } = req.query;

    // Build filter criteria
    const filters = {};
    if (search) {
      filters.name = { $regex: search, $options: "i" }; // Case-insensitive search
    }
    if (category) {
      filters.category = category; // Exact category match
    }
    if (priceRange) {
      const [minPrice, maxPrice] = priceRange.split("-").map(Number);
      filters.$or = [
        { offerPrice: { $gte: minPrice, $lte: maxPrice } },
        { price: { $gte: minPrice, $lte: maxPrice } },
      ];
    }

    // Query the filtered products
    const products = await Product.find(filters, {
      name: 1,
      productImages: { $arrayElemAt: ["$productImages", 0] },
      offerPrice: 1,
      price: 1,
      category: 1,
    });

    // Fetch all categories for filter dropdown
    const categories = await Product.distinct("category");

    // Render JSON for AJAX responses or full page for regular requests
    if (req.xhr) {
      res.json({ products });
    } else {
      res.render("users/Shop", {
        title: "Shop",
        isShopPage: true,
        products: products,
        categories: categories.map((cat) => ({ category: cat })),
      });
    }
  } catch (error) {
    next(error);
  }
};

const searchSuggestions = async (req, res, next) => {
  const query = req.query.q; // Extract search query
  try {
    // Use regex for case-insensitive matching
    const products = await Product.find(
      { name: { $regex: query, $options: "i" } },
      { name: 1 } // Only return the name field
    ); // Limit results to avoid unnecessary load
    res.json(products);
  } catch (error) {
    next(error);
  }
};

const getViewProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }
    res.render("users/Product", {
      title: product.name,
      product: product,
      isViewProduct: true,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHomePage,
  getShopPage,
  searchSuggestions,
  getViewProduct,
};
