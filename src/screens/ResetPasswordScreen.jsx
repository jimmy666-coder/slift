import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function ResetPasswordScreen({ onComplete }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) setError('Invalid or expired reset link.')
    })
  }, [])

  const handleUpdatePassword = async () => {
    setError('')
    if (!password || !confirm) { setError('Please fill in both password fields.'); return }
    if (password !== confirm) { setError('Passwords do not match'); return }
    try {
      setLoading(true)
      const { error } = await supabase.auth.updateUser({ password })
      if (error) { setError(error.message); return }
      onComplete()
    } catch (err) {
      setError(err?.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight:'100vh', background:'#0A0A0F', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px', position:'relative', overflow:'hidden', fontFamily:'Inter, ui-sans-serif, system-ui, sans-serif' }}>
      <style>{`
        @keyframes floatOrb { 0%{transform:translate3d(0,0,0) scale(1)} 50%{transform:translate3d(0,-18px,0) scale(1.04)} 100%{transform:translate3d(0,0,0) scale(1)} }
        @keyframes pulseGlow { 0%{box-shadow:0 12px 32px rgba(123,63,242,0.28),0 0 0 rgba(0,255,156,0)} 50%{box-shadow:0 16px 42px rgba(123,63,242,0.42),0 0 30px rgba(0,255,156,0.18)} 100%{box-shadow:0 12px 32px rgba(123,63,242,0.28),0 0 0 rgba(0,255,156,0)} }
        @keyframes fadeUp { 0%{opacity:0;transform:translateY(16px)} 100%{opacity:1;transform:translateY(0)} }
      `}</style>

      <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,#7B3FF2 0%,#00FF9C 100%)', boxShadow:'0 0 24px rgba(123,63,242,0.45)' }} />
      <div style={{ position:'absolute', top:'-10%', left:'-8%', width:320, height:320, borderRadius:'50%', background:'radial-gradient(circle,rgba(123,63,242,0.28) 0%,rgba(123,63,242,0) 72%)', filter:'blur(14px)', animation:'floatOrb 8.4s ease-in-out infinite', pointerEvents:'none' }} />
      <div style={{ position:'absolute', top:'18%', right:'-6%', width:280, height:280, borderRadius:'50%', background:'radial-gradient(circle,rgba(0,255,156,0.18) 0%,rgba(0,255,156,0) 72%)', filter:'blur(18px)', animation:'floatOrb 10s ease-in-out infinite', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:'-8%', left:'30%', width:360, height:360, borderRadius:'50%', background:'radial-gradient(circle,rgba(123,63,242,0.20) 0%,rgba(0,255,156,0.08) 42%,rgba(0,0,0,0) 72%)', filter:'blur(20px)', animation:'floatOrb 11.2s ease-in-out infinite', pointerEvents:'none' }} />

      <div style={{ width:'100%', maxWidth:460, position:'relative', zIndex:2, borderRadius:28, border:'1px solid rgba(255,255,255,0.08)', background:'linear-gradient(180deg,rgba(255,255,255,0.06) 0%,rgba(255,255,255,0.03) 100%)', backdropFilter:'blur(18px)', boxShadow:'0 30px 80px rgba(0,0,0,0.45)', padding:'32px 24px 24px', animation:'fadeUp 420ms cubic-bezier(0.22,1,0.36,1)' }}>
        <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,#7B3FF2 0%,#00FF9C 100%)', display:'flex', alignItems:'center', justifyContent:'center', color:'#FFFFFF', fontWeight:900, fontSize:18 }}>S</div>
            <div style={{ color:'#FFFFFF', fontSize:18, fontWeight:800, letterSpacing:'-0.03em' }}>SLIFT</div>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <h1 style={{ margin:0, color:'#FFFFFF', fontSize:'clamp(32px,5vw,42px)', lineHeight:1.05, letterSpacing:'-0.04em', fontWeight:800 }}>Set new password</h1>
            <p style={{ margin:0, color:'rgba(255,255,255,0.58)', fontSize:15, lineHeight:1.6 }}>Choose a strong password for your account.</p>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="New password" style={{ width:'100%', height:58, borderRadius:16, border:'1px solid rgba(255,255,255,0.10)', background:'rgba(255,255,255,0.04)', color:'#FFFFFF', fontSize:16, outline:'none', padding:'0 18px', boxSizing:'border-box' }} />
            <input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Confirm new password" onKeyDown={e=>{ if(e.key==='Enter'&&!loading) handleUpdatePassword() }} style={{ width:'100%', height:58, borderRadius:16, border:'1px solid rgba(255,255,255,0.10)', background:'rgba(255,255,255,0.04)', color:'#FFFFFF', fontSize:16, outline:'none', padding:'0 18px', boxSizing:'border-box' }} />
          </div>

          {error && <div style={{ color:'#FF7B9C', fontSize:14, fontWeight:600, padding:'12px 14px', borderRadius:14, background:'rgba(255,123,156,0.10)', border:'1px solid rgba(255,123,156,0.18)' }}>{error}</div>}

          <button type="button" onClick={handleUpdatePassword} disabled={loading}
            style={{ width:'100%', height:58, borderRadius:18, border:'none', cursor:loading?'not-allowed':'pointer', color:'#FFFFFF', fontSize:16, fontWeight:800, background:'linear-gradient(135deg,#7B3FF2 0%,#00FF9C 100%)', boxShadow:'0 14px 36px rgba(123,63,242,0.32)', animation:loading?'none':'pulseGlow 2s ease-in-out infinite', opacity:loading?0.65:1 }}
            onMouseEnter={e=>{ if(!loading) e.currentTarget.style.transform='translateY(-2px)' }}
            onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}>
            {loading ? 'Updating...' : 'Update password'}
          </button>
        </div>
      </div>
    </div>
  )
}
