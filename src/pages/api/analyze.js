import { fetchStockData } from '../../utils/stockApi'
import { callLLMAnalysis } from '../../utils/llmApi'
import { saveStockAnalysis } from '../../utils/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { symbol } = req.body

    if (!symbol || symbol.trim() === '') {
      return res.status(400).json({ error: 'Symbol is required' })
    }

    const stockData = await fetchStockData(symbol)
    const analysis = await callLLMAnalysis(stockData)
    await saveStockAnalysis(symbol.toUpperCase(), stockData, analysis)

    res.status(200).json({
      stock: stockData,
      analysis: analysis,
    })
  } catch (error) {
    console.error('Analysis error:', error)
    res.status(500).json({ error: error.message })
  }
}
