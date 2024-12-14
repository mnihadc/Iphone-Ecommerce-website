const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  offerPrice: { type: Number },
  stock: { type: Number, required: true },
  productImages: { type: [String], required: true },
  colorOption: {
    // Changed from colorOptions array to a single object
    colorName: { type: String, required: true },
    colorCode: { type: String, required: true },
    colorImage: { type: String, default: "" }, // Default value for colorImage if not provided
  },
  specifications: [
    {
      key: { type: String, required: true }, // e.g., "Processor"
      value: { type: String, required: true }, // e.g., "Intel Core i7"
    },
  ],
  releaseDate: { type: Date },
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
