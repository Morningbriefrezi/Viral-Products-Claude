def generate_analysis(data, crypto=False):
    lines = []

    rsi = data['rsi']
    score = data['trend_score']
    breakout = data['breakout']
    divergence = data['divergence']

    # Trend
    if score >= 70:
        lines.append("Strong bullish trend across all indicators.")
    elif score >= 40:
        lines.append("Moderate bullish momentum, but not fully confirmed.")
    elif score > 0:
        lines.append("Weak trend. Mixed signals — caution advised.")
    else:
        lines.append("No clear trend. Market is ranging or bearish.")

    # RSI
    if rsi >= 70:
        lines.append(f"RSI at {rsi} — overbought, watch for a pullback.")
    elif rsi <= 30:
        lines.append(f"RSI at {rsi} — oversold, potential bounce incoming.")
    elif 50 < rsi < 70:
        lines.append(f"RSI at {rsi} — bullish zone, momentum intact.")
    else:
        lines.append(f"RSI at {rsi} — below midpoint, bearish pressure.")

    # Breakout
    if breakout == "Bullish Breakout":
        lines.append("Price broke above recent highs — breakout confirmed.")
    elif breakout == "Bearish Breakdown":
        lines.append("Price broke below recent lows — breakdown in play.")

    # Divergence
    if divergence == "Bullish Divergence":
        lines.append("Bullish RSI divergence detected — possible reversal up.")
    elif divergence == "Bearish Divergence":
        lines.append("Bearish RSI divergence detected — possible reversal down.")

    # Crypto trade setup
    if crypto:
        risk_reward = round((data['tp'] - data['entry']) / (data['entry'] - data['stop']), 1) if data['entry'] != data['stop'] else 0
        lines.append(f"R:R ratio {risk_reward}:1 | Size: {data['size']} units.")

    return " ".join(lines)


def format_asset(name, data, crypto=False):
    analysis = generate_analysis(data, crypto=crypto)

    text = f"{'—'*20}\n"
    text += f"🪙 {name}\n" if crypto else f"📈 {name}\n"
    text += f"Price: {data['price']}  |  RSI: {data['rsi']}  |  Score: {data['trend_score']}/100\n"
    text += f"Breakout: {data['breakout']}  |  Divergence: {data['divergence']}\n"

    if crypto:
        text += f"Entry: {data['entry']}  SL: {data['stop']}  TP: {data['tp']}\n"

    text += f"\n💬 {analysis}\n"

    return text
