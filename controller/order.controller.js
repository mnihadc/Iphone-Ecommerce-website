const Checkout = require("../model/Checkout");
const Cart = require("../model/Cart");
const Product = require("../model/Product");

const checkout = async (req, res) => {
  try {
    const { offerCode, shippingMethod } = req.body;
    const user = req.session.user;
    const userId = user?.id;

    if (!userId) {
      return res
        .status(400)
        .json({ message: "User ID is required and cannot be empty" });
    }

    const cart = await Cart.find({ userId });
    if (!cart || cart.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const productIds = cart.map((item) => item.productId);
    const products = await Product.find({ _id: { $in: productIds } });

    // Map the products to cart items
    const cartItems = cart.map((item) => {
      const product = products.find(
        (prod) => prod._id.toString() === item.productId.toString()
      );
      return {
        productId: product._id,
        productName: product.name,
        quantity: item.quantity,
        itemTotalPrice: (product.offerPrice || product.price) * item.quantity,
      };
    });

    const totalPrice = cartItems.reduce(
      (acc, item) => acc + item.itemTotalPrice,
      0
    );

    let discount = 0;
    if (offerCode === "DISCOUNT10") {
      discount = totalPrice * 0.1;
    }

    const shippingCost = shippingMethod === "Express-Delivery" ? 10 : 5;
    const finalTotalPrice = totalPrice - discount + shippingCost;

    const newCheckout = new Checkout({
      userId,
      items: cartItems,
      totalPrice: finalTotalPrice,
      discount,
      offerCode: offerCode || null,
      delivery: shippingMethod,
    });

    // Save the checkout and clear the cart
    await newCheckout.save();
    await Cart.deleteMany({ userId });

    res.status(200).json({
      message: "Checkout successful",
      checkout: newCheckout,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error during checkout", error: err });
  }
};

const getCheckoutSummery = async (req, res, next) => {
  try {
    const user = req.session.user;
    const userId = user.id;

    // Fetch the most recent checkout for the user
    const checkoutData = await Checkout.find({ userId })
      .sort({ createdAt: -1 })
      .limit(1);

    if (!checkoutData || checkoutData.length === 0) {
      return res.status(404).json({ message: "No checkout history found" });
    }

    // Extract product IDs from the checkout items
    const productIds = checkoutData[0].items.map((item) => item.productId);

    // Fetch the product details
    const products = await Product.find({ _id: { $in: productIds } });

    // Map checkout items to include detailed product information along with the quantity
    const checkoutItemsWithDetails = checkoutData[0].items.map((item) => {
      const product = products.find(
        (prod) => prod._id.toString() === item.productId.toString()
      );

      return {
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity, // Include quantity from checkout
        itemTotalPrice: item.itemTotalPrice, // Total price for the item
        product: product
          ? {
              name: product.name,
              battery: product.specifications.battery,
              colorOptions: product.colorOptions.map((color) => ({
                colorName: color.colorName,
                colorCode: color.colorCode,
              })),
              category: product.category,
              image: product.productImages[0], // Use the first image
              price: product.offerPrice || product.price,
              stock: product.stock, // Include stock quantity of the product
            }
          : null,
      };
    });

    // Calculate the total price again (if necessary)
    const totalPrice = checkoutItemsWithDetails.reduce(
      (acc, item) => acc + item.itemTotalPrice,
      0
    );

    // Prepare the full checkout data to render
    const fullCheckoutData = {
      checkout: {
        ...checkoutData[0].toObject(),
        items: checkoutItemsWithDetails,
        totalPrice: totalPrice,
        discount: checkoutData[0].discount || 0,
        delivery: checkoutData[0].delivery || "Standard-Delivery",
        offerCode: checkoutData[0].offerCode || null,
      },
    };

    // Render the checkout summary page with full data
    res.render("users/Checkout-Summery", {
      title: "Checkout Summary",
      user: req.session.user,
      isCheckoutSummery: true,
      ...fullCheckoutData,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { checkout, getCheckoutSummery };
