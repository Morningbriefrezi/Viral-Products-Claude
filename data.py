import yfinance as yf

def get_data(ticker):
    return yf.download(
        ticker,
        period="3mo",      # was 6mo
        interval="1d",
        progress=False
    )
