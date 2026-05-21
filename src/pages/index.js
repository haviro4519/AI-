import { useState } from 'react'

export default function Home() {
  const [symbol, setSymbol] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symbol: symbol.trim().toUpperCase() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze')
      }

      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'Bullish':
        return 'text-green-600 bg-green-100'
      case 'Bearish':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'Low':
        return 'text-green-600 bg-green-100'
      case 'High':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-yellow-600 bg-yellow-100'
    }
  }

  const formatPrice = (price) => {
    return price.toLocaleString('zh-CN', { style: 'currency', currency: 'CNY' })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white mb-3">AI Stock Analyzer</h1>
          <p className="text-gray-400">输入股票代码，获取AI分析报告</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-white/80 text-sm mb-2">股票代码</label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="例如: 000001, 600519, 002594"
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !symbol.trim()}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  分析中...
                </>
              ) : (
                '分析'
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-300 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        {result && (
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">实时行情数据</h2>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  result.stock.dataSource && result.stock.dataSource.includes('演示模式') 
                    ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                    : 'bg-green-500/20 text-green-300 border border-green-500/30'
                }`}>
                  📡 {result.stock.dataSource || '未知来源'}
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="text-gray-400 text-sm mb-1">股票代码</div>
                  <div className="text-white font-semibold">{result.stock.symbol}</div>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="text-gray-400 text-sm mb-1">股票名称</div>
                  <div className="text-white font-semibold">{result.stock.name || '--'}</div>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="text-gray-400 text-sm mb-1">当前价格</div>
                  <div className="text-white font-semibold">{formatPrice(result.stock.price)}</div>
                </div>
                <div className={`bg-white/5 rounded-xl p-4 ${result.stock.change >= 0 ? 'border border-green-500/30' : 'border border-red-500/30'}`}>
                  <div className="text-gray-400 text-sm mb-1">涨跌幅</div>
                  <div className={`font-semibold ${result.stock.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {result.stock.change >= 0 ? '+' : ''}{result.stock.changePercent}%
                  </div>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="text-gray-400 text-sm mb-1">成交量</div>
                  <div className="text-white font-semibold">{result.stock.volume.toLocaleString()}</div>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="text-gray-400 text-sm mb-1">开盘价</div>
                  <div className="text-white font-semibold">{formatPrice(result.stock.open)}</div>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="text-gray-400 text-sm mb-1">最高价</div>
                  <div className="text-white font-semibold">{formatPrice(result.stock.high)}</div>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="text-gray-400 text-sm mb-1">最低价</div>
                  <div className="text-white font-semibold">{formatPrice(result.stock.low)}</div>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">AI 分析结果</h2>
              <div className="bg-white/5 rounded-xl p-4 mb-4">
                <div className="text-gray-400 text-sm mb-2">分析摘要</div>
                <div className="text-white">{result.analysis.summary}</div>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="text-gray-400 text-sm mb-2">市场情绪</div>
                  <div className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${getSentimentColor(result.analysis.sentiment)}`}>
                    {result.analysis.sentiment}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-gray-400 text-sm mb-2">风险等级</div>
                  <div className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${getRiskColor(result.analysis.risk_level)}`}>
                    {result.analysis.risk_level}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>数据来源: 模拟数据 | 分析引擎: OpenAI GPT-3.5</p>
        </div>
      </div>
    </div>
  )
}