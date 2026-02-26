def score_bar(score, total=100, length=10):
    """Visual bar like ████░░░░░░ 70/100"""
    filled = round((score / total) * length)
    return "█" * filled + "░" * (length - filled) + f"  {score}/{total}"


def verdict(data):
    score = data['trend_score']
    rsi = data['rsi']
    breakout = data['breakout']
    divergence = data['divergence']
    above_ma50 = data['above_ma50']
    above_ma200 = data['above_ma200']

    bullish_points = 0
    bearish_points = 0

    if score >= 60:
        bullish_points += 2
    elif score <= 20:
        bearish_points += 2

    if rsi > 55:
        bullish_points += 1
    elif rsi < 45:
        bearish_points += 1

    if rsi >= 70:
        bearish_points += 1  # overbought penalty
    elif rsi <= 30:
        bullish_points += 1  # oversold bonus

    if breakout == "Bullish Breakout":
        bullish_points += 2
    elif breakout == "Bearish Breakdown":
        bearish_points += 2

    if divergence == "Bullish Divergence":
        bullish_points += 1
    elif divergence == "Bearish Divergence":
        bearish_points += 1

    if above_ma50:
        bullish_points += 1
    else:
        bearish_points += 1

    if above_ma200:
        bullish_points += 1
    else:
        bearish_points += 1

    if bullish_points >= 5:
        return "🟢 BULLISH"
    elif bearish_points >= 5:
        return "🔴 BEARISH"
    else:
        return "🟡 NEUTRAL"


def generate_analysis(data, crypto=False):
    lines = []

    rsi = data['rsi']
    score = data['trend_score']
    breakout = data['breakout']
    divergence = data['divergence']
    above_ma50 = data['above_ma50']
    above_ma200 = data['above_ma200']
    vol = data['volatility']
    vol_pct = data['volatility_pct']
    week_chg = data['week_change']
    month_chg = data['month_change']
    vol_trend = data['volume_trend']

    # Trend
    if score >= 70:
        lines.append("Strong bullish trend across all indicators.")
    elif score >= 40:
        lines.append("Moderate bullish momentum, not fully confirmed yet.")
    elif score > 0:
        lines.append("Weak trend. Mixed signals — caution advised.")
    else:
        lines.append("No clear trend. Market is ranging or bearish.")

    # Weekly vs monthly context
    if week_chg >= 0 and month_chg >= 0:
        lines.append(f"Both weekly (+{week_chg}%) and monthly (+{month_chg}%) are green — sustained buying pressure.")
    elif week_chg >= 0 and month_chg < 0:
        lines.append(f"Week recovered +{week_chg}% but month is still {month_chg}% — possible short-term bounce in a downtrend.")
    elif week_chg < 0 and month_chg >= 0:
        lines.append(f"Week pulled back {week_chg}% within a positive month (+{month_chg}%) — healthy dip or start of reversal.")
    else:
        lines.append(f"Both weekly ({week_chg}%) and monthly ({month_chg}%) are red — consistent selling pressure.")

    # Volume context
    if vol_trend == "Rising ▲":
        lines.append("Volume rising this week — move is backed by participation.")
    elif vol_trend == "Falling ▼":
        lines.append("Volume declining — weak conviction behind the price move.")

    # RSI
    if rsi >= 70:
        lines.append(f"RSI {rsi} — overbought, watch for a pullback.")
    elif rsi <= 30:
        lines.append(f"RSI {rsi} — oversold, bounce possible.")
    elif rsi > 50:
        lines.append(f"RSI {rsi} — bullish zone, momentum intact.")
    else:
        lines.append(f"RSI {rsi} — below midpoint, bearish pressure.")

    # MA position
    if above_ma50 is not None and above_ma200 is not None:
        if above_ma50 and above_ma200:
            lines.append("Above both MA50 and MA200 — healthy uptrend structure.")
        elif above_ma50 and not above_ma200:
            lines.append("Above MA50 but below MA200 — recovery underway, not confirmed.")
        elif not above_ma50 and above_ma200:
            lines.append("Below MA50 but above MA200 — short-term weakness, long-term intact.")
        else:
            lines.append("Below both MA50 and MA200 — bearish structure.")

    # Breakout
    if breakout == "Bullish Breakout":
        lines.append("Broke above recent highs — breakout confirmed.")
    elif breakout == "Bearish Breakdown":
        lines.append("Broke below recent lows — breakdown in play.")

    # Divergence
    if divergence == "Bullish Divergence":
        lines.append("Bullish RSI divergence — possible reversal up.")
    elif divergence == "Bearish Divergence":
        lines.append("Bearish RSI divergence — possible reversal down.")

    # Volatility
    lines.append(f"Volatility: {vol} ({vol_pct}% ATR).")

    # Crypto trade setup
    if crypto:
        rr = round((data['tp'] - data['entry']) / (data['entry'] - data['stop']), 1) if data['entry'] != data['stop'] else 0
        lines.append(f"Trade setup: Entry {data['entry']} | SL {data['stop']} | TP {data['tp']} | R:R {rr}:1 | Size {data['size']} units.")

    return " ".join(lines)


def format_asset(name, data, crypto=False):
    v = verdict(data)
    week_chg = data['week_change']
    month_chg = data['month_change']
    week_arrow = "▲" if week_chg >= 0 else "▼"
    month_arrow = "▲" if month_chg >= 0 else "▼"
    week_sign = "+" if week_chg >= 0 else ""
    month_sign = "+" if month_chg >= 0 else ""

    text = "━━━━━━━━━━━━━━━━━━━━\n"
    text += f"{'🪙' if crypto else '📈'} {name}   {v}\n"
    text += f"💲 Close: {data['price']}\n"
    text += f"📅 7d: {week_arrow} {week_sign}{week_chg}%   |   30d: {month_arrow} {month_sign}{month_chg}%\n"

    if data['week_high'] is not None:
        text += f"📐 Week H: {data['week_high']}  L: {data['week_low']}  Open: {data['week_open']}\n"

    if data['support'] is not None:
        text += f"🛡 Support: {data['support']}   🚧 Resist: {data['resistance']}\n"

    text += f"📊 Score: {score_bar(data['trend_score'])}\n"
    text += f"📉 RSI: {data['rsi']}   ⚡ Vol: {data['volatility']} ({data['volatility_pct']}%)   📦 Volume: {data['volume_trend']}\n"

    if data['above_ma50'] is not None:
        ma50_str = "✅ MA50" if data['above_ma50'] else "❌ MA50"
        ma200_str = "✅ MA200" if data['above_ma200'] else "❌ MA200"
        text += f"📈 {ma50_str}   {ma200_str}\n"

    text += f"🔍 {data['breakout']}   |   {data['divergence']}\n"
    text += f"\n💬 {generate_analysis(data, crypto=crypto)}\n"

    return text
