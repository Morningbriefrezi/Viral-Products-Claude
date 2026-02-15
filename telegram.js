import axios from 'axios';
import { getTrendingSummary } from './history.js';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

function competitionBadge(level) {
  if (level === 'low') return '🟢 LOW';
  if (level === 'medium') return '🟡 MEDIUM';
  if (level === 'high') return '🔴 HIGH';
  return '⚪ N/A';
}

function nicheBar(score) {
  const filled = Math.round(score);
  const empty = 10 - filled;
  return '█'.repeat(filled) + '░'.repeat(empty) + ` ${score}/10`;
}

function formatDailyMessage(products, day) {
  const date = new Date().toISOString().split('T')[0];

  let msg = `🚀 VIRAL PRODUCT REPORT — Day ${day}\n`;
  msg += `📅 ${date}\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  products.forEach((p, i) => {
    msg += `${i + 1}) ${p.name}\n`;
    msg += `   💰 $${p.price.toFixed(2)}  📦 ${p.orders.toLocaleString()}+  ⭐ ${p.rating.toFixed(1)}\n`;
    msg += `   🏆 Viral Score: ${p.viralScore.toFixed(3)}\n`;
    msg += `   🏪 Competition: ${competitionBadge(p.competitionLevel)}\n`;
    msg += `   🎯 Niche Score: ${nicheBar(p.nicheScore || 0)}\n`;
    if (p.reasoning) {
      msg += `   💡 ${p.reasoning}\n`;
    }
    msg += `   🔥 ${p.whyViral || ''}\n`;
    msg += `   🔗 ${p.link}\n\n`;
  });

  msg += `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `🤖 World Viral Product Hunter v3`;
  return msg;
}

function formatTrendMessage(trends, day) {
  const summary = getTrendingSummary(trends, day);

  let msg = `📈 TREND TRACKER — Day ${day}\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  msg += `📊 Tracked: ${summary.total} | 🆕 New: ${summary.new.length}\n`;
  msg += `📈 Rising: ${summary.rising.length} | ➡️ Stable: ${summary.stable.length} | 📉 Declining: ${summary.declining.length}\n`;

  if (summary.rising.length > 0) {
    msg += `\n🔥 RISING:\n`;
    summary.rising.forEach(r => {
      const latest = r.appearances[r.appearances.length - 1];
      const prev = r.appearances[r.appearances.length - 2];
      const growth = (((latest.orders - prev.orders) / prev.orders) * 100).toFixed(0);
      msg += `  📈 ${r.name} (+${growth}%)\n`;
    });
  }

  if (summary.declining.length > 0) {
    msg += `\n⚠️ DECLINING:\n`;
    summary.declining.forEach(r => {
      msg += `  📉 ${r.name}\n`;
    });
  }

  msg += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  return msg;
}

function formatWeeklyReport(reportText, day) {
  let msg = `📊 WEEKLY DEEP ANALYSIS — Week ending Day ${day}\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  msg += reportText;
  msg += `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `🧠 AI Strategy Report`;
  return msg;
}

function splitMessage(msg, maxLen) {
  if (msg.length <= maxLen) return [msg];
  const chunks = [];
  let current = '';
  for (const line of msg.split('\n')) {
    if ((current + '\n' + line).length > maxLen && current.length > 0) {
      chunks.push(current);
      current = line;
    } else {
      current = current ? current + '\n' + line : line;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

async function sendMessage(text) {
  if (!BOT_TOKEN || !CHAT_ID) {
    console.log('\n--- Preview ---');
    console.log(text);
    console.log('--- End ---\n');
    return false;
  }

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  const chunks = splitMessage(text, 4000);

  for (const chunk of chunks) {
    try {
      await axios.post(url, {
        chat_id: CHAT_ID,
        text: chunk,
        disable_web_page_preview: true
      }, { timeout: 10000 });
      console.log('📨 Telegram sent');
    } catch (err) {
      console.error(`❌ Telegram: ${err.response?.data?.description || err.message}`);
      return false;
    }
    if (chunks.length > 1) await new Promise(r => setTimeout(r, 1000));
  }
  return true;
}

export async function sendDailyReport(products, day) {
  return sendMessage(formatDailyMessage(products, day));
}

export async function sendTrendReport(trends, day) {
  const summary = getTrendingSummary(trends, day);
  if (summary.total === 0) return true;
  return sendMessage(formatTrendMessage(trends, day));
}

export async function sendWeeklyReport(reportText, day) {
  if (!reportText) return false;
  return sendMessage(formatWeeklyReport(reportText, day));
}
