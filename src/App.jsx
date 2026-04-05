import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { AuthScreen } from './screens/AuthScreen'
import { OnboardingScreen } from './screens/OnboardingScreen'
import MorningCheckin from './screens/MorningCheckin'
import { RecoveryScore } from './screens/RecoveryScore'
import WorkoutScreen from './screens/WorkoutScreen'

const SCREEN = {
  AUTH: 'auth',
  ONBOARDING: 'onboarding',
  CHECKIN: 'checkin',
  SCORE: 'score',
  WORKOUT: 'workout',
}

export default function App() {
  const [screen, setScreen] = useState(SCREEN.AUTH)
  const [user, setUser] = useState(null)
  const [checkinData, setCheckinData] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        checkOnboarding(session.user.id)
      } else {
        setScreen(SCREEN.AUTH)
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user)
        checkOnboarding(session.user.id)
      } else {
        setUser(null)
        setScreen(SCREEN.AUTH)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function checkOnboarding(userId) {
    try {
      const { data } = await supabase
        .from('tapeprofiles')
        .select('onboarding_completed, onboarding')
        .eq('id', userId)
        .maybeSingle()
      if (data?.onboarding_completed) {
        setProfile(data?.onboarding ?? null)
        setScreen(SCREEN.CHECKIN)
      } else {
        setScreen(SCREEN.ONBOARDING)
      }
    } catch {
      setScreen(SCREEN.ONBOARDING)
    }
    setLoading(false)
  }

  function handleCheckinComplete(data) {
    setCheckinData(data)
    setScreen(SCREEN.SCORE)
  }

  function handleReset() {
    setCheckinData(null)
    setScreen(SCREEN.CHECKIN)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6', fontFamily: 'sans-serif', fontSize: '18px', letterSpacing: '4px' }}>
        SLIFT
      </div>
    )
  }

  return (
    <>
      {screen === SCREEN.AUTH && <AuthScreen />}
      {screen === SCREEN.ONBOARDING && (
        <OnboardingScreen
          userId={user?.id}
          onComplete={async () => {
            const uid = user?.id
            if (!uid) throw new Error('Session lost. Please sign in again.')
            const { data, error } = await supabase.from('tapeprofiles').select('onboarding').eq('id', uid).single()
            if (error) throw new Error(error.message)
            setProfile(data?.onboarding ?? null)
            setScreen(SCREEN.CHECKIN)
            setCheckinData(null)
          }}
        />
      )}
      {screen === SCREEN.CHECKIN && (
        <MorningCheckin
          onComplete={handleCheckinComplete}
          initialValues={profile?.duration ? { duration: profile.duration } : {}}
        />
      )}
      {screen === SCREEN.SCORE && checkinData && (
        <RecoveryScore checkinData={checkinData} userId={user?.id} onContinue={() => setScreen(SCREEN.WORKOUT)} />
      )}
      {screen === SCREEN.WORKOUT && checkinData && (
        <WorkoutScreen checkinData={checkinData} onReset={handleReset} profile={profile} />
      )}
    </>
  )
}
