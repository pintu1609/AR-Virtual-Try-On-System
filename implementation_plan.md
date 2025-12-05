# Implementation Plan - Realistic Mesh-Based Virtual Try-On

## Goal
Upgrade the current 2D "paper doll" virtual try-on to a realistic, mesh-based system that warps clothing to fit the user's body and handles occlusion using Three.js and MediaPipe Segmentation.

## User Review Required
> [!IMPORTANT]
> This implementation introduces a new dependency: **Three.js**. This is necessary for hardware-accelerated mesh warping, which is not feasible with standard 2D Canvas.

## Proposed Changes

### Dependencies
#### [NEW] `three`
- Install `three` package to handle 3D mesh rendering and warping.

### Core Logic
#### [MODIFY] [poseModel.js](file:///Users/shashwatyashaswi/Programs/pintu/AR-Virtual-Try-On-System/client/src/utils/poseModel.js)
- Enable `enableSegmentation: true` in the MediaPipe Pose configuration.
- This is required to detect where the user's arms and hands are, so we can hide the virtual shirt behind them (occlusion).

#### [MODIFY] [ARTryOn.js](file:///Users/shashwatyashaswi/Programs/pintu/AR-Virtual-Try-On-System/client/src/components/ARTryOn.js)
- **Complete Rewrite**:
    - Remove the 2D Canvas drawing logic (`ctx.drawImage`).
    - Initialize a **Three.js Scene** (`WebGLRenderer`, `OrthographicCamera`).
    - Create a **PlaneGeometry** with high segmentation (e.g., 10x10 grid) to represent the shirt.
    - Load the selected shirt image as a **Texture** on this plane.
    - **Rigging Logic**:
        - On every frame, map the MediaPipe Pose landmarks (Shoulders, Hips, Chest) to the vertices of the shirt mesh.
        - Deform the mesh: Move the top corners to the shoulders, bottom corners to the hips, and interpolate the middle vertices.
    - **Occlusion**:
        - Use the segmentation mask from MediaPipe as an alpha mask or stencil to "cut out" the user's arms from the shirt layer.

### [NEW] Robustness Improvements (Sitting Mode)
- **Problem**: If the user is sitting, hips might be out of frame.
- **Solution**: Implement fallback logic in `ARTryOn.js`.
    - If `hips` are not detected (visibility < threshold):
        - Calculate `shoulderWidth`.
        - Estimate `torsoLength` approx `1.5 * shoulderWidth`.
        - Estimate `hipPosition` by projecting down from the shoulder center.
    - This ensures the shirt is still drawn even if only the upper body is visible.

## Verification Plan

### Manual Verification
1.  **Start the App**: Run `npm start`.
2.  **Select Outfit**: Choose a shirt from the carousel.
3.  **Test Movement**:
    - Move closer/further (Scaling).
    - Tilt body (Rotation).
    - **Twist/Turn**: Verify the shirt warps/squashes realistically, not just sliding sideways.
    - **Occlusion**: Cross arms in front of chest. Verify the shirt appears *behind* the arms.
4.  **Test Sitting**:
    - Sit at a desk (hips hidden).
    - Verify the shirt still appears and follows the shoulders.
