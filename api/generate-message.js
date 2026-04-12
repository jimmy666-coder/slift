import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { scores, userId, nickname } = req.body

  let resolvedNickname = nickname
  if (
    (!resolvedNickname || !String(resolvedNickname).trim()) &&
    userId
  ) {
    const url = process.env.SUPABASE_URL
    const key =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_ANON_KEY
    if (url && key) {
      const supabase = createClient(url, key)
      const { data } = await supabase
        .from('tapeprofiles')
        .select('nickname')
        .eq('id', userId)
        .maybeSingle()
      if (data?.nickname?.trim()) {
        resolvedNickname = data.nickname
      }
    }
  }

  const displayNick =
    (resolvedNickname && String(resolvedNickname).trim()) || 'Slifter'
  const avg = (
    scores.reduce((a, b) => a + b, 0) / scores.length
  ).toFixed(1)

  const prompt = `You are PULSE, SLIFT's bienveillant AI coach.
Write a SHORT (2-3 sentences), warm and motivating message in English.
Address the user by their nickname: ${displayNick}.
Based on their last 7 recovery scores: ${scores.join(', ')}.
Average: ${avg}/10.
Be encouraging, personal and positive. Never negative. Focus on progress.
Example: "Great week ${displayNick}! Your energy is trending up..."
`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  const data = await response.json()
  const text = data.content[0].text
  res.status(200).send(text)
}
