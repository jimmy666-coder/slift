import { useEffect, useRef, useState } from 'react'
import { supabase } from './lib/supabase'
import AuthScreen from './screens/AuthScreen'
import ResetPasswordScreen from './screens/ResetPasswordScreen'
import OnboardingScreen from './screens/OnboardingScreen'
import MorningCheckin from './screens/MorningCheckin'
import RecoveryScore from './screens/RecoveryScore'
import WorkoutScreen from './screens/WorkoutScreen'
import LandingPage from './screens/LandingPage'
import HistoryScreen from './screens/HistoryScreen'
import ProfileScreen from './screens/ProfileScreen'
import WorkoutComplete from './screens/WorkoutComplete'

const SCREEN = {
  LANDING: 'landing',
  AUTH: 'auth',
  RESET: 'reset',
  ONBOARDING: 'onboarding',
  CHECKIN: 'checkin',
  PROFILE: 'profile',
  SCORE: 'score',
  WORKOUT: 'workout',
  HISTORY: 'history',
  COMPLETE: 'complete',
}

export default function App() {
  const [screen, setScreen] = useState(SCREEN.LANDING)
  const screenRef = useRef(screen)
  const [user, setUser] = useState(null)
  const [checkinData, setCheckinData] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const destinationAfterLandingRef = useRef(SCREEN.ONBOARDING)
  const recoveryFromHashRef = useRef(false)

  useEffect(() => {
    const hash = window.location.hash
    const params = new URLSearchParams(hash.replace('#', '?'))
    const type = params.get('type')

    if (type === 'recovery') {
      recoveryFromHashRef.current = true
      setScreen(SCREEN.RESET)
      return
    }
  }, [])

  useEffect(() => {
    screenRef.current = screen
  }, [screen])

  async function loadTapeProfileForLanding(userId) {
    try {
      const { data } = await supabase
        .from('tapeprofiles')
        .select('onboarding_completed, onboarding')
        .eq('id', userId)
        .maybeSingle()
      if (data?.onboarding_completed) {
        setProfile(data?.onboarding ?? null)
        destinationAfterLandingRef.current = SCREEN.CHECKIN
      } else {
        destinationAfterLandingRef.current = SCREEN.ONBOARDING
      }
    } catch {
      destinationAfterLandingRef.current = SCREEN.ONBOARDING
    }
  }

  async function navigateAfterSignIn(userId) {
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        if (
          recoveryFromHashRef.current ||
          screenRef.current === SCREEN.RESET
        ) {
          setLoading(false)
          return
        }
        if (screenRef.current === SCREEN.LANDING) {
          loadTapeProfileForLanding(session.user.id).then(() =>
            setLoading(false)
          )
        } else {
          navigateAfterSignIn(session.user.id)
        }
      } else {
        setScreen((prev) =>
          prev === SCREEN.LANDING || prev === SCREEN.RESET
            ? prev
            : SCREEN.AUTH
        )
        setLoading(false)
      }
    })

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          recoveryFromHashRef.current = true
          setScreen(SCREEN.RESET)
          setLoading(false)
          return
        }
        if (
          event === 'SIGNED_IN' &&
          screenRef.current !== SCREEN.RESET &&
          !recoveryFromHashRef.current
        ) {
          if (session?.user) {
            setUser(session.user)
            if (screenRef.current === SCREEN.LANDING) {
              loadTapeProfileForLanding(session.user.id).then(() =>
                setLoading(false)
              )
            } else {
              navigateAfterSignIn(session.user.id)
            }
          }
          return
        }
        if (event === 'SIGNED_OUT') {
          setUser(null)
          setScreen(SCREEN.LANDING)
          setLoading(false)
        }
      }
    )

    return () => authListener.subscription.unsubscribe()
  }, [])

  function handleGetStartedFromLanding() {
    if (!user) {
      setScreen(SCREEN.AUTH)
      return
    }
    setScreen(destinationAfterLandingRef.current)
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
      {screen === SCREEN.RESET && (
        <ResetPasswordScreen
          onComplete={() => {
            recoveryFromHashRef.current = false
            setScreen(SCREEN.AUTH)
          }}
        />
      )}
      {screen === SCREEN.LANDING && <LandingPage onGetStarted={handleGetStartedFromLanding} />}
      {screen !== SCREEN.LANDING && screen === SCREEN.AUTH && <AuthScreen />}
      {screen !== SCREEN.LANDING && screen === SCREEN.ONBOARDING && (
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
      {screen !== SCREEN.LANDING && screen === SCREEN.CHECKIN && (
        <MorningCheckin
          onComplete={handleCheckinComplete}
          initialValues={profile?.duration ? { duration: profile.duration } : {}}
          onGoHome={() => setScreen(SCREEN.LANDING)}
          onHistory={() => setScreen(SCREEN.HISTORY)}
          onProfile={() => setScreen(SCREEN.PROFILE)}
        />
      )}
      {screen !== SCREEN.LANDING && screen === SCREEN.SCORE && checkinData && (
        <RecoveryScore checkinData={checkinData} userId={user?.id} onContinue={() => setScreen(SCREEN.WORKOUT)} />
      )}
      {screen !== SCREEN.LANDING && screen === SCREEN.WORKOUT && checkinData && (
        <WorkoutScreen
          checkinData={checkinData}
          onReset={handleReset}
          profile={profile}
          onGoHome={() => setScreen(SCREEN.LANDING)}
          onHistory={() => setScreen(SCREEN.HISTORY)}
          onProfile={() => setScreen(SCREEN.PROFILE)}
          onComplete={() => setScreen(SCREEN.COMPLETE)}
        />
      )}
      {screen !== SCREEN.LANDING && screen === SCREEN.COMPLETE && checkinData && (
        <WorkoutComplete
          checkinData={checkinData}
          onReset={handleReset}
          onHistory={() => setScreen(SCREEN.HISTORY)}
        />
      )}
      {screen !== SCREEN.LANDING && screen === SCREEN.HISTORY && user && (
        <HistoryScreen
          userId={user.id}
          onBack={() => setScreen(SCREEN.CHECKIN)}
          onProfile={() => setScreen(SCREEN.PROFILE)}
        />
      )}
      {screen !== SCREEN.LANDING && screen === SCREEN.PROFILE && user && (
        <ProfileScreen
          userId={user.id}
          onBack={() => setScreen(SCREEN.CHECKIN)}
        />
      )}
    </>
  )
}
