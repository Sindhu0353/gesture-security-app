class GestureClassifier {
  constructor() {
    // MediaPipe 21 Hand Landmark Identifiers
    this.WRIST = 0;
    this.FINGERS = {
      THUMB:  { tip: 4,  ip: 3,  mcp: 2,  cmc: 1 },
      INDEX:  { tip: 8,  dip: 7, pip: 6,  mcp: 5 },
      MIDDLE: { tip: 12, dip: 11, pip: 10, mcp: 9 },
      RING:   { tip: 16, dip: 15, pip: 14, mcp: 13 },
      PINKY:  { tip: 20, dip: 19, pip: 18, mcp: 17 }
    };
  }

  classify(landmarks) {
    if (!landmarks || landmarks.length < 21) {
      return { gesture: "NONE", confidence: 0 };
    }

    const isIndexExtended  = this._isFingerExtended(landmarks, this.FINGERS.INDEX);
    const isMiddleExtended = this._isFingerExtended(landmarks, this.FINGERS.MIDDLE);
    const isRingExtended   = this._isFingerExtended(landmarks, this.FINGERS.RING);
    const isPinkyExtended  = this._isFingerExtended(landmarks, this.FINGERS.PINKY);
    const isThumbExtended  = this._isThumbExtended(landmarks);

    const extendedFingers = [isIndexExtended, isMiddleExtended, isRingExtended, isPinkyExtended];
    const extendedCount   = extendedFingers.filter(Boolean).length;

    let gesture = "NONE";
    let confidence = 0.30;

    // --- Gesture Logic ---

    // 1. FIST: All 4 fingers curled inward + Thumb folded/wrapped
    if (extendedCount === 0 && !isThumbExtended) {
      gesture = "FIST";
      confidence = 0.96;
    }
    // 2. ONE_FINGER: Index finger extended, others curled
    else if (isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended) {
      gesture = "ONE_FINGER";
      confidence = 0.98;
    }
    // 3. TWO_FINGER: Index and Middle extended, Ring and Pinky curled
    else if (isIndexExtended && isMiddleExtended && !isRingExtended && !isPinkyExtended) {
      gesture = "TWO_FINGER";
      confidence = 0.96;
    }
    // 4. OPEN_PALM: All 4 main fingers extended
    else if (extendedCount >= 4) {
      gesture = "OPEN_PALM";
      confidence = 0.99;
    }

    return { gesture, confidence };
  }

  /**
   * Compares the distance from Wrist-to-Tip vs Wrist-to-MCP (base knuckle).
   * In a curled finger/fist, tip distance shrinks close to MCP distance.
   */
  _isFingerExtended(landmarks, finger) {
    const dTip = this._euclideanDistance3D(landmarks[finger.tip], landmarks[this.WRIST]);
    const dMcp = this._euclideanDistance3D(landmarks[finger.mcp], landmarks[this.WRIST]);
    const dPip = this._euclideanDistance3D(landmarks[finger.pip], landmarks[this.WRIST]);

    // A finger is extended ONLY if tip is clearly further from wrist than PIP AND MCP joints
    return dTip > dPip && dTip > dMcp * 1.15;
  }

  /**
   * Evaluates thumb position relative to Index MCP (base knuckle)
   */
  _isThumbExtended(landmarks) {
    const thumbTip  = landmarks[this.FINGERS.THUMB.tip];
    const indexMcp  = landmarks[this.FINGERS.INDEX.mcp];
    const pinkyMcp  = landmarks[this.FINGERS.PINKY.mcp];

    // Distance between thumb tip and base of pinky/index
    const dThumbIndexBase = this._euclideanDistance3D(thumbTip, indexMcp);
    const dPalmWidth      = this._euclideanDistance3D(indexMcp, pinkyMcp);

    // If thumb tip is tucked close to index base or across palm, it's NOT extended
    return dThumbIndexBase > dPalmWidth * 0.75;
  }

  _euclideanDistance3D(pt1, pt2) {
    return Math.sqrt(
      Math.pow(pt1.x - pt2.x, 2) +
      Math.pow(pt1.y - pt2.y, 2) +
      Math.pow(pt1.z - pt2.z, 2)
    );
  }
}

window.gestureClassifier = new GestureClassifier();