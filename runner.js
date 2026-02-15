import { PRODUCTS_PER_DAY, MAX_DAYS, WEEKLY_REPORT_EVERY } from './config.js';
import { discoverProducts, filterAndScore, recalculateScores } from './discover.js';
import { analyzeProducts, generateWeeklyReport } from './analyzer.js';
import {
  loadHistory, getSeenProductNames, addProductsToHistory,
  loadState, saveState,
  loadTrends, updateTrends
} from './history.js';
import { sendDailyReport, sendTrendReport, sendWeeklyReport } from './telegram.js';

export async function runDaily() {
  const state = loadState();
  const nextDay = state.currentDay + 1;

  if (nextDay > MAX_DAYS) {
    console.log(`\n🏁 Completed all ${MAX_DAYS} days.`);
    return false;
  }

  const today = new Date().toISOString().split('T')[0];
  if (state.lastRunDate === today) {
    console.log(`\n⏭️ Already ran today (${today}).`);
    return false;
  }

  console.log(`\n${'═'.repeat(55)}`);
  console.log(`🚀 WORLD VIRAL PRODUCT HUNTER v3 — Day ${nextDay}/${MAX_DAYS}`);
  console.log(`📅 ${today}`);
  console.log(`${'═'.repeat(55)}`);

  const history = loadHistory();
  const trends = loadTrends();
  const seenNames = getSeenProductNames(history);

  // PHASE 1: Discover
  let topProducts = [];
  let attempt = 0;

  while (topProducts.length < PRODUCTS_PER_DAY && attempt < 3) {
    attempt++;
    if (attempt > 1) console.log(`\n🔄 Retry ${attempt}...`);

    const raw = await discoverProducts(nextDay + (attempt - 1) * 7, seenNames);
    const scored = filterAndScore(raw, seenNames);

    for (const p of scored) {
      if (!topProducts.some(e => e.name.toLowerCase() === p.name.toLowerCase())) {
        topProducts.push(p);
      }
    }
  }

  topProducts = topProducts.slice(0, PRODUCTS_PER_DAY);

  if (topProducts.length === 0) {
    console.log('\n⚠️ No qualifying products found.');
    saveState({ currentDay: nextDay, lastRunDate: today });
    return true;
  }

  // PHASE 2: Competition & Niche Analysis
  topProducts = await analyzeProducts(topProducts);

  // PHASE 3: Recalculate with analysis
  topProducts = recalculateScores(topProducts);
  topProducts = topProducts.slice(0, PRODUCTS_PER_DAY);

  console.log(`\n📋 Final ${topProducts.length} products:`);
  topProducts.forEach((p, i) => {
    const comp = p.competitionLevel === 'low' ? '🟢' : p.competitionLevel === 'medium' ? '🟡' : '🔴';
    console.log(`  ${i + 1}. ${p.name.slice(0, 45)} | $${p.price} | ${p.orders} | ${comp} | Niche:${p.nicheScore}/10`);
  });

  // PHASE 4: Daily report
  await sendDailyReport(topProducts, nextDay);

  // PHASE 5: Trend tracking
  updateTrends(trends, topProducts, nextDay);
  if (nextDay > 1) {
    await sendTrendReport(trends, nextDay);
  }

  // PHASE 6: Weekly deep report (every 7 days)
  if (nextDay % WEEKLY_REPORT_EVERY === 0) {
    console.log('\n📊 Weekly report day!');
    const weeklyText = await generateWeeklyReport(history, trends, nextDay);
    if (weeklyText) {
      await sendWeeklyReport(weeklyText, nextDay);
    }
  }

  // Save
  addProductsToHistory(history, topProducts, nextDay);
  saveState({ currentDay: nextDay, lastRunDate: today });

  console.log(`\n✅ Day ${nextDay} complete.`);
  return true;
}
