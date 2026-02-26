import requests
from datetime import date, timedelta

from config import TELEGRAM_TOKEN, CHAT_ID
from data import get_data
from analysis import analyze_asset
from formatter import format_asset

CRYPTO = {
    "Bitcoin": "BTC-USD",
    "Ethereum": "ETH-USD",
    "Solana": "SOL-USD",
    "Arweave": "AR-USD",
    "Bittensor": "TAO-USD",
    "Chainlink": "LINK-USD",
    "Litecoin": "LTC-USD",
    "SUI": "SUI-USD",
    "BNB": "BNB-USD",
    "Cardano": "ADA-USD"
}

STOCKS = {
    "S&P 500": "^GSPC",
    "Tesla": "TSLA",
    "Apple": "AAPL",
    "NVIDIA": "NVDA",
    "Palantir": "PLTR",
    "Google": "GOOGL",
    "Meta": "META"
}


def send_message(text):
    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
    requests.post(url, data={"chat_id": CHAT_ID, "text": text})


def build_section(assets, crypto=False):
    """Build a message string for a group of assets."""
    message = ""
    for name, ticker in assets.items():
        try:
            data = get_data(ticker)
            if data is None or data.empty:
                message += f"{name}: No data available\n\n"
                continue
            analysis = analyze_asset(data, crypto=crypto)
            message += format_asset(name, analysis, crypto=crypto)
            message += "\n"
        except Exception as e:
            message += f"{name}: Error — {e}\n\n"
    return message


def generate_report():
    today = date.today()
    week_start = today - timedelta(days=6)
    date_range = f"{week_start.strftime('%b %d')} – {today.strftime('%b %d, %Y')}"

    header = f"📅 WEEKLY RECAP  |  {date_range}\n\n"

    # Split crypto into two batches of 5 — 10 assets would exceed Telegram's 4096 char limit
    crypto_items = list(CRYPTO.items())
    crypto_batch_1 = dict(crypto_items[:5])
    crypto_batch_2 = dict(crypto_items[5:])

    send_message(header + "🪙 CRYPTO WEEKLY RECAP (1/2)\n\n" + build_section(crypto_batch_1, crypto=True))
    send_message(header + "🪙 CRYPTO WEEKLY RECAP (2/2)\n\n" + build_section(crypto_batch_2, crypto=True))
    send_message(header + "📈 STOCKS WEEKLY RECAP\n\n" + build_section(STOCKS, crypto=False))
    print("Weekly reports sent.")


if __name__ == "__main__":
    generate_report()
