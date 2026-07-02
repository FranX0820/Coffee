const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    // 🎯 UPDATED SECTION: Replaced single coffeeType/size strings with an array of items
    items: [
      {
        coffeeType: { type: String, required: true },
        size: { type: String, required: true },
        quantity: { type: Number, required: true, default: 1 },
        price: { type: Number, required: true }
      }
    ],
    notes: { type: String, default: "" },
    totalPrice: { type: Number, required: true },
    status: {
      type: String,
      default: "pending",
      enum: ["pending", "completed", "Served"], // Kept your enums intact!
    },
    email: { type: String, required: true }
  },
  { timestamps: true },
);

module.exports = mongoose.model("Order", orderSchema);