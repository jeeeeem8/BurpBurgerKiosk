const mongoose = require('mongoose');

const addonSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, enum: ['burger', 'rice'] },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Addon', addonSchema);
