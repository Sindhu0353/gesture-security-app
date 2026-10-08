class CameraManager {
  constructor() {
    this.videoElement = null;
    this.canvasElement = null;
    this.canvasCtx = null;
    this.hands = null;
    this.camera = null;
    this.isStreaming = false;
  }

  async init(videoSelector, canvasSelector) {
    this.videoElement = document.querySelector(videoSelector);
    this.canvasElement = document.querySelector(canvasSelector);
    this.canvasCtx = this.canvasElement.getContext("2d");

    // Initialize MediaPipe Hands Pipeline
    this.hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    this.hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.6
    });

    this.hands.onResults((results) => this.onResults(results));
  }

  async startCameraFeed() {
    if (this.isStreaming) return;

    // Ensure video dimensions match canvas resolution
    this.videoElement.width = 640;
    this.videoElement.height = 480;

    this.camera = new Camera(this.videoElement, {
      onFrame: async () => {
        if (this.isStreaming && this.videoElement.readyState >= 2) {
          await this.hands.send({ image: this.videoElement });
        }
      },
      width: 640,
      height: 480
    });

    this.isStreaming = true;
    await this.camera.start();
  }

  stopCamera() {
    this.isStreaming = false;

    if (this.camera) {
      this.camera.stop();
      this.camera = null;
    }

    if (this.videoElement && this.videoElement.srcObject) {
      const tracks = this.videoElement.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
      this.videoElement.srcObject = null;
    }

    if (this.canvasCtx) {
      this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
    }
  }

  onResults(results) {
    this.canvasCtx.save();
    this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);

    // 1. Mirror transformation for natural camera feed interaction
    this.canvasCtx.translate(this.canvasElement.width, 0);
    this.canvasCtx.scale(-1, 1);

    // 2. DRAW LIVE VIDEO FRAME DIRECTLY TO CANVAS FIRST
    // This prevents the black screen issue!
    if (results.image) {
      this.canvasCtx.drawImage(
        results.image,
        0,
        0,
        this.canvasElement.width,
        this.canvasElement.height
      );
    }

    // 3. Render Landmark Overlays and process behavior
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];

      // Draw MediaPipe Skeletal Overlays
      drawConnectors(this.canvasCtx, landmarks, HAND_CONNECTIONS, { color: "#3b82f6", lineWidth: 3 });
      drawLandmarks(this.canvasCtx, landmarks, { color: "#10b981", lineWidth: 1, radius: 3 });

      // Run Classification and Behavioral Analysis
      const gestureResult = window.gestureClassifier.classify(landmarks);
      window.behaviorAnalyzer.processFrame(landmarks, gestureResult);
    } else {
      window.behaviorAnalyzer.processFrame(null, { gesture: "NONE", confidence: 0 });
    }

    this.canvasCtx.restore();
  }
}

window.cameraManager = new CameraManager();

// Safeguard against hardware lockups on window refresh/unload
window.addEventListener("beforeunload", () => {
  if (window.cameraManager) {
    window.cameraManager.stopCamera();
  }
});