def format_asset(name, data, crypto=False):
    text = f"""
{name}
Price: {data['price']}
RSI: {data['rsi']}
ATR: {data['atr']}
Trend Score: {data['trend_score']}/100
Breakout: {data['breakout']}
Divergence: {data['divergence']}
"""

    if crypto:
        text += f"""
Entry: {data['entry']}
Stop Loss: {data['stop']}
Take Profit: {data['tp']}
Position Size: {data['size']}
"""

    return text
