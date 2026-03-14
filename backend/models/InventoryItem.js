const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    normalizedName: { type: String, required: true, unique: true, index: true },
    unit: { type: String, default: 'pc', trim: true },
    quantity: { type: Number, required: true, min: 0, default: 0 },
    lowStockThreshold: { type: Number, required: true, min: 0, default: 10 },
    available: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model('InventoryItem', inventoryItemSchema);
