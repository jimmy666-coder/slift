import { useState } from 'react'
import { calculateRecoveryScore } from '../utils/workoutEngine'

const SLIDERS = [
  { id: 'sleep',      label: 'Sleep quality',   hint: '1 = very poor · 10 = excellent' },
  { id: 'soreness',   label: 'Muscle soreness', hint: '1 = none · 10 = very sore' },
  { id: 'energy',     label: 'Energy level',    hint: '1 = exhausted · 10 = full energy' },
  { id: 'motivation', label: 'Motivation',      hint: '1 = zero drive · 10 = locked in' },
]

const MUSCLE_GROUPS = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core']

export function MorningCheckin({ onComplete }) {
  const [values, setValues] = useState({ sleep: 5, soreness: 5, energy: 5, motivation: 5 })
  const [selectedGroups, setSelectedGroups] = useState([])

  function toggleGroup(group) {
    setSelectedGroups(prev =>
      prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]
    )
  }

  function handleSubmit() {
    const score = calculateRecoveryScore(values.sleep, values.soreness, values.energy, values.motivation)
    onComplete({ ...values, muscleGroups: selectedGroups, score })
  }

  return (
    <div style={styles.container}>
      <p style={styles.brand}>SLIFT</p>
      <h1 style={styles.title}>How are you today?</h1>
      <div style={styles.card}>
        <p style={styles.cardLabel}>MORNING CHECK-IN</p>
        <p style={styles.cardHint}>Rate how you feel right now. Drag each slider from 1 (low) to 10 (high).</p>
        {SLIDERS.map(slider => (
          <div key={slider.id} style={styles.sliderGroup}>
            <div style={styles.sliderHeader}>
              <span style={styles.sliderLabel}>{slider.label}</span>
              <span style={styles.sliderValue}>{values[slider.id]}</span>
            </div>
            <p style={styles.sliderHint}>{slider.hint}</p>
            <input type="range" min="1" max="10" value={values[slider.id]} onChange={e => setValues(prev => ({ ...prev, [slider.id]: Number(e.target.value) }))} style={styles.slider} />
          </div>
        ))}
        <p style={styles.cardLabel}>MUSCLE GROUPS (OPTIONAL)</p>
        <p style={styles.cardHint}>Select the areas you want to train today.</p>
        <div style={styles.groupGrid}>
          {MUSCLE_GROUPS.map(group => (
            <button key={group} onClick={() => toggleGroup(group)} style={{ ...styles.groupBtn, background: selectedGroups.includes(group) ? '#7c3aed' : '#0f0f1a', border: selectedGroups.includes(group) ? '2px solid #8b5cf6' : '2px solid #2a2a4a', color: selectedGroups.includes(group) ? 'white' : '#9ca3af' }}>
              {group}
            </button>
          ))}
        </div>
        <button style={styles.button} onClick={handleSubmit}>Calculate my score</button>
      </div>
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', background: '#0f0f1a', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 20px', fontFamily: 'sans-serif' },
  brand: { color: '#8b5cf6', fontSize: '11px', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '8px' },
  title: { color: 'white', fontSize: '32px', fontWeight: '900', marginBottom: '24px', textAlign: 'center' },
  card: { background: '#16162a', border: '1px solid #2a2a4a', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '16px' },
  cardLabel: { color: '#8b5cf6', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: '700', margin: 0 },
  cardHint: { color: '#9ca3af', fontSize: '14px', margin: 0, lineHeight: '1.5' },
  sliderGroup: { display: 'flex', flexDirection: 'column', gap: '4px' },
  sliderHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  sliderLabel: { color: 'white', fontWeight: '600', fontSize: '16px' },
  sliderValue: { color: '#8b5cf6', fontWeight: '700', fontSize: '18px' },
  sliderHint: { color: '#6b7280', fontSize: '12px', margin: 0 },
  slider: { width: '100%', accentColor: '#8b5cf6', cursor: 'pointer', height: '6px' },
  groupGrid: { display: 'flex', flexWrap: 'wrap', gap: '10px' },
  groupBtn: { borderRadius: '20px', padding: '8px 16px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: 'sans-serif' },
  button: { background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '14px', padding: '16px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', marginTop: '8px', fontFamily: 'sans-serif' },
}
