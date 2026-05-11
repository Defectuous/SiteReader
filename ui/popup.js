/**
 * SiteReader - Popup UI Controller
 * Handles user interactions and communication with content script
 */

const logger = new SiteReaderLogger('popup');

// UI State
let uiState = {
  chapters: [],
  currentChapter: 0,
  isPlaying: false,
  isPaused: false,
};

// DOM References
const elements = {
  playBtn: document.getElementById('playBtn'),
  pauseBtn: document.getElementById('pauseBtn'),
  stopBtn: document.getElementById('stopBtn'),
  restartBtn: document.getElementById('restartBtn'),
  logsBtn: document.getElementById('logsBtn'),
  pageTitle: document.getElementById('pageTitle'),
  status: document.getElementById('status'),
  statusIndicator: document.getElementById('statusIndicator'),
};

/**
 * Initialize popup
 */
function initializePopup() {
  logger.info('Popup initialized');
  
  attachEventListeners();
  loadPageTitle();
  loadInitialState();
  loadSettings();
}

/**
 * Load and display page title from og:title meta tag
 */
function loadPageTitle() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) {
      elements.pageTitle.textContent = 'No active page';
      return;
    }

    chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_PAGE_TITLE' }, (response) => {
      if (chrome.runtime.lastError) {
        logger.warn('Could not get page title: ' + chrome.runtime.lastError.message);
        elements.pageTitle.textContent = tabs[0].title || 'Unknown Page';
        return;
      }

      if (response && response.title) {
        elements.pageTitle.textContent = response.title;
        logger.info('Page title: ' + response.title);
      }
    });
  });
}

/**
 * Attach event listeners to all controls
 */
function attachEventListeners() {
  logger.info('Attaching event listeners');
  
  elements.playBtn.addEventListener('click', () => {
    logger.info('Play button clicked');
    sendCommand('PLAY_COMMAND');
  });
  elements.pauseBtn.addEventListener('click', () => {
    logger.info('Pause button clicked');
    sendCommand('PAUSE_COMMAND');
  });
  elements.stopBtn.addEventListener('click', () => {
    logger.info('Stop button clicked');
    sendCommand('STOP_COMMAND');
  });
  elements.restartBtn.addEventListener('click', () => {
    logger.info('Restart button clicked');
    sendCommand('RESTART_COMMAND');
  });
  
  elements.logsBtn.addEventListener('click', openLogsViewer);

  logger.info('Event listeners attached');
}

/**
 * Load initial state from content script
 */
function loadInitialState() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) {
      updateStatus('No active tab', 'error');
      logger.error('No active tab found');
      return;
    }

    chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_STATE' }, (response) => {
      if (chrome.runtime.lastError) {
        logger.warn('Content script not ready: ' + chrome.runtime.lastError.message);
        updateStatus('Initializing...', 'idle');
        return;
      }

      if (response) {
        uiState.chapters = response.chapters || [];
        uiState.currentChapter = response.currentChapter || 0;
        uiState.isPlaying = response.isPlaying || false;
        uiState.isPaused = response.isPaused || false;

        updateUI();
        logger.info('Initial state loaded: ' + uiState.chapters.length + ' chapters');
      }
    });
  });
}

/**
 * Send command to content script
 */
function sendCommand(command) {
  logger.info('Attempting to send command: ' + command);
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) {
      logger.error('No active tab found for command: ' + command);
      updateStatus('No active tab', 'error');
      return;
    }

    logger.info('Sending ' + command + ' to tab ' + tabs[0].id);
    chrome.tabs.sendMessage(tabs[0].id, { type: command }, (response) => {
      if (chrome.runtime.lastError) {
        const errorMsg = chrome.runtime.lastError.message;
        logger.error('Chrome runtime error sending ' + command + ': ' + errorMsg);
        updateStatus('Error: ' + errorMsg, 'error');
        return;
      }

      logger.info('Received response from content script for ' + command + ': ' + JSON.stringify(response));
      if (response && response.error) {
        logger.error('Content script error for ' + command + ': ' + response.error);
        updateStatus('Error: ' + response.error, 'error');
      } else {
        logger.info('Command ' + command + ' executed successfully');
        // Update UI based on command
        updateUIAfterCommand(command);
      }
    });
  });
}

/**
 * Update UI after command execution
 */
function updateUIAfterCommand(command) {
  switch (command) {
    case 'PLAY_COMMAND':
      uiState.isPlaying = true;
      uiState.isPaused = false;
      updateStatus('Playing...', 'playing');
      break;
    case 'PAUSE_COMMAND':
      uiState.isPaused = true;
      updateStatus('Paused', 'paused');
      break;
    case 'STOP_COMMAND':
      uiState.isPlaying = false;
      uiState.isPaused = false;
      updateStatus('Stopped', 'idle');
      break;
    case 'RESTART_COMMAND':
      uiState.isPlaying = true;
      uiState.isPaused = false;
      updateStatus('Restarting...', 'playing');
      break;
  }
  updateUI();
}

/**
 * Update UI elements
 */
function updateUI() {
  logger.debug('UI updated', {
    chapter: uiState.currentChapter,
    total: uiState.chapters.length,
    playing: uiState.isPlaying,
  });
}

/**
 * Update button states based on playback status
 */

/**
 * Update status display
 */
function updateStatus(message, status) {
  const statusLabels = {
    'playing': 'Playing',
    'paused': 'Paused',
    'stopped': 'Stopped',
    'idle': 'Ready',
    'error': 'Error',
  };

  document.querySelector('.status-label').textContent = statusLabels[status] || message;
  
  elements.statusIndicator.className = 'status-indicator';
  if (status) {
    elements.statusIndicator.classList.add(status);
  }
}

/**
 * Update speech synthesis settings (for future use when we support multiple TTS engines)
 */
function updateSpeechSettings() {
  // Speech settings no longer configurable
}

/**
 * Load settings from Chrome storage
 */
function loadSettings() {
  // Settings loading no longer needed
}

/**
 * Apply theme to popup (light or dark)
 */
function applyTheme(theme) {
  const container = document.querySelector('.popup-container');
  if (!container) return;
  
  logger.info('Applying theme: ' + theme);
  
  // Remove existing theme classes
  container.classList.remove('theme-light', 'theme-dark');
  
  // Add new theme class
  if (theme === 'dark') {
    container.classList.add('theme-dark');
  } else {
    container.classList.add('theme-light');
  }
}

/**
 * Save settings to Chrome storage
 */
function saveSettings() {
  // Settings saving no longer needed
}

/**
 * Open logs viewer in new tab
 */
function openLogsViewer() {
  logger.info('Opening logs viewer');
  
  // For now, just log to console
  const logs = logger.getLogs();
  console.log('=== SiteReader Logs ===');
  console.table(logs);
  console.log('=======================');
  
  alert(`Logs exported to console. Press F12 to open DevTools and view logs.`);
}

/**
 * Listen for state updates from content script
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'STATE_UPDATED') {
    uiState.chapters = request.payload.chapters || uiState.chapters;
    uiState.currentChapter = request.payload.currentChapter ?? uiState.currentChapter;
    uiState.isPlaying = request.payload.isPlaying ?? uiState.isPlaying;
    uiState.isPaused = request.payload.isPaused ?? uiState.isPaused;
    
    // Apply theme if provided
    if (request.payload.theme) {
      applyTheme(request.payload.theme);
    }
    
    updateUI();
    
    if (uiState.isPlaying && !uiState.isPaused) {
      updateStatus('Playing...', 'playing');
    } else if (uiState.isPaused) {
      updateStatus('Paused', 'paused');
    }
    
    sendResponse({ received: true });
  }
});

// Initialize when popup loads
document.addEventListener('DOMContentLoaded', initializePopup);

// Refresh state every 500ms to stay in sync
setInterval(() => {
  if (!uiState.isPlaying) {
    loadInitialState();
  }
}, 500);
