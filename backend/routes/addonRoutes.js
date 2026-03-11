const express = require('express');
const Addon = require('../models/Addon');

const router = express.Router();
const validAddonCategories = new Set(['burger', 'rice']);

router.get('/', async (req, res) => {
  const addons = await Addon.find().sort({ createdAt: -1 });
  res.json(addons);
});

router.post('/', async (req, res) => {
  if (!validAddonCategories.has(req.body.category)) {
    return res.status(400).json({ message: 'Add-on category must be burger or rice.' });
  }

  const addon = await Addon.create({
    name: req.body.name,
    price: Number(req.body.price),
    category: req.body.category,
  });
  res.status(201).json(addon);
});

router.put('/:id', async (req, res) => {
  if (!validAddonCategories.has(req.body.category)) {
    return res.status(400).json({ message: 'Add-on category must be burger or rice.' });
  }

  const addon = await Addon.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      price: Number(req.body.price),
      category: req.body.category,
    },
    { new: true },
  );

  res.json(addon);
});

router.delete('/:id', async (req, res) => {
  const { password } = req.body || {};
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  if (password !== adminPassword) {
    return res.status(401).json({ message: 'Invalid admin password.' });
  }

  await Addon.findByIdAndDelete(req.params.id);
  return res.json({ message: 'Add-on deleted permanently.' });
});

module.exports = router;
