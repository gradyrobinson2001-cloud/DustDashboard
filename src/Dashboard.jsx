import { useState, useEffect, useRef, useCallback } from "react";
import { T, SERVICED_AREAS, PRICING, WEEKLY_DISCOUNT, calcQuote, generateMockEnquiry, generateMockFormSubmission, getInitialEnquiries, getInitialQuotes } from "./shared";

// ═══════════════════════════════════════════════════════════
// DUST BUNNIES CLEANING — Admin Dashboard (Functional Demo)
// ═══════════════════════════════════════════════════════════

// ─── Channel Icons ───
const ChannelIcon = ({ ch, size = 16 }) => {
  const colors = { messenger: "#0084FF", instagram: "#E1306C", email: "#5B9EC4" };
  const labels = { messenger: "M", instagram: "IG", email: "@" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: size + 8, height: size + 8, borderRadius: 6, background: colors[ch] || "#999", color: "#fff", fontSize: size * 0.55, fontWeight: 800 }}>
      {labels[ch] || "?"}
    </span>
  );
};

// ─── Status Badge ───
const StatusBadge = ({ status }) => {
  const map = {
    new: { bg: "#E6F0F7", color: "#3B82A0", label: "New" },
    info_requested: { bg: "#FFF8E7", color: "#8B6914", label: "Info Requested" },
    info_received: { bg: "#E8F5EE", color: "#2D7A5E", label: "Info Received" },
    quote_ready: { bg: "#E8F5EE", color: "#2D7A5E", label: "Quote Ready" },
    quote_sent: { bg: T.primaryLight, color: T.primaryDark, label: "Quote Sent" },
    accepted: { bg: "#D4EDDA", color: "#155724", label: "Accepted ✓" },
    declined: { bg: "#FDF0EF", color: "#D4645C", label: "Declined" },
    out_of_area: { bg: "#FDF0EF", color: "#D4645C", label: "Out of Area" },
    pending_approval: { bg: "#FFF8E7", color: "#8B6914", label: "Pending Approval" },
    sent: { bg: T.primaryLight, color: T.primaryDark, label: "Sent" },
  };
  const s = map[status] || { bg: "#eee", color: "#666", label: status };
  return (
    <span style={{ padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color, whiteSpace: "nowrap" }}>
      {s.label}
    </span>
  );
};

// ─── Toast ───
function Toast({ message, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, background: T.sidebar, color: "#fff", padding: "14px 24px", borderRadius: T.radius, boxShadow: T.shadowLg, fontSize: 14, fontWeight: 600, zIndex: 9999, animation: "slideUp 0.3s ease" }}>
      {message}
    </div>
  );
}

// ─── Modal ───
function Modal({ title, onClose, children, wide }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(27,58,45,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: T.radiusLg, padding: "28px 32px", maxWidth: wide ? 700 : 500, width: "100%", maxHeight: "85vh", overflow: "auto", boxShadow: T.shadowLg }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: T.text }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: T.textMuted, padding: 4 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [page, setPage] = useState("inbox");
  const [enquiries, setEnquiries] = useState(getInitialEnquiries);
  const [quotes, setQuotes] = useState(getInitialQuotes);
  const [pricing, setPricing] = useState(PRICING);
  const [filter, setFilter] = useState("all");
  const [toast, setToast] = useState(null);
  const [demoMode, setDemoMode] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [editQuoteModal, setEditQuoteModal] = useState(null);
  const [editPriceModal, setEditPriceModal] = useState(null);
  const [previewQuote, setPreviewQuote] = useState(null);
  const demoInterval = useRef(null);
  const quoteCounter = useRef(3);

  const showToast = useCallback((msg) => setToast(msg), []);

  // ─── Demo Mode: simulate incoming enquiries ───
  useEffect(() => {
    if (demoMode) {
      demoInterval.current = setInterval(() => {
        const newEnq = generateMockEnquiry();
        setEnquiries(prev => [newEnq, ...prev]);
        showToast(`📩 New ${newEnq.channel} message from ${newEnq.name}`);
      }, 6000);
    } else {
      clearInterval(demoInterval.current);
    }
    return () => clearInterval(demoInterval.current);
  }, [demoMode, showToast]);

  // ─── Cross-tab: listen for customer form submissions ───
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "db_form_submission") {
        try {
          const data = JSON.parse(e.newValue);
          const enq = {
            id: Date.now(),
            name: data.name, channel: "email", suburb: data.suburb,
            message: `Form submitted: ${data.bedrooms} bed, ${data.bathrooms} bath, ${data.frequency} clean`,
            status: "info_received",
            timestamp: new Date().toISOString(),
            avatar: data.name.split(" ").map(n => n[0]).join(""),
            details: data, quoteId: null,
          };
          setEnquiries(prev => [enq, ...prev]);
          showToast(`📋 New form submission from ${data.name}!`);
        } catch (_) {}
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [showToast]);

  // ─── Actions ───
  const sendInfoForm = (enqId) => {
    setEnquiries(prev => prev.map(e => e.id === enqId ? { ...e, status: "info_requested" } : e));
    showToast("📤 Info form link sent!");
  };

  const simulateInfoReceived = (enqId) => {
    const mock = generateMockFormSubmission();
    setEnquiries(prev => prev.map(e => e.id === enqId ? { ...e, status: "info_received", details: { ...mock, name: e.name, suburb: e.suburb } } : e));
    showToast(`📋 Details received from customer`);
  };

  const generateQuote = (enqId) => {
    const enq = enquiries.find(e => e.id === enqId);
    if (!enq || !enq.details) return;
    const qId = `Q${String(quoteCounter.current++).padStart(3, "0")}`;
    const q = {
      id: qId, enquiryId: enqId, name: enq.name, channel: enq.channel, suburb: enq.suburb,
      frequency: enq.details.frequency.charAt(0).toUpperCase() + enq.details.frequency.slice(1),
      status: "pending_approval", createdAt: new Date().toISOString(), details: { ...enq.details },
    };
    setQuotes(prev => [q, ...prev]);
    setEnquiries(prev => prev.map(e => e.id === enqId ? { ...e, status: "quote_ready", quoteId: qId } : e));
    showToast(`💰 Quote ${qId} generated — review & approve`);
  };

  const approveQuote = (qId) => {
    setQuotes(prev => prev.map(q => q.id === qId ? { ...q, status: "sent" } : q));
    const q = quotes.find(q => q.id === qId);
    if (q) {
      setEnquiries(prev => prev.map(e => e.id === q.enquiryId ? { ...e, status: "quote_sent" } : e));
    }
    showToast(`✅ Quote ${qId} approved & sent!`);
  };

  const markAccepted = (qId) => {
    setQuotes(prev => prev.map(q => q.id === qId ? { ...q, status: "accepted" } : q));
    const q = quotes.find(q => q.id === qId);
    if (q) {
      setEnquiries(prev => prev.map(e => e.id === q.enquiryId ? { ...e, status: "accepted" } : e));
    }
    showToast(`🎉 Quote accepted — new client!`);
  };

  const declineOutOfArea = (enqId) => {
    setEnquiries(prev => prev.map(e => e.id === enqId ? { ...e, status: "out_of_area" } : e));
    showToast("📍 Out-of-area reply sent");
  };

  // ─── Filtered Enquiries ───
  const filtered = filter === "all" ? enquiries : enquiries.filter(e => {
    if (filter === "new") return e.status === "new";
    if (filter === "awaiting") return e.status === "info_requested";
    if (filter === "received") return e.status === "info_received";
    if (filter === "quote_ready") return e.status === "quote_ready";
    if (filter === "sent") return e.status === "quote_sent";
    if (filter === "accepted") return e.status === "accepted";
    if (filter === "out") return e.status === "out_of_area";
    return true;
  });

  const pendingQuotes = quotes.filter(q => q.status === "pending_approval");
  const sentQuotes = quotes.filter(q => q.status === "sent" || q.status === "accepted");

  // ─── Sidebar Items ───
  const navItems = [
    { id: "inbox", label: "Inbox", icon: "📥", badge: enquiries.filter(e => ["new", "info_received", "quote_ready"].includes(e.status)).length },
    { id: "quotes", label: "Quotes", icon: "💰", badge: pendingQuotes.length },
    { id: "form", label: "Customer Form", icon: "📋", badge: 0 },
    { id: "pricing", label: "Pricing", icon: "⚙️", badge: 0 },
  ];

  const formUrl = typeof window !== "undefined" ? window.location.origin + "/form" : "/form";

  // ─── Time Ago ───
  const timeAgo = (ts) => {
    const diff = (Date.now() - new Date(ts)) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* ═══ Sidebar ═══ */}
      <div style={{ width: 240, background: T.sidebar, padding: "24px 16px", display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 28, marginBottom: 4 }}>🌿</div>
          <h2 style={{ color: "#fff", fontSize: 16, fontWeight: 800, margin: 0 }}>Dust Bunnies</h2>
          <p style={{ color: "#8FBFA8", fontSize: 11, margin: "2px 0 0" }}>Admin Dashboard</p>
        </div>

        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
          {navItems.map(n => (
            <button key={n.id} onClick={() => setPage(n.id)} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: T.radiusSm,
              background: page === n.id ? "rgba(255,255,255,0.12)" : "transparent",
              border: "none", cursor: "pointer", color: page === n.id ? "#fff" : "#8FBFA8", fontSize: 14, fontWeight: 600,
              textAlign: "left", width: "100%", transition: "all 0.15s",
            }}>
              <span style={{ fontSize: 18 }}>{n.icon}</span>
              <span style={{ flex: 1 }}>{n.label}</span>
              {n.badge > 0 && (
                <span style={{ background: T.accent, color: T.sidebar, padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 800 }}>{n.badge}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Demo Mode Toggle */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 16, marginTop: 16 }}>
          <button onClick={() => setDemoMode(!demoMode)} style={{
            width: "100%", padding: "10px 14px", borderRadius: T.radiusSm, border: "none", cursor: "pointer",
            background: demoMode ? T.accent : "rgba(255,255,255,0.08)", color: demoMode ? T.sidebar : "#8FBFA8",
            fontSize: 13, fontWeight: 700, textAlign: "center", transition: "all 0.2s",
          }}>
            {demoMode ? "🎬 Demo Running..." : "🎬 Start Demo Mode"}
          </button>
          {demoMode && <p style={{ color: T.accent, fontSize: 10, textAlign: "center", marginTop: 6 }}>New enquiries arriving...</p>}
        </div>
      </div>

      {/* ═══ Main Content ═══ */}
      <div style={{ flex: 1, padding: 28, maxWidth: 960 }}>

        {/* ─── INBOX PAGE ─── */}
        {page === "inbox" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: T.text }}>Inbox</h1>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: T.textMuted }}>{enquiries.length} total enquiries</p>
              </div>
            </div>

            {/* Filters */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
              {[
                { id: "all", label: "All" }, { id: "new", label: "New" }, { id: "awaiting", label: "Awaiting Info" },
                { id: "received", label: "Info Received" }, { id: "quote_ready", label: "Quote Ready" },
                { id: "sent", label: "Quote Sent" }, { id: "accepted", label: "Accepted" }, { id: "out", label: "Out of Area" },
              ].map(f => (
                <button key={f.id} onClick={() => setFilter(f.id)} style={{
                  padding: "6px 14px", borderRadius: 20, border: filter === f.id ? `2px solid ${T.primary}` : `1.5px solid ${T.border}`,
                  background: filter === f.id ? T.primaryLight : "#fff", color: filter === f.id ? T.primaryDark : T.textMuted,
                  fontSize: 12, fontWeight: 700, cursor: "pointer",
                }}>
                  {f.label}
                </button>
              ))}
            </div>

            {/* Enquiry Cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {filtered.map(e => (
                <div key={e.id} style={{ background: "#fff", borderRadius: T.radius, padding: "18px 20px", boxShadow: T.shadow, borderLeft: e.status === "new" ? `4px solid ${T.blue}` : e.status === "info_received" ? `4px solid ${T.accent}` : "4px solid transparent" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                    {/* Avatar */}
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: `linear-gradient(135deg, ${T.primary}, ${T.blue})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 14, flexShrink: 0 }}>
                      {e.avatar}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 800, fontSize: 15, color: T.text }}>{e.name}</span>
                        <ChannelIcon ch={e.channel} />
                        <span style={{ fontSize: 12, color: T.textLight }}>📍 {e.suburb}</span>
                        <span style={{ fontSize: 11, color: T.textLight, marginLeft: "auto" }}>{timeAgo(e.timestamp)}</span>
                      </div>
                      <p style={{ margin: "0 0 10px", fontSize: 13, color: T.textMuted, lineHeight: 1.5 }}>{e.message}</p>

                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <StatusBadge status={e.status} />

                        {/* Action Buttons */}
                        {e.status === "new" && !SERVICED_AREAS.includes(e.suburb) && (
                          <button onClick={() => declineOutOfArea(e.id)} style={actionBtn("#FDF0EF", T.danger)}>📍 Decline — Out of Area</button>
                        )}
                        {e.status === "new" && SERVICED_AREAS.includes(e.suburb) && (
                          <button onClick={() => sendInfoForm(e.id)} style={actionBtn(T.blueLight, T.blue)}>📤 Send Info Form</button>
                        )}
                        {e.status === "info_requested" && (
                          <button onClick={() => simulateInfoReceived(e.id)} style={actionBtn(T.accentLight, "#8B6914")}>⏳ Simulate Info Received</button>
                        )}
                        {e.status === "info_received" && !e.quoteId && (
                          <button onClick={() => generateQuote(e.id)} style={actionBtn(T.primaryLight, T.primaryDark)}>💰 Generate Quote</button>
                        )}
                        {e.status === "quote_ready" && (
                          <button onClick={() => { setPage("quotes"); }} style={actionBtn(T.primaryLight, T.primaryDark)}>👁️ Review Quote</button>
                        )}
                        {e.details && (
                          <button onClick={() => setSelectedEnquiry(e)} style={actionBtn(T.borderLight, T.textMuted)}>📋 View Details</button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div style={{ textAlign: "center", padding: 60, color: T.textLight }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                  <p style={{ fontSize: 15 }}>No enquiries match this filter</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* ─── QUOTES PAGE ─── */}
        {page === "quotes" && (
          <>
            <h1 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 900, color: T.text }}>Quotes</h1>
            <p style={{ margin: "0 0 24px", fontSize: 13, color: T.textMuted }}>{quotes.length} total quotes</p>

            {/* Pending Approval */}
            {pendingQuotes.length > 0 && (
              <>
                <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: T.accent, textTransform: "uppercase", letterSpacing: 0.8 }}>⏳ Pending Your Approval</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 32 }}>
                  {pendingQuotes.map(q => {
                    const calc = calcQuote(q.details, pricing);
                    return (
                      <div key={q.id} style={{ background: "#fff", borderRadius: T.radiusLg, padding: "24px 28px", boxShadow: T.shadowMd, borderTop: `3px solid ${T.accent}` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontWeight: 800, fontSize: 16, color: T.text }}>{q.name}</span>
                            <ChannelIcon ch={q.channel} />
                            <span style={{ fontSize: 12, color: T.textLight }}>📍 {q.suburb}</span>
                          </div>
                          <div style={{ fontSize: 28, fontWeight: 900, color: T.primary }}>${calc.total.toFixed(2)}</div>
                        </div>

                        {/* Line items */}
                        <div style={{ background: T.bg, borderRadius: T.radiusSm, padding: "14px 16px", marginBottom: 14, fontSize: 13 }}>
                          {calc.items.map((item, i) => (
                            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", color: T.textMuted }}>
                              <span>{item.description} × {item.qty}</span>
                              <span style={{ fontWeight: 700, color: T.text }}>${item.total.toFixed(2)}</span>
                            </div>
                          ))}
                          {calc.discountLabel && (
                            <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", color: T.primaryDark, fontWeight: 700, borderTop: `1px solid ${T.border}`, marginTop: 6, paddingTop: 8 }}>
                              <span>{calc.discountLabel}</span>
                              <span>-${calc.discount.toFixed(2)}</span>
                            </div>
                          )}
                        </div>

                        <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 14 }}>
                          📅 {q.frequency} clean · Quote #{q.id}
                        </div>

                        {/* AI Message Preview */}
                        <div style={{ background: T.blueLight, borderRadius: T.radiusSm, padding: "12px 16px", marginBottom: 16 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: T.blue, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>💬 Message preview</div>
                          <p style={{ margin: 0, fontSize: 13, color: T.text, lineHeight: 1.6 }}>
                            Hey {q.name.split(" ")[0]}! 🌿 Thanks so much for your details! We've put together a personalised quote for your {q.details.bedrooms}-bed, {q.details.bathrooms}-bath home in {q.suburb}. Your {q.frequency.toLowerCase()} clean comes to <strong>${calc.total.toFixed(2)}</strong> per visit{calc.discountLabel ? " (with your 10% weekly discount! 🎉)" : ""}. Have a look at the attached quote and let us know if you'd like to go ahead! 💚
                          </p>
                        </div>

                        <div style={{ display: "flex", gap: 10 }}>
                          <button onClick={() => setEditQuoteModal(q)} style={{ padding: "10px 18px", borderRadius: T.radiusSm, border: `1.5px solid ${T.border}`, background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700, color: T.textMuted }}>
                            ✏️ Modify
                          </button>
                          <button onClick={() => setPreviewQuote(q)} style={{ padding: "10px 18px", borderRadius: T.radiusSm, border: `1.5px solid ${T.primary}`, background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700, color: T.primary }}>
                            👁️ Preview Quote
                          </button>
                          <button onClick={() => approveQuote(q.id)} style={{ padding: "10px 18px", borderRadius: T.radiusSm, border: "none", background: `linear-gradient(135deg, ${T.primary}, ${T.blue})`, cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#fff", boxShadow: "0 2px 8px rgba(74,158,126,0.3)" }}>
                            ✅ Approve & Send
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Sent / Accepted Quotes */}
            {sentQuotes.length > 0 && (
              <>
                <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.8 }}>Sent & Accepted</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {sentQuotes.map(q => {
                    const calc = calcQuote(q.details, pricing);
                    return (
                      <div key={q.id} style={{ background: "#fff", borderRadius: T.radius, padding: "16px 20px", boxShadow: T.shadow, display: "flex", alignItems: "center", gap: 14 }}>
                        <ChannelIcon ch={q.channel} size={14} />
                        <span style={{ fontWeight: 700, fontSize: 14, color: T.text, minWidth: 130 }}>{q.name}</span>
                        <span style={{ fontSize: 12, color: T.textLight }}>📍 {q.suburb}</span>
                        <span style={{ fontSize: 12, color: T.textMuted }}>{q.frequency}</span>
                        <span style={{ fontWeight: 800, fontSize: 15, color: T.primary, marginLeft: "auto" }}>${calc.total.toFixed(2)}</span>
                        <StatusBadge status={q.status} />
                        {q.status === "sent" && (
                          <button onClick={() => markAccepted(q.id)} style={{ padding: "6px 12px", borderRadius: 8, border: "none", background: "#D4EDDA", color: "#155724", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                            Mark Accepted
                          </button>
                        )}
                        <button onClick={() => setPreviewQuote(q)} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", color: T.textMuted }}>View</button>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {quotes.length === 0 && (
              <div style={{ textAlign: "center", padding: 60, color: T.textLight }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>💰</div>
                <p>No quotes yet — they'll appear when you generate them from the inbox</p>
              </div>
            )}
          </>
        )}

        {/* ─── CUSTOMER FORM PAGE ─── */}
        {page === "form" && (
          <>
            <h1 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 900, color: T.text }}>Customer Form</h1>
            <p style={{ margin: "0 0 24px", fontSize: 13, color: T.textMuted }}>This is the form your customers will fill in. Share the link below.</p>

            <div style={{ background: "#fff", borderRadius: T.radiusLg, padding: "28px 32px", boxShadow: T.shadowMd, marginBottom: 24 }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 800, color: T.text }}>📎 Shareable Form Link</h3>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ flex: 1, padding: "12px 16px", borderRadius: T.radiusSm, background: T.bg, border: `1.5px solid ${T.border}`, fontSize: 14, color: T.primary, fontWeight: 600, wordBreak: "break-all" }}>
                  {formUrl}
                </div>
                <button onClick={() => { navigator.clipboard?.writeText(formUrl); showToast("📋 Link copied!"); }}
                  style={{ padding: "12px 20px", borderRadius: T.radiusSm, border: "none", background: T.primary, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>
                  Copy Link
                </button>
                <a href="/form" target="_blank" rel="noopener noreferrer"
                  style={{ padding: "12px 20px", borderRadius: T.radiusSm, border: `1.5px solid ${T.primary}`, background: "#fff", color: T.primary, fontWeight: 700, fontSize: 13, cursor: "pointer", textDecoration: "none", whiteSpace: "nowrap" }}>
                  Open Form ↗
                </a>
              </div>
              <p style={{ margin: "12px 0 0", fontSize: 12, color: T.textMuted }}>💡 Tip: Open the form in a new tab. When you submit it, watch the enquiry appear in your Inbox!</p>
            </div>

            <div style={{ background: T.blueLight, borderRadius: T.radius, padding: "20px 24px" }}>
              <h4 style={{ margin: "0 0 8px", fontWeight: 700, color: T.blue }}>How it works</h4>
              <div style={{ fontSize: 13, color: T.text, lineHeight: 2 }}>
                1️⃣ Customer clicks the link (from your auto-reply message)<br />
                2️⃣ They fill in their details, room counts, frequency & add-ons<br />
                3️⃣ Submission appears in your Inbox with status "Info Received"<br />
                4️⃣ You click "Generate Quote" → review → approve & send<br />
                5️⃣ Customer receives a branded quote via their channel (email PDF / social image)
              </div>
            </div>
          </>
        )}

        {/* ─── PRICING PAGE ─── */}
        {page === "pricing" && (
          <>
            <h1 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 900, color: T.text }}>Pricing</h1>
            <p style={{ margin: "0 0 24px", fontSize: 13, color: T.textMuted }}>Manage your service prices. Changes apply to all new quotes.</p>

            <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.8 }}>Room Pricing</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14, marginBottom: 28 }}>
              {["bedroom", "bathroom", "living", "kitchen"].map(k => (
                <div key={k} style={{ background: "#fff", borderRadius: T.radius, padding: "20px", boxShadow: T.shadow, textAlign: "center" }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{pricing[k].icon}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 2 }}>{pricing[k].label}</div>
                  <div style={{ fontSize: 11, color: T.textLight, marginBottom: 10 }}>{pricing[k].unit}</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: T.primary }}>${pricing[k].price}</div>
                  <button onClick={() => setEditPriceModal(k)} style={{ marginTop: 12, padding: "6px 16px", borderRadius: 8, border: `1.5px solid ${T.border}`, background: "#fff", fontSize: 12, fontWeight: 700, color: T.textMuted, cursor: "pointer" }}>
                    Edit
                  </button>
                </div>
              ))}
            </div>

            <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.8 }}>Add-on Pricing</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14, marginBottom: 28 }}>
              {["oven", "sheets", "windows", "organising"].map(k => (
                <div key={k} style={{ background: "#fff", borderRadius: T.radius, padding: "20px", boxShadow: T.shadow, textAlign: "center" }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{pricing[k].icon}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 2 }}>{pricing[k].label}</div>
                  <div style={{ fontSize: 11, color: T.textLight, marginBottom: 10 }}>{pricing[k].unit}</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: T.blue }}>${pricing[k].price}</div>
                  <button onClick={() => setEditPriceModal(k)} style={{ marginTop: 12, padding: "6px 16px", borderRadius: 8, border: `1.5px solid ${T.border}`, background: "#fff", fontSize: 12, fontWeight: 700, color: T.textMuted, cursor: "pointer" }}>
                    Edit
                  </button>
                </div>
              ))}
            </div>

            {/* Info cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div style={{ background: T.accentLight, borderRadius: T.radius, padding: "18px 22px" }}>
                <h4 style={{ margin: "0 0 6px", fontWeight: 700, color: "#8B6914" }}>🎉 Weekly Discount</h4>
                <p style={{ margin: 0, fontSize: 13, color: T.text }}>10% automatically applied to all weekly bookings</p>
              </div>
              <div style={{ background: T.primaryLight, borderRadius: T.radius, padding: "18px 22px" }}>
                <h4 style={{ margin: "0 0 6px", fontWeight: 700, color: T.primaryDark }}>📍 Service Areas</h4>
                <p style={{ margin: 0, fontSize: 13, color: T.text }}>{SERVICED_AREAS.join(", ")}</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ═══ MODALS ═══ */}

      {/* Enquiry Details Modal */}
      {selectedEnquiry && (
        <Modal title={`${selectedEnquiry.name}'s Details`} onClose={() => setSelectedEnquiry(null)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 14 }}>
            {selectedEnquiry.details && Object.entries({
              "Bedrooms": selectedEnquiry.details.bedrooms,
              "Bathrooms": selectedEnquiry.details.bathrooms,
              "Living Rooms": selectedEnquiry.details.living,
              "Kitchens": selectedEnquiry.details.kitchen,
              "Frequency": selectedEnquiry.details.frequency,
              "Oven Clean": selectedEnquiry.details.oven ? "Yes" : "No",
              "Sheet Changes": selectedEnquiry.details.sheets ? "Yes" : "No",
              "Windows": selectedEnquiry.details.windows ? `Yes (${selectedEnquiry.details.windowCount})` : "No",
              "Organising": selectedEnquiry.details.organising ? "Yes" : "No",
            }).map(([k, v]) => (
              <div key={k}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>{k}</div>
                <div style={{ fontWeight: 700, color: T.text }}>{v}</div>
              </div>
            ))}
          </div>
          {selectedEnquiry.details?.notes && (
            <div style={{ marginTop: 16, padding: "12px 16px", background: T.bg, borderRadius: T.radiusSm }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, marginBottom: 4 }}>NOTES</div>
              <div style={{ fontSize: 13, color: T.text }}>{selectedEnquiry.details.notes}</div>
            </div>
          )}
        </Modal>
      )}

      {/* Edit Quote Modal */}
      {editQuoteModal && (
        <EditQuoteModal
          quote={editQuoteModal}
          pricing={pricing}
          onSave={(updated) => {
            setQuotes(prev => prev.map(q => q.id === updated.id ? updated : q));
            setEditQuoteModal(null);
            showToast("✏️ Quote updated");
          }}
          onClose={() => setEditQuoteModal(null)}
        />
      )}

      {/* Edit Price Modal */}
      {editPriceModal && (
        <EditPriceModal
          serviceKey={editPriceModal}
          pricing={pricing}
          onSave={(key, newPrice) => {
            setPricing(prev => ({ ...prev, [key]: { ...prev[key], price: newPrice } }));
            setEditPriceModal(null);
            showToast(`💰 ${pricing[editPriceModal].label} price updated to $${newPrice}`);
          }}
          onClose={() => setEditPriceModal(null)}
        />
      )}

      {/* Quote Preview Modal */}
      {previewQuote && (
        <Modal title="Quote Preview" onClose={() => setPreviewQuote(null)} wide>
          <QuotePreviewInline quote={previewQuote} pricing={pricing} />
          <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
            <a href={`/quote/${previewQuote.id}?data=${encodeURIComponent(JSON.stringify({ ...previewQuote, pricing }))}`} target="_blank" rel="noopener noreferrer"
              style={{ flex: 1, display: "block", padding: "12px", borderRadius: T.radiusSm, background: T.primary, color: "#fff", textAlign: "center", fontWeight: 700, fontSize: 13, textDecoration: "none" }}>
              📄 Open Full Quote Page ↗
            </a>
            <button onClick={() => setPreviewQuote(null)} style={{ padding: "12px 20px", borderRadius: T.radiusSm, border: `1.5px solid ${T.border}`, background: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", color: T.textMuted }}>
              Close
            </button>
          </div>
        </Modal>
      )}

      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      <style>{`
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        button:hover:not(:disabled) { opacity: 0.9; }
      `}</style>
    </div>
  );
}

// ─── Helper: action button style ───
function actionBtn(bg, color) {
  return {
    padding: "5px 12px", borderRadius: 8, border: "none", background: bg,
    color, fontSize: 11, fontWeight: 700, cursor: "pointer",
  };
}

// ─── Edit Quote Modal Component ───
function EditQuoteModal({ quote, pricing, onSave, onClose }) {
  const [details, setDetails] = useState({ ...quote.details });
  const u = (k, v) => setDetails(prev => ({ ...prev, [k]: v }));
  const calc = calcQuote(details, pricing);

  return (
    <Modal title={`Edit Quote — ${quote.name}`} onClose={onClose}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        {[
          { k: "bedrooms", l: "Bedrooms" }, { k: "bathrooms", l: "Bathrooms" },
          { k: "living", l: "Living Rooms" }, { k: "kitchen", l: "Kitchens" },
        ].map(r => (
          <div key={r.k}>
            <label style={{ fontSize: 11, fontWeight: 700, color: T.textMuted }}>{r.l}</label>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
              <button onClick={() => u(r.k, Math.max(0, details[r.k] - 1))} style={counterBtn}>−</button>
              <span style={{ fontWeight: 800, fontSize: 16 }}>{details[r.k]}</span>
              <button onClick={() => u(r.k, details[r.k] + 1)} style={counterBtnPlus}>+</button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: T.textMuted }}>Frequency</label>
        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          {["weekly", "fortnightly", "monthly"].map(f => (
            <button key={f} onClick={() => u("frequency", f)} style={{
              padding: "8px 16px", borderRadius: 8, border: details.frequency === f ? `2px solid ${T.primary}` : `1.5px solid ${T.border}`,
              background: details.frequency === f ? T.primaryLight : "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer",
              color: details.frequency === f ? T.primaryDark : T.textMuted,
            }}>
              {f.charAt(0).toUpperCase() + f.slice(1)} {f === "weekly" && "(-10%)"}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: T.bg, borderRadius: T.radiusSm, padding: "14px 16px", marginBottom: 16 }}>
        <div style={{ fontWeight: 700, color: T.text, marginBottom: 4 }}>Updated Total: <span style={{ fontSize: 22, color: T.primary }}>${calc.total.toFixed(2)}</span></div>
        {calc.discountLabel && <div style={{ fontSize: 12, color: T.primaryDark }}>Includes {calc.discountLabel}</div>}
      </div>

      <button onClick={() => onSave({ ...quote, details, frequency: details.frequency.charAt(0).toUpperCase() + details.frequency.slice(1) })}
        style={{ width: "100%", padding: "12px", borderRadius: T.radiusSm, border: "none", background: T.primary, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
        Save Changes
      </button>
    </Modal>
  );
}

const counterBtn = { width: 32, height: 32, borderRadius: 8, border: `1.5px solid #E2EBE6`, background: "#fff", cursor: "pointer", fontSize: 16, fontWeight: 600, color: "#7A8F85", display: "flex", alignItems: "center", justifyContent: "center" };
const counterBtnPlus = { ...counterBtn, border: `1.5px solid #4A9E7E`, background: "#E8F5EE", color: "#4A9E7E" };

// ─── Edit Price Modal ───
function EditPriceModal({ serviceKey, pricing, onSave, onClose }) {
  const [price, setPrice] = useState(pricing[serviceKey].price);
  return (
    <Modal title={`Edit ${pricing[serviceKey].label} Price`} onClose={onClose}>
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: T.textMuted }}>Price ($)</label>
        <input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} min={0} step={5}
          style={{ width: "100%", padding: "12px 16px", borderRadius: 8, border: `1.5px solid ${T.border}`, fontSize: 20, fontWeight: 800, marginTop: 6, color: T.primary }} />
      </div>
      <button onClick={() => onSave(serviceKey, price)}
        style={{ width: "100%", padding: "12px", borderRadius: 8, border: "none", background: T.primary, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
        Update Price
      </button>
    </Modal>
  );
}

// ─── Inline Quote Preview ───
function QuotePreviewInline({ quote, pricing }) {
  const calc = calcQuote(quote.details, pricing);
  const isEmail = quote.channel === "email";

  return (
    <div style={{ borderRadius: T.radius, overflow: "hidden", border: `1px solid ${T.border}` }}>
      {/* Header */}
      <div style={{ background: T.sidebar, padding: "20px 24px", color: "#fff" }}>
        <div style={{ fontSize: 20, fontWeight: 800 }}>🌿 Dust Bunnies Cleaning</div>
        <div style={{ fontSize: 12, color: "#8FBFA8", marginTop: 2 }}>Eco-conscious cleaning | Sunshine Coast</div>
      </div>
      <div style={{ background: T.primary, padding: "8px 24px", color: "#fff", fontSize: 12, fontWeight: 700, display: "flex", justifyContent: "space-between" }}>
        <span>CLEANING QUOTE</span><span>#{quote.id}</span>
      </div>

      <div style={{ padding: "20px 24px" }}>
        {/* Customer */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase" }}>Prepared For</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: T.text }}>{quote.name}</div>
            <div style={{ fontSize: 12, color: T.textMuted }}>{quote.suburb}, Sunshine Coast</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase" }}>Frequency</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: T.primaryDark }}>
              {quote.frequency} {quote.details.frequency === "weekly" && <span style={{ background: T.accentLight, padding: "2px 8px", borderRadius: 8, fontSize: 10, color: "#8B6914" }}>SAVE 10%</span>}
            </div>
          </div>
        </div>

        {/* Items table */}
        <div style={{ borderRadius: T.radiusSm, overflow: "hidden", marginBottom: 16 }}>
          <div style={{ background: T.sidebar, padding: "8px 14px", display: "flex", color: "#fff", fontSize: 11, fontWeight: 700 }}>
            <span style={{ flex: 1 }}>SERVICE</span><span style={{ width: 50, textAlign: "center" }}>QTY</span><span style={{ width: 60, textAlign: "center" }}>UNIT</span><span style={{ width: 70, textAlign: "right" }}>TOTAL</span>
          </div>
          {calc.items.map((item, i) => (
            <div key={i} style={{ padding: "10px 14px", display: "flex", fontSize: 13, background: i % 2 ? T.bg : "#fff", alignItems: "center" }}>
              <span style={{ flex: 1, color: T.text }}>{item.description}</span>
              <span style={{ width: 50, textAlign: "center", color: T.textMuted }}>{item.qty}</span>
              <span style={{ width: 60, textAlign: "center", color: T.textMuted }}>${item.unitPrice}</span>
              <span style={{ width: 70, textAlign: "right", fontWeight: 700, color: T.text }}>${item.total.toFixed(2)}</span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div style={{ textAlign: "right", marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: T.textMuted }}>Subtotal: <span style={{ fontWeight: 700, color: T.text }}>${calc.subtotal.toFixed(2)}</span></div>
          {calc.discountLabel && (
            <div style={{ fontSize: 13, color: T.primaryDark, fontWeight: 700, marginTop: 4 }}>{calc.discountLabel}: -${calc.discount.toFixed(2)}</div>
          )}
        </div>

        <div style={{ background: T.primary, borderRadius: T.radiusSm, padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", color: "#fff" }}>
          <span style={{ fontSize: 12, fontWeight: 700 }}>TOTAL PER CLEAN</span>
          <span style={{ fontSize: 26, fontWeight: 900 }}>${calc.total.toFixed(2)}</span>
        </div>

        <div style={{ marginTop: 16, background: T.primaryLight, borderRadius: T.radiusSm, padding: "12px 16px" }}>
          <p style={{ margin: 0, fontSize: 13, color: T.primaryDark }}>
            To accept this quote, just reply to this message and we'll get you booked in! 💚
          </p>
        </div>
      </div>

      <div style={{ borderTop: `1px solid ${T.border}`, padding: "12px 24px", textAlign: "center" }}>
        <p style={{ margin: 0, fontSize: 11, color: T.textLight }}>Dust Bunnies Cleaning · Sunshine Coast · Eco-conscious 🌿</p>
      </div>

      {/* Format indicator */}
      <div style={{ background: T.blueLight, padding: "10px 24px", fontSize: 12, color: T.blue, fontWeight: 600, textAlign: "center" }}>
        {isEmail ? "📄 Sent as branded PDF via email" : `🖼️ Sent as branded image via ${quote.channel}`}
      </div>
    </div>
  );
}
