(function () {
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  const userLoggedIn = sessionStorage.getItem("user_logged_in") === "TRUE";
  const gestureAuthStatus = sessionStorage.getItem("auth_status") === "AUTHENTICATED";

  // Prevent accessing gesture verification without completing Stage 1 credential login
  if (currentPage === "gesture-verification.html") {
    if (!userLoggedIn) {
      alert("Session expired or unauthenticated. Please log in first.");
      window.location.replace("login.html");
    }
  } 
  // Protect all stage 3 target pages (dashboard, control-center, settings, restricted)
  else if (currentPage !== "login.html" && currentPage !== "index.html") {
    if (!userLoggedIn) {
      alert("Unauthorized access. Please log in with your credentials.");
      window.location.replace("login.html");
    } else if (!gestureAuthStatus) {
      alert("Gesture verification required.");
      window.location.replace("gesture-verification.html");
    }
  }
})();