export async function fetchStockData(symbol) {
  try {
    return await fetchStockDataFromSina(symbol);
  } catch (sinaError) {
    console.warn('Sina API failed:', sinaError.message);
    try {
      return await fetchStockDataFromEastMoney(symbol);
    } catch (eastError) {
      console.warn('EastMoney API failed, falling back to demo mode:', eastError.message);
      return await fetchStockDataFromDemo(symbol);
    }
  }
}

async function fetchStockDataFromSina(symbol) {
  if (!symbol || symbol.trim() === '') {
    throw new Error('Symbol is required');
  }
  
  const cleanSymbol = symbol.replace(/\.SZ$|\.SH$|\.sz$|\.sh$/, '').trim();
  const prefix = cleanSymbol.startsWith('6') ? 'sh' : 'sz';
  
  const url = 'https://hq.sinajs.cn/list=' + prefix + cleanSymbol;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate',
      'Connection': 'keep-alive',
      'Referer': 'https://finance.sina.com.cn/',
      'Origin': 'https://finance.sina.com.cn'
    }
  });
  
  if (!response.ok) {
    throw new Error('HTTP error! status: ' + response.status);
  }
  
  const arrayBuffer = await response.arrayBuffer();
  const decoder = new TextDecoder('gbk');
  const text = decoder.decode(arrayBuffer);
  
  const match = text.match(/var hq_str_(\w+)="([^"]+)"/);
  
  if (!match) {
    throw new Error('No data found for symbol');
  }
  
  const fields = match[2].split(',');
  
  if (fields.length < 30) {
    throw new Error('Invalid data format');
  }
  
  const name = fields[0];
  
  const open = parseFloat(fields[1]);
  const prevClose = parseFloat(fields[2]);
  const price = parseFloat(fields[3]);
  const high = parseFloat(fields[4]);
  const low = parseFloat(fields[5]);
  const volume = parseInt(fields[8]);
  const date = fields[30];
  
  const change = price - prevClose;
  const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;
  
  return {
    symbol: cleanSymbol,
    name: name,
    price: Math.round(price * 100) / 100,
    change: Math.round(change * 100) / 100,
    changePercent: Math.round(changePercent * 100) / 100,
    volume: volume,
    open: Math.round(open * 100) / 100,
    high: Math.round(high * 100) / 100,
    low: Math.round(low * 100) / 100,
    latestTradingDay: date,
    dataSource: '新浪财经实时行情API'
  };
}

async function fetchStockDataFromEastMoney(symbol) {
  if (!symbol || symbol.trim() === '') {
    throw new Error('Symbol is required');
  }
  
  const cleanSymbol = symbol.replace(/\.SZ$|\.SH$|\.sz$|\.sh$/, '').trim();
  const market = cleanSymbol.startsWith('6') ? 'SH' : 'SZ';
  
  const url = 'https://push2.eastmoney.com/api/qt/stock/get?secid=' + market + '.' + cleanSymbol + '&fields=f57,f58,f116,f117,f118,f119,f120,f121,f122,f123,f124,f125,f126';
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Referer': 'https://quote.eastmoney.com/',
      'Origin': 'https://quote.eastmoney.com'
    }
  });
  
  if (!response.ok) {
    throw new Error('HTTP error! status: ' + response.status);
  }
  
  const data = await response.json();
  
  if (data.code !== 0 || !data.data) {
    throw new Error('No data found for symbol');
  }
  
  const d = data.data;
  const price = parseFloat(d.f116);
  const change = parseFloat(d.f118);
  const changePercent = parseFloat(d.f119);
  const open = parseFloat(d.f120);
  const high = parseFloat(d.f121);
  const low = parseFloat(d.f122);
  const volume = parseInt(d.f123);
  
  return {
    symbol: cleanSymbol,
    name: d.f58 || cleanSymbol,
    price: Math.round(price * 100) / 100,
    change: Math.round(change * 100) / 100,
    changePercent: Math.round(changePercent * 100) / 100,
    volume: volume,
    open: Math.round(open * 100) / 100,
    high: Math.round(high * 100) / 100,
    low: Math.round(low * 100) / 100,
    latestTradingDay: new Date().toISOString().split('T')[0],
    dataSource: '东方财富实时行情API'
  };
}

async function fetchStockDataFromDemo(symbol) {
  if (!symbol || symbol.trim() === '') {
    throw new Error('Symbol is required');
  }
  
  const cleanSymbol = symbol.replace(/\.SZ$|\.SH$|\.sz$|\.sh$/, '').trim();
  
  const stockDatabase = {
    '000001': { name: '平安银行', basePrice: 11.25 },
    '000858': { name: '五粮液', basePrice: 142.30 },
    '600519': { name: '贵州茅台', basePrice: 1316.90 },
    '601318': { name: '中国平安', basePrice: 45.20 },
    '002594': { name: '比亚迪', basePrice: 242.80 },
    'AAPL': { name: '苹果公司', basePrice: 178.50 },
    'MSFT': { name: '微软', basePrice: 378.90 }
  };
  
  let stockInfo = stockDatabase[cleanSymbol];
  if (!stockInfo) {
    stockInfo = { name: cleanSymbol, basePrice: 50 + (parseInt(cleanSymbol.slice(-4)) % 100) };
  }
  
  const randomFactor = 1 + (Math.random() - 0.5) * 0.05;
  const changePercent = (Math.random() - 0.48) * 4;
  const price = stockInfo.basePrice * randomFactor;
  const prevClose = price / (1 + changePercent / 100);
  const change = price - prevClose;
  
  return {
    symbol: cleanSymbol,
    name: stockInfo.name,
    price: Math.round(price * 100) / 100,
    change: Math.round(change * 100) / 100,
    changePercent: Math.round(changePercent * 100) / 100,
    volume: Math.floor(Math.random() * 50000000) + 1000000,
    open: Math.round(prevClose * (1 + (Math.random() - 0.5) * 0.02) * 100) / 100,
    high: Math.round(price * (1 + Math.random() * 0.03) * 100) / 100,
    low: Math.round(price * (1 - Math.random() * 0.03) * 100) / 100,
    latestTradingDay: new Date().toISOString().split('T')[0],
    dataSource: '演示模式（模拟数据）'
  };
}