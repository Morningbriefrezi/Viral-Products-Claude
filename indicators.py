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
