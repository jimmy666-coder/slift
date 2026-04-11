import React, { useEffect, useMemo, useRef, useState } from 'react'
import { getScoreTier, getWorkoutExercises } from '../utils/workoutEngine'
import { generateWorkoutWithAI } from '../utils/claudeAI'
import { supabase } from '../lib/supabase'

function titleCase(value) {
  if (!value) return ''
  return String(value)
    .replace(/[_-]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

function toArray(value) {
  if (Array.isArray(value)) return value
  if (value == null) return []
  return [value]
}

function safeParseJSON(value) {
  if (typeof value !== 'string') return value
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

function getScoreColor(score) {
  if (score <= 4) return '#f97316'
  if (score <= 6) return '#eab308'
  if (score <= 7) return '#d1d5db'
  if (score <= 8.4) return '#00FF9C'
  return '#00FF9C'
}

function getScoreGlow(score) {
  if (score > 8.4) return '0 0 28px rgba(0,255,156,0.18)'
  if (score > 7) return '0 0 18px rgba(0,255,156,0.10)'
  if (score > 6) return '0 0 16px rgba(209,213,219,0.10)'
  if (score > 4) return '0 0 16px rgba(234,179,8,0.10)'
  return '0 0 16px rgba(249,115,22,0.10)'
}

function getTierLabel(score, tierResult) {
  if (typeof tierResult === 'string' && tierResult.trim()) {
    return tierResult.toUpperCase()
  }

  if (tierResult && typeof tierResult === 'object') {
    const raw =
      tierResult.label ||
      tierResult.name ||
      tierResult.title ||
      tierResult.tier ||
      tierResult.status

    if (raw) return String(raw).toUpperCase()
  }

  if (score <= 4) return 'LOW'
  if (score <= 6) return 'STEADY'
  if (score <= 7) return 'SOLID'
  if (score <= 8.4) return 'GOOD'
  return 'PEAK'
}

function formatDuration(duration) {
  if (!duration) return '45 min'
  if (typeof duration === 'number') return `${duration} min`
  return String(duration)
}

function formatSetsReps(exercise) {
  const sets = exercise.sets || 3
  const reps = exercise.reps || '8-12'
  return `${sets} × ${reps}`
}

function formatRest(rest) {
  if (rest == null || rest === '') return '90s rest'
  const raw = String(rest).trim()
  if (/rest/i.test(raw)) return raw
  if (/s$|sec$|secs$|second|seconds|min|mins|minute|minutes/i.test(raw)) {
    return `${raw} rest`
  }
  return `${raw}s rest`
}

function normalizeExercise(item, fallbackGroup, index) {
  if (typeof item === 'string') {
    return {
      id: `exercise-${index}-${item}`,
      group: fallbackGroup,
      name: titleCase(item),
      sets: 3,
      reps: '8-12',
      rpe: 7,
      rest: '90s',
    }
  }

  const setsValue =
    item.sets ??
    item.setCount ??
    item.rounds ??
    item.series ??
    3

  const repsValue =
    item.reps ??
    item.repRange ??
    item.repetitions ??
    item.targetReps ??
    '8-12'

  const rpeValue =
    item.rpe ??
    item.intensity ??
    item.effort ??
    7

  const restValue =
    item.rest ??
    item.restTime ??
    item.restSeconds ??
    item.break ??
    '90s'

  return {
    id: item.id || `exercise-${index}-${item.name || item.exercise || item.title || 'item'}`,
    group: titleCase(
      item.group ||
        item.muscleGroup ||
        item.category ||
        item.block ||
        fallbackGroup ||
        'Main Work'
    ),
    name: titleCase(item.name || item.exercise || item.title || `Exercise ${index + 1}`),
    sets: setsValue,
    reps: repsValue,
    rpe: rpeValue,
    rest: restValue,
  }
}

function pickMuscleGroups(checkinData, profile) {
  const raw =
    checkinData?.muscleGroups ||
    checkinData?.muscleGroup ||
    profile?.muscleGroups ||
    profile?.muscleGroup ||
    ['Full Body']

  return toArray(raw).map((item) => titleCase(item))
}

function buildFallbackSession(checkinData, profile, fallbackSource, score) {
  const muscleGroups = pickMuscleGroups(checkinData, profile)
  const duration = formatDuration(
    checkinData?.duration || fallbackSource?.duration || fallbackSource?.estimatedDuration
  )

  let sourceExercises = []

  if (Array.isArray(fallbackSource)) {
    sourceExercises = fallbackSource
  } else if (fallbackSource?.exercises && Array.isArray(fallbackSource.exercises)) {
    sourceExercises = fallbackSource.exercises
  } else if (fallbackSource?.mainExercises && Array.isArray(fallbackSource.mainExercises)) {
    sourceExercises = fallbackSource.mainExercises
  }

  if (!sourceExercises.length) {
    sourceExercises = [
      { name: `${muscleGroups[0] || 'Upper Body'} Compound`, group: muscleGroups[0] || 'Main Work', sets: 4, reps: '6-8', rpe: score > 8 ? 8 : 7, rest: '120s' },
      { name: `${muscleGroups[0] || 'Upper Body'} Secondary`, group: muscleGroups[0] || 'Main Work', sets: 3, reps: '8-10', rpe: 7, rest: '90s' },
      { name: `${muscleGroups[1] || muscleGroups[0] || 'Accessory'} Accessory`, group: muscleGroups[1] || muscleGroups[0] || 'Accessory', sets: 3, reps: '10-12', rpe: 7, rest: '75s' },
      { name: 'Finisher Movement', group: 'Finisher', sets: 2, reps: '12-15', rpe: 8, rest: '60s' },
    ]
  }

  const exercises = sourceExercises.map((exercise, index) =>
    normalizeExercise(exercise, muscleGroups[index % muscleGroups.length] || 'Main Work', index)
  )

  return {
    title: muscleGroups.join(' + '),
    duration,
    note:
      fallbackSource?.note ||
      fallbackSource?.motivation ||
      fallbackSource?.coachNote ||
      'Built around your readiness so you can push without training like a sleep-deprived maniac.',
    warmup:
      fallbackSource?.warmup ||
      [
        `5 min easy cardio`,
        `Dynamic mobility for ${muscleGroups.join(' + ').toLowerCase()}`,
      ],
    cooldown:
      fallbackSource?.cooldown ||
      ['Light stretching', 'Slow nasal breathing for 2-3 min'],
    exercises,
    bonusExercise:
      fallbackSource?.bonusExercise ||
      fallbackSource?.optionalExercise ||
      {
        name: `${muscleGroups[0] || 'Main'} pump finisher`,
        group: muscleGroups[0] || 'Optional',
        sets: 2,
        reps: '15-20',
        rpe: 8,
        rest: '45s',
      },
  }
}

function normalizeWorkout(aiResult, checkinData, profile, fallbackSource, score) {
  const parsed = safeParseJSON(aiResult)
  const root =
    parsed?.workout ||
    parsed?.session ||
    parsed?.plan ||
    parsed?.data ||
    parsed

  if (!root || typeof root !== 'object') {
    return buildFallbackSession(checkinData, profile, fallbackSource, score)
  }

  const muscleGroups = pickMuscleGroups(checkinData, profile)
  const exercisesRaw =
    root.exercises ||
    root.mainExercises ||
    root.workout ||
    root.blocks ||
    []

  const exercises = toArray(exercisesRaw)
    .map((item, index) =>
      normalizeExercise(item, muscleGroups[index % muscleGroups.length] || 'Main Work', index)
    )
    .filter((item) => item.name)

  const fallback = buildFallbackSession(checkinData, profile, fallbackSource, score)

  return {
    title:
      titleCase(root.title) ||
      titleCase(root.sessionTitle) ||
      titleCase(root.name) ||
      muscleGroups.join(' + '),
    duration: formatDuration(root.duration || root.estimatedDuration || checkinData?.duration),
    note:
      root.note ||
      root.motivationalNote ||
      root.coachNote ||
      root.summary ||
      fallback.note,
    warmup: toArray(root.warmup).length ? toArray(root.warmup) : fallback.warmup,
    cooldown: toArray(root.cooldown).length ? toArray(root.cooldown) : fallback.cooldown,
    exercises: exercises.length ? exercises : fallback.exercises,
    bonusExercise:
      root.bonusExercise ||
      root.optionalExercise ||
      root.optional ||
      fallback.bonusExercise,
  }
}

export default function WorkoutScreen({
  checkinData,
  profile,
  onReset,
  onComplete,
  onHistory,
}) {
  const [loading, setLoading] = useState(true)
  const [workout, setWorkout] = useState(null)
  const [error, setError] = useState('')
  const requestRef = useRef(null)

  const score = useMemo(() => Number(checkinData?.score || 0), [checkinData])
  const scoreColor = useMemo(() => getScoreColor(score), [score])
  const scoreGlow = useMemo(() => getScoreGlow(score), [score])
  const isEliteScore = score > 8.4
  const scoreTierResult = useMemo(() => {
    try {
      return getScoreTier(score)
    } catch {
      return null
    }
  }, [score])

  const tierLabel = useMemo(
    () => getTierLabel(score, scoreTierResult),
    [score, scoreTierResult]
  )

  const muscleGroups = useMemo(
    () => pickMuscleGroups(checkinData, profile),
    [checkinData, profile]
  )

  const requestSignature = useMemo(
    () =>
      JSON.stringify({
        score: checkinData?.score,
        muscleGroups: checkinData?.muscleGroups,
        duration: checkinData?.duration,
        profileId: profile?.id || profile?.userId || profile?.username || null,
      }),
    [checkinData, profile]
  )

  useEffect(() => {
    let cancelled = false

    async function buildWorkout() {
      if (!checkinData) {
        setWorkout(null)
        setLoading(false)
        return
      }

      if (requestRef.current === requestSignature) return
      requestRef.current = requestSignature

      setLoading(true)
      setError('')

      let fallbackSource = null

      try {
        try {
          fallbackSource = getWorkoutExercises(checkinData, profile)
        } catch {
          fallbackSource = getWorkoutExercises(checkinData)
        }

        let aiResponse = null

        try {
          aiResponse = await generateWorkoutWithAI({
            checkinData,
            profile,
            score,
            scoreTier: tierLabel,
            suggestedExercises: fallbackSource,
          })
        } catch {
          aiResponse = await generateWorkoutWithAI(checkinData, profile)
        }

        const normalized = normalizeWorkout(
          aiResponse,
          checkinData,
          profile,
          fallbackSource,
          score
        )

        if (!cancelled) {
          setWorkout(normalized)
          setLoading(false)
        }
      } catch (err) {
        console.error(err)

        const fallbackWorkout = buildFallbackSession(
          checkinData,
          profile,
          fallbackSource,
          score
        )

        if (!cancelled) {
          setWorkout(fallbackWorkout)
          setError('AI generation had a wobble. Fallback session loaded.')
          setLoading(false)
        }
      }
    }

    buildWorkout()

    return () => {
      cancelled = true
    }
  }, [checkinData, profile, requestSignature, score, tierLabel])

  const handleComplete = () => {
    const hasSupabase = Boolean(supabase)

    onComplete?.({
      ...workout,
      checkinData,
      profile,
      score,
      tierLabel,
      completedAt: new Date().toISOString(),
      provider: hasSupabase ? 'supabase' : 'local',
    })
  }

  if (!checkinData) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#0A0A0F',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          boxSizing: 'border-box',
          fontFamily:
            'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 520,
            borderRadius: 28,
            background: '#12121A',
            border: '1px solid rgba(255,255,255,0.08)',
            padding: 28,
            boxSizing: 'border-box',
            boxShadow: '0 30px 80px rgba(0,0,0,0.45)',
          }}
        >
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: '-0.03em',
              marginBottom: 12,
            }}
          >
            No session yet
          </div>
          <div
            style={{
              color: '#9ca3af',
              fontSize: 15,
              lineHeight: 1.6,
              marginBottom: 24,
            }}
          >
            Start a new check-in first. Revolutionary concept, I know.
          </div>

          <button
            type="button"
            onClick={onReset}
            style={{
              width: '100%',
              height: 54,
              borderRadius: 16,
              border: 'none',
              background: 'linear-gradient(135deg, #7B3FF2 0%, #00FF9C 100%)',
              color: '#FFFFFF',
              fontSize: 16,
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            New check-in
          </button>
        </div>
      </div>
    )
  }

  if (loading || !workout) {
    return (
      <div
        style={{
          minHeight: '100vh',
          width: '100%',
          background: '#0A0A0F',
          color: '#FFFFFF',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          boxSizing: 'border-box',
          fontFamily:
            'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        <style>
          {`
            @keyframes loadingSpin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }

            @keyframes dotPulse {
              0%, 80%, 100% { transform: scale(0.65); opacity: 0.35; }
              40% { transform: scale(1); opacity: 1; }
            }

            @keyframes floatOrb {
              0% { transform: translate3d(0, 0, 0) scale(1); }
              50% { transform: translate3d(0, -14px, 0) scale(1.03); }
              100% { transform: translate3d(0, 0, 0) scale(1); }
            }
          `}
        </style>

        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: 'linear-gradient(90deg, #7B3FF2 0%, #00FF9C 100%)',
            boxShadow: '0 0 24px rgba(123,63,242,0.45)',
          }}
        />

        <div
          style={{
            position: 'absolute',
            top: '-10%',
            left: '-8%',
            width: 320,
            height: 320,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(123,63,242,0.22) 0%, rgba(123,63,242,0.05) 42%, rgba(123,63,242,0) 72%)',
            filter: 'blur(16px)',
            animation: 'floatOrb 8s ease-in-out infinite',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '18%',
            right: '-6%',
            width: 280,
            height: 280,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(0,255,156,0.14) 0%, rgba(0,255,156,0.04) 42%, rgba(0,255,156,0) 72%)',
            filter: 'blur(18px)',
            animation: 'floatOrb 10s ease-in-out infinite',
          }}
        />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 18,
            position: 'relative',
            zIndex: 2,
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              border: '3px solid rgba(255,255,255,0.08)',
              borderTop: `3px solid ${scoreColor}`,
              animation: 'loadingSpin 0.95s linear infinite',
              boxShadow: isEliteScore ? '0 0 24px rgba(0,255,156,0.12)' : 'none',
            }}
          />
          <div
            style={{
              fontSize: 26,
              fontWeight: 800,
              letterSpacing: '-0.03em',
            }}
          >
            Building your session...
          </div>
          <div
            style={{
              color: '#7B3FF2',
              fontSize: 15,
              fontWeight: 700,
            }}
          >
            Powered by AI · SLIFT
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 6,
            }}
          >
            {[0, 1, 2].map((dot) => (
              <span
                key={dot}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: scoreColor,
                  display: 'inline-block',
                  animation: `dotPulse 1.2s ease-in-out ${dot * 0.18}s infinite`,
                  opacity: 0.7,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  const sessionTitle = workout.title || muscleGroups.join(' + ') || 'Today’s Session'
  const durationLabel = formatDuration(workout.duration)

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        background: '#0A0A0F',
        color: '#FFFFFF',
        position: 'relative',
        overflowX: 'hidden',
        paddingBottom: 120,
        boxSizing: 'border-box',
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <style>
        {`
          @keyframes floatOrb {
            0% { transform: translate3d(0, 0, 0) scale(1); }
            50% { transform: translate3d(0, -14px, 0) scale(1.03); }
            100% { transform: translate3d(0, 0, 0) scale(1); }
          }

          @keyframes slideDownIn {
            0% { opacity: 0; transform: translate3d(0, -24px, 0); }
            100% { opacity: 1; transform: translate3d(0, 0, 0); }
          }

          @keyframes badgePopIn {
            0% { opacity: 0; transform: scale(0.85); }
            70% { opacity: 1; transform: scale(1.04); }
            100% { opacity: 1; transform: scale(1); }
          }

          @keyframes slideUpIn {
            0% { opacity: 0; transform: translate3d(0, 24px, 0); }
            100% { opacity: 1; transform: translate3d(0, 0, 0); }
          }

          @keyframes pulseGlow {
            0% { box-shadow: 0 14px 36px rgba(123,63,242,0.28), 0 0 0 rgba(0,255,156,0); }
            50% { box-shadow: 0 20px 48px rgba(123,63,242,0.38), 0 0 28px rgba(0,255,156,0.16); }
            100% { box-shadow: 0 14px 36px rgba(123,63,242,0.28), 0 0 0 rgba(0,255,156,0); }
          }
        `}
      </style>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-10%',
            left: '-8%',
            width: 320,
            height: 320,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(123,63,242,0.22) 0%, rgba(123,63,242,0.05) 42%, rgba(123,63,242,0) 72%)',
            filter: 'blur(16px)',
            animation: 'floatOrb 8s ease-in-out infinite',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '16%',
            right: '-6%',
            width: 280,
            height: 280,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(0,255,156,0.14) 0%, rgba(0,255,156,0.04) 42%, rgba(0,255,156,0) 72%)',
            filter: 'blur(18px)',
            animation: 'floatOrb 10s ease-in-out infinite',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-10%',
            left: '28%',
            width: 360,
            height: 360,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(123,63,242,0.14) 0%, rgba(0,255,156,0.06) 42%, rgba(0,0,0,0) 72%)',
            filter: 'blur(20px)',
            animation: 'floatOrb 11.5s ease-in-out infinite',
          }}
        />
      </div>

      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          backdropFilter: 'blur(14px)',
          background: 'rgba(10,10,15,0.72)',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: 'linear-gradient(90deg, #7B3FF2 0%, #00FF9C 100%)',
            boxShadow: '0 0 24px rgba(123,63,242,0.45)',
          }}
        />

        <div
          style={{
            width: '100%',
            maxWidth: 860,
            margin: '0 auto',
            padding: '20px 20px 16px',
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 14,
            animation: 'slideDownIn 0.55s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #7B3FF2 0%, #00FF9C 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                fontWeight: 900,
                fontSize: 16,
                boxShadow: '0 10px 24px rgba(123,63,242,0.28)',
              }}
            >
              S
            </div>

            <div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                }}
              >
                SLIFT
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: '#9ca3af',
                  marginTop: 2,
                }}
              >
                Daily adaptive training
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              flexWrap: 'wrap',
              justifyContent: 'flex-end',
            }}
          >
            <button
              type="button"
              onClick={onReset}
              style={{
                height: 40,
                padding: '0 14px',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.04)',
                color: '#9ca3af',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              New check-in
            </button>

            <button
              type="button"
              onClick={onHistory}
              style={{
                height: 40,
                padding: '0 14px',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.04)',
                color: '#9ca3af',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              History
            </button>
          </div>
        </div>
      </div>

      <div
        style={{
          width: '100%',
          maxWidth: 860,
          margin: '0 auto',
          padding: '28px 20px 0',
          boxSizing: 'border-box',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <div
          style={{
            background: 'linear-gradient(180deg, rgba(18,18,26,0.98) 0%, rgba(18,18,26,0.92) 100%)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 28,
            padding: 24,
            boxSizing: 'border-box',
            boxShadow: `0 24px 80px rgba(0,0,0,0.42), ${scoreGlow}`,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              marginBottom: 18,
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 14px',
                borderRadius: 999,
                background: `${scoreColor}14`,
                border: `1px solid ${scoreColor}28`,
                color: scoreColor,
                fontSize: 13,
                fontWeight: 900,
                letterSpacing: '0.08em',
                animation: 'badgePopIn 0.55s cubic-bezier(0.22, 1, 0.36, 1)',
                boxShadow: isEliteScore ? '0 0 24px rgba(0,255,156,0.12)' : 'none',
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: scoreColor,
                  boxShadow: isEliteScore ? '0 0 16px rgba(0,255,156,0.35)' : 'none',
                }}
              />
              {tierLabel} · TODAY
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.07)',
                color: '#FFFFFF',
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              <span style={{ color: '#9ca3af' }}>Duration</span>
              <span>{durationLabel}</span>
            </div>
          </div>

          <div
            style={{
              fontSize: 'clamp(34px, 5vw, 52px)',
              fontWeight: 900,
              lineHeight: 1.02,
              letterSpacing: '-0.05em',
              marginBottom: 14,
              animation: 'slideUpIn 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          >
            {sessionTitle}
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 14,
              marginBottom: 14,
            }}
          >
            <div
              style={{
                fontSize: 18,
                color: '#9ca3af',
                fontWeight: 700,
              }}
            >
              Readiness
            </div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 900,
                color: scoreColor,
                letterSpacing: '-0.03em',
                textShadow: isEliteScore ? '0 0 20px rgba(0,255,156,0.18)' : 'none',
              }}
            >
              {Number(score).toFixed(1)} / 10
            </div>
          </div>

          <div
            style={{
              color: '#9ca3af',
              fontSize: 15,
              fontStyle: 'italic',
              lineHeight: 1.7,
              maxWidth: 700,
            }}
          >
            {workout.note}
          </div>

          {error ? (
            <div
              style={{
                marginTop: 16,
                color: '#d1d5db',
                fontSize: 13,
                fontWeight: 700,
                padding: '10px 12px',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.04)',
              }}
            >
              {error}
            </div>
          ) : null}
        </div>

        <div
          style={{
            display: 'grid',
            gap: 14,
            marginBottom: 18,
          }}
        >
          <div
            style={{
              display: 'grid',
              gap: 12,
            }}
          >
            <div
              style={{
                background: '#12121A',
                borderRadius: 22,
                border: '1px solid rgba(255,255,255,0.06)',
                padding: 18,
                boxSizing: 'border-box',
                animation: 'slideUpIn 0.48s cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 900,
                  letterSpacing: '0.12em',
                  color: '#7B3FF2',
                  marginBottom: 10,
                }}
              >
                WARM-UP
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 14,
                    background: 'rgba(123,63,242,0.14)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                  }}
                >
                  🔥
                </div>
                <div
                  style={{
                    color: '#FFFFFF',
                    fontSize: 15,
                    lineHeight: 1.7,
                  }}
                >
                  {toArray(workout.warmup).join(' • ')}
                </div>
              </div>
            </div>
          </div>

          {toArray(workout.exercises).map((exercise, index) => (
            <div
              key={exercise.id || `${exercise.name}-${index}`}
              style={{
                position: 'relative',
                background: '#12121A',
                borderRadius: 22,
                border: '1px solid rgba(255,255,255,0.06)',
                padding: 20,
                boxSizing: 'border-box',
                overflow: 'hidden',
                animation: `slideUpIn 0.55s cubic-bezier(0.22, 1, 0.36, 1) ${0.1 + index * 0.1}s both`,
                boxShadow: `0 18px 40px rgba(0,0,0,0.25), inset 3px 0 0 ${scoreColor}`,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 12,
                  bottom: 12,
                  width: 3,
                  borderRadius: 999,
                  background: scoreColor,
                  boxShadow: `0 0 18px ${scoreColor}55`,
                }}
              />

              <div
                style={{
                  paddingLeft: 8,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 900,
                    letterSpacing: '0.14em',
                    color: scoreColor,
                    marginBottom: 8,
                    textTransform: 'uppercase',
                  }}
                >
                  {exercise.group}
                </div>

                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 850,
                    letterSpacing: '-0.03em',
                    color: '#FFFFFF',
                    lineHeight: 1.08,
                    marginBottom: 14,
                  }}
                >
                  {exercise.name}
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: 999,
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: '#FFFFFF',
                      fontSize: 15,
                      fontWeight: 800,
                    }}
                  >
                    {formatSetsReps(exercise)}
                  </div>

                  <div
                    style={{
                      padding: '10px 12px',
                      borderRadius: 999,
                      background: `${scoreColor}14`,
                      border: `1px solid ${scoreColor}22`,
                      color: scoreColor,
                      fontSize: 13,
                      fontWeight: 900,
                    }}
                  >
                    RPE {exercise.rpe}
                  </div>

                  <div
                    style={{
                      padding: '10px 12px',
                      borderRadius: 999,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: '#9ca3af',
                      fontSize: 13,
                      fontWeight: 800,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <span style={{ fontSize: 14 }}>⏱</span>
                    <span>{formatRest(exercise.rest)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {workout.bonusExercise ? (
            <div
              style={{
                position: 'relative',
                background: 'rgba(18,18,26,0.72)',
                borderRadius: 22,
                border: '1px dashed rgba(123,63,242,0.35)',
                padding: 20,
                boxSizing: 'border-box',
                animation: `slideUpIn 0.55s cubic-bezier(0.22, 1, 0.36, 1) ${0.1 + toArray(workout.exercises).length * 0.1}s both`,
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '8px 12px',
                  borderRadius: 999,
                  background: 'rgba(123,63,242,0.18)',
                  color: '#7B3FF2',
                  fontSize: 12,
                  fontWeight: 900,
                  letterSpacing: '0.10em',
                  marginBottom: 12,
                }}
              >
                OPTIONAL
              </div>

              <div
                style={{
                  color: '#FFFFFF',
                  fontSize: 24,
                  fontWeight: 850,
                  letterSpacing: '-0.03em',
                  marginBottom: 12,
                }}
              >
                {titleCase(workout.bonusExercise.name || workout.bonusExercise.exercise)}
              </div>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 999,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#FFFFFF',
                    fontSize: 15,
                    fontWeight: 800,
                  }}
                >
                  {formatSetsReps(workout.bonusExercise)}
                </div>

                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: 999,
                    background: 'rgba(123,63,242,0.12)',
                    border: '1px solid rgba(123,63,242,0.22)',
                    color: '#7B3FF2',
                    fontSize: 13,
                    fontWeight: 900,
                  }}
                >
                  RPE {workout.bonusExercise.rpe || 8}
                </div>

                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: 999,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#9ca3af',
                    fontSize: 13,
                    fontWeight: 800,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 14 }}>⏱</span>
                  <span>{formatRest(workout.bonusExercise.rest)}</span>
                </div>
              </div>
            </div>
          ) : null}

          <div
            style={{
              background: '#12121A',
              borderRadius: 22,
              border: '1px solid rgba(255,255,255,0.06)',
              padding: 18,
              boxSizing: 'border-box',
              animation: `slideUpIn 0.55s cubic-bezier(0.22, 1, 0.36, 1) ${0.2 + toArray(workout.exercises).length * 0.1}s both`,
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: '0.12em',
                color: '#7B3FF2',
                marginBottom: 10,
              }}
            >
              COOLDOWN
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 14,
                  background: 'rgba(123,63,242,0.14)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                }}
              >
                🧘
              </div>
              <div
                style={{
                  color: '#FFFFFF',
                  fontSize: 15,
                  lineHeight: 1.7,
                }}
              >
                {toArray(workout.cooldown).join(' • ')}
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            position: 'sticky',
            bottom: 16,
            zIndex: 10,
            paddingTop: 8,
          }}
        >
          <button
            type="button"
            onClick={handleComplete}
            style={{
              width: '100%',
              height: 62,
              borderRadius: 20,
              border: 'none',
              background: 'linear-gradient(135deg, #7B3FF2 0%, #00FF9C 100%)',
              color: '#FFFFFF',
              fontSize: 17,
              fontWeight: 900,
              letterSpacing: '-0.02em',
              cursor: 'pointer',
              boxShadow: '0 16px 40px rgba(123,63,242,0.30)',
              animation: 'pulseGlow 2s ease-in-out infinite',
            }}
          >
            Complete session ✓
          </button>
        </div>
      </div>
    </div>
  )
}
git add . && git commit -m "Premium WorkoutScreen redesign" && git push origin main
