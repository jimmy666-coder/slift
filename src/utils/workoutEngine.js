// src/utils/workoutEngine.js
// SLIFT Workout Engine v3.0

const EXERCISE_DB = {
  Chest: {
    type: 'large',
    exercises: [
      { name: 'Barbell Bench Press' },
      { name: 'Incline Dumbbell Press' },
      { name: 'Cable Fly' },
      { name: 'Dips (chest focus)' },
      { name: 'Decline Barbell Press' },
      { name: 'Pec Deck Machine' },
      { name: 'Push-up variations' },
    ],
  },
  Back: {
    type: 'large',
    exercises: [
      { name: 'Barbell Row' },
      { name: 'Pull-ups / Lat Pulldown' },
      { name: 'Seated Cable Row' },
      { name: 'Single Arm Dumbbell Row' },
      { name: 'Face Pulls' },
      { name: 'Deadlift' },
      { name: 'Chest-Supported Row' },
    ],
  },
  Legs: {
    type: 'large',
    exercises: [
      { name: 'Barbell Squat' },
      { name: 'Romanian Deadlift' },
      { name: 'Leg Press' },
      { name: 'Walking Lunges' },
      { name: 'Leg Curl' },
      { name: 'Leg Extension' },
      { name: 'Calf Raises' },
    ],
  },
  Shoulders: {
    type: 'small',
    exercises: [
      { name: 'Overhead Press (Barbell or Dumbbell)' },
      { name: 'Lateral Raises' },
      { name: 'Rear Delt Fly' },
      { name: 'Front Raises' },
      { name: 'Arnold Press' },
      { name: 'Upright Row' },
    ],
  },
  Arms: {
    type: 'small',
    exercises: [
      { name: 'Barbell Curl' },
      { name: 'Tricep Pushdown' },
      { name: 'Hammer Curl' },
      { name: 'Skull Crushers' },
      { name: 'Concentration Curl' },
      { name: 'Overhead Tricep Extension' },
    ],
  },
  Core: {
    type: 'small',
    exercises: [
      { name: 'Plank' },
      { name: 'Cable Crunch' },
      { name: 'Hanging Leg Raise' },
      { name: 'Ab Wheel Rollout' },
      { name: 'Russian Twist' },
      { name: 'Dead Bug' },
    ],
  },
}

function getIntensity(score) {
  if (score <= 4)   return { sets: 2, reps: '15',    rest: '2 min',   rpe: '5-6' }
  if (score <= 6)   return { sets: 3, reps: '12-15', rest: '90 sec',  rpe: '6-7' }
  if (score <= 7)   return { sets: 3, reps: '10-12', rest: '90 sec',  rpe: '7'   }
  if (score <= 8.4) return { sets: 4, reps: '8-10',  rest: '2 min',   rpe: '7-8' }
  return                   { sets: 5, reps: '6-8',   rest: '2-3 min', rpe: '8-9' }
}

function getExerciseCount(score) {
  if (score <= 4)   return 2
  if (score <= 6)   return 3
  if (score <= 7)   return 4
  if (score <= 8.4) return 5
  return 6
}

function distributeExercises(muscleGroups, totalCount) {
  if (!muscleGroups || muscleGroups.length === 0) return {}
  if (muscleGroups.length === 1) return { [muscleGroups[0]]: totalCount }
  const distribution = {}
  muscleGroups.forEach(group => {
    distribution[group] = EXERCISE_DB[group]?.type === 'large' ? 2 : 1
  })
  let remaining = totalCount - Object.values(distribution).reduce((a, b) => a + b, 0)
  const large = muscleGroups.filter(g => EXERCISE_DB[g]?.type === 'large')
  const small = muscleGroups.filter(g => EXERCISE_DB[g]?.type === 'small')
  const priority = [...large, ...small]
  let i = 0
  while (remaining > 0) {
    distribution[priority[i % priority.length]]++
    remaining--
    i++
  }
  return distribution
}

export function getWorkoutExercises(score, muscleGroups) {
  const intensity = getIntensity(score)
  const totalCount = getExerciseCount(score)
  const distribution = distributeExercises(muscleGroups, totalCount)
  const exercises = []
  Object.entries(distribution).forEach(([group, count]) => {
    const db = EXERCISE_DB[group]
    if (!db) return
    db.exercises.slice(0, count).forEach(ex => {
      exercises.push({ group, name: ex.name, sets: intensity.sets, reps: intensity.reps, rest: intensity.rest, rpe: intensity.rpe, isBonus: false, isCardio: false })
    })
  })
  if (score <= 4) {
    exercises.push({ group: 'Bonus', name: '10 min walk or light stretching', sets: null, reps: null, rest: null, rpe: null, isBonus: true, isCardio: true })
  } else if (score <= 6) {
    exercises.push({ group: 'Bonus', name: '10 min light cardio or stretching', sets: null, reps: null, rest: null, rpe: null, isBonus: true, isCardio: true })
  } else {
    const firstGroup = muscleGroups?.[0]
    const db = firstGroup ? EXERCISE_DB[firstGroup] : null
    if (db) {
      const usedCount = distribution[firstGroup] || 0
      const bonusEx = db.exercises[usedCount] ?? db.exercises[db.exercises.length - 1]
      exercises.push({ group: firstGroup, name: bonusEx.name, sets: intensity.sets, reps: intensity.reps, rest: intensity.rest, rpe: intensity.rpe, isBonus: true, isCardio: false })
    }
  }
  return exercises
}

export function getScoreTier(score) {
  if (score <= 4)   return { label: 'Critical', color: '#ef4444', note: 'Your body needs rest. Keep it very light today.' }
  if (score <= 6)   return { label: 'Low',      color: '#f97316', note: 'Ease in. Protect your gains. Stay controlled.' }
  if (score <= 7)   return { label: 'Moderate', color: '#eab308', note: "You're ready to work. Stay technical." }
  if (score <= 8.4) return { label: 'Good',     color: '#22c55e', note: 'Strong session ahead. Push the loads progressively.' }
  return                   { label: 'Peak',     color: '#8b5cf6', note: "You're at your best. Make every set count." }
}

export function calculateRecoveryScore(sleep, soreness, energy, motivation) {
  const score = sleep * 0.40 + (10 - soreness) * 0.25 + energy * 0.25 + motivation * 0.10
  return Math.round(score * 10) / 10
}
