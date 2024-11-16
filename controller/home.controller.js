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
    const products = await Product.aggregate([
      {
        $project: {
          _id: 1,
          name: 1,
          productImages: { $arrayElemAt: ["$productImages", 0] },
          offerPrice: 1,
          price: 1,
        },
      },
    ]);

    res.render("users/Shop", {
      title: "Shop Page",
      isHomePage: true,
      user: req.session.user,
      products: products,
    });
  } catch (error) {
    next(error);
  }
};
module.exports = {
  getHomePage,
  getShopPage,
};
