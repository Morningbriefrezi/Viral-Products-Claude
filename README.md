# 🌍 World Viral Product Hunter v2

Automated system that discovers 10 viral products per day using OpenAI and delivers them via Telegram. Runs 15 consecutive days with full duplicate control.

## How It Works

1. OpenAI identifies real trending AliExpress products across rotating categories
2. Products are filtered (>500 orders, ≥4.3★, <$40), scored, and ranked
3. Top 10 new products are sent to Telegram daily
4. History prevents duplicates across all 15 days

## Setup

```bash
git clone https://github.com/YOUR_USERNAME/world-viral-product-hunter.git
cd world-viral-product-hunter
npm install
cp .env.example .env
# Edit .env with your keys
npm start
```

## GitHub Actions (Recommended)

Add these 3 secrets in **Settings → Secrets → Actions**:

| Secret | Where to get it |
|--------|----------------|
| `OPENAI_API_KEY` | platform.openai.com → API Keys |
| `TELEGRAM_BOT_TOKEN` | @BotFather on Telegram |
| `TELEGRAM_CHAT_ID` | @userinfobot on Telegram |

Workflow runs daily at 05:00 UTC automatically.

## Project Structure

```
src/
├── index.js      # Entry + cron scheduler
├── runner.js     # Daily orchestrator
├── discover.js   # OpenAI product discovery + scoring
├── telegram.js   # Telegram delivery
├── history.js    # JSON persistence + dedup
├── config.js     # Categories, filters, weights
└── run-once.js   # Manual single run
```
