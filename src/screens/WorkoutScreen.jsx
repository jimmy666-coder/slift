import React, { useEffect, useMemo, useState } from "react";
import { getScoreTier, getWorkoutExercises } from "../utils/workoutEngine";
import { generateWorkoutWithAI } from "../utils/claudeAI";
import { supabase } from "../lib/supabase";

const COLORS = {
  bg: "#0A0A0F",
  card: "#12121A",
  primary: "#7B3FF2",
  accent: "#00FF9C",
  text: "#FFFFFF",
  muted: "#9ca3af",
  border: "rgba(255,255,255,0.06)",
};

function getScoreColor(score) {
  if (score <= 4) return "#f97316";
  if (score <= 6) return "#eab308";
  if (score <= 7) return "#d1d5db";
  return "#00FF9C";
}

function normalizeExercises(exercises, muscleGroups) {
  if (!Array.isArray(exercises)) return [];
  const fallbackGroup = Array.isArray(muscleGroups) && muscleGroups.length > 0 ? muscleGroups[0] : "Training";
  return exercises.map((exercise, index) => {
    if (typeof exercise === "string") return { id: `exercise-${index}`, group: fallbackGroup, name: exercise, sets: "3", reps: "8-12", rpe: "7", rest: "60-90 sec" };
    return {
      id: exercise.id || `exercise-${index}`,
      group: exercise.group || exercise.category || fallbackGroup,
      name: exercise.name || exercise.exercise || `Exercise ${index + 1}`,
      sets: exercise.sets || "3",
      reps: exercise.reps || "8-12",
      rpe: exercise.rpe || "7",
      rest: exercise.rest || exercise.restTime || "60-90 sec",
      isBonus: exercise.isBonus || false,
      isCardio: exercise.isCardio || false,
    };
  });
}

function ExerciseCard({ exercise, accentColor, optional = false }) {
  return (
    <div style={{
      ...styles.exerciseCard,
      background: optional ? "linear-gradient(180deg, rgba(123,63,242,0.10) 0%, rgba(18,18,26,1) 100%)" : COLORS.card,
      borderColor: optional ? "rgba(123,63,242,0.24)" : COLORS.border,
    }}>
      <div style={styles.exerciseTop}>
        <div style={{
          ...styles.groupPill,
          color: optional ? COLORS.primary : accentColor,
          background: optional ? "rgba(123,63,242,0.14)" : accentColor === "#d1d5db" ? "rgba(209,213,219,0.12)" : accentColor === "#eab308" ? "rgba(234,179,8,0.12)" : accentColor === "#f97316" ? "rgba(249,115,22,0.12)" : "rgba(0,255,156,0.10)",
        }}>
          {optional ? "OPTIONAL" : exercise.group}
        </div>
        {!optional && <div style={styles.exerciseIndexDot} />}
      </div>
      <div style={styles.exerciseName}>{exercise.name}</div>
      {!exercise.isCardio && (
        <div style={styles.exerciseMeta}>
          {exercise.sets} sets × {exercise.reps} @ RPE {exercise.rpe} · {exercise.rest} rest
        </div>
      )}
    </div>
  );
}

export default function WorkoutScreen({ checkinData, profile, onReset, onGoHome, onHistory }) {
  const [loading, setLoading] = useState(true);
  const [workout, setWorkout] = useState(null);

  const safeData = useMemo(() => ({
    score: Number(checkinData?.score ?? 0),
    muscleGroups: Array.isArray(checkinData?.muscleGroups) ? checkinData.muscleGroups : [],
    duration: checkinData?.duration || "",
  }), [checkinData]);

  const scoreColor = getScoreColor(safeData.score);
  const scoreGlow = safeData.score > 8.4;
  const tier = getScoreTier(safeData.score);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const result = await generateWorkoutWithAI({
          profile, score: safeData.score, muscleGroups: safeData.muscleGroups,
          scoreTier: tier.label, duration: safeData.duration,
        });
        if (isMounted) setWorkout(result);
      } catch (err) {
        const exercises = getWorkoutExercises(safeData.score, safeData.muscleGroups);
        if (isMounted) setWorkout({ warmup: "8-10 min warm-up", note: tier.note, exercises, cooldown: "5-8 min easy cool-down" });
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => { isMounted = false; };
  }, []);

  const normalizedExercises = useMemo(() => normalizeExercises(workout?.exercises, safeData.muscleGroups), [workout, safeData.muscleGroups]);
  const bonusExercise = useMemo(() => normalizedExercises.find(e => e.isBonus), [normalizedExercises]);
  const mainExercises = useMemo(() => normalizedExercises.filter(e => !e.isBonus), [normalizedExercises]);

  const sessionTitle = safeData.muscleGroups.length > 0 ? safeData.muscleGroups.join(" · ") : "Today's session";

  const handleLogout = async () => {
    try { await supabase.auth.signOut(); } catch (e) { console.error(e); } finally { window.location.reload(); }
  };

  if (loading) {
    return (
      <div style={styles.loadingScreen}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: 48, height: 48, borderRadius: "50%", border: "4px solid #1a1a2e", borderTop: "4px solid #7B3FF2", animation: "spin 2.5s linear infinite", marginBottom: 18 }} />
        <div style={{ fontSize: 20, fontWeight: 700, color: "#FFFFFF", marginBottom: 8, textAlign: "center" }}>SLIFT is building your session...</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#7B3FF2", textAlign: "center" }}>Powered by AI</div>
      </div>
    );
  }

  return (
    <div style={styles.screen}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.brandWrap}>
            <div style={styles.brandMark}>S</div>
            <div style={styles.brandText}>SLIFT</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button type="button" onClick={onReset} style={styles.secondaryButton}>New check-in</button>
            <button
              type="button"
              onClick={() => { if (typeof onHistory === "function") onHistory(); }}
              style={styles.homeButton}
            >
              History
            </button>
            <button
              type="button"
              onClick={() => { if (typeof onGoHome === "function") onGoHome(); }}
              style={styles.homeButton}
            >
              Home
            </button>
            <button type="button" onClick={handleLogout} style={{ ...styles.secondaryButton, color: "#f97316", borderColor: "rgba(249,115,22,0.3)" }}>Log out</button>
          </div>
        </div>

        <div style={styles.heroCard}>
          <div style={{ ...styles.scoreBadge, color: scoreColor, borderColor: scoreGlow ? "rgba(0,255,156,0.28)" : "rgba(255,255,255,0.08)", background: scoreGlow ? "rgba(0,255,156,0.08)" : "rgba(255,255,255,0.03)", textShadow: scoreGlow ? "0 0 12px rgba(0,255,156,0.6)" : "none" }}>
            {tier.label}
          </div>
          <h1 style={styles.sessionTitle}>{sessionTitle}</h1>
          <div style={styles.sessionSubline}>Score {safeData.score}/10{safeData.duration ? ` · ${safeData.duration}` : ""}</div>
          {workout?.note && <p style={styles.sessionNote}>{workout.note}</p>}
        </div>

        <div style={styles.sectionCard}>
          <div style={styles.sectionEyebrow}>Warm-up</div>
          <div style={styles.sectionText}>{workout?.warmup || "8-10 min warm-up: mobility, ramp-up sets, pulse raise"}</div>
        </div>

        <div style={styles.exerciseList}>
          {mainExercises.map((exercise) => (
            <ExerciseCard key={exercise.id} exercise={exercise} accentColor={scoreColor} />
          ))}
        </div>

        {bonusExercise && <ExerciseCard exercise={bonusExercise} accentColor={scoreColor} optional />}

        <div style={styles.sectionCard}>
          <div style={styles.sectionEyebrow}>Cool-down</div>
          <div style={styles.sectionText}>{workout?.cooldown || "5-8 min cool-down: breathing, light mobility"}</div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  loadingScreen: { minHeight: "100vh", background: "#0A0A0F", color: "#FFFFFF", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" },
  screen: { minHeight: "100vh", background: "#0A0A0F", color: "#FFFFFF", padding: "24px 16px 48px" },
  container: { width: "100%", maxWidth: 920, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" },
  brandWrap: { display: "flex", alignItems: "center", gap: 12 },
  brandMark: { width: 38, height: 38, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #7B3FF2 0%, #00FF9C 140%)", color: "#0A0A0F", fontWeight: 900, fontSize: 16 },
  brandText: { fontSize: 20, fontWeight: 800, letterSpacing: "-0.03em" },
  secondaryButton: { appearance: "none", border: `1px solid ${COLORS.border}`, background: "rgba(255,255,255,0.03)", color: COLORS.text, borderRadius: 16, padding: "12px 16px", minHeight: 46, fontSize: 14, fontWeight: 700, cursor: "pointer", WebkitTapHighlightColor: "transparent" },
  homeButton: { appearance: "none", border: `1px solid ${COLORS.border}`, background: "rgba(255,255,255,0.03)", color: COLORS.muted, borderRadius: 14, padding: "8px 12px", minHeight: 36, fontSize: 12, fontWeight: 700, cursor: "pointer", WebkitTapHighlightColor: "transparent" },
  heroCard: { background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 28, padding: 24 },
  scoreBadge: { display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: 36, padding: "8px 14px", borderRadius: 999, border: `1px solid ${COLORS.border}`, fontSize: 14, fontWeight: 800, marginBottom: 16 },
  sessionTitle: { margin: 0, fontSize: "clamp(2rem, 5vw, 3.2rem)", lineHeight: 1, fontWeight: 850, letterSpacing: "-0.05em" },
  sessionSubline: { marginTop: 12, color: COLORS.muted, fontSize: 15, lineHeight: 1.6, fontWeight: 600 },
  sessionNote: { margin: "16px 0 0", color: COLORS.muted, fontSize: 16, lineHeight: 1.7, maxWidth: 760 },
  sectionCard: { background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 22, padding: 20 },
  sectionEyebrow: { fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.16em", color: COLORS.primary, marginBottom: 10 },
  sectionText: { fontSize: 16, color: COLORS.text, lineHeight: 1.7 },
  exerciseList: { display: "grid", gap: 14 },
  exerciseCard: { background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 24, padding: 20 },
  exerciseTop: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 14 },
  groupPill: { display: "inline-flex", alignItems: "center", minHeight: 30, padding: "6px 10px", borderRadius: 999, fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" },
  exerciseIndexDot: { width: 8, height: 8, borderRadius: "50%", background: "rgba(255,255,255,0.16)", flexShrink: 0 },
  exerciseName: { fontSize: 26, lineHeight: 1.1, fontWeight: 800, letterSpacing: "-0.04em", marginBottom: 10 },
  exerciseMeta: { fontSize: 15, color: COLORS.muted, lineHeight: 1.6, fontWeight: 600 },
};
