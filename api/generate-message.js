export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  
  const { scores } = JSON.parse(req.body)
  const avg = (scores.reduce((a,b) => a+b, 0) / scores.length).toFixed(1)
  
  const prompt = `You are SLIFT, a bienveillant AI fitness coach. 
Write a SHORT (2-3 sentences max), warm and motivating message in English 
based on this user's last 7 recovery scores: ${scores.join(', ')}.
Average: ${avg}/10.
Be encouraging, personal, and positive. Never negative. Focus on progress.`

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
