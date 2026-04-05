export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { profile, score, muscleGroups, scoreTier, duration, trainingStyle } = req.body

  const exerciseCount = score <= 4 ? 2 : score <= 6 ? 3 : score <= 7 ? 4 : score <= 8.4 ? 5 : 6
  const maxByDuration = duration === '30 min' ? 3 : duration === '45 min' ? 4 : duration === '60 min' ? 5 : duration === '90 min' ? 6 : 7
  const finalCount = Math.min(exerciseCount, maxByDuration)

  const prompt = `You are SLIFT, an elite AI fitness coach. Generate a workout as JSON only.

USER:
- Name: ${profile?.name || 'Slifter'}
- Goal: ${profile?.goal || 'Hypertrophy'}
- Level: ${profile?.level || 'Intermediate'}
- Equipment: ${Array.isArray(profile?.equipment) ? profile.equipment.join(', ') : 'Full Gym'}

TODAY:
- Recovery Score: ${score}/10 (${scoreTier})
- Muscles: ${Array.isArray(muscleGroups) && muscleGroups.length > 0 ? muscleGroups.join(', ') : 'Full Body'}
- Duration: ${duration || '60 min'}
- Style: ${trainingStyle || 'Hypertrophy'}

STRICT RULES:
- Generate EXACTLY ${finalCount} main exercises + 1 bonus
- Goal Strength: sets 3-5, reps 3-5, rest 3-5 min, RPE 8-9
- Goal Hypertrophy: sets 3-4, reps 8-12, rest 60-90s, RPE 7-8
- Goal Cut: sets 3, reps 12-15, rest 45-60s, RPE 7
- Score below 5: light weights, no failure
- Score above 8: push hard, progressive overload
- Bonus for score below 6: isCardio true, name "10 min light cardio or walk"
- Bonus for score above 6: isCardio false, one optional extra exercise

Respond with ONLY valid JSON, no markdown:
{"warmup":"string","note":"string","exercises":[{"group":"string","name":"string","sets":3,"reps":"string","rest":"string","rpe":"string","isBonus":false,"isCardio":false}]}`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Anthropic error:', JSON.stringify(data))
      return res.status(500).json({ error: data })
    }

    const text = data.content[0].text
    const clean = text.replace(/```json|```/g, '').trim()
    const workout = JSON.parse(clean)
    return res.status(200).json(workout)

  } catch (err) {
    console.error('Server error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
