const normalizeName = (value = '') => String(value).trim().toLowerCase();

const RECIPE_BOOK = {
  'bb sophie': [
    { name: 'Patty', quantity: 1, unit: 'pc' },
    { name: 'Buns', quantity: 1, unit: 'pc' },
    { name: 'Sliced Cheese', quantity: 1, unit: 'pc' },
    { name: 'Bacon', quantity: 1, unit: 'pc' },
    { name: 'Lettuce', quantity: 1, unit: 'pc' },
  ],
  'bb primo': [
    { name: 'Buns', quantity: 1, unit: 'pc' },
    { name: 'Patty', quantity: 1, unit: 'pc' },
    { name: 'Sliced Cheese', quantity: 1, unit: 'pc' },
    { name: 'Sliced Pineapple', quantity: 1, unit: 'pc' },
    { name: 'Bacon', quantity: 1, unit: 'pc' },
    { name: 'Lettuce', quantity: 1, unit: 'pc' },
  ],
  'bb ginger': [
    { name: 'Buns', quantity: 1, unit: 'pc' },
    { name: 'Patty', quantity: 1, unit: 'pc' },
    { name: 'Sliced Cheese', quantity: 1, unit: 'pc' },
    { name: 'Bacon', quantity: 2, unit: 'pc' },
    { name: 'Lettuce', quantity: 1, unit: 'pc' },
  ],
  'bb motchi': [
    { name: 'Buns', quantity: 1, unit: 'pc' },
    { name: 'Patty', quantity: 2, unit: 'pc' },
    { name: 'Sliced Cheese', quantity: 2, unit: 'pc' },
    { name: 'Lettuce', quantity: 1, unit: 'pc' },
  ],
  'bb summer': [
    { name: 'Buns', quantity: 1, unit: 'pc' },
    { name: 'Patty', quantity: 1, unit: 'pc' },
    { name: 'Sliced Cheese', quantity: 1, unit: 'pc' },
    { name: 'Lettuce', quantity: 1, unit: 'pc' },
  ],
  'bb sugar': [
    { name: 'Buns', quantity: 1, unit: 'pc' },
    { name: 'Chicken', quantity: 1, unit: 'pc' },
    { name: 'Sliced Cheese', quantity: 1, unit: 'pc' },
    { name: 'Lettuce', quantity: 1, unit: 'pc' },
  ],
  'bb bailey': [
    { name: 'Fries', quantity: 1, unit: 'pc' },
    { name: 'Bacon', quantity: 1, unit: 'pc' },
  ],
  "chic n' fries": [
    { name: 'Fries', quantity: 1, unit: 'pc' },
    { name: 'Chicken', quantity: 1, unit: 'pc' },
  ],
  'luncheon meat': [{ name: 'Luncheon Meat', quantity: 2, unit: 'pc' }],
  'chicken nuggets': [{ name: 'Chicken Nuggets', quantity: 4, unit: 'pc' }],
  'grilled hungarian sausage': [{ name: 'Hungarian Sausage', quantity: 1, unit: 'pc' }],
  'coca-cola': [{ name: 'Coca-Cola Bottle', quantity: 1, unit: 'bottle' }],
  sprite: [{ name: 'Sprite Bottle', quantity: 1, unit: 'bottle' }],
  royal: [{ name: 'Royal Bottle', quantity: 1, unit: 'bottle' }],
  'bottled water': [{ name: 'Bottled Water Bottle', quantity: 1, unit: 'bottle' }],
};

const ADDON_TO_INGREDIENT = {
  [normalizeName('Sliced Cheese')]: { name: 'Sliced Cheese', quantity: 1, unit: 'pc' },
  [normalizeName('Melted Cheese')]: { name: 'Melted Cheese', quantity: 1, unit: 'pc' },
  [normalizeName('Bacon')]: { name: 'Bacon', quantity: 1, unit: 'pc' },
  [normalizeName('Sliced Pineapple')]: { name: 'Sliced Pineapple', quantity: 1, unit: 'pc' },
  [normalizeName('Egg')]: { name: 'Egg', quantity: 1, unit: 'pc' },
  [normalizeName('BBQ Sauce')]: { name: 'BBQ Sauce', quantity: 1, unit: 'serving' },
  [normalizeName('Garlic Mayo')]: { name: 'Garlic Mayo', quantity: 1, unit: 'serving' },
};

const DEFAULT_INGREDIENT_STOCK = {
  [normalizeName('Patty')]: 120,
  [normalizeName('Buns')]: 120,
  [normalizeName('Sliced Cheese')]: 160,
  [normalizeName('Bacon')]: 180,
  [normalizeName('Lettuce')]: 140,
  [normalizeName('Sliced Pineapple')]: 120,
  [normalizeName('Chicken')]: 120,
  [normalizeName('Fries')]: 80,
  [normalizeName('Luncheon Meat')]: 100,
  [normalizeName('Chicken Nuggets')]: 400,
  [normalizeName('Hungarian Sausage')]: 80,
  [normalizeName('Coca-Cola Bottle')]: 100,
  [normalizeName('Sprite Bottle')]: 100,
  [normalizeName('Royal Bottle')]: 100,
  [normalizeName('Bottled Water Bottle')]: 100,
  [normalizeName('Melted Cheese')]: 100,
  [normalizeName('Egg')]: 100,
  [normalizeName('BBQ Sauce')]: 100,
  [normalizeName('Garlic Mayo')]: 100,
};

const ALL_KNOWN_INGREDIENTS = (() => {
  const map = new Map();

  Object.values(RECIPE_BOOK).forEach((ingredients) => {
    ingredients.forEach((ingredient) => {
      const key = normalizeName(ingredient.name);
      if (!map.has(key)) {
        map.set(key, { name: ingredient.name, unit: ingredient.unit || 'pc' });
      }
    });
  });

  Object.values(ADDON_TO_INGREDIENT).forEach((ingredient) => {
    const key = normalizeName(ingredient.name);
    if (!map.has(key)) {
      map.set(key, { name: ingredient.name, unit: ingredient.unit || 'pc' });
    }
  });

  return Array.from(map.entries()).map(([normalizedName, data]) => ({
    normalizedName,
    name: data.name,
    unit: data.unit,
    quantity: Number(DEFAULT_INGREDIENT_STOCK[normalizedName] || 50),
    lowStockThreshold: 10,
  }));
})();

module.exports = {
  normalizeName,
  RECIPE_BOOK,
  ADDON_TO_INGREDIENT,
  ALL_KNOWN_INGREDIENTS,
};
