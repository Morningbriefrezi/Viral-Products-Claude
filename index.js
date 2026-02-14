import 'dotenv/config';
import cron from 'node-cron';
import { runDaily } from './runner.js';
import { MAX_DAYS } from './config.js';
import { loadState } from './history.js';

const CRON_SCHEDULE = process.env.CRON_SCHEDULE || '0 5 * * *';

async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   🌍 WORLD VIRAL PRODUCT HUNTER v2          ║');
  console.log('║   Powered by OpenAI + Telegram              ║');
  console.log('╚══════════════════════════════════════════════╝');

  const state = loadState();
  console.log(`\n📊 Current state: Day ${state.currentDay}/${MAX_DAYS}`);
  console.log(`⏰ Cron: ${CRON_SCHEDULE}`);

  console.log('\n▶️ Running initial scan...');
  await runDaily();

  if (state.currentDay < MAX_DAYS) {
    console.log(`\n⏰ Cron scheduled: ${CRON_SCHEDULE}`);
    cron.schedule(CRON_SCHEDULE, async () => {
      console.log(`\n⏰ Cron triggered: ${new Date().toISOString()}`);
      const continued = await runDaily();
      if (!continued) {
        const s = loadState();
        if (s.currentDay >= MAX_DAYS) {
          console.log('\n🏁 All days completed. Exiting.');
          process.exit(0);
        }
      }
    }, { timezone: 'UTC' });
    console.log('🟢 Waiting for next scheduled run...');
  } else {
    console.log('\n🏁 All days already completed.');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
