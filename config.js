export const CATEGORIES = [
  'trending gadgets 2024',
  'viral tiktok products',
  'smart home gadgets',
  'kitchen gadgets bestseller',
  'car accessories trending',
  'phone accessories popular',
  'fitness gadgets hot',
  'led lights trending',
  'cleaning gadgets viral',
  'beauty tools bestseller',
  'pet gadgets popular',
  'travel accessories trending',
  'desk gadgets cool',
  'outdoor gadgets popular',
  'baby products bestseller',
  'gaming accessories trending',
  'portable electronics hot',
  'mini projector popular',
  'wireless earbuds bestseller',
  'smart watch gadgets'
];

export const FILTERS = {
  MIN_ORDERS: 500,
  MIN_RATING: 4.3,
  MAX_PRICE: 100
};

export const SCORING_WEIGHTS = {
  ORDERS: 0.5,
  RATING: 0.3,
  PRICE_ADVANTAGE: 0.2
};

export const PRODUCTS_PER_DAY = parseInt(process.env.PRODUCTS_PER_DAY) || 10;
export const MAX_DAYS = parseInt(process.env.MAX_DAYS) || 15;
