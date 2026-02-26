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
    month_chg = monthly_change(data)
    vol_level, vol_pct = volatility_level(data)
    above_ma50, above_ma200 = ma_position(data)
    w_open, w_high, w_low = weekly_ohlc(data)
    vol_trend = volume_trend(data)
    support, resistance = key_levels(data)

    result = {
        "price": round(float(latest['Close']), 4),
        "rsi": round(float(latest['RSI']), 2),
        "atr": round(float(latest['ATR']), 4),
        "trend_score": score,
        "breakout": breakout,
        "divergence": divergence,
        "week_change": week_chg,
        "month_change": month_chg,
        "volatility": vol_level,
        "volatility_pct": vol_pct,
        "above_ma50": above_ma50,
        "above_ma200": above_ma200,
        "week_open": w_open,
        "week_high": w_high,
        "week_low": w_low,
        "volume_trend": vol_trend,
        "support": support,
        "resistance": resistance,
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
