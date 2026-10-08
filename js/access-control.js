class AccessController {
  constructor() {
    // RBAC Security Route Matrix Definition
    this.routeMatrix = {
      "ONE_FINGER": { page: "dashboard.html", allowedRoles: ["STUDENT", "FACULTY", "ADMIN"] },
      "TWO_FINGER": { page: "control-center.html", allowedRoles: ["FACULTY", "ADMIN"] },
      "OPEN_PALM":  { page: "settings.html",       allowedRoles: ["STUDENT", "FACULTY", "ADMIN"] },
      "FIST":       { page: "restricted.html",     allowedRoles: ["ADMIN"] }
    };

    this.bindGlobalHandler();
  }

  bindGlobalHandler() {
    window.onBehaviorValidated = (event) => this.handleValidation(event);
  }

  handleValidation(data) {
    const activeRole = window.authManager.getRole();
    const routeConfig = this.routeMatrix[data.gesture];
    const banner = document.getElementById("status-banner");

    if (!routeConfig) {
      this.updateBanner(banner, "denied", "Unrecognized Security Gesture");
      window.behaviorAnalyzer.reset();
      return;
    }

    const isAuthorized = routeConfig.allowedRoles.includes(activeRole);
    const timestamp = new Date().toISOString();

    if (isAuthorized) {
      // 1. Log Authorization Event
      window.activityLogger.addEntry({
        timestamp,
        gesture: data.gesture,
        confidence: `${Math.round(data.confidence * 100)}%`,
        holdTime: `${data.holdDuration}s`,
        stability: "STABLE",
        targetPage: routeConfig.page,
        result: "GRANTED"
      });

      // 2. Persist Proof Session Data
      sessionStorage.setItem("auth_status", "AUTHENTICATED");
      sessionStorage.setItem("auth_role", activeRole);
      sessionStorage.setItem("auth_gesture", data.gesture);
      sessionStorage.setItem("auth_confidence", `${Math.round(data.confidence * 100)}%`);
      sessionStorage.setItem("auth_hold_time", `${data.holdDuration}s`);
      sessionStorage.setItem("auth_timestamp", timestamp);

      // 3. UI Status Indication
      this.updateBanner(banner, "granted", `ACCESS GRANTED: Navigating to ${routeConfig.page}...`);

      // 4. Hardware Teardown & Smooth Safe Redirect
      if (window.cameraManager) {
        window.cameraManager.stopCamera();
      }

      setTimeout(() => {
        window.location.replace(routeConfig.page);
      }, 800);

    } else {
      // Write Security Denied Log Event
      window.activityLogger.addEntry({
        timestamp,
        gesture: data.gesture,
        confidence: `${Math.round(data.confidence * 100)}%`,
        holdTime: `${data.holdDuration}s`,
        stability: "STABLE",
        targetPage: routeConfig.page,
        result: "DENIED"
      });

      this.updateBanner(banner, "denied", `ACCESS DENIED: Role ${activeRole} lacks required privileges`);

      // Cooldown & Behavior Reset
      setTimeout(() => {
        this.updateBanner(banner, "", "System Ready. Perform Hand Gesture.");
        window.behaviorAnalyzer.reset();
      }, 2000);
    }
  }

  updateBanner(element, state, message) {
    if (!element) return;
    element.className = `status-banner ${state}`;
    element.textContent = message;
  }

  populateProof() {
    const elRole = document.getElementById("proof-role");
    const elGesture = document.getElementById("proof-gesture");
    const elConfidence = document.getElementById("proof-confidence");
    const elHold = document.getElementById("proof-hold");
    const elTime = document.getElementById("proof-time");

    if (elRole) elRole.textContent = sessionStorage.getItem("auth_role") || "N/A";
    if (elGesture) elGesture.textContent = sessionStorage.getItem("auth_gesture") || "N/A";
    if (elConfidence) elConfidence.textContent = sessionStorage.getItem("auth_confidence") || "N/A";
    if (elHold) elHold.textContent = sessionStorage.getItem("auth_hold_time") || "N/A";
    if (elTime) elTime.textContent = sessionStorage.getItem("auth_timestamp") || "N/A";
  }
}

window.accessController = new AccessController();
document.addEventListener("DOMContentLoaded", () => {
  window.accessController.populateProof();
});