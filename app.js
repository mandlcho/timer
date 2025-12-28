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

  // Calendar DOM Elements
  const calendarGrid = document.getElementById('calendar-grid');
  const calendarMonth = document.getElementById('calendar-month');
  const calendarLegend = document.getElementById('calendar-legend');
  const prevMonthBtn = document.getElementById('prev-month');
  const nextMonthBtn = document.getElementById('next-month');

  // Theme toggle
  const themeToggle = document.getElementById('theme-toggle');

  // Timer ring
  const timerRingProgress = document.getElementById('timer-ring-progress');
  const ringCircumference = 2 * Math.PI * 100; // r=100

  function updateRing(remaining, duration) {
    const progress = remaining / duration;
    const offset = ringCircumference * (1 - progress);
    timerRingProgress.style.strokeDasharray = ringCircumference;
    timerRingProgress.style.strokeDashoffset = offset;
  }

  function resetRing() {
    timerRingProgress.style.strokeDasharray = ringCircumference;
    timerRingProgress.style.strokeDashoffset = 0;
  }

  // Calendar state
  let currentDate = new Date();
  let selectedDate = null;

  // Activity color palette
  const activityColors = {};
  const colorPalette = [
    '#4a9eff', '#4ade80', '#f472b6', '#fb923c',
    '#a78bfa', '#22d3d8', '#facc15', '#f87171'
  ];
  let colorIndex = 0;

  function getActivityColor(activity) {
    if (!activityColors[activity]) {
      activityColors[activity] = colorPalette[colorIndex % colorPalette.length];
      colorIndex++;
    }
    return activityColors[activity];
  }

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
      updateRing(remaining, timer.duration);
    },
    onComplete: (entry) => {
      playDing();
      historyManager.add(entry);
      updateUI('stopped');
      renderHistory();
      renderCalendar();
    },
    onStop: (entry) => {
      playDing();
      historyManager.add(entry);
      renderHistory();
      renderCalendar();
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
    let history = historyManager.getAll();

    // Filter by selected date if any
    let dateLabel = '';
    if (selectedDate) {
      const selectedKey = getDateKey(selectedDate);
      history = history.filter(entry => entry.timestamp.split('T')[0] === selectedKey);
      dateLabel = selectedDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    }

    // Update history header
    const historyTitle = document.querySelector('.history-title');
    if (selectedDate) {
      historyTitle.innerHTML = `${dateLabel} <span class="clear-filter" id="clear-date-filter">✕</span>`;
      // Add click handler for clear filter
      setTimeout(() => {
        const clearBtn = document.getElementById('clear-date-filter');
        if (clearBtn) {
          clearBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            selectedDate = null;
            renderCalendar();
            renderHistory();
          });
        }
      }, 0);
    } else {
      historyTitle.textContent = 'History';
    }

    if (history.length === 0) {
      const msg = selectedDate ? 'No sessions on this day' : 'No sessions yet';
      historyList.innerHTML = `<div class="empty-state">${msg}</div>`;
      return;
    }

    historyList.innerHTML = history.slice(0, 20).map(entry => {
      const date = new Date(entry.timestamp);
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      const elapsed = Timer.formatTime(entry.elapsed);
      const status = entry.completed ? 'completed' : 'stopped';
      const statusLabel = entry.completed ? 'done' : `${elapsed}`;
      const color = getActivityColor(entry.activity);

      return `
        <div class="history-item">
          <span class="history-activity">
            <span class="activity-dot" style="background: ${color}; display: inline-block; margin-right: 6px;"></span>
            ${escapeHtml(entry.activity)}
          </span>
          <span class="history-meta">
            <span class="history-status ${status}">${statusLabel}</span>
            <br>${selectedDate ? timeStr : dateStr + ' ' + timeStr}
          </span>
        </div>
      `;
    }).join('');
  }

  function getDateKey(date) {
    return date.toISOString().split('T')[0];
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Calendar functions

  function getHistoryByDate() {
    const history = historyManager.getAll();
    const byDate = {};

    history.forEach(entry => {
      const dateKey = entry.timestamp.split('T')[0];
      if (!byDate[dateKey]) {
        byDate[dateKey] = [];
      }
      byDate[dateKey].push(entry);
    });

    return byDate;
  }

  function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Update month label
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    calendarMonth.textContent = `${monthNames[month]} ${year}`;

    // Get first day of month and total days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay();
    const totalDays = lastDay.getDate();

    // Get history grouped by date
    const historyByDate = getHistoryByDate();
    const today = new Date();
    const todayKey = getDateKey(today);

    // Build calendar HTML
    let html = '';

    // Weekday headers
    const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    weekdays.forEach(day => {
      html += `<div class="calendar-weekday">${day}</div>`;
    });

    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      html += `<div class="calendar-day other-month"><span class="day-number">${day}</span></div>`;
    }

    // Current month days
    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(year, month, day);
      const dateKey = getDateKey(date);
      const isToday = dateKey === todayKey;
      const isSelected = selectedDate && dateKey === getDateKey(selectedDate);
      const dayEntries = historyByDate[dateKey] || [];
      const hasActivity = dayEntries.length > 0;

      let classes = 'calendar-day';
      if (isToday) classes += ' today';
      if (isSelected) classes += ' selected';
      if (hasActivity) classes += ' has-activity';

      // Get unique activities for this day
      const uniqueActivities = [...new Set(dayEntries.map(e => e.activity))];
      const dotsHtml = uniqueActivities.slice(0, 4).map(activity => {
        const color = getActivityColor(activity);
        return `<span class="activity-dot" style="background: ${color}" title="${escapeHtml(activity)}"></span>`;
      }).join('');

      html += `
        <div class="${classes}" data-date="${dateKey}">
          <span class="day-number">${day}</span>
          <div class="day-dots">${dotsHtml}</div>
        </div>
      `;
    }

    // Next month days to fill grid
    const totalCells = startDayOfWeek + totalDays;
    const remainingCells = (7 - (totalCells % 7)) % 7;
    for (let day = 1; day <= remainingCells; day++) {
      html += `<div class="calendar-day other-month"><span class="day-number">${day}</span></div>`;
    }

    calendarGrid.innerHTML = html;

    // Add click handlers
    calendarGrid.querySelectorAll('.calendar-day:not(.other-month)').forEach(dayEl => {
      dayEl.addEventListener('click', () => {
        const dateStr = dayEl.dataset.date;
        if (selectedDate && getDateKey(selectedDate) === dateStr) {
          selectedDate = null;
        } else {
          selectedDate = new Date(dateStr + 'T00:00:00');
        }
        renderCalendar();
        renderHistory();
      });
    });

    // Render legend
    renderLegend();
  }

  function renderLegend() {
    const history = historyManager.getAll();
    const activities = [...new Set(history.map(e => e.activity))];

    if (activities.length === 0) {
      calendarLegend.innerHTML = '';
      return;
    }

    calendarLegend.innerHTML = activities.slice(0, 8).map(activity => {
      const color = getActivityColor(activity);
      return `
        <div class="legend-item">
          <span class="legend-dot" style="background: ${color}"></span>
          <span>${escapeHtml(activity)}</span>
        </div>
      `;
    }).join('');
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
    resetRing();
    timer.start();
    updateUI('running');
  });

  stopBtn.addEventListener('click', () => {
    timer.stop();
    updateUI('stopped');
  });

  resetBtn.addEventListener('click', () => {
    timer.reset();
    resetRing();
    updateDisplayFromInputs();
    updateUI('ready');
  });

  minutesInput.addEventListener('input', updateDisplayFromInputs);
  secondsInput.addEventListener('input', updateDisplayFromInputs);

  clearHistoryBtn.addEventListener('click', () => {
    if (confirm('Clear all history?')) {
      historyManager.clear();
      selectedDate = null;
      renderHistory();
      renderCalendar();
    }
  });

  // Calendar navigation
  prevMonthBtn.addEventListener('click', () => {
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    renderCalendar();
  });

  nextMonthBtn.addEventListener('click', () => {
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    renderCalendar();
  });

  // Theme toggle
  let preFocusTheme = null;

  function getTheme() {
    return localStorage.getItem('focus-timer-theme') || 'dark';
  }

  function setTheme(theme, persist = true) {
    if (persist) {
      localStorage.setItem('focus-timer-theme', theme);
    }
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
      themeToggle.textContent = '◑';
    } else {
      document.documentElement.removeAttribute('data-theme');
      themeToggle.textContent = '◐';
    }
  }

  function enterFocusMode() {
    preFocusTheme = getTheme();
    setTheme('dark', false);
    themeToggle.disabled = true;
    themeToggle.style.opacity = '0.3';
  }

  function exitFocusMode() {
    if (preFocusTheme) {
      setTheme(preFocusTheme, false);
      preFocusTheme = null;
    }
    themeToggle.disabled = false;
    themeToggle.style.opacity = '';
  }

  themeToggle.addEventListener('click', () => {
    const current = getTheme();
    setTheme(current === 'dark' ? 'light' : 'dark');
  });

  // Initialize
  setTheme(getTheme());
  resetRing();
  updateDisplayFromInputs();
  renderHistory();
  renderCalendar();

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

  // Request wake lock and enter focus mode when timer starts
  const originalStart = timer.start.bind(timer);
  timer.start = function() {
    requestWakeLock();
    enterFocusMode();
    originalStart();
  };

  // Release wake lock and exit focus mode when timer stops
  const originalStop = timer.stop.bind(timer);
  timer.stop = function() {
    if (wakeLock) {
      wakeLock.release();
      wakeLock = null;
    }
    exitFocusMode();
    originalStop();
  };

  // Also exit focus mode on complete
  const originalComplete = timer.complete.bind(timer);
  timer.complete = function() {
    if (wakeLock) {
      wakeLock.release();
      wakeLock = null;
    }
    exitFocusMode();
    originalComplete();
  };
})();
