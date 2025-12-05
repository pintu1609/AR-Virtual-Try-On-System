// // Helper to load models
// import * as tf from '@tensorflow/tfjs';
// import * as poseDetection from '@tensorflow-models/pose-detection';
// import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';


// export async function loadModels(){
// await tf.ready();
// // We'll use MoveNet or BlazePose via MediaPipe
// const detectorConfig = { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING };
// const poseDetector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, detectorConfig);


// const faceDetector = await faceLandmarksDetection.load(faceLandmarksDetection.SupportedPackages.mediapipeFacemesh);


// return { poseDetector, faceDetector };
// }



// import * as tf from '@tensorflow/tfjs';
// import * as poseDetection from '@tensorflow-models/pose-detection';
// import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';

// export async function loadModels() {
//   await tf.ready();

//   // ✅ POSE DETECTOR (MoveNet)
//   const poseDetector = await poseDetection.createDetector(
//     poseDetection.SupportedModels.MoveNet,
//     {
//       modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
//     }
//   );

//   // ✅ FACE DETECTOR (MediaPipe FaceMesh - NEW API)
//   const faceDetector = await faceLandmarksDetection.createDetector(
//     faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
//     {
//       runtime: 'mediapipe',
//       solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh',
//     }
//   );

//   return { poseDetector, faceDetector };
// }


import { Pose } from "@mediapipe/pose";

export async function loadModels(video) {
  return new Promise((resolve) => {
    const pose = new Pose({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    pose.onResults((results) => {
      resolve(results);
    });

    resolve(pose);
  });
}
