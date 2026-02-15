import { readFileSync, writeFileSync, existsSync } from 'fs';

const HISTORY_PATH = './history.json';
const STATE_PATH = './state.json';
const TRENDS_PATH = './trends.json';

function loadJSON(filePath, fallback) {
  if (!existsSync(filePath)) return fallback;
  try {
    return JSON.parse(readFileSync(filePath, 'utf-8'));
  } catch {
    return fallback;
  }
}

function saveJSON(filePath, data) {
  writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export function loadHistory() {
  return loadJSON(HISTORY_PATH, { products: [] });
}

export function saveHistory(history) {
  saveJSON(HISTORY_PATH, history);
}

export function getSeenProductNames(history) {
  return history.products.map(p => p.name.toLowerCase().trim());
}

export function addProductsToHistory(history, products, day) {
  const date = new Date().toISOString().split('T')[0];
  for (const product of products) {
    history.products.push({
      name: product.name,
      link: product.link,
      price: product.price,
      orders: product.orders,
      rating: product.rating,
      category: product.category,
      competitionLevel: product.competitionLevel || 'unknown',
      nicheScore: product.nicheScore || 0,
      viralScore: product.viralScore || 0,
      day,
      date
    });
  }
  saveHistory(history);
}

export function loadState() {
  return loadJSON(STATE_PATH, { currentDay: 0, lastRunDate: null });
}

export function saveState(state) {
  saveJSON(STATE_PATH, state);
}

export function loadTrends() {
  return loadJSON(TRENDS_PATH, { tracked: {} });
}

export function saveTrends(trends) {
  saveJSON(TRENDS_PATH, trends);
}

export function updateTrends(trends, products, day) {
  for (const p of products) {
    const key = p.name.toLowerCase().trim();
    if (!trends.tracked[key]) {
      trends.tracked[key] = {
        name: p.name,
        category: p.category,
        firstSeen: day,
        appearances: [],
        trend: 'new'
      };
    }
    trends.tracked[key].appearances.push({
      day,
      orders: p.orders,
      price: p.price,
      rating: p.rating,
      viralScore: p.viralScore
    });
  }
  for (const key of Object.keys(trends.tracked)) {
    const t = trends.tracked[key];
    const apps = t.appearances;
    if (apps.length >= 2) {
      const latest = apps[apps.length - 1];
      const previous = apps[apps.length - 2];
      const growth = ((latest.orders - previous.orders) / previous.orders) * 100;
      if (growth > 10) t.trend = '📈 rising';
      else if (growth < -10) t.trend = '📉 declining';
      else t.trend = '➡️ stable';
    } else {
      t.trend = '🆕 new';
    }
  }
  saveTrends(trends);
}

export function getTrendingSummary(trends, currentDay) {
  const entries = Object.values(trends.tracked);
  return {
    rising: entries.filter(t => t.trend === '📈 rising'),
    declining: entries.filter(t => t.trend === '📉 declining'),
    stable: entries.filter(t => t.trend === '➡️ stable'),
    new: entries.filter(t => t.trend === '🆕 new' && t.firstSeen === currentDay),
    total: entries.length
  };
}
