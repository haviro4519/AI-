# AI Stock Analyzer

一个基于 Next.js 的 AI 股票分析面板，用户输入股票代码即可获取实时行情数据并由 LLM 分析生成结构化报告。

## 在线访问

部署地址：待部署后更新

## 功能特性

- 📈 **实时行情数据**：通过东方财富/新浪财经 API 获取 A 股实时价格、涨跌幅、成交量等数据
- 🤖 **AI 分析**：使用 OpenAI GPT-3.5 分析股票数据
- 💾 **数据存储**：分析结果自动保存到 Supabase 数据库

## 技术栈

- **框架**: Next.js 14 (App Router)
- **前端**: React 18 + Tailwind CSS 3
- **后端**: Node.js 
- **AI**: OpenAI GPT-3.5-turbo
- **数据来源**: 东方财富 API、新浪财经 API
- **数据库**: Supabase

## 快速开始

### 环境变量

复制 `.env.example` 并配置环境变量：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

### Supabase 表结构

在 Supabase 中创建 `stock_analyses` 表：

```sql
CREATE TABLE stock_analyses (
  id SERIAL PRIMARY KEY,
  symbol TEXT NOT NULL,
  raw_data JSONB NOT NULL,
  analysis JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

<br />

# 使用说明

### 支持的股票代码

| 代码     | 名称   | 板块  |
| ------ | ---- | --- |
| 600519 | 贵州茅台 | 白酒  |
| 000001 | 平安银行 | 银行  |
| 000858 | 五粮液  | 白酒  |
| 601318 | 中国平安 | 保险  |
| 002594 | 比亚迪  | 新能源 |
| AAPL   | 苹果公司 | 科技  |

### 输入格式

- A 股股票代码：直接输入6位数字（如 `600519`、`000001`）
- 自动识别市场：6开头为沪市，0/3开头为深市

## API 接口

### POST /api/analyze

分析指定股票代码

**请求体**:

```json
{
  "symbol": "600519"
}
```

**响应**:

```json
{
  "stock": {
    "symbol": "600519",
    "name": "贵州茅台",
    "price": 1817.44,
    "change": -27.88,
    "changePercent": -1.51,
    "volume": 46454520,
    "open": 1838.38,
    "high": 1836.73,
    "low": 1771.17,
    "latestTradingDay": "2026-05-21"
  },
  "analysis": {
    "summary": "贵州茅台 (600519) 今日下跌 1.51%。股票板块承压，短期风险较高。建议控制仓位，等待企稳信号。",
    "sentiment": "Bearish",
    "risk_level": "High"
  }
}
```

## Prompt 配置

### Prompt 内容

```
You are a stock analysis assistant. Analyze the following stock data and output ONLY a valid JSON object with no additional text, explanation, or markdown.

Stock Data:
- Symbol: {symbol}
- Name: {name}
- Current Price: ${price}
- Price Change: ${change} (${changePercent}%)
- Volume: ${volume}
- Open: ${open}
- High: ${high}
- Low: ${low}

Output format (strict JSON only):
{"summary": "string summary of stock performance and recommendation in Chinese", "sentiment": "Bullish" | "Neutral" | "Bearish", "risk_level": "Low" | "Medium" | "High"}
```

### 强制 JSON 输出

1. **明确指令开头**: 使用 "output ONLY a valid JSON object with no additional text" 明确禁止额外内容
2. **禁止 markdown**: 明确指出 "no markdown"，防止 LLM 返回代码块格式
3. **系统消息约束**: 在 system message 中设定角色为 "You are a stock analysis expert. Output only valid JSON."
4. **严格格式示例**: 提供明确的 JSON 格式模板，包含字段类型和可选值
5. **低 temperature**: 设置 temperature: 0.3 减少随机性，提高输出一致性

### JSON 验证函数

代码中实现了 `validateAndParseLLMResponse` 函数，执行以下验证：

1. 清理 markdown 标记（移除 `json 和 `  ）
2. 使用 JSON.parse 验证格式正确性
3. 字段校验（summary、sentiment、risk\_level）
4. 解析失败时返回包含原始响应的错误信息

## Debug 记录

### CORS 错误解决

**问题现象**: 开发环境中前端调用 API 时出现 CORS 错误。

**排查思路**:

1. 检查浏览器控制台错误信息
2. 确认 API 路由是否正确配置
3. 验证请求方式和头部

**解决方案**: 在 `next.config.js` 中配置 CORS 响应头：

```javascript
async headers() {
  return [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: '*' },
        { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
      ],
    },
  ];
}
```

### API 403 错误解决

**问题现象**: 新浪财经 API 返回 403 Forbidden。

**排查思路**:

1. 检查请求头是否完整
2. 确认是否缺少必要的浏览器标识（防止反爬）

**解决方案**: 添加完整的模拟浏览器请求头：

```javascript
headers: {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
  'Referer': 'https://quote.eastmoney.com/',
  'Origin': 'https://quote.eastmoney.com'
}
```

## 项目结构

```
.
├── README.md
├── prompt.md           # Prompt 配置说明
├── .env.example        # 环境变量模板
├── .gitignore
├── package.json
├── next.config.js      # Next.js 配置（含 CORS）
├── render.yaml         # Render 部署配置
└── src/
    ├── pages/
    │   ├── index.js    # 前端页面
    │   └── api/
    │       └── analyze.js  # API 路由
    └── utils/
        ├── stockApi.js   # 股票数据 API 封装（东方财富/新浪财经）
        ├── llmApi.js     # OpenAI API 封装
        └── supabase.js   # Supabase 客户端
```

<br />

