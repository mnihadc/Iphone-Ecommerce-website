const Admin = require("../model/Admin");
const Product = require("../model/Product");
const nodemailer = require("nodemailer");

// Get Home Page
const getHomePage = async (req, res, next) => {
  try {
    console.log(req.user);

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
    const banner = await Admin.findOne({ mainStatus: true });

    res.render("users/Home", {
      title: "Home Page",
      isHomePage: true,
      user: req.user,
      banner,
      products,
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

    const products = await Product.find(filters, {
      name: 1,
      productImages: { $arrayElemAt: ["$productImages", 0] },
      offerPrice: 1,
      price: 1,
      category: 1,
    });

    const categories = await Product.distinct("category");

    if (req.xhr) {
      res.json({ products });
    } else {
      res.render("users/Shop", {
        title: "Shop",
        isShopPage: true,
        products,
        categories: categories.map((cat) => ({ category: cat })),
        user: req.user, // Use token-based user
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
      user: req.user, // Use token-based user
      limitedProducts,
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
