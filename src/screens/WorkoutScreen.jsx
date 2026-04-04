import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getScoreTier, getWorkoutExercises } from '../utils/workoutEngine'
import { generateWorkoutWithAI } from '../utils/claudeAI'

export function WorkoutScreen({ checkinData, profile, onReset }) {
  const { score, muscleGroups, duration, trainingStyle } = checkinData
  const tier = getScoreTier(score)
  const [workout, setWorkout] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      console.log('Calling Claude API...')
      await new Promise(r => setTimeout(r, 3000))
      console.log('Profile:', profile)
      try {
        const result = await generateWorkoutWithAI({
          profile,
          score,
          muscleGroups,
          scoreTier: tier.label,
          duration,
          trainingStyle,
        })
        setWorkout(result)
      } catch (err) {
        console.error('AI failed, using static:', err)
        const exercises = getWorkoutExercises(score, muscleGroups)
        setWorkout({
          warmup: '8-10 min full-body warm-up: light cardio, dynamic stretches.',
          note: tier.note,
          exercises,
        })
      }
      setLoading(false)
    }
    load()
  }, [profile, score, muscleGroups, duration, trainingStyle, tier.label])

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.reload()
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f0f1a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px' }}>
        <div style={{ width: '48px', height: '48px', border: '4px solid #2a2a4a', borderTop: '4px solid #8b5cf6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'white', fontSize: '20px', fontWeight: '700', fontFamily: 'sans-serif' }}>SLIFT is building your session...</p>
        <p style={{ color: '#8b5cf6', fontSize: '13px', letterSpacing: '2px', fontFamily: 'sans-serif' }}>POWERED BY AI</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  const mainExercises = workout.exercises.filter(e => !e.isBonus)
  const bonus = workout.exercises.find(e => e.isBonus)

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.brand}>SLIFT</span>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button style={styles.resetBtn} onClick={onReset}>New check-in</button>
          <button style={styles.logoutBtn} onClick={handleLogout}>Log out</button>
        </div>
      </div>
      <h1 style={styles.title}>Today's session</h1>
      <div style={{ ...styles.card, borderColor: tier.color + '30' }}>
        <p style={{ ...styles.tierLabel, color: tier.color }}>{tier.label.toUpperCase()} · TODAY'S SESSION</p>
        <h2 style={styles.focus}>{muscleGroups?.length > 0 ? muscleGroups.join(' + ') : 'Full Body'}</h2>
        <p style={styles.scoreNote}>Adapted from your recovery score of <strong style={{ color: tier.color }}>{score}</strong>/10.</p>
        <p style={styles.intensityNote}>{workout.note}</p>
        <p style={styles.sectionLabel}>WARM-UP</p>
        <p style={styles.warmupText}>{workout.warmup}</p>
        <p style={styles.sectionLabel}>MAIN WORK</p>
        {mainExercises.map((ex, i) => (
          <div key={i} style={styles.exerciseCard}>
            <p style={styles.exerciseGroup}>{ex.group?.toUpperCase()}</p>
            <p style={styles.exerciseName}>{ex.name}</p>
            <p style={styles.exerciseDetails}>{ex.sets} sets x {ex.reps} @ RPE {ex.rpe} · rest {ex.rest}</p>
          </div>
        ))}
        {bonus && (
          <>
            <p style={styles.sectionLabel}>{bonus.isCardio ? 'RECOVERY' : 'BONUS 💪'}</p>
            <div style={{ ...styles.exerciseCard, borderColor: '#8b5cf620', background: '#0f0f1a' }}>
              {!bonus.isCardio && <p style={{ ...styles.exerciseGroup, color: '#8b5cf6' }}>OPTIONAL — only if you still have energy</p>}
              <p style={styles.exerciseName}>{bonus.name}</p>
              {!bonus.isCardio && <p style={styles.exerciseDetails}>{bonus.sets} sets x {bonus.reps} @ RPE {bonus.rpe} · rest {bonus.rest}</p>}
            </div>
          </>
        )}
        <p style={styles.sectionLabel}>COOL-DOWN</p>
        <p style={styles.warmupText}>5-8 min easy movement, light stretching, water and protein within the next few hours.</p>
      </div>
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', background: '#0f0f1a', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 20px 40px', fontFamily: 'sans-serif' },
  header: { width: '100%', maxWidth: '480px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  brand: { color: '#8b5cf6', fontSize: '11px', letterSpacing: '4px', textTransform: 'uppercase' },
  resetBtn: { background: 'transparent', color: '#8b5cf6', border: '1px solid #8b5cf640', borderRadius: '20px', padding: '8px 16px', fontSize: '13px', cursor: 'pointer', fontFamily: 'sans-serif' },
  logoutBtn: { background: 'transparent', color: '#ef4444', border: '1px solid #ef444440', borderRadius: '20px', padding: '8px 16px', fontSize: '13px', cursor: 'pointer', fontFamily: 'sans-serif' },
  title: { color: 'white', fontSize: '28px', fontWeight: '900', marginBottom: '20px' },
  card: { background: '#16162a', border: '2px solid', borderRadius: '24px', padding: '28px', width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '14px' },
  tierLabel: { fontSize: '11px', letterSpacing: '2px', fontWeight: '700', margin: 0 },
  focus: { color: 'white', fontSize: '26px', fontWeight: '900', margin: 0 },
  scoreNote: { color: '#9ca3af', fontSize: '14px', margin: 0 },
  intensityNote: { color: '#d1d5db', fontSize: '14px', margin: 0, lineHeight: '1.5', fontStyle: 'italic' },
  sectionLabel: { color: '#8b5cf6', fontSize: '11px', letterSpacing: '2px', fontWeight: '700', margin: '8px 0 0' },
  warmupText: { color: '#9ca3af', fontSize: '14px', margin: 0, lineHeight: '1.6' },
  exerciseCard: { background: '#0f0f2a', border: '1px solid #2a2a4a', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' },
  exerciseGroup: { color: '#8b5cf6', fontSize: '10px', letterSpacing: '2px', fontWeight: '700', margin: 0 },
  exerciseName: { color: 'white', fontSize: '17px', fontWeight: '700', margin: 0 },
  exerciseDetails: { color: '#9ca3af', fontSize: '13px', margin: 0 },
}
