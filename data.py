import yfinance as yf

def get_data(ticker):
    return yf.download(
        ticker,
        period="1y",       # 1 year = ~252 trading days, enough for MA200
        interval="1d",
        progress=False
    )
