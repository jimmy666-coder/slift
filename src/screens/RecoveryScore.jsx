import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { getScoreTier } from '../utils/workoutEngine'

export function RecoveryScore({ checkinData, userId, onContinue }) {
  const { score, sleep, soreness, energy, motivation, muscleGroups } = checkinData
  const tier = getScoreTier(score)

  useEffect(() => {
    async function saveScore() {
      await supabase.from('recovery_score').insert({
        user_id: userId,
        score,
        sleep,
        soreness,
        energy,
        motivation,
        muscle_groups: muscleGroups?.join(', ') || '',
      })
    }
    saveScore()
  }, [])

  return (
    <div style={styles.container}>
      <p style={styles.brand}>SLIFT</p>
      <h1 style={styles.title}>Your readiness</h1>
      <div style={{ ...styles.card, borderColor: tier.color + '40' }}>
        <p style={styles.cardLabel}>RECOVERY SCORE</p>
        <p style={{ ...styles.score, color: tier.color }}>
          {score}<span style={styles.scoreMax}>/10</span>
        </p>
        <div style={{ ...styles.badge, background: tier.color + '20', border: `1px solid ${tier.color}40` }}>
          <span style={{ color: tier.color, fontWeight: '700', fontSize: '13px' }}>{tier.label}</span>
        </div>
        <p style={styles.note}>{tier.note}</p>
        <p style={styles.footnote}>Based on sleep quality, muscle recovery, energy & motivation</p>
        <button style={{ ...styles.button, background: tier.color }} onClick={onContinue}>
          See today's workout →
        </button>
      </div>
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', background: '#0f0f1a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 20px', fontFamily: 'sans-serif' },
  brand: { color: '#8b5cf6', fontSize: '11px', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '8px' },
  title: { color: 'white', fontSize: '32px', fontWeight: '900', marginBottom: '24px' },
  card: { background: '#16162a', border: '2px solid', borderRadius: '24px', padding: '36px 28px', width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' },
  cardLabel: { color: '#8b5cf6', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: '700', margin: 0 },
  score: { fontSize: '72px', fontWeight: '900', margin: 0, lineHeight: 1 },
  scoreMax: { fontSize: '28px', color: '#6b7280', fontWeight: '400' },
  badge: { borderRadius: '20px', padding: '6px 16px' },
  note: { color: 'white', fontSize: '16px', textAlign: 'center', lineHeight: '1.5', margin: 0 },
  footnote: { color: '#4b5563', fontSize: '12px', textAlign: 'center', margin: 0, fontStyle: 'italic' },
  button: { color: 'white', border: 'none', borderRadius: '14px', padding: '16px 32px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', width: '100%', fontFamily: 'sans-serif', marginTop: '8px' },
}
