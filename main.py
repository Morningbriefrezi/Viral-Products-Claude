import requests
import schedule
import time

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

def generate_report():
    message = "📊 DAILY MARKET REPORT\n"

    for name, ticker in CRYPTO.items():
        data = get_data(ticker)
        analysis = analyze_asset(data, crypto=True)
        message += format_asset(name, analysis, crypto=True)

    for name, ticker in STOCKS.items():
        data = get_data(ticker)
        analysis = analyze_asset(data)
        message += format_asset(name, analysis)

    send_message(message)

schedule.every().day.at("09:00").do(generate_report)

while True:
    schedule.run_pending()
    time.sleep(60)
