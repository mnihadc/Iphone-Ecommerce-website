const Admin = require("../model/Admin");
const Coupon = require("../model/Coupon");
const Product = require("../model/Product");
const nodemailer = require("nodemailer");
const WishList = require("../model/WishList");

// Get Home Page
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

    const userWishlist = req.user
      ? await WishList.find({ userId: req.user.userId })
      : [];
    const wishlistProductIds = userWishlist.map((item) =>
      item.productId.toString()
    );

    // Add `isAdded` property to each product
    const productsWithWishlist = products.map((product) => ({
      ...product,
      isAdded: wishlistProductIds.includes(product._id.toString()),
    }));

    const banner = await Admin.findOne({ mainStatus: true });

    res.render("users/Home", {
      title: "Home Page",
      isHomePage: true,
      user: req.user,
      banner,
      products: productsWithWishlist, // Send updated products array
    });
  } catch (error) {
    next(error);
  }
};
// Get Shop Page
const getShopPage = async (req, res, next) => {
  try {
    const { search, category, priceRange } = req.query;

    const filters = {};
    if (search) {
      filters.name = { $regex: search, $options: "i" };
    }
    if (category) {
      filters.category = category;
    }
    if (priceRange) {
      const [minPrice, maxPrice] = priceRange.split("-").map(Number);
      filters.$or = [
        { offerPrice: { $gte: minPrice, $lte: maxPrice } },
        { price: { $gte: minPrice, $lte: maxPrice } },
      ];
    }

    // Fetch products
    const products = await Product.find(filters, {
      id: 1,
      name: 1,
      productImages: { $arrayElemAt: ["$productImages", 0] },
      offerPrice: 1,
      price: 1,
      category: 1,
    });

    // Fetch categories
    const categories = await Product.distinct("category");

    // Check if user is logged in and if so, get their wishlist
    const userWishlist = req.user
      ? await WishList.find({ userId: req.user.userId })
      : [];
    const wishlistProductIds = userWishlist.map((item) =>
      item.productId.toString()
    );

    // Add `isAdded` flag to each product
    const productsWithIsAdded = products.map((product) => ({
      ...product.toObject(),
      isAdded: wishlistProductIds.includes(product.id.toString()),
    }));

    if (req.xhr) {
      res.json({ products: productsWithIsAdded });
    } else {
      res.render("users/Shop", {
        title: "Shop",
        isShopPage: true,
        products: productsWithIsAdded,
        categories: categories.map((cat) => ({ category: cat })),
        user: req.user, // User from the token
      });
    }
  } catch (error) {
    next(error);
  }
};

// Search Suggestions
const searchSuggestions = async (req, res, next) => {
  const query = req.query.q;
  try {
    const products = await Product.find(
      { name: { $regex: query, $options: "i" } },
      { name: 1 }
    );
    res.json(products);
  } catch (error) {
    next(error);
  }
};

// View Product
const getViewProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;

    // Fetch the product details
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    // Fetch all products to show "related" products
    const allProducts = await Product.find();
    const shuffledProducts = allProducts.sort(() => Math.random() - 0.5);
    const limitedProducts = shuffledProducts.slice(
      0,
      Math.min(shuffledProducts.length, 16)
    );

    // Format the release date
    const formattedReleaseDate = new Date(
      product.releaseDate
    ).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Check if the product is in the user's wishlist
    let isAddedToWishlist = false;
    if (req.user) {
      const userWishlist = await WishList.findOne({
        userId: req.user.userId,
        productId: productId,
      });
      isAddedToWishlist = !!userWishlist; // true if wishlist entry exists
    }

    const {
      _id,
      name,
      category,
      description,
      price,
      offerPrice,
      stock,
      productImages,
      colorOptions, // colorOptions is an array
      specifications,
    } = product;

    // Get the first color option from the array
    const selectedColorOption = colorOptions && colorOptions[0];

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
      colorOption: selectedColorOption,
      specifications,
      releaseDate: formattedReleaseDate,
      isViewProduct: true,
      user: req.user, // Use token-based user
      limitedProducts,
      isAddedToWishlist, // Flag to check if in wishlist
    });
  } catch (error) {
    next(error);
  }
};

// About Page
const getAbout = (req, res, next) => {
  res.render("users/About", {
    title: "About",
    isAboutPage: true,
    user: req.user, // Use token-based user
  });
};

// Blog Page
const getBlog = (req, res, next) => {
  res.render("users/Blog", {
    title: "Blog",
    isBlogPage: true,
    user: req.user, // Use token-based user
  });
};

// Contact Us Page
const getContactUs = (req, res, next) => {
  res.render("users/ContactUs", {
    title: "Contact Us",
    isContactUsPage: true,
    user: req.user, // Use token-based user
  });
};

// Contact Us Form Submission
const ContactUs = async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: email,
      to: "mncnihad@gmail.com",
      subject: `Contact Form Submission: ${subject}`,
      text: `You received a new message from ${name} (${email}):\n\n${message}`,
    };

    await transporter.sendMail(mailOptions);

    res.json({
      message: "Thank you for contacting us. We'll get back to you soon.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "There was an error sending the email." });
  }
};

module.exports = {
  getHomePage,
  getShopPage,
  searchSuggestions,
  getViewProduct,
  getAbout,
  getBlog,
  getContactUs,
  ContactUs,
};
