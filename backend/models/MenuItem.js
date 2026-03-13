const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, enum: ['Burger', 'Rice Meal', 'Fries', 'Drinks'] },
    image: { type: String, default: '' },
  },
  { timestamps: true },
);

module.exports = mongoose.model('MenuItem', menuItemSchema);
