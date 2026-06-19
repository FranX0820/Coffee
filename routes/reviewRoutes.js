// routes/reviewRoutes.js
const express = require('express');
const router = express.Router();
const Review = require('../models/Review');

// 1. Submit a rating
router.post('/reviews', async (req, res) => {
    try {
        const { rating, comment } = req.body;
        
        const newReview = new Review({ rating, comment });
        await newReview.save();
        
        res.status(201).json({ success: true, message: "Rating submitted successfully!" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 2. Fetch all ratings AND the calculated average
router.get('/reviews', async (req, res) => {
    try {
        const reviews = await Review.find().sort({ createdAt: -1 });
        
        // Calculate the average score
        const totalReviews = reviews.length;
        let averageRating = 0;
        
        if (totalReviews > 0) {
            const sum = reviews.reduce((acc, item) => acc + item.rating, 0);
            averageRating = (sum / totalReviews).toFixed(1); // e.g., 4.5
        }

        res.status(200).json({
            averageRating,
            totalReviews,
            reviews
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;