import sys
import json
import os

os.environ['NO_PROXY'] = '*'
os.environ['HTTP_PROXY'] = ''
os.environ['HTTPS_PROXY'] = ''

import akshare as ak

def fetch_stock_data(symbol):
    try:
        if '.' in symbol:
            symbol_part = symbol.split('.')[0]
            exchange = symbol.split('.')[1].lower()
        else:
            symbol_part = symbol
            exchange = 'sh'
        
        df = ak.stock_zh_a_hist(
            symbol=symbol_part,
            period="daily",
            start_date="20240101",
            adjust="qfq"
        )
        
        if df.empty:
            return json.dumps({
                "error": "No data found for symbol: " + symbol
            })
        
        latest_data = df.iloc[-1]
        
        prev_data = df.iloc[-2] if len(df) > 1 else latest_data
        
        result = {
            "symbol": symbol.upper(),
            "price": round(float(latest_data['收盘']), 2),
            "change": round(float(latest_data['收盘']) - float(prev_data['收盘']), 2),
            "changePercent": round(((float(latest_data['收盘']) - float(prev_data['收盘'])) / float(prev_data['收盘'])) * 100, 2),
            "volume": int(latest_data['成交量']),
            "open": round(float(latest_data['开盘']), 2),
            "high": round(float(latest_data['最高']), 2),
            "low": round(float(latest_data['最低']), 2),
            "latestTradingDay": str(latest_data['日期'])
        }
        
        return json.dumps(result, ensure_ascii=False)
    
    except Exception as e:
        return json.dumps({
            "error": str(e)
        })

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Symbol parameter is required"}))
        sys.exit(1)
    
    symbol = sys.argv[1]
    print(fetch_stock_data(symbol))