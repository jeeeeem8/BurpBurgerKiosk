const cors = require('cors');
const dotenv = require('dotenv');
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const User = require('./models/User');
const addonRoutes = require('./routes/addonRoutes');
const authRoutes = require('./routes/authRoutes');
const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/kiosk_ordering_db';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'kiosk-admin-token';

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const authMiddleware = (req, res, next) => {
  if (req.path.startsWith('/auth') || req.path === '/health') {
    return next();
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '').trim();

  if (token !== ADMIN_TOKEN) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  return next();
};

app.use('/api', authMiddleware);
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/addons', addonRoutes);
app.use('/api/orders', orderRoutes);

app.get('/', (req, res) => {
  res.json({
    ok: true,
    message: 'Kiosk backend is running.',
    apiBase: '/api',
    health: '/api/health',
  });
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'Kiosk API is running.' });
});

const seedAdmin = async () => {
  const existing = await User.findOne({ username: ADMIN_USERNAME });

  if (!existing) {
    await User.create({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD });
    console.log(`Seeded admin user: ${ADMIN_USERNAME}`);
  }
};

const start = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    await seedAdmin();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

start();
