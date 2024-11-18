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
        user: req.session.user,
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
    const allProducts = await Product.find();

    const shuffledProducts = allProducts.sort(() => Math.random() - 0.5);
    const limitedProducts = shuffledProducts.slice(
      0,
      Math.min(shuffledProducts.length, 16)
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }
    const formattedReleaseDate = new Date(
      product.releaseDate
    ).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const {
      _id,
      name,
      category,
      description,
      price,
      offerPrice,
      stock,
      productImages,
      colorOptions,
      specifications,
      releaseDate,
    } = product;

    res.render("users/ViewProducts", {
      title: name,
      _id,
      name,
      category,
      description,
      price,
      offerPrice,
      stock,
      productImages,
      colorOptions,
      specifications,
      releaseDate: formattedReleaseDate,
      isViewProduct: true,
      user: req.session.user,
      limitedProducts,
    });
  } catch (error) {
    next(error);
  }
};

const getAbout = (req, res, next) => {
  res.render("users/About", {
    title: "About",
    isAboutPage: true,
    user: req.session.user,
  });
};
module.exports = {
  getHomePage,
  getShopPage,
  searchSuggestions,
  getViewProduct,
  getAbout,
};
