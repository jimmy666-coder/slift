import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

const STEPS = [
  { key: 'firstName', type: 'text', title: "What's your name?", placeholder: 'Enter your first name' },
  { key: 'age', type: 'number', title: 'How old are you?', placeholder: 'Enter your age' },
  { key: 'gender', type: 'select', title: 'What is your gender?', options: ['Male', 'Female', 'Other'] },
  { key: 'weight', type: 'unit-input', title: 'What is your weight?', placeholder: 'Enter your weight', unitsKey: 'weightUnit', units: ['kg', 'lbs'] },
  { key: 'height', type: 'unit-input', title: 'What is your height?', placeholder: 'Enter your height', unitsKey: 'heightUnit', units: ['cm', 'ft'] },
  { key: 'goal', type: 'select', title: 'What is your main goal?', options: ['Strength', 'Hypertrophy', 'Cut', 'Body Recomposition'] },
  { key: 'level', type: 'select', title: 'What is your training level?', options: ['Beginner', 'Intermediate', 'Advanced'] },
  { key: 'frequency', type: 'select', title: 'How often do you train?', options: ['2x per week', '3x per week', '4x per week', '5x per week', '6x per week'] },
  { key: 'final', type: 'final', title: "You're all set. SLIFT will adapt to you from day one." },
]

const initialForm = {
  firstName: '', age: '', gender: '', weight: '', weightUnit: 'kg',
  height: '', heightUnit: 'cm', goal: '', level: '', frequency: '',
}

export default function OnboardingScreen({ onComplete, userId }) {
  const [stepIndex, setStepIndex] = useState(0)
  const [direction, setDirection] = useState('forward')
  const [form, setForm] = useState(initialForm)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const currentStep = STEPS[stepIndex]
  const progress = useMemo(() => ((stepIndex + 1) / STEPS.length) * 100, [stepIndex])

  const updateField = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }))
    if (error) setError('')
  }

  const isCurrentStepValid = () => {
    switch (currentStep.key) {
      case 'firstName': return form.firstName.trim().length > 0
      case 'age': return Number(form.age) > 0
      case 'gender': return !!form.gender
      case 'weight': return Number(form.weight) > 0
      case 'height': return Number(form.height) > 0
      case 'goal': return !!form.goal
      case 'level': return !!form.level
      case 'frequency': return !!form.frequency
      case 'final': return true
      default: return false
    }
  }

  const handleComplete = async () => {
    setIsSaving(true)
    setError('')
    try {
      await supabase.from('tapeprofiles').upsert({
        id: userId,
        username: form.firstName,
        onboarding: form,
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
      })
      onComplete(form)
    } catch (err) {
      setError('Something went wrong while saving your onboarding.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleContinue = async () => {
    if (!isCurrentStepValid() || isSaving) return
    if (stepIndex === STEPS.length - 1) { await handleComplete(); return }
    setDirection('forward')
    setStepIndex(prev => prev + 1)
  }

  const handleBack = () => {
    if (stepIndex === 0 || isSaving) return
    setDirection('back')
    setStepIndex(prev => prev - 1)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && isCurrentStepValid()) handleContinue()
  }

  const renderOptionButton = (option, fieldKey) => {
    const selected = form[fieldKey] === option
    return (
      <button key={option} type="button" onClick={() => updateField(fieldKey, option)}
        style={{ width:'100%', background: selected ? 'linear-gradient(135deg,rgba(123,63,242,1),rgba(0,255,156,0.95))' : 'rgba(255,255,255,0.08)', border:'none', borderRadius:18, padding:1, cursor:'pointer', transition:'transform 180ms ease,box-shadow 180ms ease', boxShadow: selected ? '0 12px 36px rgba(123,63,242,0.28)' : 'none' }}
        onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'}
        onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}>
        <div style={{ width:'100%', borderRadius:17, padding:'16px 18px', background: selected ? 'linear-gradient(135deg,rgba(123,63,242,0.28),rgba(123,63,242,0.42))' : 'rgba(14,14,20,0.96)', color: selected ? '#FFFFFF' : 'rgba(255,255,255,0.88)', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
          <span style={{ fontSize:16, fontWeight:600, letterSpacing:'-0.01em', textAlign:'left' }}>{option}</span>
          <span style={{ width:18, height:18, minWidth:18, borderRadius:'50%', border: selected ? '5px solid #00FF9C' : '1px solid rgba(255,255,255,0.22)', background: selected ? '#7B3FF2' : 'transparent', transition:'all 180ms ease' }} />
        </div>
      </button>
    )
  }

  const renderInput = () => {
    const inputStyle = { width:'100%', height:60, borderRadius:18, border:'1px solid rgba(255,255,255,0.10)', background:'rgba(255,255,255,0.04)', color:'#FFFFFF', fontSize:18, fontWeight:500, outline:'none', padding:'0 18px', boxSizing:'border-box' }

    if (currentStep.type === 'text' || currentStep.type === 'number') {
      return <input autoFocus type={currentStep.type} value={form[currentStep.key]} onChange={e => updateField(currentStep.key, e.target.value)} onKeyDown={handleKeyDown} placeholder={currentStep.placeholder} style={inputStyle} />
    }

    if (currentStep.type === 'unit-input') {
      return (
        <div style={{ width:'100%', display:'flex', flexDirection:'column', gap:18 }}>
          <input autoFocus type="number" value={form[currentStep.key]} onChange={e => updateField(currentStep.key, e.target.value)} onKeyDown={handleKeyDown} placeholder={currentStep.placeholder} style={inputStyle} />
          <div style={{ display:'grid', gridTemplateColumns:`repeat(${currentStep.units.length},minmax(0,1fr))`, gap:10 }}>
            {currentStep.units.map(unit => {
              const selected = form[currentStep.unitsKey] === unit
              return (
                <button key={unit} type="button" onClick={() => updateField(currentStep.unitsKey, unit)}
                  style={{ background: selected ? 'linear-gradient(135deg,rgba(123,63,242,1),rgba(0,255,156,0.95))' : 'rgba(255,255,255,0.08)', border:'none', borderRadius:16, padding:1, cursor:'pointer' }}>
                  <div style={{ borderRadius:15, padding:'14px 16px', background: selected ? 'linear-gradient(135deg,rgba(123,63,242,0.30),rgba(123,63,242,0.42))' : 'rgba(14,14,20,0.96)', color: selected ? '#FFFFFF' : 'rgba(255,255,255,0.80)', fontSize:15, fontWeight:700 }}>{unit}</div>
                </button>
              )
            })}
          </div>
        </div>
      )
    }

    if (currentStep.type === 'select') {
      return <div style={{ width:'100%', display:'grid', gridTemplateColumns:'1fr', gap:12 }}>{currentStep.options.map(o => renderOptionButton(o, currentStep.key))}</div>
    }

    if (currentStep.type === 'final') {
      return (
        <div style={{ width:'100%', display:'flex', flexDirection:'column', gap:18, alignItems:'flex-start' }}>
          <div style={{ width:68, height:68, borderRadius:20, background:'linear-gradient(135deg,rgba(123,63,242,1),rgba(0,255,156,0.95))', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 16px 40px rgba(123,63,242,0.30)' }}>
            <span style={{ color:'#0A0A0F', fontSize:30, fontWeight:900 }}>✓</span>
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
            {[form.firstName||'Profile', form.goal||'Goal', form.level||'Level', form.frequency||'Frequency'].map((item, i) => (
              <div key={i} style={{ padding:'10px 14px', borderRadius:999, border:'1px solid rgba(255,255,255,0.10)', background:'rgba(255,255,255,0.05)', color:'rgba(255,255,255,0.88)', fontSize:14, fontWeight:600 }}>{item}</div>
            ))}
          </div>
          <p style={{ margin:0, color:'rgba(255,255,255,0.68)', fontSize:16, lineHeight:1.6 }}>Your recovery, training, and progression will be tailored around the profile you just gave.</p>
        </div>
      )
    }
    return null
  }

  return (
    <div style={{ minHeight:'100vh', width:'100%', background:'#0A0A0F', position:'relative', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', padding:'32px 20px', boxSizing:'border-box', fontFamily:'Inter, ui-sans-serif, system-ui, sans-serif' }}>
      <style>{`
        @keyframes floatOrb { 0%{transform:translate3d(0,0,0) scale(1)} 50%{transform:translate3d(0,-18px,0) scale(1.04)} 100%{transform:translate3d(0,0,0) scale(1)} }
        @keyframes pulseGlow { 0%{box-shadow:0 12px 32px rgba(123,63,242,0.28),0 0 0 rgba(0,255,156,0)} 50%{box-shadow:0 16px 42px rgba(123,63,242,0.42),0 0 30px rgba(0,255,156,0.18)} 100%{box-shadow:0 12px 32px rgba(123,63,242,0.28),0 0 0 rgba(0,255,156,0)} }
        @keyframes slideInRight { 0%{opacity:0;transform:translate3d(42px,0,0)} 100%{opacity:1;transform:translate3d(0,0,0)} }
        @keyframes slideInLeft { 0%{opacity:0;transform:translate3d(-42px,0,0)} 100%{opacity:1;transform:translate3d(0,0,0)} }
      `}</style>

      <div style={{ position:'absolute', inset:0, pointerEvents:'none', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'-10%', left:'-8%', width:320, height:320, borderRadius:'50%', background:'radial-gradient(circle,rgba(123,63,242,0.28) 0%,rgba(123,63,242,0) 72%)', filter:'blur(14px)', animation:'floatOrb 8.4s ease-in-out infinite' }} />
        <div style={{ position:'absolute', top:'18%', right:'-6%', width:280, height:280, borderRadius:'50%', background:'radial-gradient(circle,rgba(0,255,156,0.18) 0%,rgba(0,255,156,0) 72%)', filter:'blur(18px)', animation:'floatOrb 10s ease-in-out infinite' }} />
        <div style={{ position:'absolute', bottom:'-8%', left:'30%', width:360, height:360, borderRadius:'50%', background:'radial-gradient(circle,rgba(123,63,242,0.20) 0%,rgba(0,255,156,0.08) 42%,rgba(0,0,0,0) 72%)', filter:'blur(20px)', animation:'floatOrb 11.2s ease-in-out infinite' }} />
      </div>

      <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,#7B3FF2 0%,#00FF9C 100%)', boxShadow:'0 0 24px rgba(123,63,242,0.45)' }} />

      <div style={{ position:'relative', width:'100%', maxWidth:620, borderRadius:30, border:'1px solid rgba(255,255,255,0.08)', background:'linear-gradient(180deg,rgba(255,255,255,0.06) 0%,rgba(255,255,255,0.03) 100%)', backdropFilter:'blur(18px)', boxShadow:'0 30px 80px rgba(0,0,0,0.45)', padding:'28px 24px 24px', boxSizing:'border-box' }}>
        <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:16 }}>
            <div style={{ color:'rgba(255,255,255,0.28)', fontSize:18, fontWeight:800, letterSpacing:'0.18em' }}>{String(stepIndex+1).padStart(2,'0')}</div>
            <div style={{ flex:1, height:8, borderRadius:999, background:'rgba(255,255,255,0.08)', overflow:'hidden' }}>
              <div style={{ width:`${progress}%`, height:'100%', borderRadius:999, background:'linear-gradient(90deg,#7B3FF2 0%,#00FF9C 100%)', transition:'width 320ms ease', boxShadow:'0 0 18px rgba(123,63,242,0.35)' }} />
            </div>
          </div>

          <div key={`${stepIndex}-${direction}`} style={{ animation: direction==='forward' ? 'slideInRight 320ms cubic-bezier(0.22,1,0.36,1)' : 'slideInLeft 320ms cubic-bezier(0.22,1,0.36,1)', display:'flex', flexDirection:'column', gap:24, minHeight:340 }}>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <h1 style={{ margin:0, color:'#FFFFFF', fontSize:'clamp(30px,4vw,42px)', lineHeight:1.08, letterSpacing:'-0.04em', fontWeight:800, maxWidth:540 }}>{currentStep.title}</h1>
              {currentStep.type !== 'final' && <p style={{ margin:0, color:'rgba(255,255,255,0.56)', fontSize:15, lineHeight:1.5 }}>Build your profile once. Let the app do the rest.</p>}
            </div>
            <div style={{ width:'100%' }}>{renderInput()}</div>
          </div>

          {error && <div style={{ color:'#FF7B9C', fontSize:14, fontWeight:600, padding:'12px 14px', borderRadius:14, background:'rgba(255,123,156,0.10)', border:'1px solid rgba(255,123,156,0.18)' }}>{error}</div>}

          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:14, marginTop:4 }}>
            <button type="button" onClick={handleBack} disabled={stepIndex===0||isSaving}
              style={{ border:'none', background:'transparent', color: stepIndex===0||isSaving ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.52)', fontSize:15, fontWeight:700, padding:'14px 8px', cursor: stepIndex===0||isSaving ? 'not-allowed' : 'pointer' }}>
              Back
            </button>
            <button type="button" onClick={handleContinue} disabled={!isCurrentStepValid()||isSaving}
              style={{ minWidth:168, height:56, borderRadius:18, border:'none', cursor: !isCurrentStepValid()||isSaving ? 'not-allowed' : 'pointer', padding:'0 22px', color:'#FFFFFF', fontSize:16, fontWeight:800, background: !isCurrentStepValid()||isSaving ? 'linear-gradient(135deg,rgba(123,63,242,0.38),rgba(0,255,156,0.28))' : 'linear-gradient(135deg,#7B3FF2 0%,#00FF9C 100%)', opacity: !isCurrentStepValid()||isSaving ? 0.55 : 1, boxShadow: !isCurrentStepValid()||isSaving ? 'none' : '0 14px 36px rgba(123,63,242,0.32)', animation: !isCurrentStepValid()||isSaving ? 'none' : 'pulseGlow 2s ease-in-out infinite' }}
              onMouseEnter={e => { if(!isCurrentStepValid()||isSaving) return; e.currentTarget.style.transform='translateY(-2px)' }}
              onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}>
              {isSaving ? 'Saving...' : stepIndex===STEPS.length-1 ? 'Start training' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
