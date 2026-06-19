// 1. Core Modules and Packages Imports
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');

// 2. Import Database Schemas
const Order = require('./models/Order');
const Review = require('./models/Review');

const app = express();

// 3. App Middleware Settings
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// 4. Nodemailer Transport Configuration
const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
        user: 'mohuaduttajsr0820@gmail.com', 
        pass: 'rcnl gygs rxtu puzt' 
    }
});

// 5. Connect to Local MongoDB Setup
mongoose.connect('mongodb://localhost:27017/coffeeShopDB')
    .then(() => console.log('Successfully connected to MongoDB!'))
    .catch(err => console.error('Database connection error:', err));


// --- 6. ENDPOINT API ROUTES ---

// Route A: Listen for incoming orders from frontend form
app.post('/api/orders', async (req, res) => {
    try {
        const newOrder = new Order(req.body);
        const savedOrder = await newOrder.save();
        res.status(201).json({ success: true, data: savedOrder });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// Route B: Submit a new review & trigger automated thank you email dispatch
app.post('/api/reviews', async (req, res) => {
    try {
        const { name, email, rating, comment } = req.body;
        
        // Save form submission record straight to MongoDB
        const newReview = new Review({ name, email, rating, comment });
        await newReview.save();

        // Setup the specific email layout rules
        const mailOptions = {
            from: 'mohuaduttajsr0820@gmail.com',
            to: email, 
            subject: 'Thank you for your review! ☕',
            html: `
                <h3>Hi ${name},</h3>
                <p>Thank you so much for taking the time to share your experience with Coffee.!</p>
                <p>We are thrilled that you gave us a <strong>${rating}/5 star</strong> rating. Your feedback helps our team keep roasting the best coffee beans around.</p>
                <br>
                <p>Warm regards,</p>
                <p><strong>The Coffee. Team</strong></p>
            `
        };

        // Fire off execution to send out email asynchronously
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Email notification failure:', error);
            } else {
                console.log('Automated validation email sent successfully: ' + info.response);
            }
        });

        res.status(201).json({ success: true, message: "Review saved and email sent!" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Route C: FETCH ALL ORDERS (PROTECTED DASHBOARD ROUTE)
app.get('/api/orders', async (req, res) => {
    // 1. Grab the security key sent by the frontend header
    const adminKey = req.headers['x-admin-key'];

    // 2. Verify if the key matches our secret passphrase
    if (adminKey !== 'hehe') {
        return res.status(403).json({ success: false, error: 'Access Denied: Invalid Admin Key' });
    }

    try {
        const allOrders = await Order.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: allOrders });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch orders' });
    }
});

// Route D: Pull down all reviews collection dataset to display back on ui grid
app.get('/api/reviews', async (req, res) => {
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

// Route E: DELETE AN ORDER WHEN SERVED
app.delete('/api/orders/:id', async (req, res) => {
    try {
        const deletedOrder = await Order.findByIdAndDelete(req.params.id);
        
        if (!deletedOrder) {
            return res.status(404).json({ success: false, error: "Order not found" });
        }

        res.status(200).json({ success: true, message: "Order successfully removed from database" });
    } catch (error) {
        console.error("Database delete error:", error);
        res.status(500).json({ success: false, error: "Failed to delete order" });
    }
});


// 7. Initialize listener loop pipeline (ALWAYS STAYS AT THE VERY BOTTOM)
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server is running smoothly on port ${PORT}`);
});