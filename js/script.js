/**
 * Life Dashboard — js/script.js
 *
 * Modules:
 *   - StorageModule   (Task 2.1)
 *   - ThemeModule     (Task 2.2)
 *   - ClockModule     (Task 3.1)
 *   - GreetingModule  (Task 3.4)
 *   - TimerModule     (Task 5.1)
 *   - TaskModule      (Task 6.1 – 6.10)
 *   - LinksModule     (Task 8.1 – 8.2)
 *
 * Boot sequence wired in DOMContentLoaded (Task 11).
 */

// =============================================================================
// StorageModule — Task 2.1
// Thin wrapper around localStorage with JSON parse/stringify and error handling.
// Requirements: 4.5, 4.6, 6.4, 7.5, 8.1, 8.2, 8.3, 8.4
// =============================================================================
var StorageModule = {
  /**
   * Retrieves and JSON-parses the value stored under `key`.
   * Returns null if the key is absent, if JSON.parse fails, or if
   * localStorage is unavailable (SecurityError).
   *
   * @param {string} key
   * @returns {*} parsed value or null
   */
  get: function (key) {
    try {
      var raw = localStorage.getItem(key);
      if (raw === null) return null;
      return JSON.parse(raw);
    } catch (e) {
      // Covers SecurityError (storage blocked) and SyntaxError (invalid JSON)
      return null;
    }
  },

  /**
   * JSON-serializes `value` and stores it under `key`.
   * Swallows SecurityError so the app keeps working in-memory even when
   * localStorage is blocked.
   *
   * @param {string} key
   * @param {*} value
   */
  set: function (key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      // localStorage unavailable; in-memory state continues to work
    }
  },

  /**
   * Retrieves and JSON-parses the value stored under `key`, then validates
   * that the result is an array.
   * Returns [] if the key is absent, if JSON.parse fails, if localStorage is
   * unavailable, or if the parsed value is not an array.
   *
   * @param {string} key
   * @returns {Array}
   */
  getArray: function (key) {
    try {
      var val = JSON.parse(localStorage.getItem(key));
      return Array.isArray(val) ? val : [];
    } catch (e) {
      return [];
    }
  }
};

// =============================================================================
// ThemeModule — Task 2.2
// Reads/writes the 'theme' key in localStorage and toggles the body class.
// Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
// =============================================================================
var ThemeModule = {
  /**
   * Reads the stored theme, validates it, and applies the corresponding class
   * to <body>. Falls back to 'light' for any missing or invalid value.
   * Called immediately (before DOMContentLoaded) to prevent a flash of the
   * wrong theme.
   */
  init: function () {
    var stored = StorageModule.get('theme');
    var theme = (stored === 'light' || stored === 'dark') ? stored : 'light';
    document.body.className = 'theme-' + theme;
  },

  /**
   * Flips the active theme between 'theme-light' and 'theme-dark' on <body>,
   * then persists the new value under the 'theme' key in localStorage.
   */
  toggle: function () {
    var isDark = document.body.classList.contains('theme-dark');
    var next = isDark ? 'light' : 'dark';
    document.body.className = 'theme-' + next;
    StorageModule.set('theme', next);
  }
};

// Apply theme immediately so the correct class is on <body> before the first
// paint — this avoids a visible flash of the default light theme on dark-mode
// sessions. (ThemeModule.init() is also called in the DOMContentLoaded boot
// sequence for consistency, but this early call is what prevents the flash.)
ThemeModule.init();

// =============================================================================
// ClockModule — Task 3.1
// Manages the live clock: starts a 1-second interval, formats time and date,
// and writes both to the DOM.
// Requirements: 1.1, 1.2, 1.3
// =============================================================================

/**
 * Formats a Date's time component as zero-padded HH:MM:SS (24-hour).
 * Exposed at top level for testability (Property 1).
 *
 * @param {Date} date
 * @returns {string} e.g. "09:05:03"
 */
var formatTime = function (date) {
  var hh = String(date.getHours()).padStart(2, '0');
  var mm = String(date.getMinutes()).padStart(2, '0');
  var ss = String(date.getSeconds()).padStart(2, '0');
  return hh + ':' + mm + ':' + ss;
};

/**
 * Formats a Date's date component as "DayName, MonthName DD, YYYY".
 * Day and month names are English full names. DD is not zero-padded.
 * Exposed at top level for testability (Property 2).
 *
 * @param {Date} date
 * @returns {string} e.g. "Tuesday, January 21, 2025"
 */
var formatDate = function (date) {
  var dayNames = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday',
    'Thursday', 'Friday', 'Saturday'
  ];
  var monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  var dayName   = dayNames[date.getDay()];
  var monthName = monthNames[date.getMonth()];
  var day       = date.getDate();          // not zero-padded
  var year      = date.getFullYear();
  return dayName + ', ' + monthName + ' ' + day + ', ' + year;
};

var ClockModule = {
  /**
   * Calls tick() once immediately (so the display is correct on load),
   * then starts a 1-second interval.
   * Requirement 1.2 — begins updating every 1 second without a page reload.
   */
  start: function () {
    this.tick();
    setInterval(function () {
      ClockModule.tick();
    }, 1000);
  },

  /**
   * Reads the current Date, formats it, and writes both parts to the DOM.
   * Requirement 1.1 — HH:MM:SS (24-hour) in #clock-time.
   * Requirement 1.3 — DayName, MonthName DD, YYYY in #clock-date.
   */
  tick: function () {
    var now = new Date();
    var timeEl = document.getElementById('clock-time');
    var dateEl = document.getElementById('clock-date');
    if (timeEl) timeEl.textContent = formatTime(now);
    if (dateEl) dateEl.textContent = formatDate(now);
  }
};

// =============================================================================
// GreetingModule — Task 3.4
// Reads/writes userName, determines the time-sensitive greeting period, and
// updates the DOM greeting element.
// Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9
// =============================================================================

/**
 * Maps an integer hour (0–23) to one of three period strings.
 * Exposed at top level for testability (Property 3).
 *
 * @param {number} hour  integer 0–23
 * @returns {"Morning"|"Afternoon"|"Evening"}
 */
var getGreetingPeriod = function (hour) {
  if (hour <= 11) return 'Morning';
  if (hour <= 17) return 'Afternoon';
  return 'Evening';
};

/**
 * Builds the full greeting string for a given hour and name.
 * Exposed at top level for testability (Property 4).
 *
 * @param {number} hour  integer 0–23
 * @param {string|null|undefined} name
 * @returns {string} e.g. "Good Morning, Fadhil" or "Good Evening, User"
 */
var renderGreeting = function (hour, name) {
  var period = getGreetingPeriod(hour);
  var displayName = (name && name.length > 0) ? name : 'User';
  return 'Good ' + period + ', ' + displayName;
};

var GreetingModule = {
  /**
   * Reads userName from storage and renders the greeting.
   * Requirement 2.8 — called on Dashboard load.
   */
  init: function () {
    this.render();
  },

  /**
   * Reads the current hour and the stored userName, builds the greeting
   * string via renderGreeting(), and writes it to #greeting-text.
   * Requirements 2.1–2.5.
   */
  render: function () {
    var hour = new Date().getHours();
    var name = StorageModule.get('userName');
    var text = renderGreeting(hour, name);
    var el = document.getElementById('greeting-text');
    if (el) el.textContent = text;
  },

  /**
   * Validates, trims, and persists a new user name, then re-renders.
   * Requirements 2.6, 2.7, 2.9.
   *
   * @param {string} input  raw value from the name input field
   */
  saveName: function (input) {
    var trimmed = input.trim();
    var errorEl = document.getElementById('name-error');

    if (trimmed.length > 50) {
      // Requirement 2.9 — name too long: show error, do NOT save
      if (errorEl) errorEl.textContent = 'Name must be 50 characters or fewer.';
      return;
    }

    // Clear any previous error in all non-error cases
    if (errorEl) errorEl.textContent = '';

    if (trimmed.length === 0) {
      // Empty input: clear error but do NOT save
      return;
    }

    // Valid name (1–50 chars): persist and re-render
    StorageModule.set('userName', trimmed);
    this.render();
  }
};

// =============================================================================
// TimerModule — Task 5.1
// Pomodoro countdown timer: 25-minute (1500 s) default, start/stop/reset guard.
// Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8
// =============================================================================
var TimerModule = {
  /** Internal state — exposed for testability. */
  _state: {
    remaining: 1500,   // seconds
    running: false,
    intervalId: null
  },

  /**
   * Formats an integer number of seconds as "MM:SS".
   * Exposed as a standalone helper for testability (Property 6, 7).
   *
   * @param {number} seconds  non-negative integer
   * @returns {string} e.g. "25:00", "04:37", "00:00"
   */
  _format: function (seconds) {
    var mm = String(Math.floor(seconds / 60)).padStart(2, '0');
    var ss = String(seconds % 60).padStart(2, '0');
    return mm + ':' + ss;
  },

  /**
   * Writes the formatted time to the #timer-display element.
   * Requirement 3.1 — shows "25:00" on Dashboard load.
   *
   * @param {number} seconds
   */
  display: function (seconds) {
    var el = document.getElementById('timer-display');
    if (el) el.textContent = this._format(seconds);
  },

  /**
   * Sets remaining to 1500, running to false, and updates the display.
   * Called once at page load.
   * Requirement 3.1.
   */
  init: function () {
    this._state.remaining = 1500;
    this._state.running = false;
    this._state.intervalId = null;
    // Clear any leftover notification from a previous session
    var errEl = document.getElementById('timer-error');
    if (errEl) errEl.textContent = '';
    this.display(1500);
  },

  /**
   * Begins the countdown.
   * Guard: no-op if already running (Req 3.5) or remaining === 0 (Req 3.7).
   * Requirement 3.2.
   */
  start: function () {
    if (this._state.running || this._state.remaining === 0) return;
    this._state.running = true;
    // Clear any previous session-end message when a new session starts
    var errEl = document.getElementById('timer-error');
    if (errEl) errEl.textContent = '';
    this._state.intervalId = setInterval(function () {
      TimerModule.tick();
    }, 1000);
  },

  /**
   * Pauses the countdown by clearing the interval and marking running = false.
   * Safe to call when not running (Req 3.8) — clearInterval on null is a no-op.
   * Requirement 3.3.
   */
  stop: function () {
    clearInterval(this._state.intervalId);
    this._state.intervalId = null;
    this._state.running = false;
  },

  /**
   * Stops any active countdown and restores the display to 25:00.
   * Requirement 3.4.
   */
  reset: function () {
    this.stop();
    this._state.remaining = 1500;
    var errEl = document.getElementById('timer-error');
    if (errEl) errEl.textContent = '';
    this.display(1500);
  },

  /**
   * Called every second while the timer is running.
   * Decrements remaining; when it reaches 0, stops the timer and shows the
   * session-end notification via the in-DOM #timer-error element.
   * Requirement 3.2, 3.6.
   */
  tick: function () {
    this._state.remaining -= 1;
    this.display(this._state.remaining);
    if (this._state.remaining === 0) {
      this.stop();
      // Requirement 3.6 — in-DOM notification, consistent with error-msg pattern
      var errEl = document.getElementById('timer-error');
      if (errEl) errEl.textContent = '🎉 Session complete! Take a break.';
    }
  }
};

// =============================================================================
// TaskModule — Tasks 6.1, 6.2, 6.6, 6.10
// Full CRUD for the to-do list: add, edit, toggle completion, delete, persist.
// Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 8.1
// =============================================================================

/**
 * Factory function: creates a new task object.
 * Exposed at top level for testability.
 *
 * @param {string} text  already-trimmed task text
 * @returns {{ id: string, text: string, completed: boolean }}
 */
var createTask = function (text) {
  return {
    id: Date.now().toString(),
    text: text,
    completed: false
  };
};

var TaskModule = {
  /** In-memory task array. Populated by init(). */
  _tasks: [],

  /**
   * Shows an error message in the task card's error element.
   * Passing an empty string clears any previous message.
   *
   * @param {string} msg
   */
  _showError: function (msg) {
    var el = document.getElementById('task-error');
    if (!el) return;
    el.textContent = msg;
    if (msg) {
      el.classList.add('visible');
    } else {
      el.classList.remove('visible');
    }
  },

  /**
   * Reads the persisted task array from localStorage and calls render().
   * Requirements: 4.5, 4.6, 8.1
   */
  init: function () {
    this._tasks = StorageModule.getArray('tasks');
    this.render();
  },

  /**
   * Clears the #task-list DOM and re-renders every task as an <li>.
   * Completed tasks get a checked checkbox and line-through text style.
   * Requirements: 5.4, 5.5
   */
  render: function () {
    var listEl = document.getElementById('task-list');
    if (!listEl) return;

    // Clear existing items
    listEl.innerHTML = '';

    var self = this;
    this._tasks.forEach(function (task) {
      var li = document.createElement('li');
      li.className = 'task-item';
      li.setAttribute('data-id', task.id);

      // --- Checkbox ---
      var checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'task-checkbox';
      checkbox.checked = task.completed;
      checkbox.setAttribute('aria-label', 'Mark task complete: ' + task.text);
      checkbox.addEventListener('change', function () {
        self.toggleComplete(task.id);
      });

      // --- Text span ---
      var textSpan = document.createElement('span');
      textSpan.className = 'task-text';
      textSpan.textContent = task.text;
      if (task.completed) {
        textSpan.style.textDecoration = 'line-through';
      }

      // --- Edit button ---
      var editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'task-edit-btn';
      editBtn.textContent = 'Edit';
      editBtn.setAttribute('aria-label', 'Edit task: ' + task.text);
      editBtn.addEventListener('click', function () {
        self._enterEditMode(li, task);
      });

      // --- Delete button ---
      var deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'task-delete-btn';
      deleteBtn.textContent = 'Delete';
      deleteBtn.setAttribute('aria-label', 'Delete task: ' + task.text);
      deleteBtn.addEventListener('click', function () {
        self.delete(task.id);
      });

      li.appendChild(checkbox);
      li.appendChild(textSpan);
      li.appendChild(editBtn);
      li.appendChild(deleteBtn);
      listEl.appendChild(li);
    });
  },

  /**
   * Switches a task <li> into inline edit mode.
   * Replaces the text span with an <input>; adds Save and Cancel buttons.
   * Confirms on Enter / save-btn; cancels on Escape / cancel-btn.
   * Requirements: 5.1, 5.2
   *
   * @param {HTMLElement} li       the <li> element for this task
   * @param {{ id: string, text: string, completed: boolean }} task
   */
  _enterEditMode: function (li, task) {
    // Prevent entering edit mode on an already-editing item
    if (li.querySelector('.task-edit-input')) return;

    var self = this;

    // Hide/remove the static text span and original edit/delete buttons
    var textSpan = li.querySelector('.task-text');
    var editBtn  = li.querySelector('.task-edit-btn');
    var deleteBtn = li.querySelector('.task-delete-btn');
    if (textSpan)  textSpan.style.display = 'none';
    if (editBtn)   editBtn.style.display = 'none';
    if (deleteBtn) deleteBtn.style.display = 'none';

    // Create the edit input pre-filled with the current text
    var input = document.createElement('input');
    input.type = 'text';
    input.className = 'task-edit-input';
    input.value = task.text;
    input.setAttribute('aria-label', 'Edit text for task: ' + task.text);
    input.maxLength = 501;

    // Save button
    var saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.className = 'task-save-btn';
    saveBtn.textContent = 'Save';
    saveBtn.setAttribute('aria-label', 'Save edit');

    // Cancel button
    var cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'task-cancel-btn';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.setAttribute('aria-label', 'Cancel edit');

    // Confirm logic (Enter or save button)
    var confirmEdit = function () {
      self.edit(task.id, input.value);
    };

    // Cancel logic (Escape or cancel button)
    var cancelEdit = function () {
      self.render(); // re-render restores original state
    };

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        confirmEdit();
      } else if (e.key === 'Escape') {
        cancelEdit();
      }
    });

    saveBtn.addEventListener('click', confirmEdit);
    cancelBtn.addEventListener('click', cancelEdit);

    li.insertBefore(input, editBtn);
    li.insertBefore(saveBtn, editBtn);
    li.insertBefore(cancelBtn, editBtn);

    input.focus();
  },

  /**
   * Validates and adds a new task.
   * Rejects: empty/whitespace, > 500 chars, case-insensitive duplicate.
   * On success: creates task object, pushes, persists, re-renders.
   * Requirements: 4.1, 4.2, 4.3, 4.4
   *
   * @param {string} text  raw value from the task input field
   */
  add: function (text) {
    var trimmed = (text || '').trim();

    // Requirement 4.4 — empty / whitespace only
    if (trimmed.length === 0) {
      this._showError('Please enter a task.');
      return;
    }

    // Reject text longer than 500 characters
    if (trimmed.length > 500) {
      this._showError('Task must be 500 characters or fewer.');
      return;
    }

    // Requirement 4.3 — case-insensitive duplicate check
    var lowerTrimmed = trimmed.toLowerCase();
    var isDuplicate = this._tasks.some(function (t) {
      return t.text.trim().toLowerCase() === lowerTrimmed;
    });
    if (isDuplicate) {
      this._showError('Task already exists');
      return;
    }

    // Clear any previous error
    this._showError('');

    // Requirement 4.1 — create task, push, persist, re-render
    var task = createTask(trimmed);
    this._tasks.push(task);
    StorageModule.set('tasks', this._tasks);
    this.render();

    // Clear the input field
    var inputEl = document.getElementById('task-input');
    if (inputEl) inputEl.value = '';
  },

  /**
   * Validates and saves edited task text.
   * Clears error if new text is valid; shows error and aborts on failure.
   * Requirements: 5.1
   *
   * @param {string} id       task id
   * @param {string} newText  raw value from the edit input
   */
  edit: function (id, newText) {
    var trimmed = (newText || '').trim();

    if (trimmed.length === 0) {
      this._showError('Task text cannot be empty.');
      return;
    }

    if (trimmed.length > 500) {
      this._showError('Task must be 500 characters or fewer.');
      return;
    }

    this._showError('');

    for (var i = 0; i < this._tasks.length; i++) {
      if (this._tasks[i].id === id) {
        this._tasks[i].text = trimmed;
        break;
      }
    }

    StorageModule.set('tasks', this._tasks);
    this.render();
  },

  /**
   * Flips the completed boolean for the given task id, persists, re-renders.
   * Requirement: 5.3
   *
   * @param {string} id  task id
   */
  toggleComplete: function (id) {
    for (var i = 0; i < this._tasks.length; i++) {
      if (this._tasks[i].id === id) {
        this._tasks[i].completed = !this._tasks[i].completed;
        break;
      }
    }
    StorageModule.set('tasks', this._tasks);
    this.render();
  },

  /**
   * Removes the task with the given id from the list, persists, re-renders.
   * Requirement: 5.6
   *
   * @param {string} id  task id
   */
  delete: function (id) {
    this._tasks = this._tasks.filter(function (t) {
      return t.id !== id;
    });
    StorageModule.set('tasks', this._tasks);
    this.render();
  }
};

// =============================================================================
// isValidUrl — Task 8.1
// Pure validation helper: returns true only for http:// or https:// URLs.
// Exposed at top level for testability (Properties 16, 18).
// Requirements: 6.1, 6.7
// =============================================================================

/**
 * Returns true if `url` starts with "http://" or "https://", false otherwise.
 * Exposed at top level for testability.
 *
 * @param {string} url
 * @returns {boolean}
 */
var isValidUrl = function (url) {
  return typeof url === 'string' &&
    (url.indexOf('http://') === 0 || url.indexOf('https://') === 0);
};

// =============================================================================
// LinksModule — Tasks 8.1, 8.2
// Full CRUD for the quick links manager: add, delete, open, persist.
// Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 8.2
// =============================================================================
var LinksModule = {
  /** In-memory links array. Populated by init(). */
  _links: [],

  /**
   * Shows an error message in the links card's error element.
   * Passing an empty string clears any previous message.
   * Consistent with TaskModule._showError pattern.
   *
   * @param {string} msg
   */
  _showError: function (msg) {
    var el = document.getElementById('links-error');
    if (!el) return;
    el.textContent = msg;
    if (msg) {
      el.classList.add('visible');
    } else {
      el.classList.remove('visible');
    }
  },

  /**
   * Reads the persisted links array from localStorage and calls render().
   * Requirements: 6.4, 8.2
   */
  init: function () {
    this._links = StorageModule.getArray('quickLinks');
    this.render();
  },

  /**
   * Clears the #links-list DOM and re-renders every link as an <li>.
   * Shows an empty-state message when no links are saved.
   * Requirements: 6.4, 6.6
   */
  render: function () {
    var listEl = document.getElementById('links-list');
    if (!listEl) return;

    // Clear existing items
    listEl.innerHTML = '';

    if (this._links.length === 0) {
      // Requirement 6.6 — empty-state message
      var emptyMsg = document.createElement('li');
      emptyMsg.className = 'links-empty';
      emptyMsg.textContent = 'No links saved yet';
      listEl.appendChild(emptyMsg);
      return;
    }

    var self = this;
    this._links.forEach(function (link) {
      var li = document.createElement('li');
      li.className = 'link-item';
      li.setAttribute('data-id', link.id);

      // --- Name/label span ---
      var nameSpan = document.createElement('span');
      nameSpan.className = 'link-name';
      nameSpan.textContent = link.name;

      // --- Open button ---
      var openBtn = document.createElement('button');
      openBtn.type = 'button';
      openBtn.className = 'link-open-btn';
      openBtn.textContent = 'Open';
      openBtn.setAttribute('aria-label', 'Open ' + link.name);
      (function (url) {
        openBtn.addEventListener('click', function () {
          self.open(url);
        });
      }(link.url));

      // --- Delete button ---
      var deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'link-delete-btn';
      deleteBtn.textContent = 'Delete';
      deleteBtn.setAttribute('aria-label', 'Delete ' + link.name);
      (function (id) {
        deleteBtn.addEventListener('click', function () {
          self.delete(id);
        });
      }(link.id));

      li.appendChild(nameSpan);
      li.appendChild(openBtn);
      li.appendChild(deleteBtn);
      listEl.appendChild(li);
    });
  },

  /**
   * Opens the given URL in a new browser tab with security attributes.
   * Requirement: 6.2
   *
   * @param {string} url
   */
  open: function (url) {
    window.open(url, '_blank', 'noopener,noreferrer');
  },

  /**
   * Validates and adds a new quick link.
   * Rejects: empty name, empty url, invalid url scheme, list at capacity (50).
   * On success: creates link object, pushes, persists, re-renders, clears form.
   * Requirements: 6.1, 6.5, 6.7
   *
   * @param {string} name  raw value from the link-name-input field
   * @param {string} url   raw value from the link-url-input field
   */
  add: function (name, url) {
    var trimmedName = (name || '').trim();
    var trimmedUrl  = (url  || '').trim();

    // Requirement 6.5 — empty name
    if (trimmedName.length === 0) {
      this._showError('Please enter a website name.');
      return;
    }

    // Requirement 6.5 — empty url
    if (trimmedUrl.length === 0) {
      this._showError('Please enter a URL.');
      return;
    }

    // Requirement 6.7 — invalid url scheme
    if (!isValidUrl(trimmedUrl)) {
      this._showError('URL must start with http:// or https://');
      return;
    }

    // Requirement 6.1 — maximum 50 links
    if (this._links.length >= 50) {
      this._showError('Maximum of 50 links reached.');
      return;
    }

    // Clear any previous error
    this._showError('');

    // Requirement 6.1 — create link object, push, persist, re-render
    var link = {
      id: Date.now().toString(),
      name: trimmedName,
      url: trimmedUrl
    };
    this._links.push(link);
    StorageModule.set('quickLinks', this._links);
    this.render();

    // Clear the form inputs
    var nameInput = document.getElementById('link-name-input');
    var urlInput  = document.getElementById('link-url-input');
    if (nameInput) nameInput.value = '';
    if (urlInput)  urlInput.value  = '';
  },

  /**
   * Removes the link with the given id from the list, persists, re-renders.
   * Requirement: 6.3
   *
   * @param {string} id  link id
   */
  delete: function (id) {
    this._links = this._links.filter(function (l) {
      return l.id !== id;
    });
    StorageModule.set('quickLinks', this._links);
    this.render();
  }
};

// =============================================================================
// DOMContentLoaded boot sequence
// All event wiring and module initialisation happens here so the DOM is ready.
// =============================================================================
document.addEventListener('DOMContentLoaded', function () {
  // --- Theme toggle button ---
  var themeToggleBtn = document.getElementById('theme-toggle');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', function () {
      ThemeModule.toggle();
    });
  }

  // --- Name form submit (Requirement 2.6, 2.7, 2.9) ---
  var nameForm = document.getElementById('name-form');
  if (nameForm) {
    nameForm.addEventListener('submit', function (event) {
      event.preventDefault();
      var input = document.getElementById('user-name-input');
      GreetingModule.saveName(input ? input.value : '');
    });
  }

  // --- Timer buttons (Requirements 3.2, 3.3, 3.4) ---
  var timerStartBtn = document.getElementById('timer-start');
  var timerStopBtn  = document.getElementById('timer-stop');
  var timerResetBtn = document.getElementById('timer-reset');
  if (timerStartBtn) timerStartBtn.addEventListener('click', function () { TimerModule.start(); });
  if (timerStopBtn)  timerStopBtn.addEventListener('click',  function () { TimerModule.stop();  });
  if (timerResetBtn) timerResetBtn.addEventListener('click', function () { TimerModule.reset(); });

  // --- Task form submit (Requirements 4.1–4.4) ---
  var taskForm = document.getElementById('task-form');
  if (taskForm) {
    taskForm.addEventListener('submit', function (event) {
      event.preventDefault();
      var input = document.getElementById('task-input');
      TaskModule.add(input ? input.value : '');
    });
  }

  // --- Links form submit (Requirements 6.1, 6.5, 6.7) ---
  var linksForm = document.getElementById('links-form');
  if (linksForm) {
    linksForm.addEventListener('submit', function (event) {
      event.preventDefault();
      var nameInput = document.getElementById('link-name-input');
      var urlInput  = document.getElementById('link-url-input');
      LinksModule.add(
        nameInput ? nameInput.value : '',
        urlInput  ? urlInput.value  : ''
      );
    });
  }

  // --- Initialise modules ---
  ThemeModule.init();      // Requirement 7.3 — apply persisted theme
  GreetingModule.init();   // Requirement 2.8
  ClockModule.start();     // Requirement 1.2
  TimerModule.init();      // Requirement 3.1 — display 25:00 on load
  TaskModule.init();       // Requirements 4.5, 4.6, 8.1 — load and render persisted tasks
  LinksModule.init();      // Requirements 6.4, 8.2 — load and render persisted quick links
});
