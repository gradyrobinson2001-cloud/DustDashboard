import { useState } from "react";
import { T, SERVICED_AREAS } from "./shared";

// ═══════════════════════════════════════════════════════════
// CUSTOMER INFO FORM — Standalone (No pricing visible)
// ═══════════════════════════════════════════════════════════

export default function CustomerForm() {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [fd, setFd] = useState({
    name: "", email: "", phone: "", suburb: "",
    bedrooms: 1, bathrooms: 1, living: 1, kitchen: 1,
    frequency: "fortnightly",
    oven: false, sheets: false, windows: false, windowCount: 0, organising: false,
    notes: ""
  });
  const u = (k, v) => setFd({ ...fd, [k]: v });

  const isOutOfArea = fd.suburb === "__other";
  const canProceed1 = fd.name && fd.email && fd.suburb && !isOutOfArea;
  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  const handleSubmit = () => {
    // Store in localStorage so the dashboard (in another tab) picks it up
    localStorage.setItem("db_form_submission", JSON.stringify({ ...fd, submittedAt: new Date().toISOString() }));
    setSubmitted(true);
  };

  const RoomCounter = ({ k, label, icon }) => (
    <div style={{ background: "#fff", borderRadius: T.radiusSm, padding: "16px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", border: `1px solid ${T.borderLight}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{label}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={() => u(k, Math.max(0, fd[k] - 1))} style={minusBtn}>−</button>
        <span style={{ width: 28, textAlign: "center", fontWeight: 800, fontSize: 18, color: T.text }}>{fd[k]}</span>
        <button onClick={() => u(k, fd[k] + 1)} style={plusBtn}>+</button>
      </div>
    </div>
  );

  const AddonToggle = ({ k, label, icon, subtitle, children }) => (
    <div style={{
      borderRadius: T.radiusSm, overflow: "hidden",
      border: fd[k] ? `2px solid ${T.primary}` : `1.5px solid ${T.border}`,
      background: fd[k] ? T.primaryLight : "#fff", transition: "all 0.15s",
    }}>
      <button onClick={() => u(k, !fd[k])} style={{
        display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", width: "100%",
        background: "none", border: "none", cursor: "pointer", textAlign: "left",
      }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{label}</div>
          {subtitle && <div style={{ fontSize: 12, color: T.textMuted, marginTop: 1 }}>{subtitle}</div>}
        </div>
        <div style={{
          width: 24, height: 24, borderRadius: 7,
          border: fd[k] ? `2px solid ${T.primary}` : `1.5px solid ${T.border}`,
          background: fd[k] ? T.primary : "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {fd[k] && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
        </div>
      </button>
      {fd[k] && children}
    </div>
  );

  // ─── Success Screen ───
  if (submitted) {
    return (
      <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
          <div style={{ background: "#fff", borderRadius: T.radiusLg, padding: "48px 40px", boxShadow: T.shadowLg }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: T.primaryLight, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={T.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h2 style={{ margin: "0 0 8px", fontSize: 24, fontWeight: 800, color: T.text }}>You're all set! 🌿</h2>
            <p style={{ margin: "0 0 24px", fontSize: 15, color: T.textMuted, lineHeight: 1.7 }}>
              Thanks so much, {fd.name.split(" ")[0] || "lovely"}! We've got your details and we'll have a personalised quote over to you really soon.
            </p>
            <div style={{ background: T.primaryLight, borderRadius: T.radius, padding: "18px 24px", textAlign: "left" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.primaryDark, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>Your Details</div>
              <div style={{ fontSize: 13, color: T.text, lineHeight: 2 }}>
                📍 {fd.suburb}<br/>
                🛏️ {fd.bedrooms} bed · 🚿 {fd.bathrooms} bath · 🛋️ {fd.living} living · 🍳 {fd.kitchen} kitchen<br/>
                📅 {fd.frequency.charAt(0).toUpperCase() + fd.frequency.slice(1)} clean
                {fd.frequency === "weekly" && <span style={{ color: T.primary, fontWeight: 700 }}> (with discount!)</span>}
                {(fd.oven || fd.sheets || fd.windows || fd.organising) && (
                  <><br/>✨ {[fd.oven && "Oven", fd.sheets && "Sheets", fd.windows && `Windows (${fd.windowCount})`, fd.organising && "Organising"].filter(Boolean).join(", ")}</>
                )}
              </div>
            </div>
            <p style={{ margin: "24px 0 0", fontSize: 13, color: T.textLight }}>Keep an eye on your inbox — we'll be in touch! 💚</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 16px" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 24, marginTop: 16 }}>
        <div style={{ fontSize: 36, marginBottom: 6 }}>🌿</div>
        <h1 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 900, color: T.text, letterSpacing: -0.3 }}>Dust Bunnies Cleaning</h1>
        <p style={{ margin: 0, fontSize: 14, color: T.textMuted }}>Eco-conscious cleaning on the Sunshine Coast</p>
      </div>

      {/* Progress */}
      <div style={{ maxWidth: 520, width: "100%", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          {["Your Details", "Your Home", "Extras & Submit"].map((s, i) => (
            <span key={i} style={{ fontSize: 11, fontWeight: 700, color: step > i ? T.primary : T.textLight, textTransform: "uppercase", letterSpacing: 0.6 }}>{s}</span>
          ))}
        </div>
        <div style={{ height: 6, background: T.borderLight, borderRadius: 3, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${progress}%`, background: `linear-gradient(90deg, ${T.primary}, ${T.blue})`, borderRadius: 3, transition: "width 0.4s ease" }} />
        </div>
      </div>

      {/* Form Card */}
      <div style={{ maxWidth: 520, width: "100%", background: "#fff", borderRadius: T.radiusLg, boxShadow: T.shadowLg, overflow: "hidden" }}>

        {/* Step 1: Contact */}
        {step === 1 && (
          <div style={{ padding: "32px 32px 28px" }}>
            <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 800, color: T.text }}>Let's start with you 👋</h2>
            <p style={{ margin: "0 0 24px", fontSize: 13, color: T.textMuted }}>So we know who to send your quote to</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <Field label="Your Name *" value={fd.name} onChange={v => u("name", v)} placeholder="e.g. Sarah Mitchell" />
              <Field label="Email *" value={fd.email} onChange={v => u("email", v)} placeholder="sarah@email.com" type="email" />
              <Field label="Phone (optional)" value={fd.phone} onChange={v => u("phone", v)} placeholder="04XX XXX XXX" type="tel" />

              <div>
                <label style={labelStyle}>Your Suburb *</label>
                <select value={fd.suburb} onChange={e => u("suburb", e.target.value)}
                  style={{ ...inputStyle, color: fd.suburb ? T.text : T.textLight, appearance: "auto" }}>
                  <option value="">Select your suburb...</option>
                  {SERVICED_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                  <option value="__other">My suburb isn't listed</option>
                </select>

                {isOutOfArea && (
                  <div style={{ marginTop: 10, background: T.dangerLight, borderRadius: T.radiusSm, padding: "14px 16px", borderLeft: `3px solid ${T.danger}` }}>
                    <p style={{ margin: 0, fontSize: 13, color: T.danger, lineHeight: 1.6, fontWeight: 600 }}>
                      We're so sorry! 😔 We currently only service the Maroochydore corridor area. We're growing though, so please check back soon! 💚
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Home */}
        {step === 2 && (
          <div style={{ padding: "32px 32px 28px" }}>
            <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 800, color: T.text }}>Tell us about your home 🏡</h2>
            <p style={{ margin: "0 0 24px", fontSize: 13, color: T.textMuted }}>So we can tailor your clean perfectly</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <RoomCounter k="bedrooms" label="Bedrooms" icon="🛏️" />
              <RoomCounter k="bathrooms" label="Bathrooms" icon="🚿" />
              <RoomCounter k="living" label="Living Rooms" icon="🛋️" />
              <RoomCounter k="kitchen" label="Kitchens" icon="🍳" />
            </div>

            <div style={{ marginTop: 24 }}>
              <label style={{ ...labelStyle, marginBottom: 10 }}>How often would you like us? 📅</label>
              <div style={{ display: "flex", gap: 10 }}>
                {[
                  { id: "weekly", label: "Weekly", sub: null },
                  { id: "fortnightly", label: "Fortnightly", sub: "Most popular" },
                  { id: "monthly", label: "Monthly", sub: null },
                ].map(f => (
                  <button key={f.id} onClick={() => u("frequency", f.id)} style={{
                    flex: 1, padding: "16px 10px", borderRadius: T.radius, cursor: "pointer", textAlign: "center",
                    border: fd.frequency === f.id ? `2.5px solid ${T.primary}` : `1.5px solid ${T.border}`,
                    background: fd.frequency === f.id ? T.primaryLight : "#fff",
                  }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: fd.frequency === f.id ? T.primaryDark : T.text }}>{f.label}</div>
                    {f.id === "weekly" && (
                      <div style={{ marginTop: 6, background: T.accent, color: T.sidebar, padding: "3px 10px", borderRadius: 12, fontSize: 10, fontWeight: 800, display: "inline-block" }}>🎉 SAVE 10%</div>
                    )}
                    {f.sub && <div style={{ marginTop: 6, fontSize: 10, color: T.textMuted, fontWeight: 600 }}>{f.sub}</div>}
                  </button>
                ))}
              </div>
              {fd.frequency === "weekly" && (
                <div style={{ marginTop: 10, background: T.accentLight, borderRadius: T.radiusSm, padding: "10px 14px", textAlign: "center" }}>
                  <span style={{ fontSize: 13, color: "#8B6914", fontWeight: 700 }}>✨ Great choice! You'll save 10% on every clean.</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Extras & Submit */}
        {step === 3 && (
          <div style={{ padding: "32px 32px 28px" }}>
            <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 800, color: T.text }}>Anything extra? ✨</h2>
            <p style={{ margin: "0 0 24px", fontSize: 13, color: T.textMuted }}>Totally optional — just tick what you'd like</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
              <AddonToggle k="oven" label="Oven Clean" icon="♨️" subtitle="Deep clean inside and out" />
              <AddonToggle k="sheets" label="Sheet Changes" icon="🛏️" subtitle="Fresh sheets put on for you" />
              <AddonToggle k="organising" label="Organising" icon="📦" subtitle="Tidy and organise an area" />

              <AddonToggle k="windows" label="Window Cleaning" icon="🪟" subtitle="Sparkling clean inside and out">
                <div style={{ padding: "0 18px 16px", display: "flex", alignItems: "center", gap: 12, marginLeft: 36 }}>
                  <span style={{ fontSize: 13, color: T.textMuted, fontWeight: 600 }}>How many?</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button onClick={() => u("windowCount", Math.max(1, fd.windowCount - 1))} style={{ ...minusBtn, width: 30, height: 30 }}>−</button>
                    <span style={{ width: 28, textAlign: "center", fontWeight: 800, fontSize: 16, color: T.text }}>{fd.windowCount}</span>
                    <button onClick={() => u("windowCount", fd.windowCount + 1)} style={{ ...plusBtn, width: 30, height: 30 }}>+</button>
                  </div>
                </div>
              </AddonToggle>
            </div>

            <div>
              <label style={labelStyle}>Anything else we should know?</label>
              <textarea value={fd.notes} onChange={e => u("notes", e.target.value)} rows={3} placeholder="e.g. We have 2 dogs, please close the front gate..."
                style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6, height: "auto" }} />
            </div>

            {/* Summary */}
            <div style={{ marginTop: 24, background: T.bg, borderRadius: T.radius, padding: "18px 20px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.primaryDark, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>Quick Summary</div>
              <div style={{ fontSize: 13, color: T.text, lineHeight: 2 }}>
                <strong>{fd.name}</strong> · {fd.suburb}<br/>
                🛏️ {fd.bedrooms} bed · 🚿 {fd.bathrooms} bath · 🛋️ {fd.living} living · 🍳 {fd.kitchen} kitchen<br/>
                📅 {fd.frequency.charAt(0).toUpperCase() + fd.frequency.slice(1)}
                {fd.frequency === "weekly" && <span style={{ color: T.primary, fontWeight: 700 }}> (10% off!)</span>}
                {(fd.oven || fd.sheets || fd.windows || fd.organising) && (
                  <><br/>✨ {[fd.oven && "Oven", fd.sheets && "Sheets", fd.windows && `Windows (${fd.windowCount})`, fd.organising && "Organising"].filter(Boolean).join(" · ")}</>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Nav Buttons */}
        <div style={{ padding: "0 32px 28px", display: "flex", gap: 10, justifyContent: "space-between" }}>
          {step > 1 ? (
            <button onClick={() => setStep(step - 1)} style={{ padding: "13px 24px", borderRadius: T.radius, border: `1.5px solid ${T.border}`, background: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", color: T.textMuted }}>
              ← Back
            </button>
          ) : <div />}

          {step < totalSteps ? (
            <button onClick={() => canProceed1 && setStep(step + 1)} disabled={step === 1 && !canProceed1}
              style={{
                padding: "13px 28px", borderRadius: T.radius, border: "none", fontSize: 14, fontWeight: 700,
                cursor: (step === 1 && !canProceed1) ? "not-allowed" : "pointer",
                background: (step === 1 && !canProceed1) ? T.border : T.primary,
                color: (step === 1 && !canProceed1) ? T.textLight : "#fff",
              }}>
              Next →
            </button>
          ) : (
            <button onClick={handleSubmit} style={{
              padding: "13px 28px", borderRadius: T.radius, border: "none", fontSize: 14, fontWeight: 800, cursor: "pointer",
              background: `linear-gradient(135deg, ${T.primary}, ${T.blue})`, color: "#fff",
              boxShadow: `0 4px 16px rgba(74,158,126,0.3)`,
            }}>
              Submit & Get My Quote 🌿
            </button>
          )}
        </div>
      </div>

      <div style={{ marginTop: 24, textAlign: "center" }}>
        <p style={{ fontSize: 12, color: T.textLight }}>🌿 Eco-conscious · ♻️ Sustainable products · 💚 Sunshine Coast local</p>
      </div>
    </div>
  );
}

// ─── Reusable bits ───
const labelStyle = { fontSize: 11, fontWeight: 700, color: "#7A8F85", textTransform: "uppercase", letterSpacing: 0.8, display: "block", marginBottom: 6 };
const inputStyle = { width: "100%", padding: "12px 16px", borderRadius: 8, border: "1.5px solid #E2EBE6", fontSize: 15, color: "#2C3E36", boxSizing: "border-box", outline: "none" };
const minusBtn = { width: 34, height: 34, borderRadius: 10, border: "1.5px solid #E2EBE6", background: "#fff", cursor: "pointer", fontSize: 18, fontWeight: 600, color: "#7A8F85", display: "flex", alignItems: "center", justifyContent: "center" };
const plusBtn = { ...minusBtn, border: "1.5px solid #4A9E7E", background: "#E8F5EE", color: "#4A9E7E" };

function Field({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={inputStyle} />
    </div>
  );
}
