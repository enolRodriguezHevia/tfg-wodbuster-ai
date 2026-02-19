import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

let poseLandmarker = null;

/**
 * Inicializar MediaPipe Pose Landmarker
 */
export async function initializePoseLandmarker() {
  if (poseLandmarker) return poseLandmarker;

  try {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );

    poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
        delegate: "GPU"
      },
      runningMode: "VIDEO",
      numPoses: 1,
      minPoseDetectionConfidence: 0.5,
      minPosePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    return poseLandmarker;
  } catch (error) {
    throw error;
  }
}
