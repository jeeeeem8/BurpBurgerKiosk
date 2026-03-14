const InventoryItem = require('../models/InventoryItem');
const InventoryHistory = require('../models/InventoryHistory');
const { ADDON_TO_INGREDIENT, ALL_KNOWN_INGREDIENTS, RECIPE_BOOK, normalizeName } = require('../config/recipes');
const FRIES_KEY = normalizeName('Fries');

const logInventoryHistory = async ({ item, changeType, quantityBefore, quantityAfter, reason }) => {
  const before = Number(quantityBefore || 0);
  const after = Number(quantityAfter || 0);

  await InventoryHistory.create({
    itemId: item?._id,
    itemName: item?.name || 'Unknown Item',
    changeType,
    quantityBefore: before,
    quantityAfter: after,
    quantityChange: after - before,
    unit: item?.unit || 'pc',
    reason: reason || '',
  });
};

const addConsumption = (map, ingredientName, amount, unit = 'pc') => {
  if (!ingredientName || !Number.isFinite(amount) || amount <= 0) {
    return;
  }

  const key = normalizeName(ingredientName);
  const current = map.get(key) || {
    name: ingredientName,
    normalizedName: key,
    unit,
    amount: 0,
  };

  current.amount += amount;
  map.set(key, current);
};

const applyRecipe = (consumptionMap, itemName, multiplier = 1) => {
  const recipe = RECIPE_BOOK[normalizeName(itemName)] || [];
  recipe.forEach((ingredient) => {
    addConsumption(
      consumptionMap,
      ingredient.name,
      Number(ingredient.quantity || 0) * Number(multiplier || 1),
      ingredient.unit || 'pc',
    );
  });
};

const buildConsumptionFromOrder = (order) => {
  const consumptionMap = new Map();

  (order.items || []).forEach((item) => {
    const qty = Math.max(1, Number(item.quantity || 1));

    if (item.type === 'mix-match') {
      (item.meals || []).forEach((meal) => {
        applyRecipe(consumptionMap, meal.name, qty);
      });
    } else {
      applyRecipe(consumptionMap, item.name, qty);
    }

    (item.addons || []).forEach((addon) => {
      const addonRecipe = ADDON_TO_INGREDIENT[normalizeName(addon.name)];
      if (!addonRecipe) {
        return;
      }

      addConsumption(
        consumptionMap,
        addonRecipe.name,
        Number(addonRecipe.quantity || 0) * qty,
        addonRecipe.unit || 'pc',
      );
    });
  });

  return Array.from(consumptionMap.values());
};

const seedInventoryDefaults = async () => {
  for (const ingredient of ALL_KNOWN_INGREDIENTS) {
    const existing = await InventoryItem.findOne({ normalizedName: ingredient.normalizedName });
    if (existing) {
      continue;
    }

    const created = await InventoryItem.create({
      name: ingredient.name,
      normalizedName: ingredient.normalizedName,
      unit: ingredient.unit,
      quantity: ingredient.quantity,
      lowStockThreshold: ingredient.lowStockThreshold,
      available: ingredient.quantity > 0,
    });

    await logInventoryHistory({
      item: created,
      changeType: 'added',
      quantityBefore: 0,
      quantityAfter: Number(created.quantity || 0),
      reason: 'initial-seed',
    });
  }

  // One-time migration: convert old fries stock stored in grams to pack count (1 pc = 250g).
  const fries = await InventoryItem.findOne({ normalizedName: FRIES_KEY });
  if (fries && fries.unit === 'g') {
    const beforeQty = Number(fries.quantity || 0);
    fries.quantity = Math.max(1, Math.round(Number(fries.quantity || 0) / 250));
    fries.unit = 'pc';
    fries.available = Number(fries.quantity || 0) > 0;
    await fries.save();

    await logInventoryHistory({
      item: fries,
      changeType: 'updated',
      quantityBefore: beforeQty,
      quantityAfter: Number(fries.quantity || 0),
      reason: 'unit-migration-g-to-pc',
    });
  }
};

const getInventoryHistory = async ({ sortBy = 'createdAt', sortOrder = 'desc', limit = 200 } = {}) => {
  const allowedSortFields = new Set(['createdAt', 'itemName', 'changeType', 'quantityBefore', 'quantityAfter', 'quantityChange']);
  const safeSortBy = allowedSortFields.has(sortBy) ? sortBy : 'createdAt';
  const safeSortOrder = String(sortOrder).toLowerCase() === 'asc' ? 1 : -1;
  const safeLimit = Math.max(1, Math.min(1000, Number(limit || 200)));

  return InventoryHistory.find()
    .sort({ [safeSortBy]: safeSortOrder })
    .limit(safeLimit)
    .lean();
};

const getInventorySummary = async () => {
  const items = await InventoryItem.find().sort({ name: 1 }).lean();
  const totalStockUnits = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const totalInventoryItems = items.length;
  const lowStockItems = items.filter((item) => Number(item.quantity || 0) <= Number(item.lowStockThreshold || 10));

  return {
    items,
    summary: {
      totalStockUnits,
      totalInventoryItems,
      lowStockCount: lowStockItems.length,
    },
  };
};

const getLowStockItems = async (threshold = 10) => {
  const numericThreshold = Number.isFinite(Number(threshold)) ? Number(threshold) : 10;
  return InventoryItem.find({ quantity: { $lte: numericThreshold } })
    .sort({ quantity: 1, name: 1 })
    .lean();
};

const getOutOfStockItemsForOrder = async (order) => {
  const consumption = buildConsumptionFromOrder(order);
  const outOfStockItems = [];

  for (const ingredient of consumption) {
    const inventoryItem = await InventoryItem.findOne({ normalizedName: ingredient.normalizedName }).lean();
    const availableQty = Number(inventoryItem?.quantity || 0);

    if (!inventoryItem || availableQty <= 0 || availableQty < Number(ingredient.amount || 0)) {
      outOfStockItems.push({
        name: ingredient.name,
        required: Number(ingredient.amount || 0),
        available: availableQty,
        unit: inventoryItem?.unit || ingredient.unit || 'pc',
      });
    }
  }

  return outOfStockItems;
};

const deductInventoryByOrder = async (order) => {
  const consumption = buildConsumptionFromOrder(order);
  const lowStockItems = [];
  const updates = [];

  for (const ingredient of consumption) {
    let inventoryItem = await InventoryItem.findOne({ normalizedName: ingredient.normalizedName });

    if (!inventoryItem) {
      inventoryItem = await InventoryItem.create({
        name: ingredient.name,
        normalizedName: ingredient.normalizedName,
        unit: ingredient.unit,
        quantity: 0,
        lowStockThreshold: 10,
        available: false,
      });

      await logInventoryHistory({
        item: inventoryItem,
        changeType: 'added',
        quantityBefore: 0,
        quantityAfter: 0,
        reason: 'auto-created-on-deduction',
      });
    }

    const beforeQty = Number(inventoryItem.quantity || 0);
    const nextQty = Math.max(0, Number(inventoryItem.quantity || 0) - Number(ingredient.amount || 0));
    inventoryItem.quantity = nextQty;
    inventoryItem.available = nextQty > 0;
    await inventoryItem.save();

    await logInventoryHistory({
      item: inventoryItem,
      changeType: 'deducted',
      quantityBefore: beforeQty,
      quantityAfter: nextQty,
      reason: 'order-completed',
    });

    updates.push({
      name: inventoryItem.name,
      consumed: Number(ingredient.amount || 0),
      unit: inventoryItem.unit,
      quantity: Number(inventoryItem.quantity || 0),
    });

    if (Number(inventoryItem.quantity || 0) <= Number(inventoryItem.lowStockThreshold || 10)) {
      lowStockItems.push({
        name: inventoryItem.name,
        quantity: Number(inventoryItem.quantity || 0),
        threshold: Number(inventoryItem.lowStockThreshold || 10),
      });
    }
  }

  return { updates, lowStockItems };
};

module.exports = {
  seedInventoryDefaults,
  getInventorySummary,
  getLowStockItems,
  getInventoryHistory,
  logInventoryHistory,
  getOutOfStockItemsForOrder,
  deductInventoryByOrder,
};
