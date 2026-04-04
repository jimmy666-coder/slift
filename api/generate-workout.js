export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { profile, score, muscleGroups, scoreTier, duration, trainingStyle } = req.body

  const sessionDuration = duration || profile?.duration || '60 min'
  const styleToday = trainingStyle || 'Hypertrophy'

  const prompt = `You are SLIFT, an elite AI fitness coach. Generate a personalized workout as JSON only.

USER DATA:
- Score: ${score}/10 (${scoreTier})
- Today's training style: ${styleToday} (Force = heavy strength, Hypertrophy = muscle growth, Endurance = conditioning & higher reps)
- Session duration (today): ${sessionDuration}
- Muscles: ${muscleGroups?.join(', ') || 'Full Body'}
- Profile goal (onboarding): ${profile?.goal || 'Hypertrophy'}
- Level: ${profile?.level || 'Intermediate'}
- Equipment: ${profile?.equipment?.join(', ') || 'Full Gym'}

TRAINING RULES BY TODAY'S STYLE (${styleToday}):
- Force: 3–6 reps, RPE 8–9, rest 3–5 min, prioritize heavy compounds, lower total sets
- Hypertrophy: 8–12 reps, RPE 7–8, rest 60–120s, compounds plus isolation
- Endurance: 12–20+ reps or timed intervals, RPE 6–7, rest 30–60s, circuits/supersets when appropriate

TRAINING RULES BY PROFILE GOAL (context):
- Strength-oriented goals: bias lower reps, heavier loads when score allows
- Mass Gain / Hypertrophy goals: bias volume and moderate rest
- Cut: bias density, shorter rest, supersets when score allows
- Body Recomposition: moderate volume, balanced rest

EXERCISE COUNT BY DURATION:
- 30 min: max 3 exercises + optional 5–10 min cardio at medium/high intensity
- 45 min: max 4 exercises
- 60 min: max 5 exercises + full warm-up
- 90 min: max 6 exercises + accessories + finisher
- 2h+: max 7 exercises + accessories + finisher

EXERCISE COUNT BY SCORE:
- Score 1–4: 2 light exercises + cardio bonus (10 min walk)
- Score 4–6: 3 exercises + cardio bonus (10 min light cardio)
- Score 6–7: 4 exercises + optional bonus exercise
- Score 7–8.4: 5 exercises + optional bonus exercise
- Score 8.5–10: 6 exercises + optional bonus exercise, push heavy where appropriate

Always respect BOTH duration and score rules. Use the lower exercise count if they conflict. Match intensity to today's training style (${styleToday}) and recovery score.

Respond with ONLY this JSON, no markdown, no explanation:
{"warmup":"string","note":"string","exercises":[{"group":"string","name":"string","sets":3,"reps":"string","rest":"string","rpe":"string","isBonus":false,"isCardio":false}]}`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    return res.status(500).json({ error: data })
  }

  const text = data.content[0].text
  const clean = text.replace(/```json|```/g, '').trim()
  const workout = JSON.parse(clean)

  return res.status(200).json(workout)
}
