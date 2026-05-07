import type { NextApiRequest, NextApiResponse } from 'next'
import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '../../lib/supabase-admin'
import { checkAccess, canAccess } from '../../lib/access'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Cost per 1M tokens (Haiku) in USD
const INPUT_COST_PER_M = 0.25
const OUTPUT_COST_PER_M = 1.25
const MARKUP = 2.0 // 100% markup

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { userId, transactions, budgets, question } = req.body
  if (!userId) return res.status(401).json({ error: 'Not authenticated' })

  // Check subscription access
  const access = await checkAccess(userId)
  if (!canAccess(access)) {
    return res.status(403).json({ error: 'Subscription required', access })
  }

  const supabase = createAdminClient()

  // Build prompt
  const systemPrompt = `You are a personal finance advisor analyzing spending data. 
Be specific, actionable, and encouraging. Focus on practical savings opportunities.
Format responses clearly with specific dollar amounts where possible.
Keep responses concise — 3-5 key insights maximum.`

  const userPrompt = question
    ? `The user asks: "${question}"\n\nHere is their spending data:\n${JSON.stringify({ transactions: transactions?.slice(0, 100), budgets }, null, 2)}`
    : `Analyze this spending data and provide 3-5 specific insights and recommendations:\n${JSON.stringify({ transactions: transactions?.slice(0, 100), budgets }, null, 2)}`

  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const inputTokens = message.usage.input_tokens
    const outputTokens = message.usage.output_tokens
    const costUSD = ((inputTokens / 1_000_000) * INPUT_COST_PER_M) +
                    ((outputTokens / 1_000_000) * OUTPUT_COST_PER_M)
    const chargedUSD = costUSD * MARKUP

    // Log usage for billing tracking
    await supabase.from('user_settings').upsert({
      user_id: userId,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

    const content = message.content[0]
    const responseText = content.type === 'text' ? content.text : ''

    return res.status(200).json({
      analysis: responseText,
      usage: { inputTokens, outputTokens, costUSD: chargedUSD.toFixed(4) },
    })
  } catch (err: any) {
    console.error('Claude API error:', err)
    return res.status(500).json({ error: 'AI analysis failed' })
  }
}
