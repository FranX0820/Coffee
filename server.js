// 1. Core Modules and Packages Imports
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const nodemailer = require("nodemailer");

// 2. Import Database Schemas
const Order = require("./models/Order");
const Review = require("./models/Review");

const app = express();

// 3. App Middleware Settings
app.use(express.json());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "x-admin-key"],
  }),
);
app.use(express.static(path.join(__dirname, "public")));

// 4. Nodemailer SendGrid API Configuration (Bypasses Firewall Ports)
const sgTransport = require("nodemailer-sendgrid-transport");

const transporter = nodemailer.createTransport(
  sgTransport({
    auth: {
      api_key: process.env.SENDGRID_API_KEY, // 👈 Securely pulled from Render environment variables
    },
  }),
);

// 5. Connect to Local MongoDB Setup
// 5. Connect to Local MongoDB Setup
mongoose
  .connect(
    "mongodb+srv://mohuaduttajsr0820_db_user:Mohua@cluster0.ragpkby.mongodb.net/coffeeShopDB?retryWrites=true&w=majority&appName=Cluster0",
  )
  .then(() => console.log("Successfully connected to MongoDB Atlas Cloud!"))
  .catch((err) => console.error("Database connection error:", err));

// --- 6. ENDPOINT API ROUTES ---

// Route A: Listen for incoming orders from frontend form
app.post("/api/orders", async (req, res) => {
  try {
    const orderData = { ...req.body, status: "pending" };
    const newOrder = new Order(orderData);
    const savedOrder = await newOrder.save();

    // ☕ EMAIL DISPATCH 1: ORDER CONFIRMED
    const mailOptions = {
      from: "mohuaduttajsr0820@gmail.com",
      to: String(savedOrder.email).trim(),
      subject: "Your Coffee Order is Cooking! ☕🔥",
      html: `
                <h3>Order Confirmed!</h3>
                <p>Hi there! We have received your order for a fresh <strong>${savedOrder.size.toUpperCase()} ${savedOrder.coffeeType.toUpperCase()}</strong>.</p>
                <p>Our baristas are steaming up the milk right now. You can track your progress live on your dashboard tracking application!</p>
                <br>
                <p>Warmly,<br><strong>The Coffee. Team</strong></p>
            `,
    };

    // Fire the email asynchronously
    transporter.sendMail(mailOptions, (err) => {
      if (err) console.error("Order Creation Email Failure:", err);
    });

    res.status(201).json({ success: true, data: savedOrder });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Route B: Submit a new review & trigger automated thank you email dispatch
app.post("/api/reviews", async (req, res) => {
  try {
    const { name, email, rating, comment } = req.body;

    // Save form submission record straight to MongoDB
    const newReview = new Review({ name, email, rating, comment });
    await newReview.save();

    // Setup the specific email layout rules
    const mailOptions = {
      from: "mohuaduttajsr0820@gmail.com",
      to: "mohuaduttajsr0820@gmail.com",
      subject: "Thank you for your review! ☕",
      html: `
                <h3>Hi ${name},</h3>
                <p>Thank you so much for taking the time to share your experience with Coffee.!</p>
                <p>We are thrilled that you gave us a <strong>${rating}/5 star</strong> rating. Your feedback helps our team keep roasting the best coffee beans around.</p>
                <br>
                <p>Warm regards,</p>
                <p><strong>The Coffee. Team</strong></p>
            `,
    };

    // Fire off execution to send out email asynchronously
    await transporter.sendMail(mailOptions);

    res
      .status(201)
      .json({ success: true, message: "Review saved and email sent!" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Route C: FETCH PENDING ORDERS ONLY FOR DASHBOARD
app.get("/api/orders", async (req, res) => {
  const adminKey = req.headers["x-admin-key"];

  if (adminKey !== "hehe") {
    return res
      .status(403)
      .json({ success: false, error: "Access Denied: Invalid Admin Key" });
  }

  try {
    // Only return orders where status is 'pending' so served orders hide away dynamically
    const incomingOrders = await Order.find({ status: "pending" }).sort({
      createdAt: -1,
    });
    res.status(200).json({ success: true, data: incomingOrders });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch orders" });
  }
});

// Route D: Pull down all reviews collection dataset to display back on ui grid
app.get("/api/reviews", async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 });
    const totalReviews = reviews.length;
    let averageRating = 0;
    if (totalReviews > 0) {
      const sum = reviews.reduce((acc, item) => acc + item.rating, 0);
      averageRating = (sum / totalReviews).toFixed(1);
    }
    res.status(200).json({ averageRating, totalReviews, reviews });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Route E: Update order status to completed and notify user
app.put("/api/orders/:id/serve", async (req, res) => {
  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { status: "completed" },
      { new: true },
    );

    if (!updatedOrder) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    // ☕ EMAIL DISPATCH 2: ORDER READY FOR PICKUP
    const mailOptions = {
      from: "mohuaduttajsr0820@gmail.com",
      to: String(updatedOrder.email).trim(),
      subject: "Your Fresh Brew is Ready for Pickup! 🎉☕",
      html: `
                <h3>Your Coffee is Ready!</h3>
                <p>Your <strong>${updatedOrder.coffeeType.toUpperCase()}</strong> has finished roasting and is sitting fresh at the pickup counter!</p>
                <p>Head over and grab it while it's perfectly piping hot.</p>
                <br>
                <p>See you at the counter,<br><strong>The Coffee. Team</strong></p>
            `,
    };

    // Fire the email asynchronously
    transporter.sendMail(mailOptions, (err) => {
      if (err) console.error("Order Served Email Failure:", err);
    });

    res.status(200).json({
      success: true,
      message: "Order status marked as completed!",
      data: updatedOrder,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, error: "Failed to update order status" });
  }
});

// 7. Initialize listener loop pipeline (ALWAYS STAYS AT THE VERY BOTTOM)
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running smoothly on port ${PORT}`);
});
