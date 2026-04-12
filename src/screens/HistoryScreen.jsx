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

function scoreColor(score) {
  if (score <= 4) return "#f97316";
  if (score <= 6) return "#eab308";
  if (score <= 7) return "#d1d5db";
  if (score <= 8.4) return "#00FF9C";
  return "#00FF9C";
}

function formatDateKey(date) {
  return date.toISOString().split("T")[0];
}

/** ISO 8601 calendar week key for grouping (e.g. 2025-W03) */
function isoWeekKey(dateInput) {
  const d = new Date(dateInput);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const week1 = new Date(d.getFullYear(), 0, 4);
  const week =
    1 +
    Math.round(
      ((d.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7
    );
  return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

export default function HistoryScreen({ userId, onBack }) {
  const [data, setData] = useState([]);
  const [profile, setProfile] = useState({});
  const [aiMessage, setAiMessage] = useState("");
  const [loadingAI, setLoadingAI] = useState(true);

  /* ================= FETCH ================= */
  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("recovery_score")
        .select(
          "score, sleep, soreness, energy, motivation, muscle_groups, created_at"
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(28);

      setData(data || []);
    }
    load();
  }, [userId]);

  useEffect(() => {
    async function loadProfile() {
      const { data: p } = await supabase
        .from("tapeprofiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (!p) return;

      setProfile({
        firstName: p.first_name,
        lastName: p.last_name,
        nickname: p.nickname,
        country: p.country,
        weight: p.weight,
        height: p.height,
      });
    }
    loadProfile();
  }, [userId]);

  /* ================= STREAK ================= */
  const streak = useMemo(() => {
    if (!data.length) return 0;

    const days = new Set(
      data.map((d) =>
        new Date(d.created_at).toISOString().split("T")[0]
      )
    );

    let count = 0;
    let current = new Date();

    while (true) {
      const key = formatDateKey(current);
      if (days.has(key)) {
        count++;
        current.setDate(current.getDate() - 1);
      } else break;
    }

    return count;
  }, [data]);

  function streakInfo() {
    if (streak === 0)
      return { label: "Come back today", color: "#f97316" };
    if (streak <= 2)
      return { label: "Just getting started", color: "#d1d5db" };
    if (streak <= 7)
      return { label: "Building momentum", color: "#eab308" };
    return { label: "Unstoppable", color: "#00FF9C" };
  }

  const streakData = streakInfo();

  /* ================= LAST 7 ================= */
  const last7 = data.slice(0, 7);

  const metricSeries = {
    sleep: [...last7].reverse().map((d) => d.sleep),
    soreness: [...last7].reverse().map((d) => d.soreness),
    energy: [...last7].reverse().map((d) => d.energy),
    motivation: [...last7].reverse().map((d) => d.motivation),
  };

  const tableHeaderStyle = {
    padding: "8px 4px",
    textAlign: "center",
    fontSize: 11,
    fontWeight: 700,
    color: "#9ca3af",
    borderRight: "1px solid rgba(255,255,255,0.06)",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  };

  const tableCellStyle = {
    padding: "10px 4px",
    textAlign: "center",
    fontSize: 14,
    borderRight: "1px solid rgba(255,255,255,0.06)",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  };

  const avg7 =
    last7.length > 0
      ? (
          last7.reduce((acc, d) => acc + d.score, 0) /
          last7.length
        ).toFixed(1)
      : 0;

  /* ================= 4-WEEK (ISO week) ================= */
  const weeklyData = useMemo(() => {
    const weeks = {};
    data.forEach((d) => {
      const key = isoWeekKey(d.created_at);
      if (!weeks[key]) weeks[key] = [];
      weeks[key].push(d.score);
    });
    return Object.entries(weeks)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 4)
      .map(([week, scores]) => ({
        week,
        avg: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1),
      }));
  }, [data]);

  /* ================= PULSE ================= */
  useEffect(() => {
    async function loadMessage() {
      if (!last7.length) return;

      setLoadingAI(true);

      const res = await fetch("/api/generate-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scores: last7.map((d) => d.score),
          userId,
          nickname: profile.nickname,
        }),
      });

      const text = await res.text();
      setAiMessage(text);
      setLoadingAI(false);
    }

    loadMessage();
  }, [userId, last7.length]);

  const saveProfile = async () => {
    await supabase
      .from("tapeprofiles")
      .update({
        first_name: profile.firstName,
        last_name: profile.lastName,
        nickname: profile.nickname,
        country: profile.country,
        weight: profile.weight,
        height: profile.height,
      })
      .eq("id", userId);
  };

  const avatarLetter =
    profile.firstName?.charAt(0)?.toUpperCase() || "S";

  /* ================= UI ================= */
  return (
    <div style={styles.screen}>
      <style>
        {`
        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes pulse {
          0%,
          100% {
            opacity: 0.6;
            transform: scale(0.9);
          }
          50% {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes scan {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}
      </style>

      {/* TOP LIGHT */}
      <div
        style={{
          height: 2,
          background:
            "linear-gradient(90deg,#7B3FF2,#00FF9C)",
          marginBottom: 20,
        }}
      />

      {/* HEADER */}
      <div style={styles.header}>
        <button
          onClick={onBack}
          style={styles.backBtn}
          onMouseDown={(e) =>
            (e.currentTarget.style.transform =
              "scale(0.97)")
          }
          onMouseUp={(e) =>
            (e.currentTarget.style.transform =
              "scale(1)")
          }
        >
          ← Back
        </button>
      </div>

      {/* STREAK CARD */}
      <div
        style={{
          ...styles.card,
          border:
            streak > 7
              ? "1px solid rgba(0,255,156,0.3)"
              : `1px solid ${COLORS.border}`,
          animation: "slideUp 0.6s ease forwards",
        }}
      >
        <div
          style={{
            fontSize: 32,
            fontWeight: 900,
            color: streakData.color,
            textShadow:
              streak > 7
                ? "0 0 16px rgba(0,255,156,.6)"
                : "none",
          }}
        >
          🔥 {streak}
        </div>
        <div style={{ color: streakData.color }}>
          {streakData.label}
        </div>
      </div>

      {/* Recovery scores — last 7 sessions */}
      <div
        style={{
          background: "#12121A",
          borderRadius: 20,
          padding: 20,
          marginTop: 20,
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <style>{`
    @keyframes growBar {
      from { height: 0; }
    }
  `}</style>

        <div
          style={{
            fontSize: 14,
            fontWeight: 900,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#7B3FF2",
            marginBottom: 20,
          }}
        >
          Recovery scores — last 7 sessions
        </div>

        {(() => {
          const ordered = [...last7]
            .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

          const getColor = (score) => {
            if (score <= 4) return "#f97316";
            if (score <= 6) return "#eab308";
            if (score <= 7) return "#d1d5db";
            if (score <= 8.4) return "#00FF9C";
            return "#00FF9C";
          };

          const getLevel = (score) => {
            if (score <= 4) return "Critical";
            if (score <= 6) return "Low";
            if (score <= 7) return "Moderate";
            if (score <= 8.4) return "Good";
            return "Peak";
          };

          const todayScore = ordered[ordered.length - 1]?.score || 0;
          const todayColor = getColor(todayScore);

          return (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "space-between",
                  gap: 10,
                  height: 140,
                }}
              >
                {ordered.map((session, index) => {
                  const score = session.score;
                  const height = Math.min(score * 10, 100);
                  const color = getColor(score);

                  return (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        flex: 1,
                      }}
                    >
                      {/* Score above */}
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 800,
                          marginBottom: 6,
                          color,
                          textShadow:
                            color === "#00FF9C"
                              ? "0 0 10px rgba(0,255,156,0.5)"
                              : "none",
                        }}
                      >
                        {score}
                      </div>

                      {/* Bar */}
                      <div
                        style={{
                          width: "100%",
                          maxWidth: 28,
                          height: height,
                          maxHeight: 100,
                          background: color,
                          borderRadius: 8,
                          boxShadow: `0 0 12px ${color}`,
                          animation:
                            "growBar 0.8s cubic-bezier(0.34,1.56,0.64,1) forwards",
                        }}
                      />

                      {/* Session label */}
                      <div
                        style={{
                          marginTop: 8,
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#9ca3af",
                        }}
                      >
                        S{index + 1}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Today level indicator */}
              <div
                style={{
                  marginTop: 20,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  color: todayColor,
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: todayColor,
                    boxShadow:
                      todayColor === "#00FF9C"
                        ? "0 0 10px rgba(0,255,156,0.6)"
                        : "none",
                  }}
                />
                Today: {getLevel(todayScore)}
              </div>
            </>
          );
        })()}
      </div>

      {/* SCORE CARD */}
      <div
        style={{
          ...styles.card,
          animation: "slideUp 0.6s ease forwards",
          animationDelay: "0.1s",
        }}
      >
        <div style={styles.ringWrapper}>
          <svg width="160" height="160">
            <circle
              cx="80"
              cy="80"
              r="70"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="10"
              fill="none"
            />
            <circle
              cx="80"
              cy="80"
              r="70"
              stroke={scoreColor(avg7)}
              strokeWidth="10"
              fill="none"
              strokeDasharray="440"
              strokeDashoffset={
                440 - (avg7 / 10) * 440
              }
              style={{
                transition: "stroke-dashoffset 1s ease",
              }}
            />
          </svg>
          <div
            style={{
              ...styles.centerScore,
              color: scoreColor(avg7),
            }}
          >
            {avg7}
          </div>
        </div>
      </div>

      <div
        style={{
          background: "#12121A",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 20,
          padding: 18,
          marginTop: 20,
          animation: "slideUp .8s ease forwards",
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 900,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#7B3FF2",
            marginBottom: 14,
          }}
        >
          Last 7 sessions breakdown
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "140px repeat(7, 1fr)",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            borderLeft: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div style={tableHeaderStyle}></div>
          {[...Array(7)].map((_, i) => (
            <div key={i} style={tableHeaderStyle}>
              S{i + 1}
            </div>
          ))}
          {[
            { label: "Sleep", key: "sleep", inverted: false },
            { label: "Soreness", key: "soreness", inverted: true },
            { label: "Energy", key: "energy", inverted: false },
            { label: "Motivation", key: "motivation", inverted: false },
          ].map((metric) => (
            <React.Fragment key={metric.key}>
              <div
                style={{
                  ...tableCellStyle,
                  fontWeight: 800,
                  color: "#FFFFFF",
                  textAlign: "left",
                  paddingLeft: 12,
                }}
              >
                {metric.label}
              </div>
              {Array.from({ length: 7 }, (_, colIndex) => {
                const value = (metricSeries[metric.key] || [])[colIndex];
                const v = Number(value ?? 0);
                let color;
                if (metric.inverted) {
                  color =
                    v >= 7
                      ? "#f97316"
                      : v >= 5
                        ? "#eab308"
                        : "#00FF9C";
                } else {
                  color =
                    v >= 7
                      ? "#00FF9C"
                      : v >= 5
                        ? "#eab308"
                        : "#f97316";
                }
                return (
                  <div
                    key={colIndex}
                    style={{
                      ...tableCellStyle,
                      color,
                      fontWeight: 800,
                      textShadow:
                        color === "#00FF9C"
                          ? "0 0 8px rgba(0,255,156,0.4)"
                          : "none",
                    }}
                  >
                    {v || "-"}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* 4-WEEK TREND */}
      {weeklyData.length > 0 && (
        <div
          style={{
            ...styles.card,
            animation: "slideUp 0.6s ease forwards",
            animationDelay: "0.25s",
          }}
        >
          <div style={styles.metricTitle}>4-WEEK TREND</div>
          <div style={styles.weekBarsRow}>
            {weeklyData.map(({ week, avg }) => (
              <div key={week} style={styles.weekColumn}>
                <div style={styles.weekAvg}>{avg}</div>
                <div style={styles.weekBarTrack}>
                  <div
                    style={{
                      ...styles.weekBarFill,
                      height: `${(Number(avg) / 10) * 100}%`,
                    }}
                  />
                </div>
                <div style={styles.weekLabel}>{week}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PULSE CARD */}
      <div
        style={{
          ...styles.card,
          animation: "slideUp 0.6s ease forwards",
          animationDelay: "0.3s",
        }}
      >
        <div style={styles.aiBadge}>
          <span
            style={{
              ...styles.pulseDot,
              animation: "pulse 1.5s infinite",
            }}
          />
          PULSE
        </div>

        <p style={styles.pulseIntro}>
          Hi, I&apos;m Pulse — your partner for becoming a better Slifter.
          <br />
          Here&apos;s what I see in your recovery this week:
        </p>

        {loadingAI ? (
          <div
            style={{
              fontStyle: "italic",
              color: COLORS.muted,
              marginTop: 10,
            }}
          >
            PULSE analyzing your recovery trend...
          </div>
        ) : (
          <div
            style={{
              marginTop: 10,
              background:
                "linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.05) 75%)",
              backgroundSize: "200% 100%",
              animation: "scan 4s linear infinite",
              padding: 12,
              borderRadius: 12,
            }}
          >
            {aiMessage}
          </div>
        )}
      </div>

      {/* PROFILE */}
      <div
        style={{
          ...styles.card,
          animation: "slideUp 0.6s ease forwards",
          animationDelay: "0.4s",
        }}
      >
        <div style={styles.avatar}>
          {avatarLetter}
        </div>

        {[
          "firstName",
          "lastName",
          "nickname",
          "country",
          "weight",
          "height",
        ].map((field, i) => (
          <input
            key={i}
            placeholder={field}
            value={profile[field] || ""}
            onChange={(e) =>
              setProfile({
                ...profile,
                [field]: e.target.value,
              })
            }
            style={styles.input}
          />
        ))}

        <button
          style={styles.saveBtn}
          onClick={saveProfile}
          onMouseDown={(e) =>
            (e.currentTarget.style.transform =
              "scale(0.97)")
          }
          onMouseUp={(e) =>
            (e.currentTarget.style.transform =
              "scale(1)")
          }
        >
          Save
        </button>
      </div>

      {/* BOTTOM LIGHT */}
      <div
        style={{
          height: 2,
          background:
            "linear-gradient(90deg,#00FF9C,#7B3FF2)",
          marginTop: 20,
        }}
      />
    </div>
  );
}

const styles = {
  screen: {
    background: COLORS.bg,
    minHeight: "100vh",
    padding: 20,
    color: COLORS.text,
  },
  header: {
    display: "flex",
    justifyContent: "flex-start",
    marginBottom: 20,
  },
  backBtn: {
    background: COLORS.card,
    border: `1px solid ${COLORS.border}`,
    color: COLORS.text,
    padding: "8px 16px",
    borderRadius: 14,
    cursor: "pointer",
  },
  card: {
    background: COLORS.card,
    border: `1px solid ${COLORS.border}`,
    padding: 20,
    borderRadius: 22,
    marginBottom: 20,
  },
  ringWrapper: {
    position: "relative",
    width: 160,
    margin: "0 auto",
  },
  centerScore: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%,-50%)",
    fontSize: 40,
    fontWeight: 900,
  },
  metricTitle: {
    fontSize: 12,
    color: COLORS.muted,
  },
  weekBarsRow: {
    display: "flex",
    gap: 8,
    alignItems: "flex-end",
    marginTop: 12,
  },
  weekColumn: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    minWidth: 0,
  },
  weekAvg: {
    fontSize: 14,
    fontWeight: 800,
    color: COLORS.accent,
  },
  weekBarTrack: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    height: 80,
    width: "100%",
  },
  weekBarFill: {
    width: "100%",
    maxWidth: 36,
    borderRadius: 4,
    background: `linear-gradient(180deg, ${COLORS.primary}, ${COLORS.accent})`,
    minHeight: 4,
    alignSelf: "flex-end",
  },
  weekLabel: {
    fontSize: 9,
    color: COLORS.muted,
    textAlign: "center",
    wordBreak: "break-all",
    lineHeight: 1.2,
  },
  pulseIntro: {
    margin: "12px 0 0",
    fontStyle: "italic",
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 1.55,
  },
  aiBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: COLORS.primary,
    padding: "4px 12px",
    borderRadius: 999,
    fontWeight: 700,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: COLORS.accent,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: "50%",
    background:
      "linear-gradient(135deg,#7B3FF2,#00FF9C)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 24,
    fontWeight: 900,
    marginBottom: 20,
  },
  input: {
    width: "100%",
    marginBottom: 10,
    padding: 10,
    background: COLORS.bg,
    border: `1px solid ${COLORS.border}`,
    color: COLORS.text,
    borderRadius: 10,
  },
  saveBtn: {
    background: COLORS.accent,
    padding: 10,
    borderRadius: 14,
    border: "none",
    cursor: "pointer",
  },
};
