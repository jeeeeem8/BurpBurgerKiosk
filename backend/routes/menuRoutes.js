const express = require('express');
const admin = require('firebase-admin');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const MenuItem = require('../models/MenuItem');

const router = express.Router();
const validMenuCategories = new Set(['Burger', 'Rice Meal', 'Fries', 'Drinks']);
const isCloudRuntime = Boolean(process.env.K_SERVICE || process.env.FUNCTION_TARGET || process.env.FIREBASE_CONFIG);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory:', uploadsDir);
}

const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  },
});

const persistImage = async (file) => {
  if (!file) {
    return '';
  }

  if (!isCloudRuntime) {
    return `uploads/${file.filename}`;
  }

  if (!admin.apps.length) {
    throw new Error('Firebase Admin is not initialized.');
  }

  const bucket = admin.storage().bucket();
  const ext = path.extname(file.originalname) || '.png';
  const objectPath = `uploads/${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  const bucketFile = bucket.file(objectPath);

  await bucketFile.save(file.buffer, {
    resumable: false,
    metadata: {
      contentType: file.mimetype,
      cacheControl: 'public, max-age=31536000',
    },
  });

  const [signedUrl] = await bucketFile.getSignedUrl({
    action: 'read',
    expires: '03-01-2500',
  });

  return signedUrl;
};

const fileFilter = (req, file, cb) => {
  // Accept ONLY JPEG and PNG
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png'];
  const allowedExts = ['.jpg', '.jpeg', '.png'];
  
  const fileExt = path.extname(file.originalname).toLowerCase();
  
  if (allowedMimes.includes(file.mimetype) && allowedExts.includes(fileExt)) {
    console.log('✓ Accepted image file:', file.originalname);
    cb(null, true);
  } else {
    console.error('✗ Rejected file:', file.originalname, 'Type:', file.mimetype);
    cb(new Error('Only JPEG and PNG images are allowed'));
  }
};

const upload = multer({ 
  storage: isCloudRuntime ? multer.memoryStorage() : diskStorage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
});

// Multer error handling middleware
const uploadErrorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('MULTER ERROR:', err.code, err.message);
    if (err.code === 'FILE_TOO_LARGE') {
      return res.status(413).json({ message: 'File is too large. Max 50MB.' });
    }
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  } else if (err) {
    console.error('Upload error:', err);
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  }
  next();
};

router.get('/', async (req, res) => {
  try {
    console.log('Fetching all menu items...');
    const items = await MenuItem.find().sort({ createdAt: -1 });
    console.log(`✓ Retrieved ${items.length} menu items`);
    res.json(items);
  } catch (error) {
    console.error('❌ Error fetching menu items:', error.message);
    res.status(500).json({ message: 'Failed to fetch menu items.', error: error.message });
  }
});

router.post('/', upload.single('image'), uploadErrorHandler, async (req, res) => {
  try {
    // Extract and clean input
    const name = (req.body.name || '').trim();
    const category = (req.body.category || '').trim();
    const price = parseFloat(req.body.price);

    console.log('\n[MENU POST] Creating new item:');
    console.log('  Name:', name);
    console.log('  Category:', category);
    console.log('  Price:', price);
    console.log('  Image:', req.file ? req.file.filename : 'none');

    // Validate inputs
    if (!name) return res.status(400).json({ message: 'Name is required' });
    if (!category) return res.status(400).json({ message: 'Category is required' });
    if (isNaN(price) || price <= 0) return res.status(400).json({ message: 'Valid price is required' });

    // Validate category
    if (!validMenuCategories.has(category)) {
      return res.status(400).json({ 
        message: `Invalid category. Valid options: ${Array.from(validMenuCategories).join(', ')}`,
        sent: category,
      });
    }

    // Create item
    const imagePath = await persistImage(req.file);

    const item = await MenuItem.create({
      name,
      price: Number(price),
      category,
      image: imagePath,
    });

    console.log('[MENU POST] ✓ Item created:', item._id);
    res.status(201).json(item);
  } catch (error) {
    console.error('[MENU POST] Error:', error.name, '-', error.message);
    
    if (error.name === 'ValidationError') {
      const msg = Object.values(error.errors).map(e => e.message).join('; ');
      return res.status(400).json({ message: `Validation: ${msg}` });
    }
    
    res.status(500).json({ 
      message: 'Failed to create menu item',
      error: error.message,
    });
  }
});

router.put('/:id', upload.single('image'), uploadErrorHandler, async (req, res) => {
  try {
    const category = (req.body.category || '').trim();
    const name = (req.body.name || '').trim();
    const price = req.body.price ? parseFloat(req.body.price) : null;
    
    console.log('=== Menu PUT Received ===');
    console.log('Item ID:', req.params.id);
    console.log('Category:', category, 'Valid:', validMenuCategories.has(category));
    
    // Validation 1: Category check
    if (!validMenuCategories.has(category)) {
      console.error('❌ Category validation failed in PUT:', category);
      return res.status(400).json({ 
        message: `Invalid category: "${category}". Must be one of: ${Array.from(validMenuCategories).join(', ')}`,
        validCategories: Array.from(validMenuCategories),
      });
    }

    // Validation 2: Name and price check
    if (!name) {
      return res.status(400).json({ message: 'Menu item name is required.' });
    }

    if (!price || isNaN(price) || price <= 0) {
      return res.status(400).json({ message: 'Valid price (greater than 0) is required.' });
    }

    const payload = {
      name,
      price: Number(price),
      category,
    };

    if (req.file) {
      payload.image = await persistImage(req.file);
    }

    console.log('Updating menu item:', { id: req.params.id, ...payload });

    const item = await MenuItem.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
    
    if (!item) {
      return res.status(404).json({ message: 'Menu item not found.' });
    }
    
    console.log('✓ Menu item updated:', { id: item._id, category: item.category });
    res.json(item);
    
  } catch (error) {
    console.error('❌ Error updating menu item');
    console.error('  Error Name:', error.name);
    console.error('  Error Message:', error.message);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors)
        .map((e) => e.message)
        .join('; ');
      return res.status(400).json({ 
        message: `Validation failed: ${messages}`,
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid menu item ID format.' });
    }

    res.status(500).json({ message: 'Failed to update menu item.', error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    console.log('Deleting menu item:', req.params.id);
    const item = await MenuItem.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Menu item not found.' });
    }
    console.log('✓ Menu item deleted:', req.params.id);
    res.json({ message: 'Menu item deleted.' });
  } catch (error) {
    console.error('❌ Error deleting menu item:', error.message);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid menu item ID format.' });
    }
    
    res.status(500).json({ message: 'Failed to delete menu item.', error: error.message });
  }
});

// Test endpoint to verify backend is working
router.post('/test/validate', uploadErrorHandler, (req, res) => {
  try {
    console.log('\n======== TEST ENDPOINT ========');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('File:', req.file);
    console.log('===============================\n');
    
    res.json({
      success: true,
      message: 'Test endpoint working',
      headers: {
        contentType: req.headers['content-type'],
      },
      body: req.body,
      file: req.file ? { name: req.file.filename, size: req.file.size } : null,
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
