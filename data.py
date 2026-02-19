import yfinance as yf

def get_data(ticker):
    data = yf.download(ticker, period="6mo", interval="1d")
    return data
