export async function generateWorkoutWithAI({ profile, score, muscleGroups, scoreTier, duration, trainingStyle }) {
  const response = await fetch('/api/generate-workout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profile, score, muscleGroups, scoreTier, duration, trainingStyle }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`API error: ${err}`)
  }

  return await response.json()
}
