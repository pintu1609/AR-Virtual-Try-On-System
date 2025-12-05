import React from "react";

export default function OutfitCarousel({ outfits, selectedId, onSelect }) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 10,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        gap: 12,
        pointerEvents: "auto",
      }}
    >
      {outfits.map((o) => (
        <button
          key={o._id}
          onClick={() => onSelect(o)}
          style={{
            width: 70,
            height: 90,
            borderRadius: 10,
            overflow: "hidden",
            border:
              selectedId === o._id ? "3px solid #00ff7f" : "2px solid #fff",
            background: "#111",
            padding: 0,
            cursor: "pointer",
          }}
        >
          <img
            src={o.url}
            alt={o.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          xyz
        </button>
      ))}
    </div>
  );
}
