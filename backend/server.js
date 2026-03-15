const cors = require('cors');
const dotenv = require('dotenv');
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const User = require('./models/User');
const addonRoutes = require('./routes/addonRoutes');
const authRoutes = require('./routes/authRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes');
const { seedInventoryDefaults } = require('./services/inventoryService');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/kiosk_ordering_db';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'kiosk-admin-token';
let initializationPromise;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  if (
    req.path.startsWith('/api/menu') ||
    req.path.startsWith('/api/addons') ||
    req.path.startsWith('/api/orders') ||
    req.path.startsWith('/api/inventory')
  ) {
    console.log('\n[REQUEST]', req.method, req.path);
    console.log('Headers:', {
      'content-type': req.headers['content-type'],
      'content-length': req.headers['content-length'],
    });
  }
  next();
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const initializeBackend = async () => {
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    console.log('\n🔄 Starting Kiosk Backend...');
    console.log('MongoDB URI:', MONGO_URI);
    console.log('Connecting to MongoDB...\n');

    await mongoose.connect(MONGO_URI);
    console.log('✓ Connected to MongoDB successfully\n');

    await seedAdmin();
    await seedInventoryDefaults();
  })().catch((error) => {
    initializationPromise = undefined;
    throw error;
  });

  return initializationPromise;
};

app.use(async (req, res, next) => {
  try {
    await initializeBackend();
    next();
  } catch (error) {
    console.error('\n✗ Failed to initialize backend');
    console.error('Error:', error.message);
    res.status(500).json({
      message: 'Backend initialization failed.',
      error: error.message,
    });
  }
});

const authMiddleware = (req, res, next) => {
  // Public routes that don't require authentication
  // Note: req.path for /api-mounted middleware doesn't include /api prefix
  if (
    req.path.startsWith('/auth') || 
    req.path === '/health' || 
    req.path === '/orders/active/list'
  ) {
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
app.use('/api/inventory', inventoryRoutes);

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
    await initializeBackend();

    app.listen(PORT, () => {
      console.log(`✓ Server running on http://localhost:${PORT}\n`);
      console.log('Ready to accept requests!');
      console.log('Test URL: http://localhost:5000/api/health\n');
    });
  } catch (error) {
    console.error('\n✗ Failed to start server');
    console.error('Error:', error.message);
    console.error('\nPossible causes:');
    console.error('1. MongoDB is not running');
    console.error('2. MongoDB is not installed');
    console.error('3. MongoDB is running on a different port\n');
    console.error('To fix: Start MongoDB with: mongod\n');
    process.exit(1);
  }
};

if (require.main === module) {
  start();
}

module.exports = {
  app,
  initializeBackend,
};
