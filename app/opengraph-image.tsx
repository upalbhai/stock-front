import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "MiniHisab";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(to bottom right, #111827, #000000)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 40,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 140,
              height: 140,
              borderRadius: 32,
              background: "#3b82f6",
              color: "white",
              fontSize: 60,
              fontWeight: 900,
              marginRight: 40,
            }}
          >
            MH
          </div>
          <div style={{ fontSize: 120, fontWeight: "bold", letterSpacing: "-0.05em" }}>
            MiniHisab
          </div>
        </div>
        <div style={{ fontSize: 48, opacity: 0.8, letterSpacing: "-0.02em", color: "#9ca3af" }}>
          Retail Billing & Inventory Platform
        </div>
      </div>
    ),
    { ...size }
  );
}
