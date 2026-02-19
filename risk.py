def position_size(capital, risk_percent, entry_price, stop_price):
    risk_amount = capital * risk_percent
    risk_per_unit = abs(entry_price - stop_price)

    if risk_per_unit == 0:
        return 0

    return round(risk_amount / risk_per_unit, 4)
