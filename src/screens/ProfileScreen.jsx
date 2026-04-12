import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const initialProfile = {
  firstName: '', nickname: '', country: '', birthDate: '',
  gender: '', weight: '', weightUnit: 'kg', height: '', heightUnit: 'cm',
  goal: '', level: '', frequency: '', equipment: '',
  medicalHistory: '', strengthsWeaknesses: '',
}

export default function ProfileScreen({ userId, onBack }) {
  const [profile, setProfile] = useState(initialProfile)
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => { loadProfile() }, [userId])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const { data: p, error } = await supabase.from('tapeprofiles').select('*').eq('id', userId).single()
      if (error) throw error
      setProfile({
        firstName: p?.username || '', nickname: p?.nickname || '',
        country: p?.country || '', birthDate: p?.birth_date || '',
        gender: p?.gender || '', weight: p?.weight || '',
        weightUnit: p?.weight_unit || 'kg', height: p?.height || '',
        heightUnit: p?.height_unit || 'cm', goal: p?.goal || '',
        level: p?.level || '', frequency: p?.frequency || '',
        equipment: p?.equipment || '', medicalHistory: p?.medical_history || '',
        strengthsWeaknesses: p?.strengths || '',
      })
    } catch (err) {
      setError('Unable to load profile.')
    } finally {
      setLoading(false)
    }
  }

  const saveProfile = async () => {
    try {
      setIsSaving(true); setError(''); setSuccessMessage('')
      const { error } = await supabase.from('tapeprofiles').update({
        nickname: profile.nickname, country: profile.country,
        birth_date: profile.birthDate, gender: profile.gender,
        weight: profile.weight, weight_unit: profile.weightUnit,
        height: profile.height, height_unit: profile.heightUnit,
        goal: profile.goal, level: profile.level,
        frequency: profile.frequency, equipment: profile.equipment,
        medical_history: profile.medicalHistory, strengths: profile.strengthsWeaknesses,
      }).eq('id', userId)
      if (error) throw error
      setSuccessMessage('Profile updated ✓')
    } catch (err) {
      setError('Unable to update profile.')
    } finally {
      setIsSaving(false)
    }
  }

  const updateField = (key, value) => {
    setProfile(prev => ({ ...prev, [key]: value }))
    if (error) setError('')
    if (successMessage) setSuccessMessage('')
  }

  const labelStyle = { color:'rgba(255,255,255,0.58)', fontSize:13, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase' }
  const inputStyle = { width:'100%', height:56, borderRadius:16, border:'1px solid rgba(255,255,255,0.10)', background:'rgba(255,255,255,0.04)', color:'#FFFFFF', fontSize:16, fontWeight:500, outline:'none', padding:'0 18px', boxSizing:'border-box' }
  const textareaStyle = { width:'100%', borderRadius:16, border:'1px solid rgba(255,255,255,0.10)', background:'rgba(255,255,255,0.04)', color:'#FFFFFF', fontSize:15, fontWeight:500, outline:'none', padding:'16px 18px', boxSizing:'border-box', resize:'vertical', lineHeight:1.6 }

  const renderSelectButtons = (field, options) => (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:10 }}>
      {options.map(option => {
        const selected = profile[field] === option
        return (
          <button key={option} type="button" onClick={() => updateField(field, option)}
            style={{ background: selected ? 'linear-gradient(135deg,rgba(123,63,242,1),rgba(0,255,156,0.95))' : 'rgba(255,255,255,0.08)', border:'none', borderRadius:16, padding:1, cursor:'pointer', boxShadow: selected ? '0 10px 26px rgba(123,63,242,0.25)' : 'none' }}>
            <div style={{ borderRadius:15, padding:'14px 16px', background: selected ? 'linear-gradient(135deg,rgba(123,63,242,0.30),rgba(123,63,242,0.42))' : 'rgba(14,14,20,0.96)', color: selected ? '#FFFFFF' : 'rgba(255,255,255,0.84)', fontSize:15, fontWeight:700, textAlign:'center' }}>{option}</div>
          </button>
        )
      })}
    </div>
  )

  const renderUnitButtons = (field, options) => (
    <div style={{ display:'grid', gridTemplateColumns:`repeat(${options.length},minmax(0,1fr))`, gap:10 }}>
      {options.map(option => {
        const selected = profile[field] === option
        return (
          <button key={option} type="button" onClick={() => updateField(field, option)}
            style={{ background: selected ? 'linear-gradient(135deg,rgba(123,63,242,1),rgba(0,255,156,0.95))' : 'rgba(255,255,255,0.08)', border:'none', borderRadius:14, padding:1, cursor:'pointer' }}>
            <div style={{ borderRadius:13, padding:'12px 14px', background: selected ? 'linear-gradient(135deg,rgba(123,63,242,0.30),rgba(123,63,242,0.42))' : 'rgba(14,14,20,0.96)', color: selected ? '#FFFFFF' : 'rgba(255,255,255,0.80)', fontSize:14, fontWeight:700, textAlign:'center' }}>{option}</div>
          </button>
        )
      })}
    </div>
  )

  const avatarLetter = (profile.nickname || profile.firstName || 'S').charAt(0).toUpperCase()

  return (
    <div style={{ minHeight:'100vh', width:'100%', background:'#0A0A0F', position:'relative', overflow:'hidden', fontFamily:'Inter, ui-sans-serif, system-ui, sans-serif' }}>
      <style>{`
        @keyframes floatOrb { 0%{transform:translate3d(0,0,0) scale(1)} 50%{transform:translate3d(0,-18px,0) scale(1.04)} 100%{transform:translate3d(0,0,0) scale(1)} }
        @keyframes fadeUp { 0%{opacity:0;transform:translateY(16px)} 100%{opacity:1;transform:translateY(0)} }
        @keyframes pulseGlow { 0%{box-shadow:0 12px 32px rgba(123,63,242,0.28),0 0 0 rgba(0,255,156,0)} 50%{box-shadow:0 16px 42px rgba(123,63,242,0.42),0 0 30px rgba(0,255,156,0.18)} 100%{box-shadow:0 12px 32px rgba(123,63,242,0.28),0 0 0 rgba(0,255,156,0)} }
      `}</style>

      <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,#7B3FF2 0%,#00FF9C 100%)', boxShadow:'0 0 24px rgba(123,63,242,0.45)' }} />
      <div style={{ position:'absolute', top:'-10%', left:'-8%', width:320, height:320, borderRadius:'50%', background:'radial-gradient(circle,rgba(123,63,242,0.28) 0%,rgba(123,63,242,0) 72%)', filter:'blur(14px)', animation:'floatOrb 8.4s ease-in-out infinite', pointerEvents:'none' }} />
      <div style={{ position:'absolute', top:'18%', right:'-6%', width:280, height:280, borderRadius:'50%', background:'radial-gradient(circle,rgba(0,255,156,0.18) 0%,rgba(0,255,156,0) 72%)', filter:'blur(18px)', animation:'floatOrb 10s ease-in-out infinite', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:'-8%', left:'30%', width:360, height:360, borderRadius:'50%', background:'radial-gradient(circle,rgba(123,63,242,0.20) 0%,rgba(0,255,156,0.08) 42%,rgba(0,0,0,0) 72%)', filter:'blur(20px)', animation:'floatOrb 11.2s ease-in-out infinite', pointerEvents:'none' }} />

      <div style={{ position:'relative', zIndex:2, width:'100%', maxWidth:860, margin:'0 auto', padding:'24px 20px 48px', boxSizing:'border-box' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, marginBottom:24, animation:'fadeUp 420ms cubic-bezier(0.22,1,0.36,1)' }}>
          <button type="button" onClick={onBack} style={{ border:'1px solid rgba(255,255,255,0.08)', background:'rgba(255,255,255,0.04)', color:'rgba(255,255,255,0.72)', height:42, padding:'0 16px', borderRadius:14, fontSize:14, fontWeight:700, cursor:'pointer' }}>Back</button>
          <div style={{ color:'#FFFFFF', fontSize:'clamp(28px,4vw,40px)', fontWeight:800, letterSpacing:'-0.04em', textAlign:'center' }}>My Profile</div>
          <div style={{ width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,#7B3FF2 0%,#00FF9C 100%)', display:'flex', alignItems:'center', justifyContent:'center', color:'#FFFFFF', fontWeight:900, fontSize:18 }}>S</div>
        </div>

        <div style={{ width:'100%', borderRadius:28, border:'1px solid rgba(255,255,255,0.08)', background:'linear-gradient(180deg,rgba(18,18,26,0.98) 0%,rgba(18,18,26,0.92) 100%)', boxShadow:'0 24px 80px rgba(0,0,0,0.42)', padding:24, boxSizing:'border-box', display:'flex', flexDirection:'column', gap:22, animation:'fadeUp 480ms cubic-bezier(0.22,1,0.36,1)' }}>
          {loading ? (
            <div style={{ minHeight:320, display:'flex', alignItems:'center', justifyContent:'center', color:'#9ca3af', fontSize:16 }}>Loading profile...</div>
          ) : (
            <>
              <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:4 }}>
                <div style={{ width:62, height:62, borderRadius:'50%', background:'linear-gradient(135deg,#7B3FF2 0%,#00FF9C 100%)', display:'flex', alignItems:'center', justifyContent:'center', color:'#FFFFFF', fontSize:26, fontWeight:900, boxShadow:'0 14px 32px rgba(123,63,242,0.28)' }}>{avatarLetter}</div>
                <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                  <div style={{ color:'#FFFFFF', fontSize:24, fontWeight:800, letterSpacing:'-0.03em' }}>{profile.nickname || profile.firstName || 'Your profile'}</div>
                  <div style={{ color:'#9ca3af', fontSize:14, lineHeight:1.5 }}>Keep this up to date so SLIFT adapts perfectly to you.</div>
                </div>
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <label style={labelStyle}>First name</label>
                <input value={profile.firstName} readOnly style={{ ...inputStyle, background:'rgba(255,255,255,0.03)', color:'rgba(255,255,255,0.38)', cursor:'not-allowed', border:'1px solid rgba(255,255,255,0.08)' }} />
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:16 }}>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  <label style={labelStyle}>Nickname</label>
                  <input value={profile.nickname} onChange={e=>updateField('nickname',e.target.value)} placeholder="Preferred name" style={inputStyle} />
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  <label style={labelStyle}>Country</label>
                  <input value={profile.country} onChange={e=>updateField('country',e.target.value)} placeholder="Country" style={inputStyle} />
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  <label style={labelStyle}>Birth date</label>
                  <input type="date" value={profile.birthDate} onChange={e=>updateField('birthDate',e.target.value)} style={{ ...inputStyle, colorScheme:'dark' }} />
                </div>
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <label style={labelStyle}>Gender</label>
                {renderSelectButtons('gender', ['Male','Female','Other'])}
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:16 }}>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  <label style={labelStyle}>Weight</label>
                  <input type="number" value={profile.weight} onChange={e=>updateField('weight',e.target.value)} placeholder="Weight" style={inputStyle} />
                  {renderUnitButtons('weightUnit', ['kg','lbs'])}
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  <label style={labelStyle}>Height</label>
                  <input type="number" value={profile.height} onChange={e=>updateField('height',e.target.value)} placeholder="Height" style={inputStyle} />
                  {renderUnitButtons('heightUnit', ['cm','ft'])}
                </div>
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <label style={labelStyle}>Goal</label>
                {renderSelectButtons('goal', ['Strength','Hypertrophy','Cut','Body Recomposition'])}
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:16 }}>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  <label style={labelStyle}>Level</label>
                  {renderSelectButtons('level', ['Beginner','Intermediate','Advanced'])}
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  <label style={labelStyle}>Frequency</label>
                  {renderSelectButtons('frequency', ['2x per week','3x per week','4x per week','5x per week','6x per week'])}
                </div>
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <label style={labelStyle}>Equipment</label>
                {renderSelectButtons('equipment', ['Full gym','Home gym','Minimal equipment','No equipment'])}
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <label style={labelStyle}>Medical history</label>
                <textarea value={profile.medicalHistory} onChange={e=>updateField('medicalHistory',e.target.value)} placeholder='e.g. lower back pain, knee injury... or "None"' rows={4} style={textareaStyle} />
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <label style={labelStyle}>Strengths & weaknesses</label>
                <textarea value={profile.strengthsWeaknesses} onChange={e=>updateField('strengthsWeaknesses',e.target.value)} placeholder="e.g. strong chest, weak lower back..." rows={4} style={textareaStyle} />
              </div>

              {(error || successMessage) && (
                <div style={{ color: successMessage ? '#00FF9C' : '#FF7B9C', fontSize:14, fontWeight:700 }}>{successMessage || error}</div>
              )}

              <button type="button" onClick={saveProfile} disabled={isSaving}
                style={{ width:'100%', height:58, borderRadius:18, border:'none', cursor:isSaving?'not-allowed':'pointer', color:'#FFFFFF', fontSize:16, fontWeight:800, background:'linear-gradient(135deg,#7B3FF2 0%,#00FF9C 100%)', boxShadow:'0 14px 36px rgba(123,63,242,0.32)', opacity:isSaving?0.65:1, animation:isSaving?'none':'pulseGlow 2s ease-in-out infinite' }}
                onMouseEnter={e=>{ if(!isSaving) e.currentTarget.style.transform='translateY(-2px)' }}
                onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}>
                {isSaving ? 'Saving...' : 'Save profile'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
