const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    coffeeType: { type: String, required: true },
    size: { type: String, required: true },
    notes: { type: String },
    totalPrice: { type: Number, required: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Order", orderSchema);
