/**
 * GestuRole Validated Authentication & Credential Lifecycle Manager
 */
class AuthManager {
  constructor() {
    this.validRoles = ["STUDENT", "FACULTY", "ADMIN"];
    
    // Preset credential store for testing
    this.credentialsDatabase = {
      "student": "pass123",
      "faculty": "pass123",
      "admin": "admin123"
    };

    this.maxFailedAttempts = 3;
    this.lockoutDurationMs = 30000; // 30-second security cooldown
  }

  /**
   * Sanitizes input string against HTML/Script injection attacks
   */
  sanitizeInput(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  /**
   * Validates credentials, checks brute-force locks, and initializes session state
   */
  loginWithCredentials(rawUsername, rawPassword, role) {
    const username = this.sanitizeInput(rawUsername.trim().toLowerCase());
    const password = rawPassword.trim();

    // Check account lockout status in sessionStorage
    const lockUntil = sessionStorage.getItem(`lockout_${username}`);
    if (lockUntil && Date.now() < parseInt(lockUntil, 10)) {
      const remainingSecs = Math.ceil((parseInt(lockUntil, 10) - Date.now()) / 1000);
      return { 
        success: false, 
        message: `🚨 Account temporarily locked due to multiple failed attempts. Try again in ${remainingSecs}s.` 
      };
    }

    // Comprehensive Credential Check
    const expectedPassword = this.credentialsDatabase[username];

    if (!expectedPassword || expectedPassword !== password) {
      // Track failed attempts
      let attempts = parseInt(sessionStorage.getItem(`failed_${username}`) || "0", 10) + 1;
      sessionStorage.setItem(`failed_${username}`, attempts.toString());

      if (attempts >= this.maxFailedAttempts) {
        const lockExpiry = Date.now() + this.lockoutDurationMs;
        sessionStorage.setItem(`lockout_${username}`, lockExpiry.toString());
        sessionStorage.removeItem(`failed_${username}`);
        return { 
          success: false, 
          message: `🚨 Too many failed attempts! Account locked for 30 seconds.` 
        };
      }

      return { 
        success: false, 
        message: `Invalid credentials. ${this.maxFailedAttempts - attempts} attempt(s) remaining before lockout.` 
      };
    }

    // Reset failed counter upon successful validation
    sessionStorage.removeItem(`failed_${username}`);
    sessionStorage.removeItem(`lockout_${username}`);

    // Clear stale sessions
    sessionStorage.clear();

    // Store Stage 1 Credential Claims
    sessionStorage.setItem("user_logged_in", "TRUE");
    sessionStorage.setItem("username", username);
    sessionStorage.setItem("user_role", role);
    sessionStorage.setItem("auth_status", "CREDENTIALS_VERIFIED");
    sessionStorage.setItem("login_timestamp", new Date().toISOString());

    console.log(`[AuthManager] Stage 1 Authenticated & Validated: User=${username}, Role=${role}`);

    // Redirect to Stage 2
    window.location.replace("gesture-verification.html");
    return { success: true };
  }

  getRole() {
    return sessionStorage.getItem("user_role") || "STUDENT";
  }

  getUsername() {
    return sessionStorage.getItem("username") || "User";
  }

  logout() {
    sessionStorage.clear();
    window.location.replace("login.html");
  }
}

window.authManager = new AuthManager();