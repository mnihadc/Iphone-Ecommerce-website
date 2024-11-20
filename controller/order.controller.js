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

    const checkoutData = await Checkout.find({ userId })
      .sort({ createdAt: -1 })
      .limit(1);

    if (!checkoutData || checkoutData.length === 0) {
      return res.status(404).json({ message: "No checkout history found" });
    }

    const productIds = checkoutData[0].items.map((item) => item.productId);

    const products = await Product.find({ _id: { $in: productIds } });

    const checkoutItemsWithDetails = checkoutData[0].items.map((item) => {
      const product = products.find(
        (prod) => prod._id.toString() === item.productId.toString()
      );

      return {
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        itemTotalPrice: item.itemTotalPrice,
        product: product
          ? {
              name: product.name,
              battery: product.specifications.battery,
              colorOptions: product.colorOptions.map((color) => ({
                colorName: color.colorName,
                colorCode: color.colorCode,
              })),
              category: product.category,
              image: product.productImages[0],
              price: product.offerPrice || product.price,
              stock: product.stock,
            }
          : null,
      };
    });

    const totalPrice = checkoutItemsWithDetails.reduce(
      (acc, item) => acc + item.itemTotalPrice,
      0
    );

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

const CancelOrder = async (req, res, next) => {
  try {
    const id = req.params.id;

    const order = await Checkout.findByIdAndDelete(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    res.status(200).json({ message: "Order canceled successfully." });
  } catch (error) {
    console.error("Error canceling order:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

const getOrder = async (req, res, next) => {
  try {
    const user = req.session.user;
    const userId = user?.id;

    if (!userId) {
      return res.status(400).json({ message: "User not authenticated" });
    }

    // Fetch all orders for the user
    const orders = await Checkout.find({ userId }).sort({ createdAt: -1 });

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: "No orders found" });
    }

    // Extract all product IDs from all orders
    const allProductIds = orders.flatMap((order) =>
      order.items.map((item) => item.productId)
    );
    console.log(allProductIds);

    // Fetch product details for all product IDs
    const products = await Product.find({ _id: { $in: allProductIds } });

    // Enrich each order's items with product details
    const enrichedOrders = orders.map((order) => {
      const enrichedItems = order.items.map((item) => {
        const product = products.find(
          (prod) => prod._id.toString() === item.productId.toString()
        );

        return {
          ...item.toObject(),
          product: product
            ? {
                name: product.name,
                category: product.category,
                image: product.productImages[0],
                price: product.offerPrice || product.price,
                stock: product.stock,
                specifications: product.specifications,
              }
            : null, // Handle missing product details gracefully
        };
      });

      return {
        ...order.toObject(),
        items: enrichedItems,
      };
    });
    // Pass enriched orders data to the frontend
    res.render("users/Order", {
      title: "Your Orders",
      user: req.session.user,
      isOrderPage: true,
      orders: enrichedOrders,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    next(error);
  }
};

module.exports = { checkout, getCheckoutSummery, CancelOrder, getOrder };
