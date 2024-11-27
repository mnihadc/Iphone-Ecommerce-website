const Checkout = require("../model/Checkout");
const Cart = require("../model/Cart");
const Product = require("../model/Product");
const moment = require("moment");
require("dotenv").config(); // Ensure this is at the top of the file
const Stripe = require("stripe");
const User = require("../model/User");
const Address = require("../model/Address");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const checkout = async (req, res) => {
  try {
    const { offerCode, shippingMethod } = req.body;
    const user = req.user;
    const userId = user?.userId;

    if (!userId) {
      return res
        .status(400)
        .json({ message: "User ID is required and cannot be empty" });
    }
    const address = await Address.findOne({ userId, select: true });
    if (!address) {
      return res.status(400).json({
        message:
          "No address found. Please add a delivery address before checkout.",
        redirect: "/address/get-create-address",
      });
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
      addressId: address._id,
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
    const user = req.user;
    const userId = user.userId;

    // Fetch the most recent checkout data
    const checkoutData = await Checkout.find({ userId })
      .sort({ createdAt: -1 })
      .limit(1);

    if (!checkoutData || checkoutData.length === 0) {
      return res.status(404).json({ message: "No checkout history found" });
    }

    // Retrieve product details
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

    // Fetch address details using addressId
    const address = await Address.findById(checkoutData[0].addressId);
    const allAddress = await Address.find({ userId: userId });
    const fullCheckoutData = {
      checkout: {
        ...checkoutData[0].toObject(),
        items: checkoutItemsWithDetails,
        totalPrice: totalPrice,
        discount: checkoutData[0].discount || 0,
        delivery: checkoutData[0].delivery || "Standard-Delivery",
        offerCode: checkoutData[0].offerCode || null,
        address: address ? address.toObject() : null,
        addresses: allAddress,
      },
    };

    res.render("users/Checkout-Summery", {
      title: "Checkout Summary",
      user: req.user,
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
    const user = req.user;
    const userId = user?.userId;

    if (!userId) {
      return res.status(400).json({ message: "User not authenticated" });
    }

    const orders = await Checkout.find({ userId }).sort({ createdAt: -1 });

    const allProductIds = orders.flatMap((order) =>
      order.items.map((item) => item.productId)
    );

    const products = await Product.find({ _id: { $in: allProductIds } });

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
            : null,
        };
      });

      const totalPrice = enrichedItems.reduce(
        (acc, item) => acc + item.product.price * item.quantity,
        0
      );
      const gst = totalPrice * 0.18;

      const createdDate = new Date(order.createdAt);
      const deliveryDate = new Date(
        createdDate.getTime() + 7 * 24 * 60 * 60 * 1000
      );

      const currentDate = new Date();
      const totalDays = 7;
      const daysPassed = Math.min(
        Math.ceil((currentDate - createdDate) / (1000 * 60 * 60 * 24)),
        totalDays
      );
      const progress = (daysPassed / totalDays) * 100;

      const options = {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      };

      const formattedDeliveryDate = deliveryDate.toLocaleString(
        "en-IN",
        options
      );

      return {
        ...order.toObject(),
        items: enrichedItems,
        totalPrice,
        gst,
        deliveryDate: formattedDeliveryDate,
        progress: progress.toFixed(2),
      };
    });

    res.render("users/Order", {
      title: "Your Orders",
      user: req.user, // Changed to req.user directly
      isOrderPage: true,
      orders: enrichedOrders,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    next(error);
  }
};

const initiatePayment = async (req, res) => {
  try {
    const user = req.user;
    const userId = user?.userId;
    console.log(user);

    if (!userId) {
      return res
        .status(400)
        .json({ message: "User ID is required and cannot be empty" });
    }

    // Fetch the latest checkout data for the user
    const checkout = await Checkout.findOne({ userId }).sort({ createdAt: -1 });

    if (!checkout) {
      return res.status(404).json({ message: "No checkout data found." });
    }

    // If payment is already completed, prevent further payment attempts
    if (checkout.paymentStatus) {
      return res.status(400).json({ message: "Payment already completed" });
    }

    // Map checkout items to Stripe's line item format
    const lineItems = checkout.items
      .map((item) => {
        if (!item.itemTotalPrice || isNaN(item.itemTotalPrice)) {
          console.log("Invalid item total price for item:", item);
          return null;
        }

        return {
          price_data: {
            currency: "inr",
            product_data: {
              name: item.productName,
            },
            unit_amount: item.itemTotalPrice * 100,
          },
          quantity: item.quantity,
        };
      })
      .filter((item) => item !== null);

    if (lineItems.length === 0) {
      return res
        .status(400)
        .json({ message: "Invalid items data, unable to process payment." });
    }

    // Include delivery charge as a separate line item
    const deliveryCharge = isNaN(checkout.delivery) ? 0 : checkout.delivery;
    lineItems.push({
      price_data: {
        currency: "inr",
        product_data: {
          name: "Delivery Charge",
        },
        unit_amount: deliveryCharge * 100, // Convert to paise
      },
      quantity: 1,
    });

    // Create a Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${req.protocol}://${req.get(
        "host"
      )}/order/success?userId=${userId}`,
      cancel_url: `${req.protocol}://${req.get(
        "host"
      )}/order/cancel?userId=${userId}`,
      customer_email: user.email,
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error("Error initiating payment:", error);
    res.status(500).json({ message: "Error initiating payment", error });
  }
};

const initiatePaymentOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const user = req.user;
    const userId = user.userId;

    if (!orderId) {
      return res
        .status(400)
        .json({ message: "User ID is required and cannot be empty" });
    }

    // Fetch the latest checkout data for the user
    const checkout = await Checkout.findOne({ _id: orderId });

    if (!checkout) {
      return res.status(404).json({ message: "No checkout data found." });
    }

    // If payment is already completed, prevent further payment attempts
    if (checkout.paymentStatus) {
      return res.status(400).json({ message: "Payment already completed" });
    }

    // Map checkout items to Stripe's line item format
    const lineItems = checkout.items
      .map((item) => {
        if (!item.itemTotalPrice || isNaN(item.itemTotalPrice)) {
          console.log("Invalid item total price for item:", item);
          return null;
        }

        return {
          price_data: {
            currency: "inr",
            product_data: {
              name: item.productName,
            },
            unit_amount: item.itemTotalPrice * 100,
          },
          quantity: item.quantity,
        };
      })
      .filter((item) => item !== null);

    if (lineItems.length === 0) {
      return res
        .status(400)
        .json({ message: "Invalid items data, unable to process payment." });
    }

    // Include delivery charge as a separate line item
    const deliveryCharge = isNaN(checkout.delivery) ? 0 : checkout.delivery;
    lineItems.push({
      price_data: {
        currency: "inr",
        product_data: {
          name: "Delivery Charge",
        },
        unit_amount: deliveryCharge * 100, // Convert to paise
      },
      quantity: 1,
    });

    // Create a Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${req.protocol}://${req.get(
        "host"
      )}/order/success?userId=${userId}&orderId=${orderId}`,
      cancel_url: `${req.protocol}://${req.get(
        "host"
      )}/order/cancel?userId=${userId}&orderId=${orderId}`,
      customer_email: user.email,
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error("Error initiating payment:", error);
    res.status(500).json({ message: "Error initiating payment", error });
  }
};
// Handle Payment Success
const handlePaymentSuccess = async (req, res) => {
  try {
    const { orderId, userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let checkout;
    if (orderId) {
      // Find the checkout using the provided orderId
      checkout = await Checkout.findById(orderId);
      if (!checkout) {
        return res.status(404).json({ message: "Order not found" });
      }
    } else {
      // If no orderId is provided, fetch the latest checkout for the user
      checkout = await Checkout.findOne({ userId }).sort({ createdAt: -1 });
      if (!checkout) {
        return res.status(404).json({ message: "No checkout data found" });
      }
    }

    // Update payment status
    checkout.paymentStatus = true;
    await checkout.save();

    // Render the success page
    res.render("users/Payment-Success", {
      title: "Payment Successful",
      message: "Your payment was successful!",
      user,
    });
  } catch (error) {
    console.error("Error in handlePaymentSuccess:", error);
    res.status(500).json({ message: "Error handling payment success", error });
  }
};

// Handle Payment Cancellation
const handlePaymentCancel = async (req, res) => {
  try {
    const { userId, orderId } = req.query; // Fetch orderId from query params

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    let checkout;
    const user = await User.findById(userId);
    if (orderId) {
      // If orderId is provided, find the specific order
      checkout = await Checkout.findById(orderId);
      if (!checkout) {
        return res.status(404).json({ message: "Order not found" });
      }
    } else {
      // If no orderId, use the latest checkout for the user
      checkout = await Checkout.findOne({ userId }).sort({ createdAt: -1 });
      if (!checkout) {
        return res.status(404).json({ message: "No checkout data found" });
      }
    }

    // Render payment cancel page
    res.render("users/Payment-Cancel", {
      title: "Payment Canceled",
      user,
      message: "You canceled the payment process. Please try again.",
    });
  } catch (error) {
    console.error("Error handling payment cancel:", error);
    res.status(500).json({ message: "Error handling payment cancel", error });
  }
};

const updateOrderAddress = async (req, res, next) => {
  try {
    const { orderId, addressId } = req.body; // Expecting data in req.body
    const userId = req.user.userId;

    if (!userId) {
      return res.status(401).json({ message: "User not logged in" });
    }

    // Validate if the order belongs to the user
    const updatedOrder = await Checkout.findOneAndUpdate(
      { _id: orderId, userId: userId }, // Find the order by ID and user
      { addressId: addressId }, // Update the address
      { new: true } // Return the updated document
    );

    if (!updatedOrder) {
      return res
        .status(404)
        .json({ message: "Order not found or unauthorized" });
    }

    res.status(200).json({
      message: "Order address updated successfully",
      updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  updateOrderAddress,
  checkout,
  getCheckoutSummery,
  CancelOrder,
  getOrder,
  initiatePayment,
  handlePaymentSuccess,
  handlePaymentCancel,
  initiatePaymentOrder,
};
