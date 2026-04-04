export async function generateWorkoutWithAI({ profile, score, muscleGroups, scoreTier, duration, trainingStyle }) {
  const response = await fetch('/api/generate-workout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profile, score, muscleGroups, scoreTier, duration, trainingStyle }),
  })

  const rawText = await response.text()
  if (!response.ok) {
    throw new Error(`API ${response.status}: ${rawText}`)
  }

  return JSON.parse(rawText)
}
