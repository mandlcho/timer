/**
 * Core Timer Module
 * Framework-agnostic timer logic that can be used in web or terminal UI
 */

class Timer {
  constructor(options = {}) {
    this.duration = options.duration || 25 * 60; // default 25 minutes in seconds
    this.remaining = this.duration;
    this.activity = options.activity || 'Focus';
    this.isRunning = false;
    this.intervalId = null;
    this.startTime = null;

    // Callbacks
    this.onTick = options.onTick || (() => {});
    this.onComplete = options.onComplete || (() => {});
    this.onStop = options.onStop || (() => {});
  }

  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.startTime = Date.now();

    this.intervalId = setInterval(() => {
      this.remaining--;
      this.onTick(this.remaining);

      if (this.remaining <= 0) {
        this.complete();
      }
    }, 1000);
  }

  stop() {
    if (!this.isRunning) return;

    clearInterval(this.intervalId);
    this.isRunning = false;

    const elapsed = this.duration - this.remaining;
    this.onStop({
      activity: this.activity,
      duration: this.duration,
      elapsed: elapsed,
      completed: false,
      timestamp: new Date().toISOString()
    });
  }

  complete() {
    clearInterval(this.intervalId);
    this.isRunning = false;
    this.remaining = 0;

    this.onComplete({
      activity: this.activity,
      duration: this.duration,
      elapsed: this.duration,
      completed: true,
      timestamp: new Date().toISOString()
    });
  }

  reset() {
    this.stop();
    this.remaining = this.duration;
  }

  setDuration(seconds) {
    this.duration = seconds;
    if (!this.isRunning) {
      this.remaining = seconds;
    }
  }

  setActivity(name) {
    this.activity = name;
  }

  getState() {
    return {
      remaining: this.remaining,
      duration: this.duration,
      activity: this.activity,
      isRunning: this.isRunning
    };
  }

  static formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  static parseTime(str) {
    const parts = str.split(':').map(Number);
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    return parseInt(str, 10) * 60; // assume minutes if just a number
  }
}

/**
 * History Manager
 * Handles persistent storage of timer sessions
 */
class HistoryManager {
  constructor(storage = null) {
    this.storage = storage;
    this.key = 'focus-timer-history';
  }

  getAll() {
    if (!this.storage) return [];
    try {
      return JSON.parse(this.storage.getItem(this.key)) || [];
    } catch {
      return [];
    }
  }

  add(entry) {
    const history = this.getAll();
    history.unshift(entry);
    // Keep last 100 entries
    if (history.length > 100) {
      history.pop();
    }
    if (this.storage) {
      this.storage.setItem(this.key, JSON.stringify(history));
    }
    return history;
  }

  delete(index) {
    const history = this.getAll();
    if (index >= 0 && index < history.length) {
      history.splice(index, 1);
      if (this.storage) {
        this.storage.setItem(this.key, JSON.stringify(history));
      }
    }
    return history;
  }

  clear() {
    if (this.storage) {
      this.storage.removeItem(this.key);
    }
  }
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Timer, HistoryManager };
}
