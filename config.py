import os

TELEGRAM_TOKEN = os.environ.get("TELEGRAM_TOKEN", "")
CHAT_ID = os.environ.get("CHAT_ID", "")

CAPITAL = float(os.environ.get("CAPITAL", 10000))
RISK_PERCENT = float(os.environ.get("RISK_PERCENT", 0.01))
