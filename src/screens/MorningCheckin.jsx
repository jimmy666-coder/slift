import React, { useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { calculateRecoveryScore } from "../utils/workoutEngine";

const COLORS = {
  bg: "#0A0A0F",
  card: "#12121A",
  primary: "#7B3FF2",
  accent: "#00FF9C",
  text: "#FFFFFF",
  muted: "#9ca3af",
  border: "rgba(255,255,255,0.06)",
};

const METRICS = [
  { key: "sleep", label: "Sleep quality", hint: "1 = very poor, 10 = excellent" },
  { key: "soreness", label: "Muscle soreness", hint: "1 = none, 10 = very sore", inverted: true },
  { key: "energy", label: "Energy level", hint: "1 = drained, 10 = fully charged" },
  { key: "motivation", label: "Motivation", hint: "1 = low, 10 = unstoppable" },
];

const MUSCLE_GROUPS = ["Chest", "Back", "Legs", "Shoulders", "Biceps", "Triceps", "Core", "Upper body", "Lower body", "Full body"];

const DURATIONS = ["30 min", "45 min", "60 min", "90 min", "2h+"];

const defaultValues = {
  sleep: 5, soreness: 5, energy: 5, motivation: 5,
  muscleGroups: [], duration: "45 min",
};

function clamp(value, min, max) { return Math.min(Math.max(value, min), max); }
function getAccentOpacity(value) { return 0.14 + (value / 10) * 0.34; }

function SliderRow({ label, hint, value, onChange, active, onActiveChange, inverted = false }) {
  const percent = ((value - 1) / 9) * 100;
  const accentOpacity = getAccentOpacity(value);
  const valueColor = inverted
    ? value >= 7 ? "#f97316" : value <= 3 ? COLORS.accent : COLORS.text
    : value >= 7 ? COLORS.accent : COLORS.text;

  return (
    <div style={styles.metricBlock}>
      <div style={styles.metricHeader}>
        <div>
          <div style={styles.metricLabel}>{label}</div>
          <div style={styles.metricHint}>{hint}</div>
        </div>
        <div style={{ ...styles.metricValue, color: valueColor, transform: active ? "scale(1.06)" : "scale(1)", opacity: active ? 1 : 0.9 }}>
          {value}
        </div>
      </div>
      <div style={styles.sliderShell}>
        <div style={styles.sliderTrack} />
        <div style={{ ...styles.sliderFill, width: `${percent}%`, opacity: accentOpacity, transform: active ? "scaleY(1.12)" : "scaleY(1)" }} />
        <div style={{ ...styles.sliderThumbGlow, left: `${percent}%`, opacity: accentOpacity, transform: `translateX(-50%) scale(${active ? 1.15 : 1})` }} />
        <div style={{ ...styles.sliderThumb, left: `${percent}%`, transform: `translateX(-50%) scale(${active ? 1.08 : 1})` }} />
        <input type="range" min={1} max={10} step={1} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          onMouseDown={() => onActiveChange(true)} onMouseUp={() => onActiveChange(false)}
          onMouseLeave={() => onActiveChange(false)} onTouchStart={() => onActiveChange(true)}
          onTouchEnd={() => onActiveChange(false)} style={styles.hiddenRange} />
      </div>
    </div>
  );
}

function SelectButton({ children, selected, pressed, onPressStart, onPressEnd, onClick }) {
  return (
    <button type="button" onMouseDown={onPressStart} onMouseUp={onPressEnd}
      onMouseLeave={onPressEnd} onTouchStart={onPressStart} onTouchEnd={onPressEnd} onClick={onClick}
      style={{
        ...styles.selectButton,
        borderColor: selected ? "rgba(0,255,156,0.34)" : COLORS.border,
        background: selected ? "linear-gradient(180deg, rgba(0,255,156,0.10) 0%, rgba(123,63,242,0.10) 100%)" : "rgba(255,255,255,0.02)",
        color: selected ? COLORS.text : COLORS.muted,
        transform: pressed ? "scale(0.97)" : selected ? "scale(1.02)" : "scale(1)",
        opacity: selected ? 1 : 0.92,
      }}>
      {children}
    </button>
  );
}

export default function MorningCheckin({ onComplete, loading = false, initialValues = {}, onGoHome, onHistory }) {
  const mergedInitialValues = useMemo(() => ({
    ...defaultValues, ...initialValues,
    muscleGroups: Array.isArray(initialValues?.muscleGroups) && initialValues.muscleGroups.length > 0
      ? initialValues.muscleGroups.slice(0, 3) : defaultValues.muscleGroups,
  }), [initialValues]);

  const [form, setForm] = useState(mergedInitialValues);
  const [activeSlider, setActiveSlider] = useState(null);
  const [pressedKey, setPressedKey] = useState("");

  const updateMetric = (key, value) => setForm((prev) => ({ ...prev, [key]: clamp(value, 1, 10) }));

  const toggleMuscleGroup = (group) => {
    setForm((prev) => {
      const exists = prev.muscleGroups.includes(group);
      if (exists) return { ...prev, muscleGroups: prev.muscleGroups.filter((item) => item !== group) };
      if (prev.muscleGroups.length >= 3) return prev;
      return { ...prev, muscleGroups: [...prev.muscleGroups, group] };
    });
  };

  const score = calculateRecoveryScore(form.sleep, form.soreness, form.energy, form.motivation);

  let scoreColor = "#9ca3af";
  if (score <= 4) scoreColor = "#f97316";
  else if (score <= 6) scoreColor = "#eab308";
  else if (score <= 7) scoreColor = "#d1d5db";
  else scoreColor = "#00FF9C";

  const scoreTransform = score > 8.4 ? "translateZ(0) scale(1.04)" : "translateZ(0)";

  const handleComplete = () => {
    if (loading) return;
    if (typeof onComplete === "function") {
      onComplete({ sleep: form.sleep, soreness: form.soreness, energy: form.energy, motivation: form.motivation, muscleGroups: form.muscleGroups, duration: form.duration, score });
    }
  };

  const handleLogout = async () => {
    try { await supabase.auth.signOut(); } catch (e) { console.error(e); } finally { window.location.reload(); }
  };

  return (
    <div style={styles.screen}>
      <div style={styles.container}>
        <div style={styles.topBlock}>
          <div style={styles.topBar}>
            <div style={styles.kicker}>SLIFT</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button type="button" onClick={() => { if (typeof onGoHome === "function") onGoHome(); }} style={styles.homeButton}>Home</button>
              <button type="button" onClick={() => { if (typeof onHistory === "function") onHistory(); }} style={styles.homeButton}>History</button>
              <button type="button" onClick={handleLogout} style={styles.logoutButton}>Log out</button>
            </div>
          </div>
          <h1 style={styles.title}>How are you today?</h1>
          <p style={styles.subtitle}>Quick check-in. Clean input, better training. Small ritual, better output.</p>
        </div>
        <div style={styles.content}>
          <section style={styles.card}>
            <div style={styles.sectionHeader}>
              <div>
                <div style={styles.sectionEyebrow}>Morning check-in</div>
                <h2 style={styles.sectionTitle}>Rate how you feel right now</h2>
              </div>
              <div style={styles.readinessWrap}>
                <div style={styles.readinessLabel}>Recovery score</div>
                <div style={{ ...styles.readinessValue, color: scoreColor, textShadow: score > 8.4 ? "0 0 12px rgba(0,255,156,0.6)" : "none", transform: scoreTransform }}>
                  {score}/10
                </div>
              </div>
            </div>
            <div style={styles.metricsGrid}>
              {METRICS.map((metric) => (
                <SliderRow key={metric.key} label={metric.label} hint={metric.hint}
                  value={form[metric.key]} active={activeSlider === metric.key}
                  inverted={metric.inverted}
                  onActiveChange={(isActive) => setActiveSlider(isActive ? metric.key : null)}
                  onChange={(value) => updateMetric(metric.key, value)} />
              ))}
            </div>
          </section>
          <section style={styles.card}>
            <div style={styles.groupHeader}>
              <div>
                <div style={styles.sectionEyebrow}>Target area</div>
                <h2 style={styles.sectionTitle}>Preferred focus</h2>
                <p style={styles.sectionSubtext}>Select up to 3 muscle groups.</p>
              </div>
            </div>
            <div style={styles.buttonGrid}>
              {MUSCLE_GROUPS.map((group) => {
                const key = `muscle-${group}`;
                const selected = form.muscleGroups.includes(group);
                const limitReached = !selected && form.muscleGroups.length >= 3;
                return (
                  <SelectButton key={group} selected={selected} pressed={pressedKey === key}
                    onPressStart={() => setPressedKey(key)} onPressEnd={() => setPressedKey("")}
                    onClick={() => toggleMuscleGroup(group)}>
                    <span style={{ opacity: limitReached ? 0.45 : 1, transition: "opacity 140ms ease" }}>{group}</span>
                  </SelectButton>
                );
              })}
            </div>
          </section>
          <section style={styles.card}>
            <div style={styles.groupHeader}>
              <div>
                <div style={styles.sectionEyebrow}>Session length</div>
                <h2 style={styles.sectionTitle}>How much time do you have?</h2>
              </div>
            </div>
            <div style={styles.durationRow}>
              {DURATIONS.map((duration) => {
                const key = `duration-${duration}`;
                const selected = form.duration === duration;
                return (
                  <SelectButton key={duration} selected={selected} pressed={pressedKey === key}
                    onPressStart={() => setPressedKey(key)} onPressEnd={() => setPressedKey("")}
                    onClick={() => setForm((prev) => ({ ...prev, duration }))}>
                    {duration}
                  </SelectButton>
                );
              })}
            </div>
          </section>
          <div style={styles.bottomBar}>
            <div style={styles.summaryBlock}>
              <div style={styles.summaryLabel}>Selected</div>
              <div style={styles.summaryText}>{form.muscleGroups.length > 0 ? form.muscleGroups.join(" · ") : "No muscle group selected"}</div>
              <div style={styles.summaryMeta}>{form.duration}</div>
            </div>
            <button type="button" disabled={loading} onClick={handleComplete}
              style={{ ...styles.submitButton, transform: loading ? "scale(0.99)" : "scale(1)", opacity: loading ? 0.72 : 1 }}>
              {loading ? "Generating..." : "Generate workout"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  screen: { minHeight: "100vh", background: COLORS.bg, color: COLORS.text, padding: "24px 16px 48px" },
  container: { width: "100%", maxWidth: 880, margin: "0 auto" },
  topBlock: { padding: "12px 4px 28px" },
  topBar: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 10 },
  kicker: { fontSize: 13, fontWeight: 800, letterSpacing: "0.24em", textTransform: "uppercase", color: COLORS.primary, marginBottom: 0 },
  homeButton: { appearance: "none", border: `1px solid ${COLORS.border}`, background: "rgba(255,255,255,0.03)", color: COLORS.muted, borderRadius: 14, padding: "8px 12px", minHeight: 36, fontSize: 12, fontWeight: 700, cursor: "pointer", WebkitTapHighlightColor: "transparent" },
  logoutButton: { appearance: "none", border: "1px solid rgba(249,115,22,0.3)", background: "rgba(255,255,255,0.03)", color: "#f97316", borderRadius: 14, padding: "8px 12px", minHeight: 36, fontSize: 12, fontWeight: 700, cursor: "pointer", WebkitTapHighlightColor: "transparent" },
  title: { margin: 0, fontSize: "clamp(2.2rem, 5vw, 3.6rem)", lineHeight: 1.02, fontWeight: 800, letterSpacing: "-0.04em" },
  subtitle: { margin: "14px 0 0", fontSize: 15, lineHeight: 1.65, color: COLORS.muted, maxWidth: 620 },
  content: { display: "flex", flexDirection: "column", gap: 18 },
  card: { background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 24, padding: 22 },
  sectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 18, marginBottom: 22, flexWrap: "wrap" },
  groupHeader: { marginBottom: 18 },
  sectionEyebrow: { fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.18em", color: COLORS.primary, marginBottom: 8 },
  sectionTitle: { margin: 0, fontSize: 22, lineHeight: 1.15, letterSpacing: "-0.03em", fontWeight: 750 },
  sectionSubtext: { margin: "8px 0 0", fontSize: 13, color: COLORS.muted, lineHeight: 1.5 },
  readinessWrap: { minWidth: 120, textAlign: "right" },
  readinessLabel: { fontSize: 12, color: COLORS.muted, marginBottom: 6 },
  readinessValue: { fontSize: 30, lineHeight: 1, fontWeight: 800, letterSpacing: "-0.04em", transition: "transform 180ms ease, opacity 180ms ease" },
  metricsGrid: { display: "grid", gap: 20 },
  metricBlock: { display: "flex", flexDirection: "column", gap: 14, paddingBottom: 4 },
  metricHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 },
  metricLabel: { fontSize: 19, fontWeight: 750, letterSpacing: "-0.02em", marginBottom: 5 },
  metricHint: { fontSize: 13, color: COLORS.muted, lineHeight: 1.5 },
  metricValue: { minWidth: 32, textAlign: "right", fontSize: 28, lineHeight: 1, fontWeight: 800, transition: "transform 180ms ease, opacity 180ms ease, color 180ms ease" },
  sliderShell: { position: "relative", height: 34, display: "flex", alignItems: "center" },
  sliderTrack: { position: "absolute", left: 0, right: 0, height: 8, borderRadius: 999, background: "rgba(255,255,255,0.08)" },
  sliderFill: { position: "absolute", left: 0, height: 8, borderRadius: 999, background: `linear-gradient(90deg, ${COLORS.primary} 0%, ${COLORS.accent} 100%)`, transition: "width 180ms ease, opacity 180ms ease, transform 180ms ease", transformOrigin: "left center" },
  sliderThumbGlow: { position: "absolute", top: "50%", width: 34, height: 34, borderRadius: "50%", background: "rgba(0,255,156,0.18)", filter: "blur(10px)", pointerEvents: "none", transition: "left 180ms ease, opacity 180ms ease, transform 180ms ease", marginTop: -17 },
  sliderThumb: { position: "absolute", top: "50%", width: 22, height: 22, borderRadius: "50%", background: COLORS.text, border: `3px solid ${COLORS.accent}`, pointerEvents: "none", transition: "left 180ms ease, transform 180ms ease", marginTop: -11 },
  hiddenRange: { position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer", margin: 0 },
  buttonGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 },
  durationRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 12 },
  selectButton: { appearance: "none", border: `1px solid ${COLORS.border}`, borderRadius: 18, padding: "15px 14px", minHeight: 54, fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em", cursor: "pointer", transition: "transform 140ms ease, opacity 140ms ease, border-color 180ms ease, background 180ms ease, color 180ms ease", WebkitTapHighlightColor: "transparent" },
  bottomBar: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, paddingTop: 8, flexWrap: "wrap" },
  summaryBlock: { display: "flex", flexDirection: "column", gap: 4, paddingLeft: 4 },
  summaryLabel: { fontSize: 12, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.14em", fontWeight: 700 },
  summaryText: { fontSize: 16, color: COLORS.text, fontWeight: 700, letterSpacing: "-0.01em" },
  summaryMeta: { fontSize: 14, color: COLORS.muted, fontWeight: 600 },
  submitButton: { appearance: "none", border: "none", borderRadius: 18, padding: "16px 22px", minHeight: 56, background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.accent} 140%)`, color: "#0A0A0F", fontSize: 16, fontWeight: 800, letterSpacing: "-0.02em", cursor: "pointer", transition: "transform 160ms ease, opacity 160ms ease", WebkitTapHighlightColor: "transparent" },
};
