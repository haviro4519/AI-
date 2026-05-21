import OpenAI from 'openai'

export async function callLLMAnalysis(stockData) {
  const apiKey = process.env.OPENAI_API_KEY
  
  if (apiKey === 'demo_mode') {
    return generateDemoAnalysis(stockData)
  }
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY must be set in environment variables')
  }

  const openai = new OpenAI({ apiKey })

  const prompt = `You are a stock analysis assistant. Analyze the following stock data and output ONLY a valid JSON object with no additional text, explanation, or markdown.

Stock Data:
- Symbol: ${stockData.symbol}
- Current Price: $${stockData.price}
- Price Change: $${stockData.change} (${stockData.changePercent}%)
- Volume: ${stockData.volume.toLocaleString()}
- Open: $${stockData.open}
- High: $${stockData.high}
- Low: $${stockData.low}

Output format (strict JSON only):
{"summary": "string summary of stock performance and recommendation", "sentiment": "Bullish" | "Neutral" | "Bearish", "risk_level": "Low" | "Medium" | "High"}`

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: 'You are a stock analysis expert. Output only valid JSON.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.3,
  })

  const rawResponse = response.choices[0].message.content.trim()
  return validateAndParseLLMResponse(rawResponse)
}

function generateDemoAnalysis(stockData) {
  const changePercent = stockData.changePercent
  const isPositive = changePercent >= 0
  const name = stockData.name || stockData.symbol
  const sector = stockData.sector || '股票'
  
  let summary = ''
  let sentiment = 'Neutral'
  let riskLevel = 'Medium'
  
  if (changePercent > 1) {
    sentiment = 'Bullish'
    riskLevel = 'Medium'
    summary = `${name} (${stockData.symbol}) 表现强劲，今日上涨 ${changePercent.toFixed(2)}%。${sector}板块整体活跃，建议持有观望。价格突破阻力位，成交量放大，短期看好。`
  } else if (changePercent < -1) {
    sentiment = 'Bearish'
    riskLevel = 'High'
    summary = `${name} (${stockData.symbol}) 今日下跌 ${Math.abs(changePercent).toFixed(2)}%。${sector}板块承压，短期风险较高。建议控制仓位，等待企稳信号。`
  } else if (changePercent > 0) {
    sentiment = 'Bullish'
    riskLevel = 'Low'
    summary = `${name} (${stockData.symbol}) 小幅上涨 ${changePercent.toFixed(2)}%，走势稳健。${sector}板块表现平稳，适合中长期持有。`
  } else {
    sentiment = 'Neutral'
    riskLevel = 'Low'
    summary = `${name} (${stockData.symbol}) 微跌 ${Math.abs(changePercent).toFixed(2)}%，处于震荡整理阶段。${sector}板块整体中性，建议观望为主。`
  }
  
  return {
    summary: summary,
    sentiment: sentiment,
    risk_level: riskLevel
  }
}

export function validateAndParseLLMResponse(rawResponse) {
  let cleanedResponse = rawResponse
  
  if (cleanedResponse.startsWith('```json')) {
    cleanedResponse = cleanedResponse.slice(7)
  }
  if (cleanedResponse.endsWith('```')) {
    cleanedResponse = cleanedResponse.slice(0, -3)
  }
  
  cleanedResponse = cleanedResponse.trim()
  
  try {
    const parsed = JSON.parse(cleanedResponse)
    
    if (!parsed.summary || typeof parsed.summary !== 'string') {
      throw new Error('Invalid summary field')
    }
    
    const validSentiments = ['Bullish', 'Neutral', 'Bearish']
    if (!parsed.sentiment || !validSentiments.includes(parsed.sentiment)) {
      throw new Error('Invalid sentiment value')
    }
    
    const validRiskLevels = ['Low', 'Medium', 'High']
    if (!parsed.risk_level || !validRiskLevels.includes(parsed.risk_level)) {
      throw new Error('Invalid risk_level value')
    }
    
    return parsed
  } catch (error) {
    throw new Error(`Failed to parse LLM response: ${error.message}. Raw response: ${rawResponse}`)
  }
}