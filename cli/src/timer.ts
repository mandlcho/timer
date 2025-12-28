/**
 * Core Timer Module (ES Module version for CLI)
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';

export class Timer {
  constructor(options = {}) {
    this.duration = options.duration || 25 * 60;
    this.remaining = this.duration;
    this.activity = options.activity || 'Focus';
    this.isRunning = false;
    this.intervalId = null;
    this.startTime = null;

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

  static formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}

export class HistoryManager {
  constructor(filePath = null) {
    this.filePath = filePath;
    this.history = [];
    this.load();
  }

  load() {
    if (!this.filePath) return;
    try {
      if (existsSync(this.filePath)) {
        this.history = JSON.parse(readFileSync(this.filePath, 'utf8'));
      }
    } catch {
      this.history = [];
    }
  }

  save() {
    if (!this.filePath) return;
    try {
      writeFileSync(this.filePath, JSON.stringify(this.history, null, 2));
    } catch (e) {
      // Ignore save errors
    }
  }

  getAll() {
    return this.history;
  }

  add(entry) {
    this.history.unshift(entry);
    if (this.history.length > 100) {
      this.history.pop();
    }
    this.save();
    return this.history;
  }

  clear() {
    this.history = [];
    this.save();
  }
}
