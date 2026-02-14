import { PRODUCTS_PER_DAY, MAX_DAYS } from './config.js';
import { discoverProducts, filterAndScore } from './discover.js';
import { loadHistory, getSeenProductNames, addProductsToHistory, loadState, saveState } from './history.js';
import { sendToTelegram } from './telegram.js';

export async function runDaily() {
  const state = loadState();
  const nextDay = state.currentDay + 1;

  if (nextDay > MAX_DAYS) {
    console.log(`\n🏁 Completed all ${MAX_DAYS} days. System finished.`);
    return false;
  }

  const today = new Date().toISOString().split('T')[0];
  if (state.lastRunDate === today) {
    console.log(`\n⏭️ Already ran today (${today}). Skipping.`);
    return false;
  }

  console.log(`\n${'═'.repeat(50)}`);
  console.log(`🚀 WORLD VIRAL PRODUCT HUNTER — Day ${nextDay}/${MAX_DAYS}`);
  console.log(`📅 ${today}`);
  console.log(`${'═'.repeat(50)}`);

  const history = loadHistory();
  const seenNames = getSeenProductNames(history);

  // Attempt up to 3 times to get enough products
  let topProducts = [];
  let attempt = 0;

  while (topProducts.length < PRODUCTS_PER_DAY && attempt < 3) {
    attempt++;
    if (attempt > 1) console.log(`\n🔄 Retry attempt ${attempt}...`);

    const rawProducts = await discoverProducts(nextDay + (attempt - 1) * 7, seenNames);
    const scored = filterAndScore(rawProducts, seenNames);

    // Merge with existing finds (avoid duplicates within attempts)
    for (const p of scored) {
      if (!topProducts.some(existing => existing.name.toLowerCase() === p.name.toLowerCase())) {
        topProducts.push(p);
      }
    }
  }

  topProducts = topProducts.slice(0, PRODUCTS_PER_DAY);

  if (topProducts.length === 0) {
    console.log('\n⚠️ No qualifying products found today.');
    saveState({ currentDay: nextDay, lastRunDate: today });
    return true;
  }

  console.log(`\n📋 Final selection: ${topProducts.length} products`);
  topProducts.forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.name.slice(0, 55)} | $${p.price} | ${p.orders} orders | ⭐${p.rating}`);
  });

  await sendToTelegram(topProducts, nextDay);
  addProductsToHistory(history, topProducts, nextDay);
  saveState({ currentDay: nextDay, lastRunDate: today });

  console.log(`\n✅ Day ${nextDay} complete. ${topProducts.length} products saved.`);
  console.log(`📊 Total in history: ${history.products.length}`);

  return true;
}
