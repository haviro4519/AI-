import { createClient } from '@supabase/supabase-js'

export async function saveStockAnalysis(symbol, rawData, analysis) {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
  
  if (supabaseUrl === 'demo_mode' || supabaseAnonKey === 'demo_mode') {
    // 演示模式，模拟保存成功
    console.log('Demo mode: Analysis saved successfully')
    return { id: Date.now(), symbol, raw_data: rawData, analysis }
  }
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be set in environment variables')
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  
  const { data, error } = await supabase
    .from('stock_analyses')
    .insert([{ symbol, raw_data: rawData, analysis }])
  
  if (error) {
    throw new Error(`Failed to save analysis: ${error.message}`)
  }
  
  return data
}
