/**
 * Focus Timer Web App
 * UI bindings and audio notification
 */

(function() {
  // DOM Elements
  const activityInput = document.getElementById('activity');
  const timeDisplay = document.getElementById('time-display');
  const timeSetup = document.getElementById('time-setup');
  const minutesInput = document.getElementById('minutes');
  const secondsInput = document.getElementById('seconds');
  const startBtn = document.getElementById('start-btn');
  const stopBtn = document.getElementById('stop-btn');
  const resetBtn = document.getElementById('reset-btn');
  const historyList = document.getElementById('history-list');
  const clearHistoryBtn = document.getElementById('clear-history');

  // Audio context for notification sound
  let audioContext = null;

  function playDing() {
    try {
      if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 880; // A5 note
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);

      // Play a second tone for a nicer ding
      setTimeout(() => {
        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();

        osc2.connect(gain2);
        gain2.connect(audioContext.destination);

        osc2.frequency.value = 1320; // E6 note
        osc2.type = 'sine';

        gain2.gain.setValueAtTime(0.2, audioContext.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);

        osc2.start(audioContext.currentTime);
        osc2.stop(audioContext.currentTime + 0.8);
      }, 150);
    } catch (e) {
      console.warn('Audio not supported:', e);
    }
  }

  // Initialize history manager
  const historyManager = new HistoryManager(localStorage);

  // Initialize timer
  const timer = new Timer({
    duration: 25 * 60,
    activity: 'Focus',
    onTick: (remaining) => {
      timeDisplay.textContent = Timer.formatTime(remaining);
    },
    onComplete: (entry) => {
      playDing();
      historyManager.add(entry);
      updateUI('stopped');
      renderHistory();
    },
    onStop: (entry) => {
      playDing();
      historyManager.add(entry);
      renderHistory();
    }
  });

  function updateUI(state) {
    switch (state) {
      case 'running':
        startBtn.classList.add('hidden');
        stopBtn.classList.remove('hidden');
        resetBtn.classList.add('hidden');
        timeSetup.classList.add('hidden');
        activityInput.disabled = true;
        break;
      case 'stopped':
        startBtn.classList.remove('hidden');
        stopBtn.classList.add('hidden');
        resetBtn.classList.remove('hidden');
        timeSetup.classList.remove('hidden');
        activityInput.disabled = false;
        break;
      case 'ready':
        startBtn.classList.remove('hidden');
        stopBtn.classList.add('hidden');
        resetBtn.classList.add('hidden');
        timeSetup.classList.remove('hidden');
        activityInput.disabled = false;
        break;
    }
  }

  function getDuration() {
    const mins = parseInt(minutesInput.value, 10) || 0;
    const secs = parseInt(secondsInput.value, 10) || 0;
    return mins * 60 + secs;
  }

  function updateDisplayFromInputs() {
    const duration = getDuration();
    timeDisplay.textContent = Timer.formatTime(duration);
  }

  function renderHistory() {
    const history = historyManager.getAll();

    if (history.length === 0) {
      historyList.innerHTML = '<div class="empty-state">No sessions yet</div>';
      return;
    }

    historyList.innerHTML = history.slice(0, 20).map(entry => {
      const date = new Date(entry.timestamp);
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      const elapsed = Timer.formatTime(entry.elapsed);
      const status = entry.completed ? 'completed' : 'stopped';
      const statusLabel = entry.completed ? 'done' : `${elapsed}`;

      return `
        <div class="history-item">
          <span class="history-activity">${escapeHtml(entry.activity)}</span>
          <span class="history-meta">
            <span class="history-status ${status}">${statusLabel}</span>
            <br>${dateStr} ${timeStr}
          </span>
        </div>
      `;
    }).join('');
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Event listeners
  startBtn.addEventListener('click', () => {
    const duration = getDuration();
    if (duration <= 0) {
      minutesInput.value = 25;
      timer.setDuration(25 * 60);
    } else {
      timer.setDuration(duration);
    }

    const activity = activityInput.value.trim() || 'Focus';
    timer.setActivity(activity);
    timer.remaining = timer.duration;
    timer.start();
    updateUI('running');
  });

  stopBtn.addEventListener('click', () => {
    timer.stop();
    updateUI('stopped');
  });

  resetBtn.addEventListener('click', () => {
    timer.reset();
    updateDisplayFromInputs();
    updateUI('ready');
  });

  minutesInput.addEventListener('input', updateDisplayFromInputs);
  secondsInput.addEventListener('input', updateDisplayFromInputs);

  clearHistoryBtn.addEventListener('click', () => {
    if (confirm('Clear all history?')) {
      historyManager.clear();
      renderHistory();
    }
  });

  // Initialize
  updateDisplayFromInputs();
  renderHistory();

  // Wake lock to prevent screen from sleeping (if supported)
  let wakeLock = null;

  async function requestWakeLock() {
    try {
      if ('wakeLock' in navigator) {
        wakeLock = await navigator.wakeLock.request('screen');
      }
    } catch (e) {
      console.log('Wake lock not available');
    }
  }

  // Request wake lock when timer starts
  const originalStart = timer.start.bind(timer);
  timer.start = function() {
    requestWakeLock();
    originalStart();
  };

  // Release wake lock when timer stops
  const originalStop = timer.stop.bind(timer);
  timer.stop = function() {
    if (wakeLock) {
      wakeLock.release();
      wakeLock = null;
    }
    originalStop();
  };
})();
