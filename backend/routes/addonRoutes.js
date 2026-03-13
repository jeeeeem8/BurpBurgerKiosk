const express = require('express');
const Addon = require('../models/Addon');

const router = express.Router();
const validAddonCategories = new Set(['burger', 'rice', 'fries', 'drinks']);

router.get('/', async (req, res) => {
  try {
    const addons = await Addon.find().sort({ createdAt: -1 });
    res.json(addons);
  } catch (error) {
    console.error('Error fetching addons:', error);
    res.status(500).json({ message: 'Failed to fetch add-ons.', error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    if (!validAddonCategories.has(req.body.category)) {
      return res.status(400).json({ message: 'Add-on category must be burger, rice, fries, or drinks.' });
    }

    if (!req.body.name || !req.body.price) {
      return res.status(400).json({ message: 'Name and price are required.' });
    }

    const addon = await Addon.create({
      name: req.body.name,
      price: Number(req.body.price),
      category: req.body.category,
    });
    res.status(201).json(addon);
  } catch (error) {
    console.error('Error creating addon:', error);
    res.status(500).json({ message: 'Failed to create add-on.', error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    if (!validAddonCategories.has(req.body.category)) {
      return res.status(400).json({ message: 'Add-on category must be burger, rice, fries, or drinks.' });
    }

    if (!req.body.name || !req.body.price) {
      return res.status(400).json({ message: 'Name and price are required.' });
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

    if (!addon) {
      return res.status(404).json({ message: 'Add-on not found.' });
    }

    res.json(addon);
  } catch (error) {
    console.error('Error updating addon:', error);
    res.status(500).json({ message: 'Failed to update add-on.', error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { password } = req.body || {};
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (password !== adminPassword) {
      return res.status(401).json({ message: 'Invalid admin password.' });
    }

    const addon = await Addon.findByIdAndDelete(req.params.id);
    if (!addon) {
      return res.status(404).json({ message: 'Add-on not found.' });
    }
    return res.json({ message: 'Add-on deleted permanently.' });
  } catch (error) {
    console.error('Error deleting addon:', error);
    res.status(500).json({ message: 'Failed to delete add-on.', error: error.message });
  }
});

module.exports = router;
