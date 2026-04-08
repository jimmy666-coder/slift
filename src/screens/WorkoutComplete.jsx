import React from "react";

const COLORS = {
  bg: "#0A0A0F",
  card: "#12121A",
  primary: "#7B3FF2",
  accent: "#00FF9C",
  text: "#FFFFFF",
  muted: "#9ca3af",
  border: "rgba(255,255,255,0.06)",
};

export default function WorkoutComplete({ checkinData, onReset, onHistory }) {
  const score = Number(checkinData?.score ?? 0);
  const muscles = Array.isArray(checkinData?.muscleGroups) ? checkinData.muscleGroups.join(" · ") : "";
  const duration = checkinData?.duration || "";

  return (
    <div style={styles.screen}>
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.kicker}>Session complete</div>
          <h1 style={styles.title}>Nice work.</h1>
          <p style={styles.body}>
            You showed up with intent. Recovery score <strong style={{ color: COLORS.accent }}>{score}/10</strong>
            {duration ? ` · ${duration}` : ""}.
          </p>
          {muscles ? <p style={styles.meta}>Focus: {muscles}</p> : null}
          <div style={styles.actions}>
            <button type="button" onClick={() => typeof onReset === "function" && onReset()} style={styles.primary}>
              New check-in
            </button>
            <button type="button" onClick={() => typeof onHistory === "function" && onHistory()} style={styles.secondary}>
              History
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  screen: { minHeight: "100vh", background: COLORS.bg, color: COLORS.text, padding: "24px 16px 48px" },
  container: { width: "100%", maxWidth: 520, margin: "0 auto" },
  card: {
    background: COLORS.card,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 28,
    padding: 28,
  },
  kicker: { fontSize: 12, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: COLORS.primary, marginBottom: 12 },
  title: { margin: "0 0 16px", fontSize: "clamp(1.75rem, 4vw, 2.25rem)", fontWeight: 850, letterSpacing: "-0.04em", lineHeight: 1.1 },
  body: { margin: "0 0 12px", color: COLORS.muted, fontSize: 17, lineHeight: 1.65 },
  meta: { margin: "0 0 28px", color: COLORS.text, fontSize: 15, fontWeight: 600 },
  actions: { display: "flex", flexDirection: "column", gap: 12 },
  primary: {
    appearance: "none",
    border: "none",
    borderRadius: 18,
    padding: "16px 22px",
    minHeight: 54,
    background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.accent} 140%)`,
    color: "#0A0A0F",
    fontSize: 16,
    fontWeight: 800,
    cursor: "pointer",
    WebkitTapHighlightColor: "transparent",
  },
  secondary: {
    appearance: "none",
    border: `1px solid ${COLORS.border}`,
    background: "rgba(255,255,255,0.03)",
    color: COLORS.text,
    borderRadius: 18,
    padding: "14px 20px",
    minHeight: 48,
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    WebkitTapHighlightColor: "transparent",
  },
};
