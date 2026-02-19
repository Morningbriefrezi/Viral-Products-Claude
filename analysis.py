from indicators import *
from risk import position_size
from config import CAPITAL, RISK_PERCENT

def analyze_asset(data, crypto=False):
    data = moving_averages(data)
    data = calculate_rsi(data)
    data = calculate_atr(data)

    latest = data.iloc[-1]

    breakout = breakout_signal(data)
    divergence = detect_rsi_divergence(data)
    score = trend_strength(data)

    result = {
        "price": latest['Close'],
        "rsi": round(latest['RSI'], 2),
        "atr": round(latest['ATR'], 2),
        "trend_score": score,
        "breakout": breakout,
        "divergence": divergence
    }

    if crypto:
        entry = latest['Close']
        stop = entry - (1.5 * latest['ATR'])
        take_profit = entry + (3 * latest['ATR'])

        size = position_size(CAPITAL, RISK_PERCENT, entry, stop)

        result.update({
            "entry": round(entry, 2),
            "stop": round(stop, 2),
            "tp": round(take_profit, 2),
            "size": size
        })

    return result
