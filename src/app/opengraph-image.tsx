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
          background: "linear-gradient(135deg, #fff7ed 0%, #ffffff 55%, #f3f1f3 100%)",
          color: "#0c090c",
          padding: "70px",
        }}
      >
        <div style={{ display: "flex", position: "absolute", width: 600, height: 600, right: -130, top: -150, borderRadius: "50%", background: "#ca3500", opacity: 0.18 }} />
        <div style={{ display: "flex", position: "absolute", width: 420, height: 420, right: 80, bottom: -215, borderRadius: "50%", border: "24px solid #ca3500", opacity: 0.26 }} />
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 745, zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", fontSize: 28, fontWeight: 700, letterSpacing: 3, color: "#ca3500" }}>
            VICOBA COMMUNITY HUB
          </div>
          <div style={{ display: "flex", marginTop: 34, fontSize: 68, lineHeight: 1.05, fontWeight: 800, letterSpacing: -2 }}>
            Digital village banking for stronger communities.
          </div>
          <div style={{ display: "flex", marginTop: 28, fontSize: 29, lineHeight: 1.35, color: "#79697b" }}>
            Simamia akiba, mikopo, wanachama na mikutano ya kikundi chako kwa urahisi.
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 42 }}>
            {['Savings & Hisa', 'Loans & Mikopo', 'Meetings'].map((label) => (
              <div key={label} style={{ display: "flex", border: "1px solid #ca3500", borderRadius: 999, padding: "12px 20px", fontSize: 21, color: "#ca3500" }}>
                {label}
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", position: "absolute", right: 75, bottom: 65, width: 260, height: 205, borderRadius: 26, background: "#ffffff", color: "#0c090c", padding: 28, flexDirection: "column", boxShadow: "0 20px 45px rgba(0,0,0,0.22)", border: "1px solid #e7e4e7" }}>
          <div style={{ display: "flex", fontSize: 22, fontWeight: 700 }}>GROUP WALLET</div>
          <div style={{ display: "flex", marginTop: 18, fontSize: 36, fontWeight: 800 }}>Secure</div>
          <div style={{ display: "flex", marginTop: 5, fontSize: 21, color: "#79697b" }}>Savings together</div>
        </div>
      </div>
    ),
    size,
  );
}
