import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const HISTORY_PATH = join(__dirname, '..', 'history.json');
const STATE_PATH = join(__dirname, '..', 'state.json');

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
