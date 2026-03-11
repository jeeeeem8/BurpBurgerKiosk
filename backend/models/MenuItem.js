const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, enum: ['Rice Meals', 'Burgers'] },
    image: { type: String, default: '' },
  },
  { timestamps: true },
);

module.exports = mongoose.model('MenuItem', menuItemSchema);
