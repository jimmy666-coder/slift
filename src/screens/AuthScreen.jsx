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
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isSignup = mode === "signup";

  useEffect(() => { setMounted(true); }, []);

  const handleAuth = async () => {
    setError("");
    if (!email || !password) { setError("All fields are required."); return; }
    if (isSignup && password !== confirm) { setError("Passwords do not match."); return; }
    try {
      setLoading(true);
      if (isSignup) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setError(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.screen}>
      <style>{`
        @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-20px); } 100% { transform: translateY(0px); } }
        @keyframes logoDrop { 0% { transform: translateY(-60px) scale(.9); opacity:0; } 60% { transform: translateY(10px) scale(1.02); opacity:1; } 100% { transform: translateY(0px) scale(1); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes slideUp { from { transform: translateY(40px); opacity:0; } to { transform: translateY(0); opacity:1; } }
        @keyframes pulseGlow { 0%,100% { box-shadow:0 0 20px rgba(123,63,242,.4); } 50% { box-shadow:0 0 30px rgba(0,255,156,.6); } }
        @keyframes rotateRing { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-6px); } 75% { transform: translateX(6px); } }
      `}</style>

      <div style={{...styles.orb, top:"10%", left:"-10%", background:"radial-gradient(circle,#7B3FF2,transparent 70%)", animation:"float 8s ease-in-out infinite"}} />
      <div style={{...styles.orb, bottom:"15%", right:"-15%", background:"radial-gradient(circle,#00FF9C,transparent 70%)", animation:"float 10s ease-in-out infinite"}} />
      <div style={{...styles.orb, top:"50%", right:"10%", background:"radial-gradient(circle,#7B3FF2,transparent 70%)", animation:"float 12s ease-in-out infinite"}} />

      <div style={styles.topLine} />

      <div style={{...styles.logoWrap, animation: mounted ? "logoDrop .8s cubic-bezier(.34,1.56,.64,1) forwards" : "none"}}>
        <div style={styles.logoRing} />
        <div style={styles.logo}>S</div>
      </div>

      <div style={{...styles.tagline, animation: mounted ? "fadeIn 1.2s ease forwards" : "none"}}>
        Train smarter. Recover better.
      </div>

      <div style={{...styles.card, animation: mounted ? "slideUp .8s ease forwards" : "none"}}>
        <div style={styles.cardTitle}>{isSignup ? "Join the Slifters" : "Welcome back"}</div>
        <div style={styles.cardSubtitle}>{isSignup ? "Start your 7-day free trial." : "Your recovery. Your rules."}</div>

        <input style={{...styles.input, animation: mounted ? "slideUp .8s ease .1s forwards" : "none"}}
          placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
        <input type="password" style={{...styles.input, animation: mounted ? "slideUp .8s ease .2s forwards" : "none"}}
          placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} />
        {isSignup && (
          <input type="password" style={{...styles.input, animation: mounted ? "slideUp .8s ease .3s forwards" : "none"}}
            placeholder="Confirm password" value={confirm} onChange={(e)=>setConfirm(e.target.value)} />
        )}

        {error && <div style={{...styles.error, animation:"shake .4s ease"}}>{error}</div>}

        <button onClick={handleAuth} disabled={loading} style={styles.cta}
          onMouseDown={(e)=> e.currentTarget.style.transform="scale(.97)"}
          onMouseUp={(e)=> e.currentTarget.style.transform="scale(1)"}>
          {loading ? "Loading..." : isSignup ? "Start for free" : "Sign in"}
        </button>

        <div onClick={()=>setMode(isSignup ? "signin" : "signup")} style={styles.toggle}>
          {isSignup ? "Already a Slifter? Sign in →" : "New here? Join the Slifters →"}
        </div>
      </div>
    </div>
  );
}

const styles = {
  screen: { minHeight:"100vh", background:"#0A0A0F", color:"#FFFFFF", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:20, overflow:"hidden", position:"relative" },
  orb: { position:"absolute", width:400, height:400, borderRadius:"50%", filter:"blur(120px)", opacity:.15 },
  topLine: { position:"absolute", top:0, left:0, right:0, height:2, background:"linear-gradient(90deg,#7B3FF2,#00FF9C)" },
  logoWrap: { position:"relative", marginBottom:20, opacity:0 },
  logoRing: { position:"absolute", width:120, height:120, borderRadius:"50%", border:"1px solid rgba(255,255,255,.1)", animation:"rotateRing 20s linear infinite", top:-10, left:-10 },
  logo: { width:100, height:100, borderRadius:"50%", background:"linear-gradient(135deg,#7B3FF2,#00FF9C)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:42, fontWeight:900, color:"#0A0A0F", zIndex:2, position:"relative" },
  tagline: { fontSize:22, fontWeight:800, letterSpacing:"0.05em", marginBottom:40, textAlign:"center", opacity:0 },
  card: { background:"#12121A", padding:30, borderRadius:20, width:"100%", maxWidth:380, border:"1px solid rgba(255,255,255,.06)", opacity:0 },
  cardTitle: { fontSize:24, fontWeight:900, marginBottom:6 },
  cardSubtitle: { color:"#9ca3af", marginBottom:20 },
  input: { width:"100%", padding:14, borderRadius:14, border:"1px solid rgba(255,255,255,.06)", background:"#0A0A0F", color:"#FFFFFF", marginBottom:14, boxSizing:"border-box", opacity:0 },
  error: { color:"#f97316", marginBottom:12, fontSize:14 },
  cta: { width:"100%", padding:16, borderRadius:16, border:"none", fontWeight:900, cursor:"pointer", background:"linear-gradient(135deg,#7B3FF2,#00FF9C)", color:"#0A0A0F", animation:"pulseGlow 2.5s infinite", fontSize:16 },
  toggle: { marginTop:18, textAlign:"center", fontSize:14, color:"#9ca3af", cursor:"pointer" },
};
