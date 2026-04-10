import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

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
    <div style={{minHeight:"100vh",background:"#0A0A0F",color:"#FFFFFF",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20,overflow:"hidden",position:"relative"}}>
      <style>{`
        @keyframes float{0%{transform:translateY(0)}50%{transform:translateY(-20px)}100%{transform:translateY(0)}}
        @keyframes logoDrop{0%{transform:translateY(-60px) scale(.9);opacity:0}60%{transform:translateY(10px) scale(1.02);opacity:1}100%{transform:translateY(0) scale(1)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes slideUp{from{transform:translateY(40px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes pulseGlow{0%,100%{box-shadow:0 0 20px rgba(123,63,242,.4)}50%{box-shadow:0 0 30px rgba(0,255,156,.6)}}
        @keyframes rotateRing{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
      `}</style>

      <div style={{position:"absolute",width:400,height:400,borderRadius:"50%",filter:"blur(120px)",opacity:.15,top:"10%",left:"-10%",background:"radial-gradient(circle,#7B3FF2,transparent 70%)",animation:"float 8s ease-in-out infinite"}}/>
      <div style={{position:"absolute",width:400,height:400,borderRadius:"50%",filter:"blur(120px)",opacity:.15,bottom:"15%",right:"-15%",background:"radial-gradient(circle,#00FF9C,transparent 70%)",animation:"float 10s ease-in-out infinite"}}/>
      <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,#7B3FF2,#00FF9C)"}}/>

      <div style={{position:"relative",marginBottom:20,animation:mounted?"logoDrop .8s cubic-bezier(.34,1.56,.64,1) forwards":"none",opacity:0}}>
        <div style={{position:"absolute",width:120,height:120,borderRadius:"50%",border:"1px solid rgba(255,255,255,.1)",animation:"rotateRing 20s linear infinite",top:-10,left:-10}}/>
        <div style={{width:100,height:100,borderRadius:"50%",background:"linear-gradient(135deg,#7B3FF2,#00FF9C)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:42,fontWeight:900,color:"#0A0A0F",position:"relative",zIndex:2}}>S</div>
      </div>

      <div style={{fontSize:20,fontWeight:800,letterSpacing:"0.05em",marginBottom:30,textAlign:"center",animation:mounted?"fadeIn 1.2s ease forwards":"none",opacity:0}}>
        Train smarter. Recover better.
      </div>

      <div style={{background:"#12121A",padding:30,borderRadius:20,width:"100%",maxWidth:380,border:"1px solid rgba(255,255,255,.06)",animation:mounted?"slideUp .8s ease forwards":"none",opacity:0}}>
        <div style={{fontSize:24,fontWeight:900,marginBottom:6}}>{isSignup?"Join the Slifters":"Welcome back"}</div>
        <div style={{color:"#9ca3af",marginBottom:20}}>{isSignup?"Start your 7-day free trial.":"Your recovery. Your rules."}</div>

        <input style={{width:"100%",padding:14,borderRadius:14,border:"1px solid rgba(255,255,255,.06)",background:"#0A0A0F",color:"#FFF",marginBottom:14,boxSizing:"border-box"}}
          placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}/>
        <input type="password" style={{width:"100%",padding:14,borderRadius:14,border:"1px solid rgba(255,255,255,.06)",background:"#0A0A0F",color:"#FFF",marginBottom:14,boxSizing:"border-box"}}
          placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)}/>
        {isSignup&&<input type="password" style={{width:"100%",padding:14,borderRadius:14,border:"1px solid rgba(255,255,255,.06)",background:"#0A0A0F",color:"#FFF",marginBottom:14,boxSizing:"border-box"}}
          placeholder="Confirm password" value={confirm} onChange={e=>setConfirm(e.target.value)}/>}

        {error&&<div style={{color:"#f97316",marginBottom:12,fontSize:14,animation:"shake .4s ease"}}>{error}</div>}

        <button onClick={handleAuth} disabled={loading}
          style={{width:"100%",padding:16,borderRadius:16,border:"none",fontWeight:900,cursor:"pointer",background:"linear-gradient(135deg,#7B3FF2,#00FF9C)",color:"#0A0A0F",animation:"pulseGlow 2.5s infinite",fontSize:16}}
          onMouseDown={e=>e.currentTarget.style.transform="scale(.97)"}
          onMouseUp={e=>e.currentTarget.style.transform="scale(1)"}>
          {loading?"Loading...":isSignup?"Start for free":"Sign in"}
        </button>

        <div onClick={()=>setMode(isSignup?"signin":"signup")}
          style={{marginTop:18,textAlign:"center",fontSize:14,color:"#9ca3af",cursor:"pointer"}}>
          {isSignup?"Already a Slifter? Sign in →":"New here? Join the Slifters →"}
        </div>
      </div>
    </div>
  );
}
