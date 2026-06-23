const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    coffeeType: { type: String, required: true },
    size: { type: String, required: true },
    notes: { type: String, default: "" },
    totalPrice: { type: Number, required: true },
    status: {
      type: String,
      default: "pending",
      enum: ["pending", "completed"],
    },
    email: { type: String, required: true }
  },
  { timestamps: true },
);

module.exports = mongoose.model("Order", orderSchema);
