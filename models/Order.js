const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    coffeeType: { type: String, required: true },
    size: { type: String, required: true },
    notes: { type: String },
    totalPrice: { type: Number, required: true },
    orderDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);