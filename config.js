export const CATEGORIES = [
  'smart home gadgets',
  'kitchen tools and gadgets',
  'car accessories',
  'phone accessories',
  'fitness and gym equipment',
  'LED lights and lighting',
  'cleaning tools',
  'beauty and skincare tools',
  'pet accessories',
  'travel gear',
  'desk and office gadgets',
  'outdoor and camping gear',
  'baby and kids products',
  'gaming accessories',
  'portable electronics',
  'mini projectors and displays',
  'wireless audio devices',
  'smart watches and wearables',
  'home organization',
  'DIY tools and accessories'
];

export const FILTERS = {
  MIN_ORDERS: 500,
  MIN_RATING: 4.3,
  MAX_PRICE: 40
};

export const SCORING_WEIGHTS = {
  ORDERS: 0.5,
  RATING: 0.3,
  PRICE_ADVANTAGE: 0.2
};

export const PRODUCTS_PER_DAY = parseInt(process.env.PRODUCTS_PER_DAY) || 10;
export const MAX_DAYS = parseInt(process.env.MAX_DAYS) || 15;
