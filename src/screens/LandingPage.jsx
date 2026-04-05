import React, { useMemo, useState } from "react";

export default function LandingPage({ onGetStarted }) {
  const [email, setEmail] = useState("");

  const goToApp = () => {
    if (typeof onGetStarted === "function") onGetStarted();
  };

  const styles = useMemo(() => ({
    page: { minHeight: "100vh", backgroundColor: "#0A0A0F", color: "#FFFFFF", fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' },
    container: { width: "100%", maxWidth: "1180px", margin: "0 auto", padding: "0 20px", boxSizing: "border-box" },
    section: { padding: "72px 0" },
    nav: { position: "sticky", top: 0, zIndex: 20, backdropFilter: "blur(10px)", background: "rgba(10,10,15,0.82)", borderBottom: "1px solid rgba(255,255,255,0.06)" },
    navInner: { display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: "72px" },
    brand: { display: "flex", alignItems: "center", gap: "12px", fontWeight: 800, fontSize: "20px" },
    brandMark: { width: "38px", height: "38px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #7B3FF2 0%, #00FF9C 100%)", color: "#0A0A0F", fontWeight: 900 },
    navCta: { border: "none", background: "linear-gradient(135deg, #7B3FF2 0%, #00FF9C 140%)", color: "#0A0A0F", fontWeight: 800, padding: "12px 18px", borderRadius: "14px", cursor: "pointer", fontSize: "14px" },
    hero: { padding: "84px 0 52px" },
    heroTitle: { fontSize: "clamp(42px, 7vw, 82px)", lineHeight: 0.95, fontWeight: 850, margin: 0, letterSpacing: "-0.04em" },
    heroAccent: { color: "#7B3FF2" },
    heroSubtitle: { marginTop: "22px", color: "#9ca3af", fontSize: "19px", lineHeight: 1.65, maxWidth: "700px" },
    heroMeta: { display: "flex", gap: "18px", flexWrap: "wrap", marginTop: "22px", color: "#9ca3af", fontSize: "14px" },
    primaryButton: { border: "none", background: "linear-gradient(135deg, #7B3FF2 0%, #00FF9C 140%)", color: "#0A0A0F", fontWeight: 800, padding: "16px 22px", borderRadius: "16px", cursor: "pointer", fontSize: "16px" },
    secondaryButton: { border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", color: "#FFFFFF", fontWeight: 700, padding: "16px 22px", borderRadius: "16px", cursor: "pointer", fontSize: "16px" },
    sectionTitle: { fontSize: "clamp(30px, 4vw, 52px)", fontWeight: 820, margin: 0, letterSpacing: "-0.04em" },
    sectionSubtitle: { marginTop: "14px", color: "#9ca3af", fontSize: "18px", lineHeight: 1.65 },
    grid3: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "18px", marginTop: "28px" },
    card: { background: "#12121A", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "24px", padding: "24px" },
    stepNumber: { width: "36px", height: "36px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(123,63,242,0.18)", color: "#7B3FF2", fontWeight: 900, marginBottom: "18px", fontSize: "16px" },
    benefitIcon: { width: "44px", height: "44px", borderRadius: "14px", background: "rgba(0,255,156,0.12)", color: "#00FF9C", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "18px", marginBottom: "18px" },
    cardTitle: { fontSize: "20px", fontWeight: 760, margin: "0 0 10px", letterSpacing: "-0.02em" },
    cardText: { color: "#9ca3af", fontSize: "15px", lineHeight: 1.7, margin: 0 },
    socialCard: { background: "#12121A", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "28px", padding: "28px" },
    socialBadges: { display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "22px" },
    badge: { padding: "10px 14px", borderRadius: "999px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", color: "#FFFFFF", fontSize: "14px", fontWeight: 700 },
    finalCtaCard: { background: "radial-gradient(circle at top left, rgba(123,63,242,0.16) 0%, #12121A 38%)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "28px", padding: "32px" },
    input: { flex: 1, minHeight: "56px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.08)", background: "#0A0A0F", color: "#FFFFFF", padding: "0 18px", fontSize: "16px", outline: "none" },
    footer: { padding: "36px 0 52px", color: "#9ca3af", fontSize: "14px", borderTop: "1px solid rgba(255,255,255,0.06)" },
    footerInner: { display: "flex", justifyContent: "space-between", gap: "16px", flexWrap: "wrap", paddingTop: "20px" },
  }), []);

  return (
    <div style={styles.page}>
      <div style={styles.nav}>
        <div style={styles.container}>
          <div style={styles.navInner}>
            <div style={styles.brand}>
              <div style={styles.brandMark}>S</div>
              SLIFT
            </div>
            <button style={styles.navCta} onClick={goToApp}>Start free — 7 days</button>
          </div>
        </div>
      </div>

      <section style={styles.hero}>
        <div style={styles.container}>
          <h1 style={styles.heroTitle}>
            Train smarter.<br />
            <span style={styles.heroAccent}>Whatever your day throws at you.</span>
          </h1>
          <p style={styles.heroSubtitle}>
            SLIFT adapts your workout to your daily recovery score so you stop guessing and start training with intent. Built for real life — busy schedules, bad nights, and everything in between.
          </p>
          <div style={{ marginTop: 30, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button style={styles.primaryButton} onClick={goToApp}>Start free — 7 days</button>
            <button style={styles.secondaryButton}>See how it works</button>
          </div>
          <div style={styles.heroMeta}>
            <span>2-minute daily check-in</span>
            <span>•</span>
            <span>Recovery-based programming</span>
            <span>•</span>
            <span>For men & women 21+</span>
          </div>
        </div>
      </section>

      <section style={styles.section}>
        <div style={styles.container}>
          <h2 style={styles.sectionTitle}>How SLIFT works</h2>
          <p style={styles.sectionSubtitle}>Three simple steps. No noise, no generic programming.</p>
          <div style={styles.grid3}>
            <div style={styles.card}>
              <div style={styles.stepNumber}>1</div>
              <h3 style={styles.cardTitle}>Morning check-in</h3>
              <p style={styles.cardText}>Rate your sleep, soreness, energy and motivation. Choose your muscle groups and available time. 2 minutes max.</p>
            </div>
            <div style={styles.card}>
              <div style={styles.stepNumber}>2</div>
              <h3 style={styles.cardTitle}>Recovery score</h3>
              <p style={styles.cardText}>SLIFT calculates how ready you are today based on a scientifically weighted formula — not a generic algorithm.</p>
            </div>
            <div style={styles.card}>
              <div style={styles.stepNumber}>3</div>
              <h3 style={styles.cardTitle}>Adapted session</h3>
              <p style={styles.cardText}>Your workout adjusts to your actual condition. Volume, intensity, and exercises matched to your day.</p>
            </div>
          </div>
        </div>
      </section>

      <section style={styles.section}>
        <div style={styles.container}>
          <h2 style={styles.sectionTitle}>Why SLIFT</h2>
          <p style={styles.sectionSubtitle}>The point is not to train less. The point is to train better.</p>
          <div style={styles.grid3}>
            <div style={styles.card}>
              <div style={styles.benefitIcon}>01</div>
              <h3 style={styles.cardTitle}>No more wasted sessions</h3>
              <p style={styles.cardText}>Bad sleep, work stress, family chaos. SLIFT adjusts before you burn energy you do not have.</p>
            </div>
            <div style={styles.card}>
              <div style={styles.benefitIcon}>02</div>
              <h3 style={styles.cardTitle}>No more missed potential</h3>
              <p style={styles.cardText}>When your body is ready, SLIFT lets you capitalize on it instead of serving the same flat session.</p>
            </div>
            <div style={styles.card}>
              <div style={styles.benefitIcon}>03</div>
              <h3 style={styles.cardTitle}>A program that fits your life</h3>
              <p style={styles.cardText}>For professionals, parents, shift workers — anyone who trains seriously but does not live inside a perfect routine.</p>
            </div>
          </div>
        </div>
      </section>

      <section style={styles.section}>
        <div style={styles.container}>
          <div style={styles.socialCard}>
            <h2 style={styles.sectionTitle}>Join the Slifters</h2>
            <p style={styles.sectionSubtitle}>Built for people who want intelligent training in the middle of real life.</p>
            <div style={styles.socialBadges}>
              <div style={styles.badge}>Busy professionals</div>
              <div style={styles.badge}>Parents who still train</div>
              <div style={styles.badge}>Shift workers</div>
              <div style={styles.badge}>Men & women 21+</div>
              <div style={styles.badge}>Recovery-based training</div>
            </div>
          </div>
        </div>
      </section>

      <section style={styles.section}>
        <div style={styles.container}>
          <div style={styles.finalCtaCard}>
            <h2 style={styles.sectionTitle}>Get early access to SLIFT</h2>
            <p style={styles.sectionSubtitle}>Be among the first to train based on real recovery.<br />Smarter training starts here.</p>
            <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
              <input style={styles.input} type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <button style={styles.primaryButton} onClick={goToApp}>Get early access</button>
            </div>
          </div>
        </div>
      </section>

      <footer style={styles.footer}>
        <div style={styles.container}>
          <div style={styles.footerInner}>
            <div>© 2026 SLIFT</div>
            <div>Train smart. Recover better. Build consistency.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
