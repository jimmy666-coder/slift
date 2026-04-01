import { useState } from 'react'
import { supabase } from '../lib/supabase'

export function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    setError('')
    setLoading(true)
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) setError(error.message)
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) setError(error.message)
      }
    } catch (e) {
      setError('Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div style={styles.container}>
      <p style={styles.brand}>SLIFT</p>
      <h1 style={styles.title}>{isLogin ? 'Welcome back' : 'Create account'}</h1>
      <div style={styles.card}>
        <label style={styles.label}>Email</label>
        <input style={styles.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
        <label style={styles.label}>Password</label>
        <input style={styles.input} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
        {error && <p style={styles.error}>{error}</p>}
        <button style={styles.button} onClick={handleSubmit} disabled={loading}>
          {loading ? 'Loading...' : isLogin ? 'Log in' : 'Sign up'}
        </button>
        <button style={styles.toggle} onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? 'Need an account? Sign up' : 'Already have an account? Log in'}
        </button>
      </div>
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', background: '#0f0f1a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'sans-serif' },
  brand: { color: '#8b5cf6', fontSize: '12px', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '8px' },
  title: { color: 'white', fontSize: '32px', fontWeight: '900', marginBottom: '32px' },
  card: { background: '#16162a', border: '1px solid #2a2a4a', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '12px' },
  label: { color: '#9ca3af', fontSize: '13px' },
  input: { background: '#0f0f1a', border: '1px solid #2a2a4a', borderRadius: '10px', padding: '12px 16px', color: 'white', fontSize: '15px', outline: 'none', fontFamily: 'sans-serif' },
  error: { color: '#ef4444', fontSize: '13px' },
  button: { background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '12px', padding: '14px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', marginTop: '8px', fontFamily: 'sans-serif' },
  toggle: { background: 'transparent', color: '#8b5cf6', border: 'none', fontSize: '14px', cursor: 'pointer', fontFamily: 'sans-serif', textAlign: 'center' },
}
