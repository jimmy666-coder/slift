import React, { useEffect, useMemo, useRef, useState } from "react";
import { getScoreTier, getWorkoutExercises } from "../utils/workoutEngine";
import { generateWorkoutWithAI } from "../utils/claudeAI";
import { supabase } from "../lib/supabase";

function titleCase(value) {
  if (!value) return "";
  return String(value)
    .replace(/[_-]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join(" ");
}

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  return [value];
}

function safeParseJSON(value) {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function getScoreColor(score) {
  if (score <= 4) return "#f97316";
  if (score <= 6) return "#eab308";
  if (score <= 7) return "#d1d5db";
  if (score <= 8.4) return "#00FF9C";
  return "#00FF9C";
}

function getScoreGlow(score) {
  if (score > 8.4) return "0 0 28px rgba(0,255,156,0.18)";
  if (score > 7) return "0 0 18px rgba(0,255,156,0.10)";
  if (score > 6) return "0 0 16px rgba(209,213,219,0.10)";
  if (score > 4) return "0 0 16px rgba(234,179,8,0.10)";
  return "0 0 16px rgba(249,115,22,0.10)";
}

function getTierLabel(score, tierResult) {
  if (typeof tierResult === "string" && tierResult.trim()) {
    return tierResult.toUpperCase();
  }

  if (tierResult && typeof tierResult === "object") {
    const raw =
      tierResult.label ||
      tierResult.name ||
      tierResult.title ||
      tierResult.tier ||
      tierResult.status;

    if (raw) return String(raw).toUpperCase();
  }

  if (score <= 4) return "LOW";
  if (score <= 6) return "STEADY";
  if (score <= 7) return "SOLID";
  if (score <= 8.4) return "GOOD";
  return "PEAK";
}

function formatDuration(duration) {
  if (!duration) return "45 min";
  if (typeof duration === "number") return `${duration} min`;
  return String(duration);
}

function formatSetsReps(exercise) {
  const sets = exercise.sets || 3;
  const reps = exercise.reps || "8-12";
  return `${sets} × ${reps}`;
}

function formatRest(rest) {
  if (rest == null || rest === "") return "90s rest";
  const raw = String(rest).trim();
  if (/rest/i.test(raw)) return raw;
  if (
    /s$|sec$|secs$|second|seconds|min|mins|minute|minutes/i.test(raw)
  ) {
    return `${raw} rest`;
  }
  return `${raw}s rest`;
}

function normalizeExercise(item, fallbackGroup, index) {
  if (typeof item === "string") {
    return {
      id: `exercise-${index}-${item}`,
      group: fallbackGroup,
      name: titleCase(item),
      sets: 3,
      reps: "8-12",
      rpe: 7,
      rest: "90s",
    };
  }

  const setsValue =
    item.sets ??
    item.setCount ??
    item.rounds ??
    item.series ??
    3;

  const repsValue =
    item.reps ??
    item.repRange ??
    item.repetitions ??
    item.targetReps ??
    "8-12";

  const rpeValue =
    item.rpe ?? item.intensity ?? item.effort ?? 7;

  const restValue =
    item.rest ??
    item.restTime ??
    item.restSeconds ??
    item.break ??
    "90s";

  return {
    id:
      item.id ||
      `exercise-${index}-${item.name || item.exercise || item.title || "item"}`,
    group: titleCase(
      item.group ||
        item.muscleGroup ||
        item.category ||
        item.block ||
        fallbackGroup ||
        "Main Work"
    ),
    name: titleCase(
      item.name ||
        item.exercise ||
        item.title ||
        `Exercise ${index + 1}`
    ),
    sets: setsValue,
    reps: repsValue,
    rpe: rpeValue,
    rest: restValue,
  };
}

function pickMuscleGroups(checkinData, profile) {
  const raw =
    checkinData?.muscleGroups ||
    checkinData?.muscleGroup ||
    profile?.muscleGroups ||
    profile?.muscleGroup ||
    ["Full Body"];

  return toArray(raw).map((item) => titleCase(item));
}

function buildFallbackSession(
  checkinData,
  profile,
  fallbackSource,
  score
) {
  const muscleGroups = pickMuscleGroups(checkinData, profile);
  const duration = formatDuration(
    checkinData?.duration ||
      fallbackSource?.duration ||
      fallbackSource?.estimatedDuration
  );

  let sourceExercises = [];

  if (Array.isArray(fallbackSource)) {
    sourceExercises = fallbackSource;
  } else if (
    fallbackSource?.exercises &&
    Array.isArray(fallbackSource.exercises)
  ) {
    sourceExercises = fallbackSource.exercises;
  } else if (
    fallbackSource?.mainExercises &&
    Array.isArray(fallbackSource.mainExercises)
  ) {
    sourceExercises = fallbackSource.mainExercises;
  }

  if (!sourceExercises.length) {
    sourceExercises = [
      {
        name: `${muscleGroups[0] || "Upper Body"} Compound`,
        group: muscleGroups[0] || "Main Work",
        sets: 4,
        reps: "6-8",
        rpe: score > 8 ? 8 : 7,
        rest: "120s",
      },
      {
        name: `${muscleGroups[0] || "Upper Body"} Secondary`,
        group: muscleGroups[0] || "Main Work",
        sets: 3,
        reps: "8-10",
        rpe: 7,
        rest: "90s",
      },
      {
        name: `${muscleGroups[1] || muscleGroups[0] || "Accessory"} Accessory`,
        group:
          muscleGroups[1] || muscleGroups[0] || "Accessory",
        sets: 3,
        reps: "10-12",
        rpe: 7,
        rest: "75s",
      },
      {
        name: "Finisher Movement",
        group: "Finisher",
        sets: 2,
        reps: "12-15",
        rpe: 8,
        rest: "60s",
      },
    ];
  }

  const exercises = sourceExercises.map((exercise, index) =>
    normalizeExercise(
      exercise,
      muscleGroups[index % muscleGroups.length] || "Main Work",
      index
    )
  );

  return {
    title: muscleGroups.join(" + "),
    duration,
    note:
      fallbackSource?.note ||
      fallbackSource?.motivation ||
      fallbackSource?.coachNote ||
      "Built around your readiness so you can push without training like a sleep-deprived maniac.",
    warmup:
      fallbackSource?.warmup || [
        `5 min easy cardio`,
        `Dynamic mobility for ${muscleGroups.join(" + ").toLowerCase()}`,
      ],
    cooldown:
      fallbackSource?.cooldown || [
        "Light stretching",
        "Slow nasal breathing for 2-3 min",
      ],
    exercises,
    bonusExercise:
      fallbackSource?.bonusExercise ||
      fallbackSource?.optionalExercise ||
      {
        name: `${muscleGroups[0] || "Main"} pump finisher`,
        group: muscleGroups[0] || "Optional",
        sets: 2,
        reps: "15-20",
        rpe: 8,
        rest: "45s",
      },
  };
}

function normalizeWorkout(
  aiResult,
  checkinData,
  profile,
  fallbackSource,
  score
) {
  const parsed = safeParseJSON(aiResult);
  const root =
    parsed?.workout ||
    parsed?.session ||
    parsed?.plan ||
    parsed?.data ||
    parsed;

  if (!root || typeof root !== "object") {
    return buildFallbackSession(
      checkinData,
      profile,
      fallbackSource,
      score
    );
  }

  const muscleGroups = pickMuscleGroups(checkinData, profile);
  const exercisesRaw =
    root.exercises ||
    root.mainExercises ||
    root.workout ||
    root.blocks ||
    [];

  const exercises = toArray(exercisesRaw)
    .map((item, index) =>
      normalizeExercise(
        item,
        muscleGroups[index % muscleGroups.length] || "Main Work",
        index
      )
    )
    .filter((item) => item.name);

  const fallback = buildFallbackSession(
    checkinData,
    profile,
    fallbackSource,
    score
  );

  return {
    title:
      titleCase(root.title) ||
      titleCase(root.sessionTitle) ||
      titleCase(root.name) ||
      muscleGroups.join(" + "),
    duration: formatDuration(
      root.duration ||
        root.estimatedDuration ||
        checkinData?.duration
    ),
    note:
      root.note ||
      root.motivationalNote ||
      root.coachNote ||
      root.summary ||
      fallback.note,
    warmup: toArray(root.warmup).length
      ? toArray(root.warmup)
      : fallback.warmup,
    cooldown: toArray(root.cooldown).length
      ? toArray(root.cooldown)
      : fallback.cooldown,
    exercises: exercises.length ? exercises : fallback.exercises,
    bonusExercise:
      root.bonusExercise ||
      root.optionalExercise ||
      root.optional ||
      fallback.bonusExercise,
  };
}

const EXERCISE_ACCENT = [
  "#7B3FF2",
  "#00FF9C",
  "#f97316",
  "#eab308",
  "#a78bfa",
  "#22d3ee",
  "#f472b6",
];

export default function WorkoutScreen({
  checkinData,
  profile,
  onReset,
  onComplete,
  onHistory,
  onGoHome,
}) {
  const [loading, setLoading] = useState(true);
  const [workout, setWorkout] = useState(null);
  const [error, setError] = useState("");
  const requestRef = useRef(null);

  const score = useMemo(
    () => Number(checkinData?.score || 0),
    [checkinData]
  );
  const scoreColor = useMemo(() => getScoreColor(score), [score]);
  const scoreGlow = useMemo(() => getScoreGlow(score), [score]);
  const isEliteScore = score > 8.4;
  const scoreTierResult = useMemo(() => {
    try {
      return getScoreTier(score);
    } catch {
      return null;
    }
  }, [score]);

  const tierLabel = useMemo(
    () => getTierLabel(score, scoreTierResult),
    [score, scoreTierResult]
  );

  const muscleGroups = useMemo(
    () => pickMuscleGroups(checkinData, profile),
    [checkinData, profile]
  );

  const requestSignature = useMemo(
    () =>
      JSON.stringify({
        score: checkinData?.score,
        muscleGroups: checkinData?.muscleGroups,
        duration: checkinData?.duration,
        profileId:
          profile?.id ||
          profile?.userId ||
          profile?.username ||
          null,
      }),
    [checkinData, profile]
  );

  useEffect(() => {
    let cancelled = false;

    async function buildWorkout() {
      if (!checkinData) {
        setWorkout(null);
        setLoading(false);
        return;
      }

      if (requestRef.current === requestSignature) return;
      requestRef.current = requestSignature;

      setLoading(true);
      setError("");

      let fallbackSource = null;

      try {
        try {
          fallbackSource = getWorkoutExercises(
            checkinData,
            profile
          );
        } catch {
          fallbackSource = getWorkoutExercises(checkinData);
        }

        let aiResponse = null;

        try {
          aiResponse = await generateWorkoutWithAI({
            checkinData,
            profile,
            score,
            scoreTier: tierLabel,
            suggestedExercises: fallbackSource,
          });
        } catch {
          aiResponse = await generateWorkoutWithAI(
            checkinData,
            profile
          );
        }

        const normalized = normalizeWorkout(
          aiResponse,
          checkinData,
          profile,
          fallbackSource,
          score
        );

        if (!cancelled) {
          setWorkout(normalized);
          setLoading(false);
        }
      } catch (err) {
        console.error(err);

        const fallbackWorkout = buildFallbackSession(
          checkinData,
          profile,
          fallbackSource,
          score
        );

        if (!cancelled) {
          setWorkout(fallbackWorkout);
          setError(
            "AI generation had a wobble. Fallback session loaded."
          );
          setLoading(false);
        }
      }
    }

    buildWorkout();

    return () => {
      cancelled = true;
    };
  }, [checkinData, profile, requestSignature, score, tierLabel]);

  const handleComplete = () => {
    const hasSupabase = Boolean(supabase);

    onComplete?.({
      ...workout,
      checkinData,
      profile,
      score,
      tierLabel,
      completedAt: new Date().toISOString(),
      provider: hasSupabase ? "supabase" : "local",
    });
  };

  const font =
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

  const keyframesCSS = `
    @keyframes orbFloatA {
      0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
      50% { transform: translate3d(12px, -22px, 0) scale(1.04); }
    }
    @keyframes orbFloatB {
      0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
      50% { transform: translate3d(-10px, 18px, 0) scale(1.03); }
    }
    @keyframes orbFloatC {
      0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
      50% { transform: translate3d(6px, -14px, 0) scale(1.02); }
    }
    @keyframes spinLoader {
      to { transform: rotate(360deg); }
    }
    @keyframes dotPulse {
      0%, 80%, 100% { transform: scale(0.65); opacity: 0.35; }
      40% { transform: scale(1); opacity: 1; }
    }
    @keyframes headerReveal {
      from { opacity: 0; transform: translateY(-14px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes heroRise {
      from { opacity: 0; transform: translateY(28px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes badgePop {
      0% { opacity: 0; transform: scale(0.88); }
      70% { opacity: 1; transform: scale(1.04); }
      100% { opacity: 1; transform: scale(1); }
    }
    @keyframes cardStagger {
      from { opacity: 0; transform: translateY(22px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes pulseGlowCta {
      0%, 100% { box-shadow: 0 12px 36px rgba(123,63,242,0.35), 0 0 0 rgba(0,255,156,0); }
      50% { box-shadow: 0 16px 48px rgba(123,63,242,0.45), 0 0 28px rgba(0,255,156,0.2); }
    }
  `;

  if (!checkinData) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0A0A0F",
          color: "#FFFFFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          boxSizing: "border-box",
          fontFamily: font,
        }}
      >
        <style>{keyframesCSS}</style>
        <div
          style={{
            width: "100%",
            maxWidth: 520,
            borderRadius: 24,
            background: "#12121A",
            border: "1px solid rgba(255,255,255,0.08)",
            padding: 28,
            boxSizing: "border-box",
            animation: "heroRise 0.55s ease forwards",
          }}
        >
          <div
            style={{
              fontSize: 26,
              fontWeight: 900,
              letterSpacing: "-0.03em",
              marginBottom: 12,
            }}
          >
            No session yet
          </div>
          <div
            style={{
              color: "#9ca3af",
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
              width: "100%",
              height: 54,
              borderRadius: 16,
              border: "none",
              background:
                "linear-gradient(135deg, #7B3FF2 0%, #00FF9C 100%)",
              color: "#0A0A0F",
              fontSize: 16,
              fontWeight: 900,
              cursor: "pointer",
              animation: "pulseGlowCta 2.4s ease-in-out infinite",
            }}
          >
            New check-in
          </button>
        </div>
      </div>
    );
  }

  if (loading || !workout) {
    return (
      <div
        style={{
          minHeight: "100vh",
          width: "100%",
          background: "#0A0A0F",
          color: "#FFFFFF",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          boxSizing: "border-box",
          fontFamily: font,
        }}
      >
        <style>{keyframesCSS}</style>
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background:
              "linear-gradient(90deg, #7B3FF2 0%, #00FF9C 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "6%",
            left: "-12%",
            width: 380,
            height: 380,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(123,63,242,0.35) 0%, transparent 68%)",
            filter: "blur(80px)",
            opacity: 0.45,
            animation: "orbFloatA 9s ease-in-out infinite",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "8%",
            right: "-10%",
            width: 340,
            height: 340,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(0,255,156,0.28) 0%, transparent 68%)",
            filter: "blur(80px)",
            opacity: 0.4,
            animation: "orbFloatB 11s ease-in-out infinite",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "42%",
            right: "4%",
            width: 260,
            height: 260,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(123,63,242,0.22) 0%, transparent 70%)",
            filter: "blur(70px)",
            opacity: 0.35,
            animation: "orbFloatC 13s ease-in-out infinite",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 20,
            position: "relative",
            zIndex: 2,
          }}
        >
          <div
            style={{
              width: 76,
              height: 76,
              borderRadius: "50%",
              border: "3px solid rgba(255,255,255,0.08)",
              borderTop: `3px solid ${scoreColor}`,
              animation: "spinLoader 0.9s linear infinite",
              boxShadow: isEliteScore
                ? "0 0 28px rgba(0,255,156,0.2)"
                : "none",
            }}
          />
          <div
            style={{
              fontSize: 24,
              fontWeight: 900,
              letterSpacing: "-0.03em",
              textAlign: "center",
            }}
          >
            Building your session...
          </div>
          <div
            style={{
              color: "#7B3FF2",
              fontSize: 14,
              fontWeight: 800,
              letterSpacing: "0.06em",
            }}
          >
            POWERED BY AI · SLIFT
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 4,
            }}
          >
            {[0, 1, 2].map((dot) => (
              <span
                key={dot}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: scoreColor,
                  display: "inline-block",
                  animation: `dotPulse 1.15s ease-in-out ${dot * 0.16}s infinite`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const sessionTitle =
    workout.title ||
    muscleGroups.join(" + ") ||
    "Today's session";
  const durationLabel = formatDuration(workout.duration);
  const exercisesList = toArray(workout.exercises);

  const headerBtn = {
    height: 40,
    padding: "0 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.05)",
    color: "#d1d5db",
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        background: "#0A0A0F",
        color: "#FFFFFF",
        position: "relative",
        overflowX: "hidden",
        paddingBottom: 100,
        boxSizing: "border-box",
        fontFamily: font,
      }}
    >
      <style>{keyframesCSS}</style>

      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          overflow: "hidden",
          zIndex: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-8%",
            left: "-10%",
            width: 360,
            height: 360,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(123,63,242,0.2) 0%, transparent 70%)",
            filter: "blur(72px)",
            opacity: 0.5,
            animation: "orbFloatA 10s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "20%",
            right: "-8%",
            width: 300,
            height: 300,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(0,255,156,0.16) 0%, transparent 70%)",
            filter: "blur(72px)",
            opacity: 0.45,
            animation: "orbFloatB 12s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-6%",
            left: "20%",
            width: 400,
            height: 400,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(123,63,242,0.12) 0%, rgba(0,255,156,0.08) 45%, transparent 72%)",
            filter: "blur(80px)",
            opacity: 0.4,
            animation: "orbFloatC 14s ease-in-out infinite",
          }}
        />
      </div>

      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          background: "rgba(10,10,15,0.82)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          animation: "headerReveal 0.5s ease forwards",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background:
              "linear-gradient(90deg, #7B3FF2 0%, #00FF9C 100%)",
          }}
        />
        <div
          style={{
            maxWidth: 880,
            margin: "0 auto",
            padding: "16px 20px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background:
                  "linear-gradient(135deg, #7B3FF2 0%, #00FF9C 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#0A0A0F",
                fontWeight: 900,
                fontSize: 18,
                boxShadow: "0 8px 24px rgba(123,63,242,0.35)",
              }}
            >
              S
            </div>
            <div>
              <div
                style={{
                  fontSize: 17,
                  fontWeight: 900,
                  letterSpacing: "0.18em",
                }}
              >
                SLIFT
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "#9ca3af",
                  fontWeight: 700,
                  marginTop: 2,
                  letterSpacing: "0.04em",
                }}
              >
                Adaptive training
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
              justifyContent: "flex-end",
            }}
          >
            {onGoHome && (
              <button
                type="button"
                onClick={onGoHome}
                style={headerBtn}
              >
                Home
              </button>
            )}
            <button type="button" onClick={onReset} style={headerBtn}>
              New check-in
            </button>
            <button type="button" onClick={onHistory} style={headerBtn}>
              History
            </button>
          </div>
        </div>
      </header>

      <main
        style={{
          maxWidth: 880,
          margin: "0 auto",
          padding: "24px 20px 0",
          position: "relative",
          zIndex: 2,
          boxSizing: "border-box",
        }}
      >
        <section
          style={{
            background:
              "linear-gradient(165deg, rgba(18,18,26,0.98) 0%, rgba(18,18,26,0.9) 100%)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 24,
            padding: 26,
            marginBottom: 20,
            boxSizing: "border-box",
            boxShadow: `0 28px 80px rgba(0,0,0,0.45), ${scoreGlow}`,
            animation: "heroRise 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards",
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 14,
              marginBottom: 18,
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 16px",
                borderRadius: 999,
                background: `${scoreColor}18`,
                border: `1px solid ${scoreColor}40`,
                color: scoreColor,
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: "0.1em",
                animation:
                  "badgePop 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards",
                boxShadow: isEliteScore
                  ? "0 0 22px rgba(0,255,156,0.25)"
                  : "none",
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: scoreColor,
                }}
              />
              {tierLabel} · SCORE
            </div>
            <div
              style={{
                fontSize: 36,
                fontWeight: 900,
                color: scoreColor,
                letterSpacing: "-0.04em",
                lineHeight: 1,
                textShadow: isEliteScore
                  ? "0 0 20px rgba(0,255,156,0.25)"
                  : "none",
              }}
            >
              {Number(score).toFixed(1)}
            </div>
          </div>

          <h1
            style={{
              fontSize: "clamp(30px, 5vw, 46px)",
              fontWeight: 900,
              lineHeight: 1.08,
              letterSpacing: "-0.04em",
              margin: "0 0 12px",
            }}
          >
            {sessionTitle}
          </h1>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 14px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#e5e7eb",
              fontSize: 14,
              fontWeight: 800,
              marginBottom: 16,
            }}
          >
            <span style={{ color: "#9ca3af", fontWeight: 700 }}>
              Session
            </span>
            {durationLabel}
          </div>

          <p
            style={{
              color: "#9ca3af",
              fontSize: 15,
              lineHeight: 1.75,
              fontStyle: "italic",
              margin: 0,
              maxWidth: 720,
            }}
          >
            {workout.note}
          </p>

          {error ? (
            <div
              style={{
                marginTop: 16,
                color: "#fcd34d",
                fontSize: 13,
                fontWeight: 700,
                padding: "12px 14px",
                borderRadius: 14,
                border: "1px solid rgba(252,211,77,0.25)",
                background: "rgba(252,211,77,0.08)",
              }}
            >
              {error}
            </div>
          ) : null}
        </section>

        <section
          style={{
            background: "#12121A",
            borderRadius: 20,
            border: "1px solid rgba(255,255,255,0.06)",
            padding: 20,
            marginBottom: 16,
            boxSizing: "border-box",
            animation:
              "cardStagger 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.05s both",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: "0.14em",
              color: "#7B3FF2",
              marginBottom: 14,
            }}
          >
            WARM-UP
          </div>
          <div
            style={{ display: "flex", gap: 14, alignItems: "flex-start" }}
          >
            <div
              style={{
                flexShrink: 0,
                width: 44,
                height: 44,
                borderRadius: 14,
                background: "rgba(123,63,242,0.2)",
                border: "1px solid rgba(123,63,242,0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
              }}
            >
              🔥
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              {toArray(workout.warmup).map((line, i) => (
                <div
                  key={i}
                  style={{
                    color: "#e5e7eb",
                    fontSize: 15,
                    lineHeight: 1.65,
                    marginBottom:
                      i < toArray(workout.warmup).length - 1 ? 8 : 0,
                    paddingLeft: 4,
                    borderLeft: "2px solid rgba(123,63,242,0.35)",
                  }}
                >
                  {line}
                </div>
              ))}
            </div>
          </div>
        </section>

        {exercisesList.map((exercise, index) => {
          const accent =
            EXERCISE_ACCENT[index % EXERCISE_ACCENT.length];
          const delay = 0.08 + index * 0.09;
          return (
            <article
              key={exercise.id || `${exercise.name}-${index}`}
              style={{
                background: "#12121A",
                borderRadius: 20,
                border: "1px solid rgba(255,255,255,0.06)",
                borderLeft: `4px solid ${accent}`,
                padding: "20px 20px 20px 18px",
                marginBottom: 14,
                boxSizing: "border-box",
                boxShadow: "0 16px 40px rgba(0,0,0,0.22)",
                animation: `cardStagger 0.5s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s both`,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 900,
                  letterSpacing: "0.16em",
                  color: accent,
                  marginBottom: 8,
                }}
              >
                {String(exercise.group).toUpperCase()}
              </div>
              <h2
                style={{
                  fontSize: 24,
                  fontWeight: 900,
                  letterSpacing: "-0.03em",
                  margin: "0 0 14px",
                  lineHeight: 1.15,
                }}
              >
                {exercise.name}
              </h2>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 10,
                }}
              >
                <span
                  style={{
                    padding: "9px 14px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    fontSize: 14,
                    fontWeight: 800,
                  }}
                >
                  {formatSetsReps(exercise)}
                </span>
                <span
                  style={{
                    padding: "9px 12px",
                    borderRadius: 999,
                    background: `${accent}22`,
                    border: `1px solid ${accent}44`,
                    color: accent,
                    fontSize: 13,
                    fontWeight: 900,
                  }}
                >
                  RPE {exercise.rpe}
                </span>
                <span
                  style={{
                    padding: "9px 12px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#9ca3af",
                    fontSize: 13,
                    fontWeight: 800,
                  }}
                >
                  ⏱ {formatRest(exercise.rest)}
                </span>
              </div>
            </article>
          );
        })}

        {workout.bonusExercise ? (
          <article
            style={{
              background: "rgba(18,18,26,0.85)",
              borderRadius: 20,
              border: "1px dashed rgba(123,63,242,0.4)",
              padding: 20,
              marginBottom: 16,
              boxSizing: "border-box",
              animation: `cardStagger 0.5s cubic-bezier(0.22, 1, 0.36, 1) ${0.08 + exercisesList.length * 0.09}s both`,
            }}
          >
            <div
              style={{
                display: "inline-block",
                padding: "6px 12px",
                borderRadius: 999,
                background: "rgba(123,63,242,0.22)",
                color: "#a78bfa",
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: "0.12em",
                marginBottom: 12,
              }}
            >
              OPTIONAL
            </div>
            <h2
              style={{
                fontSize: 22,
                fontWeight: 900,
                margin: "0 0 12px",
                letterSpacing: "-0.02em",
              }}
            >
              {titleCase(
                workout.bonusExercise.name ||
                  workout.bonusExercise.exercise
              )}
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <span
                style={{
                  padding: "9px 14px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.07)",
                  fontSize: 14,
                  fontWeight: 800,
                }}
              >
                {formatSetsReps(workout.bonusExercise)}
              </span>
              <span
                style={{
                  padding: "9px 12px",
                  borderRadius: 999,
                  background: "rgba(123,63,242,0.15)",
                  color: "#c4b5fd",
                  fontSize: 13,
                  fontWeight: 900,
                }}
              >
                RPE {workout.bonusExercise.rpe || 8}
              </span>
              <span
                style={{
                  padding: "9px 12px",
                  borderRadius: 999,
                  color: "#9ca3af",
                  fontSize: 13,
                  fontWeight: 800,
                }}
              >
                ⏱{" "}
                {formatRest(workout.bonusExercise.rest)}
              </span>
            </div>
          </article>
        ) : null}

        <section
          style={{
            background: "#12121A",
            borderRadius: 20,
            border: "1px solid rgba(255,255,255,0.06)",
            padding: 20,
            marginBottom: 24,
            boxSizing: "border-box",
            animation: `cardStagger 0.5s cubic-bezier(0.22, 1, 0.36, 1) ${0.12 + exercisesList.length * 0.09}s both`,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: "0.14em",
              color: "#00FF9C",
              marginBottom: 14,
            }}
          >
            COOL-DOWN
          </div>
          <div
            style={{ display: "flex", gap: 14, alignItems: "flex-start" }}
          >
            <div
              style={{
                flexShrink: 0,
                width: 44,
                height: 44,
                borderRadius: 14,
                background: "rgba(0,255,156,0.12)",
                border: "1px solid rgba(0,255,156,0.28)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
              }}
            >
              🧘
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              {toArray(workout.cooldown).map((line, i) => (
                <div
                  key={i}
                  style={{
                    color: "#e5e7eb",
                    fontSize: 15,
                    lineHeight: 1.65,
                    marginBottom:
                      i < toArray(workout.cooldown).length - 1 ? 8 : 0,
                    paddingLeft: 4,
                    borderLeft: "2px solid rgba(0,255,156,0.3)",
                  }}
                >
                  {line}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 50,
          padding:
            "12px 20px max(16px, env(safe-area-inset-bottom, 16px))",
          background:
            "linear-gradient(180deg, transparent 0%, rgba(10,10,15,0.92) 35%, rgba(10,10,15,0.98) 100%)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            maxWidth: 880,
            margin: "0 auto",
          }}
        >
          <button
            type="button"
            onClick={handleComplete}
            style={{
              width: "100%",
              height: 58,
              borderRadius: 18,
              border: "none",
              background:
                "linear-gradient(135deg, #7B3FF2 0%, #00FF9C 100%)",
              color: "#0A0A0F",
              fontSize: 17,
              fontWeight: 900,
              letterSpacing: "0.02em",
              cursor: "pointer",
              animation: "pulseGlowCta 2.2s ease-in-out infinite",
            }}
            onMouseDown={(e) =>
              (e.currentTarget.style.transform = "scale(0.98)")
            }
            onMouseUp={(e) =>
              (e.currentTarget.style.transform = "scale(1)")
            }
          >
            Complete session ✓
          </button>
        </div>
      </div>
    </div>
  );
}
