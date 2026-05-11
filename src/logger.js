/**
 * SiteReader - Logger Utility
 * Centralized logging system for all extension scripts
 */

class SiteReaderLogger {
  constructor(context = 'SiteReader') {
    this.context = context;
    this.logs = [];
    this.maxLogs = 1000;
  }

  log(message, data = null, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      context: this.context,
      level,
      message,
      data,
    };

    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    const prefix = `[${this.context}:${timestamp}]`;
    const levelTag = level !== 'INFO' ? ` [${level}]` : '';

    if (data !== null && typeof data === 'object') {
      console.log(`${prefix}${levelTag} ${message}`, data);
    } else if (data !== null) {
      console.log(`${prefix}${levelTag} ${message} ${data}`);
    } else {
      console.log(`${prefix}${levelTag} ${message}`);
    }
  }

  info(message, data = null) {
    this.log(message, data, 'INFO');
  }

  warn(message, data = null) {
    this.log(message, data, 'WARN');
  }

  error(message, data = null) {
    this.log(message, data, 'ERROR');
  }

  debug(message, data = null) {
    if (this.isDebugEnabled()) {
      this.log(message, data, 'DEBUG');
    }
  }

  isDebugEnabled() {
    return localStorage.getItem('siteReaderDebug') === 'true';
  }

  getLogs() {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
  }

  exportLogs() {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Create global logger instance
if (typeof window !== 'undefined') {
  window.logger = new SiteReaderLogger();
}

// Export for Node/module environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SiteReaderLogger;
}
