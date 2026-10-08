class BehaviorAnalyzer {
  constructor() {
    this.previousLandmarks = null;
    this.jitterThreshold = 0.025; // Pixel space normalized displacement threshold
    this.requiredHoldTimeMs = 1500; // 1.5 Seconds
    
    this.currentGesture = "NONE";
    this.holdStartTime = null;
    this.isStable = false;
    this.isValidated = false; // Lock Guard
  }

  processFrame(landmarks, gestureResult) {
    if (this.isValidated) return; // Block frame processing once validated

    const { gesture } = gestureResult;
    const now = Date.now();

    // 1. Calculate Spatial Jitter Displacement
    if (landmarks && this.previousLandmarks) {
      const displacement = this._calculateMeanDisplacement(landmarks, this.previousLandmarks);
      this.isStable = displacement < this.jitterThreshold;
    } else {
      this.isStable = false;
    }
    this.previousLandmarks = landmarks;

    // 2. Continuous Unbroken Hold Tracking
    if (gesture !== "NONE" && gesture === this.currentGesture && this.isStable) {
      if (!this.holdStartTime) {
        this.holdStartTime = now;
      }
      
      const elapsed = now - this.holdStartTime;

      // 3. Validation Guard Trigger Execution
      if (elapsed >= this.requiredHoldTimeMs) {
        this.isValidated = true;
        if (typeof window.onBehaviorValidated === "function") {
          window.onBehaviorValidated({
            gesture: this.currentGesture,
            confidence: gestureResult.confidence,
            holdDuration: (elapsed / 1000).toFixed(2)
          });
        }
      }
    } else {
      // Reset tracker state on breaks
      this.currentGesture = gesture;
      this.holdStartTime = gesture !== "NONE" ? now : null;
    }

    this.updateUI(gestureResult);
  }

  _calculateMeanDisplacement(current, previous) {
    let sum = 0;
    for (let i = 0; i < current.length; i++) {
      sum += Math.sqrt(
        Math.pow(current[i].x - previous[i].x, 2) +
        Math.pow(current[i].y - previous[i].y, 2)
      );
    }
    return sum / current.length;
  }

  updateUI(gestureResult) {
    const elGesture = document.getElementById("metric-gesture");
    const elConfidence = document.getElementById("metric-confidence");
    const elStability = document.getElementById("metric-stability");
    const elProgressBar = document.getElementById("hold-progress-bar");

    if (elGesture) elGesture.textContent = gestureResult.gesture;
    if (elConfidence) elConfidence.textContent = `${Math.round(gestureResult.confidence * 100)}%`;
    
    if (elStability) {
      if (gestureResult.gesture === "NONE") {
        elStability.textContent = "WAITING";
        elStability.className = "badge badge-waiting";
      } else if (this.isStable) {
        elStability.textContent = "STABLE";
        elStability.className = "badge badge-stable";
      } else {
        elStability.textContent = "UNSTABLE";
        elStability.className = "badge badge-unstable";
      }
    }

    if (elProgressBar) {
      let progress = 0;
      if (this.holdStartTime && this.isStable) {
        progress = Math.min(100, ((Date.now() - this.holdStartTime) / this.requiredHoldTimeMs) * 100);
      }
      elProgressBar.style.width = `${progress}%`;
    }
  }

  reset() {
    this.previousLandmarks = null;
    this.holdStartTime = null;
    this.currentGesture = "NONE";
    this.isStable = false;
    this.isValidated = false;
  }
}

window.behaviorAnalyzer = new BehaviorAnalyzer();