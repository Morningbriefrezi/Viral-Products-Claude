import OpenAI from 'openai';
import { CATEGORIES, FILTERS, SCORING_WEIGHTS, PRODUCTS_PER_DAY } from './config.js';

let _openai;
function getClient() {
  if (!_openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set. Add it to .env or GitHub Secrets.');
    }
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

function getCategoriesForDay(day) {
  // Rotate 5 categories per day across 20 categories
  const perDay = 5;
  const start = ((day - 1) * perDay) % CATEGORIES.length;
  const selected = [];
  for (let i = 0; i < perDay; i++) {
    selected.push(CATEGORIES[(start + i) % CATEGORIES.length]);
  }
  return selected;
}

function buildExclusionList(seenNames) {
  if (seenNames.length === 0) return '';
  // Send last 50 to keep prompt size reasonable
  const recent = seenNames.slice(-50);
  return `\n\nDO NOT include any of these previously found products (or very similar ones):\n${recent.map(n => `- ${n}`).join('\n')}`;
}

export async function discoverProducts(day, seenNames) {
  const categories = getCategoriesForDay(day);
  const exclusion = buildExclusionList(seenNames);

  console.log(`\n🔑 Categories for Day ${day}: ${categories.join(', ')}`);
  console.log(`🚫 Excluding ${seenNames.length} previously seen products`);

  const prompt = `You are a viral product research expert specializing in AliExpress trending products.

Find exactly ${PRODUCTS_PER_DAY + 5} REAL viral products currently trending on AliExpress across these categories: ${categories.join(', ')}.

REQUIREMENTS:
- Products must be REAL items that actually exist and sell well on AliExpress
- Each product must have estimated orders > ${FILTERS.MIN_ORDERS}
- Each product must have estimated rating >= ${FILTERS.MIN_RATING}
- Each product price must be under $${FILTERS.MAX_PRICE}
- Focus on products that are trending on TikTok, Instagram, or going viral in 2024-2025
- Products should have mass appeal and "impulse buy" potential
- Include the SPECIFIC product name as it would appear on AliExpress
- For the link, construct a real AliExpress search URL: https://www.aliexpress.com/wholesale?SearchText=ENCODED_PRODUCT_NAME
${exclusion}

Respond ONLY with valid JSON array. No markdown, no backticks, no explanation.
Each object must have exactly these fields:
[
  {
    "name": "Exact product name as on AliExpress",
    "price": 12.99,
    "orders": 5200,
    "rating": 4.7,
    "category": "category name",
    "whyViral": "One sentence why this is trending"
  }
]`;

  console.log('🤖 Querying OpenAI for viral products...');

  const response = await getClient().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are a product research expert. You return only valid JSON arrays. No markdown formatting, no code blocks, no extra text.'
      },
      { role: 'user', content: prompt }
    ],
    temperature: 0.9,
    max_tokens: 4000
  });

  const raw = response.choices[0].message.content.trim();

  // Clean response - remove markdown backticks if present
  const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

  let products;
  try {
    products = JSON.parse(cleaned);
  } catch (err) {
    console.error('❌ Failed to parse OpenAI response:', err.message);
    console.error('Raw response:', raw.slice(0, 500));
    return [];
  }

  if (!Array.isArray(products)) {
    console.error('❌ Response is not an array');
    return [];
  }

  // Normalize and add links
  const normalized = products.map(p => ({
    name: (p.name || '').trim(),
    price: parseFloat(p.price) || 0,
    orders: parseInt(p.orders) || 0,
    rating: parseFloat(p.rating) || 0,
    category: (p.category || '').trim(),
    whyViral: (p.whyViral || '').trim(),
    link: `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent((p.name || '').trim())}`
  }));

  console.log(`📦 OpenAI returned ${normalized.length} products`);
  return normalized;
}

export function filterAndScore(products, seenNames) {
  // Filter by criteria
  let filtered = products.filter(p => (
    p.orders >= FILTERS.MIN_ORDERS &&
    p.rating >= FILTERS.MIN_RATING &&
    p.price > 0 &&
    p.price <= FILTERS.MAX_PRICE &&
    p.name.length > 5
  ));

  console.log(`✅ After filtering: ${filtered.length} products meet criteria`);

  // Remove duplicates against history (fuzzy match)
  filtered = filtered.filter(p => {
    const nameLower = p.name.toLowerCase().trim();
    return !seenNames.some(seen => {
      // Exact match or high similarity
      if (seen === nameLower) return true;
      // Check if one contains the other (catches minor variations)
      if (seen.length > 10 && nameLower.includes(seen.slice(0, 20))) return true;
      if (nameLower.length > 10 && seen.includes(nameLower.slice(0, 20))) return true;
      return false;
    });
  });

  console.log(`🆕 After dedup: ${filtered.length} new products`);

  // Score
  if (filtered.length === 0) return [];

  const maxOrders = Math.max(...filtered.map(p => p.orders), 1);

  const scored = filtered.map(p => {
    const orderScore = p.orders / maxOrders;
    const ratingScore = p.rating / 5;
    const priceAdvantage = 1 - (p.price / FILTERS.MAX_PRICE);

    const viralScore = (
      (orderScore * SCORING_WEIGHTS.ORDERS) +
      (ratingScore * SCORING_WEIGHTS.RATING) +
      (priceAdvantage * SCORING_WEIGHTS.PRICE_ADVANTAGE)
    );

    return { ...p, viralScore: Math.round(viralScore * 1000) / 1000 };
  }).sort((a, b) => b.viralScore - a.viralScore);

  return scored.slice(0, PRODUCTS_PER_DAY);
}
