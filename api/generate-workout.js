export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { profile, score, muscleGroups, scoreTier, duration, trainingStyle } = req.body

  if (score <= 3) {
    return res.status(200).json({
      warmup: "Your body needs rest today, not a workout.",
      note: "Your recovery score is critically low. Training today could lead to injury or overtraining. SLIFT strongly recommends complete rest, light walking, or gentle stretching only. Listen to your body — rest is part of the program.",
      cooldown: "Hydrate well, sleep early, and come back stronger tomorrow.",
      exercises: []
    })
  }

  const byScore = score <= 4 ? 2 : score <= 6 ? 3 : score <= 7 ? 4 : score <= 8.4 ? 5 : 6
  const byDuration = duration === '30 min' ? 2 : duration === '45 min' ? 3 : duration === '60 min' ? 4 : duration === '90 min' ? 5 : 6
  const finalCount = Math.min(byScore, byDuration)

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
- Generate EXACTLY ${finalCount} main exercises. Hard limit.
- If score is below 4: MAXIMUM 2 very light exercises, RPE 5 max, no failure, no heavy compounds. Bodyweight or very light weights only.
- Goal Strength: sets 3-5, reps 3-5, rest 3-5 min, RPE 8-9
- Goal Hypertrophy: sets 3-4, reps 8-12, rest 60-90s, RPE 7-8
- Goal Cut: sets 3, reps 12-15, rest 45-60s, RPE 7
- Score below 5: light weights, no failure
- Score above 8: push hard, progressive overload
- Bonus for score below 6: isCardio true, name "10 min light cardio or walk"
- Bonus for score above 6: isCardio false, one optional extra exercise
${score < 5 ? "Add to note: 'With a recovery score below 5, we recommend keeping your session to 30-45 min max today.'" : ""}

Respond ONLY valid JSON no markdown:
{"warmup":"string","note":"string","cooldown":"string","exercises":[{"group":"string","name":"string","sets":3,"reps":"string","rest":"string","rpe":"string","isBonus":false,"isCardio":false}]}`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await response.json()
    if (!response.ok) return res.status(500).json({ error: data })

    const text = data.content[0].text
    const clean = text.replace(/```json|```/g, '').trim()
    return res.status(200).json(JSON.parse(clean))

  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
