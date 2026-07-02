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

    // 📦 Generate an HTML list item for every single beverage in the basket
    const orderItemsHtml = savedOrder.items
      .map(
        (item) => `
        <li>
          <strong>${item.quantity}x ${item.coffeeType.toUpperCase()}</strong> (${item.size.toUpperCase()}) - $${item.price.toFixed(2)}
        </li>
      `,
      )
      .join("");

    // ☕ EMAIL DISPATCH 1: ORDER CONFIRMED
    const mailOptions = {
      from: "mohuaduttajsr0820@gmail.com",
      to: String(savedOrder.email).trim(),
      subject: "Your Coffee Order is Cooking! ☕🔥",
      html: `
        <h3>Order Confirmed!</h3>
        <p>Hi there! We have successfully received your basket order:</p>
        
        <ul style="padding-left: 20px; color: #333;">
          ${orderItemsHtml}
        </ul>

        <p><strong>Total Bill Amount:</strong> $${savedOrder.totalPrice.toFixed(2)}</p>
        <p>Our baristas are steaming up the milk right now. You can track your progress live on your dashboard tracking application!</p>
        <br>
        <p>Warmly,<br><strong>The Coffee Team</strong></p>
      `,
    };

    // Fire the confirmation email asynchronously
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error("🔴 ORDER CONFIRMATION EMAIL FAILURE:", err);
      } else {
        console.log(
          "✅ Confirmation email successfully dispatched:",
          info.response,
        );
      }
    });

    res.status(201).json({
      success: true,
      message: "Basket order recorded successfully!",
      data: savedOrder,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});
// Route B: Submit a new review & trigger automated thank you email dispatch
app.post("/api/reviews", async (req, res) => {
  try {
    const { name, email, rating, comment } = req.body;

    // Save form submission record straight to MongoDB
    const newReview = new Review({ name, email, rating, comment });
    const savedReview = await newReview.save();

    // Setup the specific email layout rules
    const mailOptions = {
      from: "mohuaduttajsr0820@gmail.com",
      to: "mohuaduttajsr0820@gmail.com", // Notification to you
      subject: `[Review Alert] New ${rating}-Star Rating from ${name} ☕`,
      html: `
        <h3>New Website Review Received</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Rating:</strong> ${rating} / 5 Stars</p>
        <p><strong>Comment:</strong> ${comment}</p>
        <br>
        <p>Warm regards,</p>
        <p><strong>The Coffee Team</strong></p>
      `,
    };

    // FORCE the server to wait until SendGrid accepts the email before responding
    try {
      await transporter.sendMail(mailOptions);
      console.log("✅ Review email accepted by SendGrid queue safely.");
    } catch (mailError) {
      console.error("🔴 SendGrid internal connection drop:", mailError);
      // We don't crash the whole request if only the email fails
    }

    // Now send the success token back to your browser
    return res
      .status(201)
      .json({ success: true, message: "Review saved and email sent!" });
  } catch (error) {
    console.error("🔴 CRITICAL REVIEW ROUTE ERROR:", error);
    return res.status(500).json({ success: false, error: error.message });
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
      { status: "Served" },
      { new: true },
    );

    if (!updatedOrder) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    // Compile simple text summary of items ordered
    let coffeeListText = "Your Coffee Order";
    if (updatedOrder.items && updatedOrder.items.length > 0) {
      coffeeListText = updatedOrder.items
        .map((item) => `${item.quantity}x ${item.coffeeType.toUpperCase()}`)
        .join(", ");
    }

    const customerEmail = updatedOrder.email;

    const mailOptions = {
      from: "mohuaduttajsr0820@gmail.com",
      to: String(customerEmail).trim(),
      subject: `Your Coffee is Ready! ☕✨`,
      html: `
        <h3>Your order is ready for pickup!</h3>
        <p>Hi Customer,</p>
        <p>Your freshly brewed order: <strong>${coffeeListText}</strong> is on the counter and ready for you.</p>
        <br>
        <p>Thank you for brewing with us!</p>
        <p><strong>The Coffee Team</strong></p>
      `,
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error("🔴 ORDER SERVED EMAIL FAILURE:", err);
      } else {
        console.log("✅ Order pickup email successfully sent:", info.response);
      }
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
// ✅ LOYALTY STAMP ROUTE: Counts completed orders for an email
app.get("/api/loyalty/:email", async (fileRequest, fileResponse) => {
  try {
    const customerEmail = fileRequest.params.email.trim();

    // Count how many orders under this email are marked as completed/served
    // Note: Change "Served" to match your exact database status string if different
    const completedCount = await Order.countDocuments({
      email: customerEmail,
      status: "Served",
    });

    fileResponse.json({
      success: true,
      stamps: completedCount % 10, // Resets back to 0 once they hit 10 stamps
      freeCoffeesEarned: Math.floor(completedCount / 10),
    });
  } catch (error) {
    fileResponse.status(500).json({ success: false, error: error.message });
  }
});
