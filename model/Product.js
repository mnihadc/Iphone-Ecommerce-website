const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  offerPrice: { type: Number },
  stock: { type: Number, required: true },
  productImages: { type: [String], required: true }, // Array of URLs
  colorOptions: [
    {
      colorName: { type: String, required: true },
      colorCode: { type: String, required: true },
      colorImage: { type: String }, // Single URL
    },
  ],
  specifications: { type: Object, required: true },
  releaseDate: { type: Date },
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
