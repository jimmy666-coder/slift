import React, { useEffect, useMemo, useState } from "react";
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

function getScoreMeta(score) {
  if (score <= 4) return { color: "#f97316", label: "Critical", glow: false, message: "Your body is asking for restraint today. Scale smart, protect recovery, and keep the long game intact." };
  if (score <= 6) return { color: "#eab308", label: "Low", glow: false, message: "You can still train today, but the win is control, not ego. Keep it clean and intentional." };
  if (score <= 7) return { color: "#d1d5db", label: "Moderate", glow: false, message: "You are in a workable zone. Not your highest gear, but more than enough for a solid session." };
  if (score <= 8.4) return { color: "#00FF9C", label: "Good", glow: false, message: "Recovery looks strong. This is a good day to train with purpose and build momentum." };
  return { color: "#00FF9C", label: "Peak", glow: true, message: "Your system looks primed today. Use it well and capitalize on the rare luxury of high readiness." };
}

function MetricCard({ label, value, accentColor, inverted = false }) {
  let valueColor = COLORS.text;
  if (inverted) { valueColor = value >= 7 ? "#f97316" : value <= 3 ? COLORS.accent : COLORS.text; }
  else { valueColor = value >= 7 ? accentColor : COLORS.text; }
  return (
    <div style={styles.metricCard}>
      <div style={styles.metricLabel}>{label}</div>
      <div style={{ ...styles.metricValue, color: valueColor }}>{value}/10</div>
    </div>
  );
}

export default function RecoveryScore({ checkinData, userId, onContinue }) {
  const [saveState, setSaveState] = useState("idle");
  const safeData = useMemo(() => ({
    score: Number(checkinData?.score ?? 0),
    sleep: Number(checkinData?.sleep ?? 0),
    soreness: Number(checkinData?.soreness ?? 0),
    energy: Number(checkinData?.energy ?? 0),
    motivation: Number(checkinData?.motivation ?? 0),
    muscleGroups: Array.isArray(checkinData?.muscleGroups) ? checkinData.muscleGroups : [],
    duration: checkinData?.duration || "",
  }), [checkinData]);

  const scoreMeta = getScoreMeta(safeData.score);

  useEffect(() => {
    let isMounted = true;
    async function save() {
      if (!userId) return;
      try {
        if (isMounted) setSaveState("saving");
        await supabase.from("recovery_score").insert({
          user_id: userId, score: safeData.score, sleep: safeData.sleep,
          soreness: safeData.soreness, energy: safeData.energy,
          motivation: safeData.motivation, muscle_groups: safeData.muscleGroups?.join(", ") || "",
        });
        if (isMounted) setSaveState("saved");
      } catch (error) {
        console.error("Failed to save:", error);
        if (isMounted) setSaveState("error");
      }
    }
    save();
    return () => { isMounted = false; };
  }, [userId, safeData.score, safeData.sleep, safeData.soreness, safeData.energy, safeData.motivation]);

  return (
    <div style={styles.screen}>
      <div style={styles.container}>
        <div style={styles.heroCard}>
          <div style={styles.kicker}>Recovery score</div>
          <div style={styles.scoreBlock}>
            <div style={{ ...styles.scoreValue, color: scoreMeta.color, textShadow: scoreMeta.glow ? "0 0 12px rgba(0,255,156,0.6)" : "none", transform: scoreMeta.glow ? "translateZ(0) scale(1.04)" : "translateZ(0)" }}>
              {safeData.score}
            </div>
            <div style={{ ...styles.scoreLabel, color: scoreMeta.color, borderColor: scoreMeta.glow ? "rgba(0,255,156,0.28)" : "rgba(255,255,255,0.08)", background: scoreMeta.glow ? "rgba(0,255,156,0.08)" : "rgba(255,255,255,0.03)" }}>
              {scoreMeta.label}
            </div>
          </div>
          <p style={styles.scoreMessage}>{scoreMeta.message}</p>
          <div style={styles.selectionCard}>
            <div style={styles.selectionLabel}>Today's setup</div>
            <div style={styles.selectionValue}>{safeData.muscleGroups.length > 0 ? safeData.muscleGroups.join(" · ") : "No muscle groups selected"}</div>
            <div style={styles.selectionMeta}>{safeData.duration || "No duration selected"}</div>
          </div>
        </div>
        <div style={styles.metricsGrid}>
          <MetricCard label="Sleep" value={safeData.sleep} accentColor={scoreMeta.color} />
          <MetricCard label="Soreness" value={safeData.soreness} accentColor={scoreMeta.color} inverted />
          <MetricCard label="Energy" value={safeData.energy} accentColor={scoreMeta.color} />
          <MetricCard label="Motivation" value={safeData.motivation} accentColor={scoreMeta.color} />
        </div>
        <div style={styles.footerBlock}>
          <div style={styles.saveState}>
            {saveState === "saving" && "Saving recovery score..."}
            {saveState === "saved" && "Recovery score saved ✓"}
            {saveState === "error" && "Unable to save score right now"}
          </div>
          <button type="button" onClick={onContinue} style={{ ...styles.ctaButton, background: scoreMeta.color, color: "#0A0A0F" }}>
            See today's workout
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  screen: { minHeight: "100vh", background: COLORS.bg, color: COLORS.text, padding: "24px 16px 48px" },
  container: { width: "100%", maxWidth: 880, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 },
  heroCard: { background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 28, padding: 24 },
  kicker: { fontSize: 12, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: COLORS.primary, marginBottom: 14 },
  scoreBlock: { display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 14 },
  scoreValue: { fontSize: "clamp(4rem, 12vw, 7rem)", lineHeight: 0.9, fontWeight: 900, letterSpacing: "-0.07em" },
  scoreLabel: { display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: 38, padding: "8px 14px", borderRadius: 999, border: "1px solid", fontSize: 14, fontWeight: 800 },
  scoreMessage: { margin: "0 0 22px", color: COLORS.muted, fontSize: 17, lineHeight: 1.7, maxWidth: 720 },
  selectionCard: { background: "rgba(255,255,255,0.02)", border: `1px solid ${COLORS.border}`, borderRadius: 22, padding: 18 },
  selectionLabel: { fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: COLORS.muted, marginBottom: 8 },
  selectionValue: { fontSize: 20, fontWeight: 750, letterSpacing: "-0.02em", color: COLORS.text, marginBottom: 6 },
  selectionMeta: { fontSize: 15, color: COLORS.muted, fontWeight: 600 },
  metricsGrid: { display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 14 },
  metricCard: { background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 22, padding: 18, minHeight: 116, display: "flex", flexDirection: "column", justifyContent: "space-between" },
  metricLabel: { fontSize: 13, color: COLORS.muted, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" },
  metricValue: { fontSize: 28, lineHeight: 1, fontWeight: 850, letterSpacing: "-0.04em" },
  footerBlock: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", paddingTop: 6 },
  saveState: { fontSize: 14, color: COLORS.muted, minHeight: 20 },
  ctaButton: { appearance: "none", border: "none", borderRadius: 18, padding: "16px 22px", minHeight: 56, fontSize: 16, fontWeight: 800, cursor: "pointer", WebkitTapHighlightColor: "transparent" },
};
