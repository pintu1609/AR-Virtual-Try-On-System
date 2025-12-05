// src/components/ARTryOn.js
import React, { useEffect, useRef, useState } from "react";
import OutfitCarousel from "./OutfitCarousel";
import { Camera } from "@mediapipe/camera_utils";
import { createPoseModel } from "../utils/poseModel";
import * as THREE from "three";



export default function ARTryOn() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [outfits, setOutfits] = useState([]);
  const [selected, setSelected] = useState(null);

  // Three.js refs
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const meshRef = useRef(null);
  const textureRef = useRef(null);

  // 1) Load outfits
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

  // 2) Initialize Three.js
  useEffect(() => {
    if (!containerRef.current) return;

    const width = 640;
    const height = 480;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera (Orthographic for 2D overlay feel)
    const camera = new THREE.OrthographicCamera(
      width / -2,
      width / 2,
      height / 2,
      height / -2,
      1,
      1000
    );
    camera.position.z = 10;
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      canvas: canvasRef.current,
    });
    renderer.setSize(width, height);
    rendererRef.current = renderer;

    // Background Video Plane (for occlusion masking)
    // We'll use this to render the video feed behind everything if needed,
    // but primarily we need the segmentation mask.
    // For now, we'll keep the video in the DOM and just overlay the shirt.

    // Shirt Mesh
    // 10x10 segments for warping
    const geometry = new THREE.PlaneGeometry(1, 1, 10, 10);
    const material = new THREE.MeshBasicMaterial({
      transparent: true,
      side: THREE.DoubleSide,
      // We will update map later
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.visible = false; // Hide until pose detected
    scene.add(mesh);
    meshRef.current = mesh;

    return () => {
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, []);

  // 3) Update Texture when outfit changes
  useEffect(() => {
    if (!selected || !meshRef.current) return;

    const loader = new THREE.TextureLoader();
    loader.load(selected.url, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      if (meshRef.current) {
        meshRef.current.material.map = tex;
        meshRef.current.material.needsUpdate = true;
        meshRef.current.visible = true;
        textureRef.current = tex;
      }
    });
  }, [selected]);

  // 4) Start Camera & Pose Tracking
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

  // 5) Pose Loop
  function onPoseResults(results) {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;

    // Draw video background?
    // Actually, we want the video to be visible in the DOM.
    // The canvas is transparent on top.
    // BUT for occlusion, we need to use the segmentation mask.

    // Handle Segmentation for Occlusion
    // If we have a segmentation mask, we can use it to mask the shirt.
    // This is complex in basic Three.js without custom shaders.
    // For this step, we will focus on the MESH WARPING first.

    if (!results.poseLandmarks) {
      if (meshRef.current) meshRef.current.visible = false;
      rendererRef.current.render(sceneRef.current, cameraRef.current);
      return;
    }

    const lm = results.poseLandmarks;
    const mesh = meshRef.current;

    // Key Landmarks
    const leftShoulder = lm[11];
    const rightShoulder = lm[12];


    // Check visibility confidence
    const isVisible = (pt) => pt && pt.visibility > 0.5;

    if (isVisible(leftShoulder) && isVisible(rightShoulder) && mesh) {
      mesh.visible = true;

      const W = 640;
      const H = 480;

      // Convert to Three.js coords
      const toVec = (l) => {
        return new THREE.Vector3((0.5 - l.x) * W, -(l.y - 0.5) * H, 0);
      };

      const vLS = toVec(leftShoulder);
      const vRS = toVec(rightShoulder);

      // Re-calculate vectors (or use estimated ones)
      // If we estimated, we already have vLH_est, vRH_est. 
      // If real, we need to map them.

      let vLH, vRH;

      if (isVisible(lm[23]) && isVisible(lm[24])) {
        vLH = toVec(lm[23]);
        vRH = toVec(lm[24]);
      } else {
        // Recalculate estimation to be sure (or reuse variables if scope allowed)
        const shoulderCenter = new THREE.Vector3().addVectors(vLS, vRS).multiplyScalar(0.5);
        const shoulderVec = new THREE.Vector3().subVectors(vRS, vLS);
        const shoulderWidth = shoulderVec.length();

        const downDir = new THREE.Vector3(-shoulderVec.y, shoulderVec.x, 0).normalize();
        if (downDir.y > 0) downDir.negate();

        const estimatedTorsoLength = shoulderWidth * 1.5;
        const estimatedHipCenter = shoulderCenter.clone().addScaledVector(downDir, estimatedTorsoLength);
        const hipWidth = shoulderWidth * 0.9;
        const hipRightDir = shoulderVec.clone().normalize();

        vLH = estimatedHipCenter.clone().addScaledVector(hipRightDir, -0.5 * hipWidth);
        vRH = estimatedHipCenter.clone().addScaledVector(hipRightDir, 0.5 * hipWidth);
      }

      // Expand the shirt slightly beyond the body points
      const shoulderDir = new THREE.Vector3().subVectors(vRS, vLS).normalize();
      const hipDir = new THREE.Vector3().subVectors(vRH, vLH).normalize();

      const shoulderWidth = vLS.distanceTo(vRS);
      const hipWidth = vLH.distanceTo(vRH);

      const vLS_ext = vLS.clone().addScaledVector(shoulderDir, -shoulderWidth * 0.3);
      const vRS_ext = vRS.clone().addScaledVector(shoulderDir, shoulderWidth * 0.3);

      // Extend hips down a bit for length
      const torsoUp = new THREE.Vector3().subVectors(vLS, vLH).normalize();
      const vLH_ext = vLH.clone().addScaledVector(hipDir, -hipWidth * 0.2).addScaledVector(torsoUp, -hipWidth * 0.3);
      const vRH_ext = vRH.clone().addScaledVector(hipDir, hipWidth * 0.2).addScaledVector(torsoUp, -hipWidth * 0.3);


      // WARPING LOGIC
      const posAttribute = mesh.geometry.attributes.position;
      const widthSegments = 10;
      const heightSegments = 10;

      for (let i = 0; i <= heightSegments; i++) {
        const v = i / heightSegments; // 0 (top) to 1 (bottom)

        // Interpolate between Shoulder line and Hip line
        const leftPoint = new THREE.Vector3().lerpVectors(vLS_ext, vLH_ext, v);
        const rightPoint = new THREE.Vector3().lerpVectors(vRS_ext, vRH_ext, v);

        for (let j = 0; j <= widthSegments; j++) {
          const u = j / widthSegments; // 0 (left) to 1 (right)

          // Linear interpolation across the row
          const finalPos = new THREE.Vector3().lerpVectors(leftPoint, rightPoint, u);

          const index = i * (widthSegments + 1) + j;
          posAttribute.setXYZ(index, finalPos.x, finalPos.y, finalPos.z);
        }
      }

      posAttribute.needsUpdate = true;
      mesh.geometry.computeBoundingSphere();
    }

    rendererRef.current.render(sceneRef.current, cameraRef.current);
  }

  return (
    <div
      ref={containerRef}
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
      {/* Video Feed (Mirrored) */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        width="640"
        height="480"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          transform: "scaleX(-1)", // Mirror the video
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />

      {/* Three.js Canvas Overlay */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          pointerEvents: "none", // Let clicks pass through
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
