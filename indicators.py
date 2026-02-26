import pandas as pd

def moving_averages(data):
    data['MA50'] = data['Close'].rolling(50).mean()
    data['MA200'] = data['Close'].rolling(200).mean()
    return data

def calculate_rsi(data, period=14):
    delta = data['Close'].diff()
    gain = delta.where(delta > 0, 0).rolling(period).mean()
    loss = -delta.where(delta < 0, 0).rolling(period).mean()
    rs = gain / loss
    data['RSI'] = 100 - (100 / (1 + rs))
    return data

def calculate_atr(data, period=14):
    high_low = data['High'] - data['Low']
    high_close = abs(data['High'] - data['Close'].shift())
    low_close = abs(data['Low'] - data['Close'].shift())
    ranges = pd.concat([high_low, high_close, low_close], axis=1)
    true_range = ranges.max(axis=1)
    data['ATR'] = true_range.rolling(period).mean()
    return data

def volume_spike(data):
    avg_volume = data['Volume'].rolling(20).mean()
    return data['Volume'].iloc[-1] > 2 * avg_volume.iloc[-1]

def breakout_signal(data, lookback=20):
    if len(data) < lookback + 2:
        return "No Breakout"
    recent_high = data['High'].rolling(lookback).max()
    recent_low = data['Low'].rolling(lookback).min()
    latest_close = float(data['Close'].iloc[-1])
    previous_high = float(recent_high.iloc[-2])
    previous_low = float(recent_low.iloc[-2])
    if latest_close > previous_high:
        return "Bullish Breakout"
    if latest_close < previous_low:
        return "Bearish Breakdown"
    return "No Breakout"

def detect_rsi_divergence(data):
    price = data['Close']
    rsi = data['RSI']
    if len(price) < 20:
        return "None"
    if price.iloc[-5:].min() < price.iloc[-10:-5].min() and \
       rsi.iloc[-5:].min() > rsi.iloc[-10:-5].min():
        return "Bullish Divergence"
    if price.iloc[-5:].max() > price.iloc[-10:-5].max() and \
       rsi.iloc[-5:].max() < rsi.iloc[-10:-5].max():
        return "Bearish Divergence"
    return "None"

def trend_strength(data):
    score = 0
    if len(data) < 200:
        return score
    latest = data.iloc[-1]
    if float(latest['MA50']) > float(latest['MA200']):
        score += 30
    if 50 < float(latest['RSI']) < 70:
        score += 20
    if volume_spike(data):
        score += 20
    if breakout_signal(data) == "Bullish Breakout":
        score += 30
    return score

def weekly_change(data):
    """% price change over the last 7 candles."""
    if len(data) < 8:
        return 0.0
    price_now = float(data['Close'].iloc[-1])
    price_week_ago = float(data['Close'].iloc[-8])
    if price_week_ago == 0:
        return 0.0
    return round(((price_now - price_week_ago) / price_week_ago) * 100, 2)

def volatility_level(data):
    """ATR as % of current price — low / medium / high."""
    latest = data.iloc[-1]
    price = float(latest['Close'])
    atr = float(latest['ATR']) if not __import__('math').isnan(float(latest['ATR'])) else 0
    if price == 0:
        return "unknown", 0.0
    pct = round((atr / price) * 100, 2)
    if pct < 1.5:
        level = "Low"
    elif pct < 4.0:
        level = "Medium"
    else:
        level = "High"
    return level, pct

def ma_position(data):
    """Returns price position relative to MA50 and MA200."""
    if len(data) < 200:
        return None, None
    latest = data.iloc[-1]
    price = float(latest['Close'])
    ma50 = float(latest['MA50'])
    ma200 = float(latest['MA200'])
    above_ma50 = price > ma50
    above_ma200 = price > ma200
    return above_ma50, above_ma200

def weekly_ohlc(data):
    """Returns the past 7 days open, high, low."""
    if len(data) < 7:
        return None, None, None
    week = data.iloc[-7:]
    w_open = round(float(week['Open'].iloc[0]), 4)
    w_high = round(float(week['High'].max()), 4)
    w_low = round(float(week['Low'].min()), 4)
    return w_open, w_high, w_low

def monthly_change(data):
    """% price change over the last 30 candles."""
    if len(data) < 31:
        return 0.0
    price_now = float(data['Close'].iloc[-1])
    price_ago = float(data['Close'].iloc[-31])
    if price_ago == 0:
        return 0.0
    return round(((price_now - price_ago) / price_ago) * 100, 2)

def volume_trend(data):
    """Compare this week's avg volume vs prior week."""
    if len(data) < 14:
        return "Unknown"
    this_week = data['Volume'].iloc[-7:].mean()
    prev_week = data['Volume'].iloc[-14:-7].mean()
    if prev_week == 0:
        return "Unknown"
    ratio = this_week / prev_week
    if ratio > 1.2:
        return "Rising ▲"
    elif ratio < 0.8:
        return "Falling ▼"
    return "Stable →"

def key_levels(data, lookback=20):
    """Support and resistance from recent highs/lows."""
    if len(data) < lookback:
        return None, None
    support = round(float(data['Low'].rolling(lookback).min().iloc[-1]), 4)
    resistance = round(float(data['High'].rolling(lookback).max().iloc[-1]), 4)
    return support, resistance
