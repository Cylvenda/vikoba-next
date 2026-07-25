import { ImageResponse } from "next/og";

export const alt = "VICOBA Community Hub — Digital Village Banking";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(135deg, #063b32 0%, #075f52 55%, #0b7665 100%)",
          color: "white",
          padding: "70px",
        }}
      >
        <div style={{ display: "flex", position: "absolute", width: 600, height: 600, right: -130, top: -150, borderRadius: "50%", background: "#d8b45b", opacity: 0.18 }} />
        <div style={{ display: "flex", position: "absolute", width: 420, height: 420, right: 80, bottom: -215, borderRadius: "50%", border: "24px solid #71d4b0", opacity: 0.26 }} />
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 745, zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", fontSize: 28, fontWeight: 700, letterSpacing: 3, color: "#b8efd7" }}>
            VICOBA COMMUNITY HUB
          </div>
          <div style={{ display: "flex", marginTop: 34, fontSize: 68, lineHeight: 1.05, fontWeight: 800, letterSpacing: -2 }}>
            Digital village banking for stronger communities.
          </div>
          <div style={{ display: "flex", marginTop: 28, fontSize: 29, lineHeight: 1.35, color: "#dcf8eb" }}>
            Simamia akiba, mikopo, wanachama na mikutano ya kikundi chako kwa urahisi.
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 42 }}>
            {['Savings & Hisa', 'Loans & Mikopo', 'Meetings'].map((label) => (
              <div key={label} style={{ display: "flex", border: "1px solid #72cbaa", borderRadius: 999, padding: "12px 20px", fontSize: 21, color: "#e4f9ee" }}>
                {label}
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", position: "absolute", right: 75, bottom: 65, width: 260, height: 205, borderRadius: 26, background: "#f3fff9", color: "#075f52", padding: 28, flexDirection: "column", boxShadow: "0 20px 45px rgba(0,0,0,0.22)" }}>
          <div style={{ display: "flex", fontSize: 22, fontWeight: 700 }}>GROUP WALLET</div>
          <div style={{ display: "flex", marginTop: 18, fontSize: 36, fontWeight: 800 }}>Secure</div>
          <div style={{ display: "flex", marginTop: 5, fontSize: 21, color: "#3a7669" }}>Savings together</div>
        </div>
      </div>
    ),
    size,
  );
}
