import OpenAI from 'openai';
import { CATEGORIES, FILTERS, SCORING_WEIGHTS, PRODUCTS_PER_DAY } from './config.js';

let _openai;
function getClient() {
  if (!_openai) {
    if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not set.');
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

function getCategoriesForDay(day) {
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
- Products must be REAL items that actually exist and sell well on AliExpress right now
- Each product must have estimated orders above ${FILTERS.MIN_ORDERS}
- Each product must have a rating of ${FILTERS.MIN_RATING} or higher (out of 5.0)
- Each product price must be under $${FILTERS.MAX_PRICE}
- Focus on products trending on TikTok, Instagram, or going viral in 2024-2025
- Prioritize UNIQUE products that are NOT easily found on Amazon
- Products should have mass appeal and impulse buy potential

CRITICAL FORMAT RULES:
- "price" must be a decimal number like 25.99 (NOT 2599)
- "rating" must be a decimal out of 5.0 like 4.7 (NOT 47)
- "orders" must be an integer like 5200 (NOT "5.2K")
- "searchQuery" must be a short 2-4 word search term for AliExpress
${exclusion}

Respond ONLY with a valid JSON array. No markdown, no backticks, no explanation.

[
  {
    "name": "Mini Portable Bluetooth Speaker Waterproof",
    "price": 15.99,
    "orders": 8500,
    "rating": 4.7,
    "category": "portable electronics",
    "whyViral": "Trending on TikTok for outdoor use",
    "searchQuery": "portable bluetooth speaker"
  }
]`;

  console.log('🤖 Querying OpenAI for products...');

  const response = await getClient().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are a product research expert. Return ONLY a valid JSON array. Prices must be decimals like 25.99, ratings decimals like 4.7, orders integers like 5200.'
      },
      { role: 'user', content: prompt }
    ],
    temperature: 0.9,
    max_tokens: 4000
  });

  const raw = response.choices[0].message.content.trim();
  const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

  let products;
  try {
    products = JSON.parse(cleaned);
  } catch (err) {
    console.error('❌ Parse failed:', err.message);
    return [];
  }

  if (!Array.isArray(products)) return [];

  const normalized = products.map(p => {
    let price = parseFloat(p.price) || 0;
    let rating = parseFloat(p.rating) || 0;
    let orders = parseInt(p.orders) || 0;

    if (price > 500) price = price / 100;
    if (rating > 5) rating = rating / 10;

    const query = (p.searchQuery || p.name || '').trim();
    const link = `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(query)}`;

    return {
      name: (p.name || '').trim(),
      price, orders, rating,
      category: (p.category || '').trim(),
      whyViral: (p.whyViral || '').trim(),
      link
    };
  });

  console.log(`📦 Received ${normalized.length} products`);
  return normalized;
}

export function filterAndScore(products, seenNames) {
  let filtered = products.filter(p => (
    p.orders >= FILTERS.MIN_ORDERS &&
    p.rating >= FILTERS.MIN_RATING &&
    p.price > 0 &&
    p.price <= FILTERS.MAX_PRICE &&
    p.name.length > 5
  ));

  console.log(`✅ Filtered: ${filtered.length} meet criteria`);

  filtered = filtered.filter(p => {
    const nameLower = p.name.toLowerCase().trim();
    return !seenNames.some(seen => {
      if (seen === nameLower) return true;
      if (seen.length > 10 && nameLower.includes(seen.slice(0, 20))) return true;
      if (nameLower.length > 10 && seen.includes(nameLower.slice(0, 20))) return true;
      return false;
    });
  });

  console.log(`🆕 After dedup: ${filtered.length} new`);
  if (filtered.length === 0) return [];

  const maxOrders = Math.max(...filtered.map(p => p.orders), 1);

  const scored = filtered.map(p => {
    const orderScore = p.orders / maxOrders;
    const ratingScore = p.rating / 5;
    const priceAdvantage = 1 - (p.price / FILTERS.MAX_PRICE);

    const baseScore = (orderScore * 0.45) + (ratingScore * 0.30) + (priceAdvantage * 0.25);

    return { ...p, viralScore: Math.round(baseScore * 1000) / 1000 };
  }).sort((a, b) => b.viralScore - a.viralScore);

  return scored.slice(0, PRODUCTS_PER_DAY + 3);
}

export function recalculateScores(products) {
  const maxOrders = Math.max(...products.map(p => p.orders), 1);

  return products.map(p => {
    const orderScore = p.orders / maxOrders;
    const ratingScore = p.rating / 5;
    const priceAdvantage = 1 - (p.price / FILTERS.MAX_PRICE);
    const competitionScore = p.competitionLevel === 'low' ? 1.0 : p.competitionLevel === 'medium' ? 0.5 : 0.15;
    const nicheNorm = (p.nicheScore || 5) / 10;

    const viralScore = (
      (orderScore * SCORING_WEIGHTS.ORDERS) +
      (ratingScore * SCORING_WEIGHTS.RATING) +
      (priceAdvantage * SCORING_WEIGHTS.PRICE_ADVANTAGE) +
      (competitionScore * SCORING_WEIGHTS.COMPETITION) +
      (nicheNorm * SCORING_WEIGHTS.NICHE)
    );

    return { ...p, viralScore: Math.round(viralScore * 1000) / 1000 };
  }).sort((a, b) => b.viralScore - a.viralScore);
}
