import axios from 'axios';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

function escapeMarkdown(text) {
  return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
}

function formatMessage(products, day) {
  const date = new Date().toISOString().split('T')[0];
  let msg = `🚀 *WORLD VIRAL PRODUCT REPORT — Day ${day}*\n`;
  msg += `📅 ${date}\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  products.forEach((p, i) => {
    msg += `*${i + 1}\\) ${escapeMarkdown(p.name)}*\n`;
    msg += `💰 Price: $${p.price.toFixed(2)}\n`;
    msg += `📦 Orders: ${p.orders.toLocaleString()}\\+\n`;
    msg += `⭐ Rating: ${p.rating}\n`;
    msg += `📊 Viral Score: ${p.viralScore}\n`;
    msg += `🔥 ${escapeMarkdown(p.whyViral || '')}\n`;
    msg += `🔗 [Search on AliExpress](${p.link})\n\n`;
  });

  msg += `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `🤖 _Powered by World Viral Product Hunter_`;
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

export async function sendToTelegram(products, day) {
  if (!BOT_TOKEN || !CHAT_ID) {
    console.error('❌ TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set');
    console.log('\n--- Telegram Preview ---');
    console.log(formatMessage(products, day).replace(/[*_\\]/g, ''));
    console.log('--- End Preview ---\n');
    return false;
  }

  const message = formatMessage(products, day);
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  const chunks = splitMessage(message, 4000);

  for (const chunk of chunks) {
    try {
      await axios.post(url, {
        chat_id: CHAT_ID,
        text: chunk,
        parse_mode: 'MarkdownV2',
        disable_web_page_preview: true
      }, { timeout: 10000 });
      console.log('📨 Telegram message sent');
    } catch (err) {
      console.error(`❌ MarkdownV2 failed: ${err.response?.data?.description || err.message}`);
      // Fallback: plain text
      try {
        await axios.post(url, {
          chat_id: CHAT_ID,
          text: chunk.replace(/[*_\\`\[\]()~>#+=|{}.!-]/g, ''),
          disable_web_page_preview: true
        }, { timeout: 10000 });
        console.log('📨 Telegram sent (plain text fallback)');
      } catch (retryErr) {
        console.error(`❌ Telegram failed completely: ${retryErr.message}`);
        return false;
      }
    }
    if (chunks.length > 1) await new Promise(r => setTimeout(r, 1000));
  }

  return true;
}
