const express = require('express');
const multer = require('multer');
const path = require('path');
const MenuItem = require('../models/MenuItem');

const router = express.Router();
const validMenuCategories = new Set(['Rice Meals', 'Burgers']);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads'),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });

router.get('/', async (req, res) => {
  const items = await MenuItem.find().sort({ createdAt: -1 });
  res.json(items);
});

router.post('/', upload.single('image'), async (req, res) => {
  if (!validMenuCategories.has(req.body.category)) {
    return res.status(400).json({ message: 'Category must be Rice Meals or Burgers.' });
  }

  const item = await MenuItem.create({
    name: req.body.name,
    price: Number(req.body.price),
    category: req.body.category,
    image: req.file ? `uploads/${req.file.filename}` : '',
  });

  res.status(201).json(item);
});

router.put('/:id', upload.single('image'), async (req, res) => {
  if (!validMenuCategories.has(req.body.category)) {
    return res.status(400).json({ message: 'Category must be Rice Meals or Burgers.' });
  }

  const payload = {
    name: req.body.name,
    price: Number(req.body.price),
    category: req.body.category,
  };

  if (req.file) {
    payload.image = `uploads/${req.file.filename}`;
  }

  const item = await MenuItem.findByIdAndUpdate(req.params.id, payload, { new: true });
  res.json(item);
});

router.delete('/:id', async (req, res) => {
  await MenuItem.findByIdAndDelete(req.params.id);
  res.json({ message: 'Menu item deleted.' });
});

module.exports = router;
