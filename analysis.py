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
    week_chg = weekly_change(data)
    vol_level, vol_pct = volatility_level(data)
    above_ma50, above_ma200 = ma_position(data)

    result = {
        "price": round(float(latest['Close']), 4),
        "rsi": round(float(latest['RSI']), 2),
        "atr": round(float(latest['ATR']), 4),
        "trend_score": score,
        "breakout": breakout,
        "divergence": divergence,
        "week_change": week_chg,
        "volatility": vol_level,
        "volatility_pct": vol_pct,
        "above_ma50": above_ma50,
        "above_ma200": above_ma200,
    }

    if crypto:
        entry = float(latest['Close'])
        stop = entry - (1.5 * float(latest['ATR']))
        take_profit = entry + (3 * float(latest['ATR']))
        size = position_size(CAPITAL, RISK_PERCENT, entry, stop)
        result.update({
            "entry": round(entry, 4),
            "stop": round(stop, 4),
            "tp": round(take_profit, 4),
            "size": size
        })

    return result
