const express = require('express');
const InventoryItem = require('../models/InventoryItem');
const {
  getInventoryHistory,
  getInventorySummary,
  getLowStockItems,
  logInventoryHistory,
  seedInventoryDefaults,
} = require('../services/inventoryService');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    await seedInventoryDefaults();
    const payload = await getInventorySummary();
    return res.json(payload);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return res.status(500).json({ message: 'Failed to fetch inventory.', error: error.message });
  }
});

router.get('/low-stock', async (req, res) => {
  try {
    await seedInventoryDefaults();
    const threshold = Number(req.query.threshold || 10);
    const items = await getLowStockItems(threshold);
    return res.json({ items, threshold });
  } catch (error) {
    console.error('Error fetching low-stock inventory:', error);
    return res.status(500).json({ message: 'Failed to fetch low stock inventory.', error: error.message });
  }
});

router.get('/history', async (req, res) => {
  try {
    const { sortBy, sortOrder, limit } = req.query;
    const history = await getInventoryHistory({ sortBy, sortOrder, limit });
    return res.json({ history });
  } catch (error) {
    console.error('Error fetching inventory history:', error);
    return res.status(500).json({ message: 'Failed to fetch inventory history.', error: error.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const { quantity, lowStockThreshold, available } = req.body || {};
    const item = await InventoryItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found.' });
    }

    const beforeQty = Number(item.quantity || 0);

    if (quantity !== undefined) {
      const numericQuantity = Number(quantity);
      if (!Number.isFinite(numericQuantity) || numericQuantity < 0) {
        return res.status(400).json({ message: 'Quantity must be a valid non-negative number.' });
      }
      item.quantity = numericQuantity;
    }

    if (lowStockThreshold !== undefined) {
      const numericThreshold = Number(lowStockThreshold);
      if (!Number.isFinite(numericThreshold) || numericThreshold < 0) {
        return res.status(400).json({ message: 'Low stock threshold must be a valid non-negative number.' });
      }
      item.lowStockThreshold = numericThreshold;
    }

    if (available !== undefined) {
      item.available = Boolean(available);
    } else {
      item.available = Number(item.quantity || 0) > 0;
    }

    await item.save();

    const afterQty = Number(item.quantity || 0);
    let changeType = 'updated';
    if (afterQty > beforeQty) {
      changeType = 'added';
    } else if (afterQty < beforeQty) {
      changeType = 'deducted';
    }

    await logInventoryHistory({
      item,
      changeType,
      quantityBefore: beforeQty,
      quantityAfter: afterQty,
      reason: 'manual-update',
    });

    return res.json(item);
  } catch (error) {
    console.error('Error updating inventory item:', error);
    return res.status(500).json({ message: 'Failed to update inventory item.', error: error.message });
  }
});

module.exports = router;
