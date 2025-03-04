const Checkout = require("../model/Checkout");
const Cart = require("../model/Cart");
const Product = require("../model/Product");
const moment = require("moment");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
require("dotenv").config(); // Ensure this is at the top of the file
const Stripe = require("stripe");
const User = require("../model/User");
const Address = require("../model/Address");
const Coupon = require("../model/Coupon");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const checkout = async (req, res) => {
  try {
    const { offerCode, paymentOption } = req.body;
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

    // Check stock and update it
    for (const item of cart) {
      const product = products.find(
        (prod) => prod._id.toString() === item.productId.toString()
      );
      if (!product || product.stock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for product: ${
            product?.name || "Unknown"
          }`,
        });
      }
      await Product.updateOne(
        { _id: product._id },
        { $inc: { stock: -item.quantity } }
      );
    }

    const totalPrice = cartItems.reduce(
      (acc, item) => acc + item.itemTotalPrice,
      0
    );

    let discount = 0;
    if (offerCode) {
      const coupon = await Coupon.findOne({ code: offerCode.toUpperCase() });
      if (coupon && coupon.validUntil > new Date()) {
        const userOrders = await Checkout.find({ userId });
        const totalOrderPrice = userOrders.reduce(
          (sum, order) => sum + order.totalPrice,
          0
        );

        if (
          totalOrderPrice >= coupon.totalOrderPriceRange &&
          userOrders.some((order) => order.totalPrice >= coupon.orderRange)
        ) {
          discount = (totalPrice * coupon.discountPercentage) / 100;
        } else {
          return res.status(400).json({
            message: "Coupon does not meet the required conditions.",
          });
        }
      } else {
        return res.status(400).json({
          message: "Invalid or expired coupon code.",
        });
      }
    }

    const finalTotalPrice = totalPrice - discount;

    const newCheckout = new Checkout({
      userId,
      addressId: address._id,
      items: cartItems,
      totalPrice: finalTotalPrice,
      discount,
      offerCode: offerCode || null,
      paymentOption,
    });

    await newCheckout.save();
    await Cart.deleteMany({ userId });

    res.status(200).json({
      message: "Checkout successful",
      checkout: newCheckout,
    });
  } catch (err) {
    console.error("Error during checkout:", err);
    res.status(500).json({ message: "Error during checkout", error: err });
  }
};

const getCheckoutSummery = async (req, res, next) => {
  try {
    const user = req.user;
    const userId = user.userId;

    // Fetch the latest checkout data for the user
    const checkoutData = await Checkout.find({ userId })
      .sort({ createdAt: -1 })
      .limit(1);

    if (!checkoutData || checkoutData.length === 0) {
      return res.status(404).json({ message: "No checkout history found" });
    }

    const latestCheckout = checkoutData[0];

    const productIds = latestCheckout.items.map((item) => item.productId);
    const products = await Product.find({ _id: { $in: productIds } });

    const checkoutItemsWithDetails = latestCheckout.items.map((item) => {
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
              battery: product.specifications?.battery,
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
    const address = await Address.findById(latestCheckout.addressId);
    const allAddress = await Address.find({ userId });

    // Prepare the checkout summary data
    const fullCheckoutData = {
      checkout: {
        ...latestCheckout.toObject(),
        items: checkoutItemsWithDetails,
        totalPrice: totalPrice,
        totalPriceWithDiscount: totalPrice - latestCheckout.discount,
        discount: latestCheckout.discount || 0,
        delivery: latestCheckout.delivery || "Standard-Delivery",
        offerCode: latestCheckout.offerCode || null,
        paymentOption: latestCheckout.paymentOption, // Include payment option
        address: address ? address.toObject() : null,
        addresses: allAddress,
      },
    };
    const paymentOptions = [
      {
        value: "CashOnDelivery",
        isSelected: latestCheckout.paymentOption === "CashOnDelivery",
      },
      { value: "Upi", isSelected: latestCheckout.paymentOption === "Upi" },
    ];

    // Render the checkout summary page
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

const CancelOrder = async (req, res) => {
  try {
    const id = req.params.id;

    // Find the order in the database
    const order = await Checkout.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    // Delete the order from the database
    await Checkout.findByIdAndDelete(id);

    return res.status(200).json({
      message: "Order canceled and deleted successfully.",
    });
  } catch (error) {
    console.error("Error canceling order:", error);
    return res.status(500).json({
      message: "Internal server error.",
      error: error.message,
    });
  }
};

const getOrder = async (req, res, next) => {
  try {
    const user = req.user;
    const userId = user?.userId;
    const users = await User.findOne({ _id: userId });

    if (!userId) {
      return res.status(400).json({ message: "User not authenticated" });
    }

    const orders = await Checkout.find({ userId }).sort({ createdAt: -1 });

    const allProductIds = orders.flatMap((order) =>
      order.items.map((item) => item.productId)
    );

    const allAddressIds = orders
      .map((order) => order.addressId)
      .filter(Boolean);

    const [products, addresses] = await Promise.all([
      Product.find({ _id: { $in: allProductIds } }),
      Address.find({ _id: { $in: allAddressIds } }),
    ]);

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

      const totalPriceBeforeDiscount = enrichedItems.reduce(
        (acc, item) =>
          acc + (item.product ? item.product.price * item.quantity : 0),
        0
      );

      // Apply discount if available
      const discount = order.discount || 0; // Assuming discount is in the order object
      const totalPrice = totalPriceBeforeDiscount - discount;
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

      // Check if the order is delivered
      const isDelivered = currentDate >= deliveryDate;

      // Find the address safely
      const address = addresses.find(
        (addr) => addr?._id?.toString() === order.addressId?.toString()
      ) || {
        name: "N/A",
        street: "N/A",
        city: "N/A",
        state: "N/A",
        zipCode: "N/A",
        phone: "N/A",
      };

      return {
        ...order.toObject(),
        items: enrichedItems,
        totalPriceBeforeDiscount,
        totalPrice, // Total price after discount
        gst,
        deliveryDate: formattedDeliveryDate,
        progress: progress.toFixed(2),
        address,
        users,
        isDelivered, // Add the delivered flag
      };
    });

    res.render("users/Order", {
      title: "Your Orders",
      user: req.user,
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
    const userId = user.userId;
    const { orderId } = req.params; // Add orderId parameter to handle both initial and existing orders

    if (!userId) {
      return res
        .status(400)
        .json({ message: "User ID is required and cannot be empty" });
    }

    // Fetch the checkout data, based on whether it's a new checkout or an existing order
    let checkout;
    if (orderId) {
      // If orderId is passed, fetch the specific order details
      checkout = await Checkout.findOne({ _id: orderId });
      if (!checkout) {
        return res
          .status(404)
          .json({ message: "No checkout data found for this order." });
      }
      if (checkout.paymentStatus) {
        return res
          .status(400)
          .json({ message: "Payment already completed for this order." });
      }
    } else {
      // If no orderId is provided, fetch the latest checkout data
      checkout = await Checkout.findOne({ userId }).sort({ createdAt: -1 });
      if (!checkout) {
        return res
          .status(404)
          .json({ message: "No checkout data found for this user." });
      }
    }

    // Map checkout items to Stripe's line item format
    const lineItems = checkout.items
      .map((item) => {
        // Ensure itemTotalPrice is a valid number
        if (!item.itemTotalPrice || isNaN(item.itemTotalPrice)) {
          console.log("Invalid item total price for item:", item);
          return null; // Handle invalid data gracefully
        }
        return {
          price_data: {
            currency: "inr",
            product_data: {
              name: item.productName,
            },
            unit_amount: item.itemTotalPrice * 100, // Convert to paise (for INR)
          },
          quantity: item.quantity,
        };
      })
      .filter((item) => item !== null); // Filter out any invalid items

    if (lineItems.length === 0) {
      return res
        .status(400)
        .json({ message: "Invalid items data, unable to process payment." });
    }

    // Include delivery charge as a separate line item (ensure delivery is a valid number)
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

    // Create a payment intent if this is an existing order with no payment yet
    let paymentIntent;
    if (!checkout.paymentIntentId) {
      paymentIntent = await stripe.paymentIntents.create({
        amount: checkout.totalPrice * 100, // Convert to paise
        currency: "inr",
      });

      // Save paymentIntentId to checkout
      checkout.paymentIntentId = paymentIntent.id;

      try {
        await checkout.save(); // Save immediately
      } catch (error) {
        console.error("Error saving paymentIntentId:", error);
        return res.status(500).json({ message: "Error saving checkout data" });
      }
    } else {
      // If there's already a paymentIntentId, use it for the checkout session
      paymentIntent = await stripe.paymentIntents.retrieve(
        checkout.paymentIntentId
      );
    }

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${req.protocol}://${req.get(
        "host"
      )}/order/success?userId=${userId}&orderId=${checkout._id}`,
      cancel_url: `${req.protocol}://${req.get(
        "host"
      )}/order/cancel?userId=${userId}&orderId=${checkout._id}`,
      customer_email: user.email, // Provide email here
    });

    // Return the URL for the Stripe Checkout session
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
        .json({ message: "Order ID is required and cannot be empty" });
    }

    // Fetch the latest checkout data for the user
    const checkout = await Checkout.findOne({ _id: orderId });

    if (!checkout) {
      return res.status(404).json({ message: "No checkout data found." });
    }

    if (checkout.paymentStatus) {
      return res.status(400).json({ message: "Payment already completed" });
    }

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

    // Create a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: checkout.totalPrice * 100, // Convert to paise
      currency: "inr",
    });

    // Save `paymentIntentId` in checkout
    checkout.paymentIntentId = paymentIntent.id;

    try {
      await checkout.save(); // Save immediately
    } catch (error) {
      console.error("Error saving paymentIntentId:", error);
      return res.status(500).json({ message: "Error saving checkout data" });
    }

    // Create Stripe Checkout session
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
      customer_email: user.email, // Provide email here
    });

    // Return the URL for the Stripe Checkout session
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
      orderId,
    });
  } catch (error) {
    console.error("Error in handlePaymentSuccess:", error);
    res.status(500).json({ message: "Error handling payment success", error });
  }
};
const handlePaymentSuccessCOD = async (req, res) => {
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
    checkout.paymentStatus = false;
    await checkout.save();

    // Render the success page
    res.render("users/Payment-Success", {
      title: "Payment Successful",
      message: "Your payment was successful!",
      user,
      orderId,
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
      orderId,
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
    console.log("Received orderId:", orderId, "and addressId:", addressId); // Debugging

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

const confirmOrderCOD = async (req, res, next) => {
  const { orderId } = req.body;
  const userId = req.user.userId;

  try {
    const result = await Checkout.updateOne(
      { _id: orderId },
      { status: "Confirmed", paymentMethod: "COD" }
    );

    if (result.matchedCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // Send response after confirming the order
    res.json({
      success: true,
      message: "Order confirmed with Cash on Delivery",
      userId,
      orderId,
    });
  } catch (error) {
    console.error("Error confirming COD order:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const generateInvoice = async (req, res) => {
  const orderId = req.params.orderId;

  try {
    // Fetch the order data
    const order = await Checkout.findById(orderId)
      .populate("items.productId")
      .populate("addressId")
      .populate("userId")
      .exec();

    if (!order) {
      return res.status(404).send({ message: "Order not found" });
    }

    const PDFDocument = require("pdfkit");
    const fs = require("fs");
    const path = require("path");
    const doc = new PDFDocument({ margin: 50 });

    const logoPath = path.resolve(__dirname, "assets", "logo.png");

    // Check if logo file exists
    if (!fs.existsSync(logoPath)) {
      console.warn("Logo file not found. Proceeding without logo.");
    }

    let filename = `invoice_${orderId}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    doc.pipe(res);

    // Add border
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    doc
      .rect(20, 20, pageWidth - 40, pageHeight - 40)
      .strokeColor("#000")
      .stroke();

    // Add logo if available
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 50, 30, { width: 100 });
    }

    // Add header
    doc
      .fontSize(20)
      .text("iStore", 150, 30, { align: "right" })
      .fontSize(10)
      .text("mncKings MTR", 150, 55, { align: "right" })
      .text("Phone: +91-1234567890", 150, 70, { align: "right" })
      .text("Email: support@istore.com", 150, 85, { align: "right" });

    doc.moveDown(2);

    // Invoice details
    doc
      .fontSize(18)
      .text(`Invoice`, { align: "center", underline: true })
      .moveDown();
    doc
      .fontSize(12)
      .text(`Invoice ID: ${orderId}`)
      .text(`Invoice Date: ${new Date(order.createdAt).toLocaleDateString()}`)
      .moveDown();

    // Customer details
    doc
      .fontSize(12)
      .text(`Customer: ${order.userId.username}`)
      .text(
        `Address: ${order.addressId.fullName}, ${order.addressId.address}, ${order.addressId.city}`
      )
      .moveDown();

    // Items purchased
    doc.fontSize(12).text("Items:", { underline: true }).moveDown(0.5);
    order.items.forEach((item) => {
      doc.text(
        `${item.productId.name} - ₹${item.productId.price.toFixed(2)} x ${
          item.quantity
        }`
      );
    });

    // Summary details
    const totalAmount = order.items.reduce(
      (sum, item) => sum + item.productId.price * item.quantity,
      0
    );
    const gst = totalAmount * 0.18; // Assuming GST is 18%
    const finalAmount = totalAmount + gst - order.discount;

    doc.moveDown();
    doc
      .fontSize(12)
      .text(`Total Price: ₹${totalAmount.toFixed(2)}`)
      .text(`Discount: ₹${order.discount.toFixed(2)}`)
      .text(`GST: ₹${gst.toFixed(2)}`)
      .text(`Total Amount: ₹${finalAmount.toFixed(2)}`)
      .moveDown();

    // Thank you note
    doc
      .fontSize(12)
      .text("Thank you for shopping with us!", { align: "center" });

    // Finalize PDF
    doc.end();
  } catch (error) {
    console.error("Error generating invoice:", error.message);
    res
      .status(500)
      .send({ message: "Error generating invoice", error: error.message });
  }
};

const refundPayment = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    // Find the checkout order in the database
    const checkout = await Checkout.findById(orderId);

    if (!checkout) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if paymentStatus is true (indicating payment was successful)
    if (!checkout.paymentStatus) {
      return res
        .status(400)
        .json({ message: "Cannot refund an order that hasn't been paid for" });
    }

    const paymentIntentId = checkout.paymentIntentId;

    if (!paymentIntentId) {
      return res
        .status(400)
        .json({ message: "No payment intent found for this order" });
    }

    // Retrieve the payment intent details from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    console.log(paymentIntent);

    // Check if the PaymentIntent is successfully captured
    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({
        message: "PaymentIntent was not successfully completed. Cannot refund.",
      });
    }

    // Check if the payment has already been refunded
    if (
      paymentIntent.charges.data[0].refunds &&
      paymentIntent.charges.data[0].refunds.data.length > 0
    ) {
      return res
        .status(400)
        .json({ message: "This payment has already been refunded." });
    }

    // Proceed with refund directly using the PaymentIntent ID
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId, // Refund the PaymentIntent directly
    });

    if (refund.status === "succeeded") {
      // Update the checkout status to reflect that the payment is refunded
      checkout.paymentStatus = false; // Mark payment as not completed
      await checkout.save();

      return res.status(200).json({
        message: "Refund successful",
        refund,
      });
    } else {
      return res.status(500).json({
        message: "Refund failed",
        refund,
      });
    }
  } catch (error) {
    console.error("Error processing refund:", error);
    // Log the detailed Stripe error
    if (error.raw) {
      console.error("Stripe Error:", error.raw);
    }
    res.status(500).json({ message: "Error processing refund", error });
  }
};

module.exports = {
  updateOrderAddress,
  checkout,
  confirmOrderCOD,
  getCheckoutSummery,
  CancelOrder,
  getOrder,
  initiatePayment,
  handlePaymentSuccess,
  handlePaymentCancel,
  initiatePaymentOrder,
  generateInvoice,
  handlePaymentSuccessCOD,
  refundPayment,
};
