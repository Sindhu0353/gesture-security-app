class ActivityLogger {
  constructor() {
    this.storageKey = "security_audit_logs";
    this.maxLogs = 10;
  }

  getLogs() {
    const raw = localStorage.getItem(this.storageKey);
    return raw ? JSON.parse(raw) : [];
  }

  addEntry(entry) {
    const logs = this.getLogs();
    logs.unshift(entry); // Add latest to top
    
    if (logs.length > this.maxLogs) {
      logs.pop();
    }

    localStorage.setItem(this.storageKey, JSON.stringify(logs));
    this.render();
  }

  render() {
    const tbody = document.getElementById("audit-log-table-body");
    if (!tbody) return;

    const logs = this.getLogs();
    tbody.innerHTML = "";

    if (logs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No activity recorded.</td></tr>`;
      return;
    }

    logs.forEach((log) => {
      const row = document.createElement("tr");
      const isGranted = log.result === "GRANTED";

      row.innerHTML = `
        <td>${new Date(log.timestamp).toLocaleTimeString()}</td>
        <td><strong>${log.gesture}</strong></td>
        <td>${log.confidence}</td>
        <td>${log.holdTime}</td>
        <td><span class="badge badge-stable">${log.stability}</span></td>
        <td><code>${log.targetPage}</code></td>
        <td class="${isGranted ? 'text-green' : 'text-red'}">${log.result}</td>
      `;
      tbody.appendChild(row);
    });
  }
}

window.activityLogger = new ActivityLogger();
document.addEventListener("DOMContentLoaded", () => {
  window.activityLogger.render();
});