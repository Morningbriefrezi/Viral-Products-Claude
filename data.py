import yfinance as yf

def get_data(ticker):
    df = yf.download(
        ticker,
        period="1y",
        interval="1d",
        progress=False,
        auto_adjust=True
    )
    if df is None or df.empty:
        return df

    # Newer yfinance returns MultiIndex columns like ('Close', 'BTC-USD').
    # Flatten to simple column names ('Close', 'High', 'Low', etc.)
    if isinstance(df.columns, __import__('pandas').MultiIndex):
        df.columns = df.columns.get_level_values(0)

    return df
