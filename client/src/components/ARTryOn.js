// src/components/ARTryOn.js
import React, { useEffect, useRef, useState } from "react";
import OutfitCarousel from "./OutfitCarousel";
import { Camera } from "@mediapipe/camera_utils";
import { createPoseModel } from "../utils/poseModel";

// Strong smoothing for professional look
const smooth = { x: 0, y: 0, angle: 0, width: 0, height: 0 };

export default function ARTryOn() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [outfits, setOutfits] = useState([]);
  const [selected, setSelected] = useState(null);

  // 1) Load outfits (your uploaded T-shirts)
  useEffect(() => {
    async function loadOutfits() {
      try {
        const res = await fetch("http://localhost:5000/api/outfits");
        const data = await res.json();
        const mapped = data.map((o) => ({
          _id: o._id,
          name: o.name,
          url: `http://localhost:5000/uploads/${o.filename}`,
        }));
        setOutfits(mapped);
      } catch (err) {
        console.error("Failed to load outfits", err);
      }
    }
    loadOutfits();
  }, []);

  // 2) Start camera + pose tracking
  useEffect(() => {
    if (!videoRef.current) return;

    const poseModel = createPoseModel(onPoseResults);

    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        await poseModel.send({ image: videoRef.current });
      },
      width: 640,
      height: 480,
    });

    camera.start();

    return () => {
      camera.stop && camera.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  // 3) Pose callback -> draw video + T-shirt together
  function onPoseResults(results) {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const W = 640;
    const H = 480;
    canvas.width = W;
    canvas.height = H;

    // draw live camera frame first
    if (videoRef.current) {
      ctx.save();
      // mirror horizontally to look like selfie
      ctx.translate(W, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(videoRef.current, 0, 0, W, H);
      ctx.restore();
    }

    if (!results.poseLandmarks || !selected) return;

    const lm = results.poseLandmarks;
    const LS = lm[11]; // left shoulder
    const RS = lm[12]; // right shoulder
    const LH = lm[23]; // left hip
    const RH = lm[24]; // right hip

    if (!LS || !RS || !LH || !RH) return;

    // ---- compute pose geometry ----
    const shoulderMidX = ((LS.x + RS.x) / 2) * W;
    const shoulderMidY = ((LS.y + RS.y) / 2) * H;
    const hipMidY = ((LH.y + RH.y) / 2) * H;

    const dx = (RS.x - LS.x) * W;
    const dy = (RS.y - LS.y) * H;
    const angle = Math.atan2(dy, dx);
    const shoulderWidth = Math.hypot(dx, dy);
    const torsoHeight = hipMidY - shoulderMidY;

    // ---- T-shirt size (tuned) ----
    // width: slightly wider than shoulders
    const desiredWidth = shoulderWidth * 2.1;
    // height: from shoulders down past hips a bit
    const desiredHeight = torsoHeight * 1.2;

    // ---- STRONG SMOOTHING (alpha small) ----
    const alpha = 0.1; // 0.1 = strong smoothing
    smooth.x = smooth.x * (1 - alpha) + shoulderMidX * alpha;
    smooth.y = smooth.y * (1 - alpha) + shoulderMidY * alpha;
    smooth.angle = smooth.angle * (1 - alpha) + angle * alpha;
    smooth.width = smooth.width * (1 - alpha) + desiredWidth * alpha;
    smooth.height = smooth.height * (1 - alpha) + desiredHeight * alpha;

    const img = new Image();
    img.src = selected.url;

    img.onload = () => {
      ctx.save();

      // mirror space because video is mirrored
      ctx.translate(W, 0);
      ctx.scale(-1, 1);

      const mirroredX = W - smooth.x;

      ctx.translate(mirroredX, smooth.y);
      ctx.rotate(smooth.angle);

      // Slight vertical offset so neck hole looks right
      const yOffset = -smooth.height * 0.15; // tweak 0.1–0.2 if needed

      ctx.drawImage(
        img,
        -smooth.width / 2,
        yOffset,
        smooth.width,
        smooth.height
      );

      ctx.restore();
    };
  }

  return (
    <div
      style={{
        position: "relative",
        width: 640,
        height: 480,
        margin: "0 auto",
        borderRadius: 16,
        overflow: "hidden",
        background: "#000",
      }}
    >
      {/* hidden video: only used as texture */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        width="640"
        height="480"
        style={{ display: "none" }}
      />

      {/* final AR frame (video + T-shirt) */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
        }}
      />

      <OutfitCarousel
        outfits={outfits}
        selectedId={selected?._id}
        onSelect={setSelected}
      />
    </div>
  );
}
