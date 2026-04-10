import React, { useEffect, useState } from "react";
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

export default function AuthScreen() {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  async function handleAuth() {
    setError("");
    if (!email || !password) { setError("Please fill in all required fields."); return; }
    if (mode === "signup" && password !== confirm) { setError("Passwords do not match."); return; }
    try {
      setLoading(true);
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setError(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.screen}>
      <style>{`
        @keyframes slideUp { from { transform: translateY(20px); opacity:0; } to { transform: translateY(0); opacity:1; } }
        @keyframes slideDown { from { transform: translateY(-20px); opacity:0; } to { transform: translateY(0); opacity:1; } }
        @keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.04); } }
        @keyframes shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-6px); } 75% { transform: translateX(6px); } }
      `}</style>

      <div style={styles.lightTop} />

      <div style={{ ...styles.logoWrap, animation: mounted ? "slideDown .6s ease forwards" : "none" }}>
        <div style={styles.logo}>S</div>
        <div style={{ color: COLORS.primary, fontSize: 11, fontWeight: 800, letterSpacing: 4, marginTop: 12, textAlign: "center" }}>SLIFT</div>
      </div>

      <div style={{ ...styles.card, animation: mounted ? "slideUp .6s ease forwards" : "none" }}>
        <div style={styles.tabs}>
          {["signin", "signup"].map((tab) => (
            <div key={tab} onClick={() => setMode(tab)} style={{ ...styles.tab, background: mode === tab ? COLORS.primary : "transparent", color: mode === tab ? "#0A0A0F" : COLORS.muted }}>
              {tab === "signin" ? "Sign in" : "Sign up"}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 20 }}>
          <input style={styles.input} placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" style={styles.input} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {mode === "signup" && (
            <input type="password" style={styles.input} placeholder="Confirm password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          )}
        </div>

        {error && <div style={{ ...styles.error, animation: "shake .4s ease" }}>{error}</div>}

        <button onClick={handleAuth} disabled={loading} style={styles.cta}
          onMouseDown={(e) => e.currentTarget.style.transform = "scale(.97)"}
          onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}>
          {loading ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </div>

      <div style={styles.lightBottom} />
    </div>
  );
}

const styles = {
  screen: { minHeight: "100vh", background: COLORS.bg, display: "flex", flexDirection: "column", alignItems: "center", padding: 20, color: COLORS.text, justifyContent: "center", position: "relative" },
  lightTop: { position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,#7B3FF2,#00FF9C)" },
  lightBottom: { position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,#00FF9C,#7B3FF2)" },
  logoWrap: { marginBottom: 30, opacity: 0 },
  logo: { width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg,#7B3FF2,#00FF9C)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, fontWeight: 900, color: "#0A0A0F", margin: "0 auto" },
  card: { width: "100%", maxWidth: 360, background: COLORS.card, padding: 24, borderRadius: 20, border: `1px solid ${COLORS.border}`, opacity: 0 },
  tabs: { display: "flex", gap: 8 },
  tab: { flex: 1, padding: 10, borderRadius: 12, textAlign: "center", cursor: "pointer", fontWeight: 700, transition: "background .2s" },
  input: { width: "100%", padding: 12, marginBottom: 12, borderRadius: 12, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.text, boxSizing: "border-box" },
  error: { color: "#f97316", fontSize: 13, marginBottom: 12 },
  cta: { width: "100%", padding: 14, borderRadius: 14, border: "none", background: "linear-gradient(135deg,#7B3FF2,#00FF9C)", color: "#0A0A0F", fontWeight: 900, cursor: "pointer", fontSize: 16, animation: "pulse 2s infinite" },
};
