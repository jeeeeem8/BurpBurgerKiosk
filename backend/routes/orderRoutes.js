const express = require('express');
const Order = require('../models/Order');

const router = express.Router();
const MIX_MATCH_PRICE = 158;

const formatDate = (date) =>
  date.toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' });

const formatTime = (date) =>
  date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

const getPeriodStart = (period) => {
  const now = new Date();

  if (period === 'day') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  if (period === 'week') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    start.setDate(start.getDate() - start.getDay());
    return start;
  }

  if (period === 'month') {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  if (period === 'year') {
    return new Date(now.getFullYear(), 0, 1);
  }

  return null;
};

const generateOrderNumber = async () => {
  const latestOrder = await Order.findOne().sort({ orderNumber: -1 }).lean();
  return latestOrder ? Number(latestOrder.orderNumber) + 1 : 1001;
};

router.post('/', async (req, res) => {
  try {
    const { customerName, items, orderNumber, status, totalPrice: payloadTotalPrice } = req.body;

    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ message: 'Order items are required.' });
    }

    const normalizedItems = items.map((item) => {
      const itemType = item.type === 'mix-match' ? 'mix-match' : 'regular';
      const quantity = Math.max(1, Number(item.quantity || 1));
      const price = itemType === 'mix-match' ? MIX_MATCH_PRICE : Number(item.price || 0);

      return {
        type: itemType,
        menuItemId: item.menuItemId || '',
        name: item.name,
        meals: Array.isArray(item.meals) ? item.meals : [],
        category: item.category || '',
        price,
        quantity,
        addons: Array.isArray(item.addons) ? item.addons : [],
        requestNote: item.requestNote || '',
      };
    });

    const now = new Date();
    const calculatedTotalPrice = normalizedItems.reduce((sum, item) => {
      const addonsTotal = (item.addons || []).reduce((addonSum, addon) => addonSum + Number(addon.price), 0);
      return sum + (Number(item.price) + addonsTotal) * Number(item.quantity);
    }, 0);

    const totalPrice = Number(payloadTotalPrice) > 0 ? Number(payloadTotalPrice) : calculatedTotalPrice;

    let resolvedOrderNumber = Number(orderNumber) > 0 ? Number(orderNumber) : await generateOrderNumber();
    const existing = await Order.findOne({ orderNumber: resolvedOrderNumber }).lean();
    if (existing) {
      resolvedOrderNumber = await generateOrderNumber();
    }

    const order = await Order.create({
      orderNumber: resolvedOrderNumber,
      customerName: customerName || 'Walk-in Customer',
      items: normalizedItems,
      addons: normalizedItems.flatMap((item) => (item.addons || []).map((addon) => addon.name)),
      quantity: normalizedItems.reduce((sum, item) => sum + Number(item.quantity), 0),
      totalPrice,
      requestNote: normalizedItems.map((item) => item.requestNote).filter(Boolean).join(' | '),
      status: status || 'completed',
      date: formatDate(now),
      time: formatTime(now),
    });

    return res.status(201).json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Failed to create order.', error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { date, status, period } = req.query;
    const query = {};

    if (date) {
      query.date = date;
    }

    if (status) {
      query.status = status;
    }

    if (period && period !== 'all') {
      const start = getPeriodStart(period);
      if (start) {
        query.createdAt = { $gte: start };
      }
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Failed to fetch orders.', error: error.message });
  }
});

router.delete('/purge/by-period', async (req, res) => {
  try {
    const { period, password } = req.body || {};
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (password !== adminPassword) {
      return res.status(401).json({ message: 'Invalid admin password.' });
    }

    const query = {};
    if (period && period !== 'all') {
      const start = getPeriodStart(period);
      if (start) {
        query.createdAt = { $gte: start };
      }
    }

    const result = await Order.deleteMany(query);
    return res.json({ deletedCount: result.deletedCount || 0 });
  } catch (error) {
    console.error('Error purging orders:', error);
    res.status(500).json({ message: 'Failed to purge orders.', error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { password } = req.body || {};
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (password !== adminPassword) {
      return res.status(401).json({ message: 'Invalid admin password.' });
    }

    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    return res.json({ message: 'Order deleted permanently.' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ message: 'Failed to delete order.', error: error.message });
  }
});

router.patch('/:id/complete', async (req, res) => {
  const order = await Order.findByIdAndUpdate(req.params.id, { status: 'completed' }, { new: true });

  if (!order) {
    return res.status(404).json({ message: 'Order not found.' });
  }

  return res.json(order);
});

router.get('/sales/summary', async (req, res) => {
  const { period } = req.query;
  const orders = await Order.find().lean();
  const completedOrders = orders.filter((order) => order.status === 'completed');

  const sumSince = (startDate) => {
    return completedOrders
      .filter((order) => new Date(order.createdAt) >= startDate)
      .reduce((sum, order) => sum + Number(order.totalPrice), 0);
  };

  const ordersSince = (startDate) => {
    return orders.filter((order) => new Date(order.createdAt) >= startDate).length;
  };

  const itemAggregate = completedOrders.reduce((acc, order) => {
    order.items.forEach((item) => {
      if (!acc[item.name]) {
        acc[item.name] = { name: item.name, qty: 0, sales: 0 };
      }

      acc[item.name].qty += Number(item.quantity || 0);
      acc[item.name].sales += Number(item.price) * Number(item.quantity || 0);
    });

    return acc;
  }, {});

  const topItems = Object.values(itemAggregate)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const totalCompletedSales = completedOrders.reduce((sum, order) => sum + Number(order.totalPrice), 0);

  const dayStart = getPeriodStart('day');
  const weekStart = getPeriodStart('week');
  const monthStart = getPeriodStart('month');
  const yearStart = getPeriodStart('year');

  const periods = {
    day: { sales: sumSince(dayStart), orders: ordersSince(dayStart) },
    week: { sales: sumSince(weekStart), orders: ordersSince(weekStart) },
    month: { sales: sumSince(monthStart), orders: ordersSince(monthStart) },
    year: { sales: sumSince(yearStart), orders: ordersSince(yearStart) },
  };

  res.json({
    today: periods.day.sales,
    week: periods.week.sales,
    month: periods.month.sales,
    year: periods.year.sales,
    totalOrders: orders.length,
    completedOrders: completedOrders.length,
    preparingOrders: orders.filter((order) => order.status === 'preparing').length,
    averageOrderValue: completedOrders.length ? totalCompletedSales / completedOrders.length : 0,
    topItems,
    periods,
    selectedPeriod: period && periods[period] ? period : 'day',
    selected: period && periods[period] ? periods[period] : periods.day,
  });
});

module.exports = router;
