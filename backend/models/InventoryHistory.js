const mongoose = require('mongoose');

const inventoryHistorySchema = new mongoose.Schema(
  {
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem', required: false },
    itemName: { type: String, required: true, trim: true },
    changeType: { type: String, enum: ['added', 'deducted', 'updated'], required: true },
    quantityBefore: { type: Number, default: 0 },
    quantityAfter: { type: Number, default: 0 },
    quantityChange: { type: Number, default: 0 },
    unit: { type: String, default: 'pc', trim: true },
    reason: { type: String, default: '', trim: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model('InventoryHistory', inventoryHistorySchema);
