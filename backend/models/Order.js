const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['regular', 'mix-match'], default: 'regular' },
    menuItemId: { type: String, default: '' },
    name: { type: String, required: true },
    meals: { type: [String], default: [] },
    category: { type: String, default: '' },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    addons: [
      {
        name: { type: String, required: true },
        price: { type: Number, required: true },
      },
    ],
    requestNote: { type: String, default: '' },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: Number, required: true, unique: true },
    customerName: { type: String, required: true, trim: true },
    items: { type: [orderItemSchema], default: [] },
    addons: { type: [String], default: [] },
    quantity: { type: Number, default: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
    requestNote: { type: String, default: '' },
    status: {
      type: String,
      enum: ['active', 'preparing', 'completed'],
      default: 'completed',
    },
    date: { type: String, required: true },
    time: { type: String, required: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Order', orderSchema);
