import { useState } from 'react'
import { supabase } from '../lib/supabase'

const STEPS = [
  { id: 'name',      question: "What's your name?",                    type: 'text',       placeholder: 'Your first name' },
  { id: 'age',       question: 'How old are you?',                     type: 'number',     placeholder: 'Your age' },
  { id: 'gender',    question: "What's your gender?",                  type: 'choice',     options: ['Male', 'Female', 'Prefer not to say'] },
  { id: 'weight',    question: "What's your weight? (optional)",       type: 'number_opt', placeholder: 'kg' },
  { id: 'goal',      question: "What's your main goal?",               type: 'choice',     options: ['Mass Gain', 'Cut', 'Strength', 'Body Recomposition'] },
  { id: 'level',     question: "What's your training level?",          type: 'choice',     options: ['Beginner', 'Intermediate', 'Advanced'] },
  { id: 'frequency', question: 'How many days per week do you train?', type: 'choice',     options: ['2', '3', '4', '5', '6', '7'] },
  { id: 'duration',  question: 'How long is each session?',            type: 'choice',     options: ['30 min', '45 min', '60 min', '90 min', '2h+'] },
  { id: 'equipment', question: 'What equipment do you have?',          type: 'multi',      options: ['Full Gym', 'Dumbbells', 'Barbell & Rack', 'Resistance Bands', 'No Equipment', 'Other'] },
]

export function OnboardingScreen({ userId, onComplete }) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [textVal, setTextVal] = useState('')
  const [multiSel, setMultiSel] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const current = STEPS[step]
  const progress = ((step + 1) / STEPS.length) * 100

  function handleChoice(option) {
    const newAnswers = { ...answers, [current.id]: option }
    setAnswers(newAnswers)
    if (step < STEPS.length - 1) setStep(s => s + 1)
    else handleFinish(newAnswers)
  }

  function toggleMulti(option) {
    setMultiSel(prev => prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option])
  }

  async function handleNext() {
    const newAnswers = { ...answers }
    if (current.type === 'text' || current.type === 'number') {
      if (!textVal.trim()) return
      newAnswers[current.id] = textVal
    } else if (current.type === 'number_opt') {
      newAnswers[current.id] = textVal || null
    } else if (current.type === 'multi') {
      newAnswers[current.id] = multiSel
    }
    setAnswers(newAnswers)
    setTextVal('')
    setMultiSel([])
    if (step < STEPS.length - 1) setStep(s => s + 1)
    else await handleFinish(newAnswers)
  }

  async function handleFinish(finalAnswers) {
    if (!userId) {
      setError('You must be signed in to finish onboarding.')
      return
    }
    setSaving(true)
    setError('')
    const { error } = await supabase.from('tapeprofiles').upsert({
      id: userId,
      onboarding: finalAnswers,
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString(),
      username: finalAnswers.name || '',
    })
    if (error) {
      setError(error.message)
      setSaving(false)
      return
    }
    try {
      await onComplete?.()
    } catch (e) {
      setError(e?.message || 'Could not continue. Please try again.')
      setSaving(false)
      return
    }
    setSaving(false)
  }

  return (
    <div style={styles.container}>
      <div style={styles.progressBg}>
        <div style={{ ...styles.progressFill, width: `${progress}%` }} />
      </div>
      <p style={styles.stepCount}>Step {step + 1} of {STEPS.length}</p>
      <p style={styles.brand}>SLIFT</p>
      <h1 style={styles.question}>{current.question}</h1>

      {(current.type === 'text' || current.type === 'number' || current.type === 'number_opt') && (
        <div style={styles.inputGroup}>
          <input style={styles.input} type={current.type === 'text' ? 'text' : 'number'} placeholder={current.placeholder} value={textVal} onChange={e => setTextVal(e.target.value)} />
          {current.type === 'number_opt' && <button style={styles.skipBtn} onClick={handleNext}>Skip</button>}
          <button style={styles.button} onClick={handleNext}>Continue →</button>
        </div>
      )}

      {current.type === 'choice' && (
        <div style={styles.choiceGrid}>
          {current.options.map(opt => (
            <button key={opt} style={{ ...styles.choiceBtn, background: answers[current.id] === opt ? '#7c3aed' : '#16162a', border: answers[current.id] === opt ? '2px solid #8b5cf6' : '2px solid #2a2a4a' }} onClick={() => handleChoice(opt)}>
              {opt}
            </button>
          ))}
        </div>
      )}

      {current.type === 'multi' && (
        <>
          <p style={styles.hint}>Select all that apply</p>
          <div style={styles.choiceGrid}>
            {current.options.map(opt => (
              <button key={opt} style={{ ...styles.choiceBtn, background: multiSel.includes(opt) ? '#7c3aed' : '#16162a', border: multiSel.includes(opt) ? '2px solid #8b5cf6' : '2px solid #2a2a4a' }} onClick={() => toggleMulti(opt)}>
                {multiSel.includes(opt) ? '✓ ' : ''}{opt}
              </button>
            ))}
          </div>
          {error && <p style={{ color: '#ef4444', fontSize: '13px', fontFamily: 'sans-serif' }}>{error}</p>}
          <button style={styles.button} onClick={handleNext} disabled={saving}>{saving ? 'Saving...' : 'Finish →'}</button>
        </>
      )}

      {step > 0 && <button style={styles.backBtn} onClick={() => setStep(s => s - 1)}>← Back</button>}
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', background: '#0f0f1a', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 20px', fontFamily: 'sans-serif' },
  progressBg: { width: '100%', maxWidth: '480px', height: '4px', background: '#1e1e3a', borderRadius: '2px', marginBottom: '12px' },
  progressFill: { height: '100%', background: '#8b5cf6', borderRadius: '2px', transition: 'width 0.3s ease' },
  stepCount: { color: '#8b5cf6', fontSize: '12px', letterSpacing: '2px', marginBottom: '24px', alignSelf: 'flex-end', maxWidth: '480px', width: '100%' },
  brand: { color: '#8b5cf6', fontSize: '11px', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '12px' },
  question: { color: 'white', fontSize: '28px', fontWeight: '900', textAlign: 'center', marginBottom: '32px', maxWidth: '480px', lineHeight: '1.3' },
  inputGroup: { width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '12px' },
  input: { background: '#16162a', border: '2px solid #2a2a4a', borderRadius: '12px', padding: '16px', color: 'white', fontSize: '18px', outline: 'none', fontFamily: 'sans-serif', textAlign: 'center' },
  button: { background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '12px', padding: '16px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', fontFamily: 'sans-serif' },
  skipBtn: { background: 'transparent', color: '#6b7280', border: 'none', fontSize: '14px', cursor: 'pointer', fontFamily: 'sans-serif', textDecoration: 'underline' },
  choiceGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', width: '100%', maxWidth: '480px', marginBottom: '20px' },
  choiceBtn: { color: 'white', borderRadius: '14px', padding: '18px 12px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', fontFamily: 'sans-serif' },
  hint: { color: '#9ca3af', fontSize: '13px', marginBottom: '16px' },
  backBtn: { background: 'transparent', color: '#6b7280', border: 'none', fontSize: '14px', cursor: 'pointer', marginTop: '16px', fontFamily: 'sans-serif' },
}
