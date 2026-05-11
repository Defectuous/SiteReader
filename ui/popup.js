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
  speechRate: 1.0,
  pitch: 1.0,
  volume: 1.0,
};

// DOM References
const elements = {
  playBtn: document.getElementById('playBtn'),
  pauseBtn: document.getElementById('pauseBtn'),
  stopBtn: document.getElementById('stopBtn'),
  nextBtn: document.getElementById('nextBtn'),
  prevBtn: document.getElementById('prevBtn'),
  restartBtn: document.getElementById('restartBtn'),
  logsBtn: document.getElementById('logsBtn'),
  chapterTitle: document.getElementById('chapterTitle'),
  chapterCount: document.getElementById('chapterCount'),
  totalChapters: document.getElementById('totalChapters'),
  chaptersList: document.getElementById('chaptersList'),
  chaptersContainer: document.getElementById('chaptersContainer'),
  status: document.getElementById('status'),
  statusIndicator: document.getElementById('statusIndicator'),
  rateSlider: document.getElementById('rateSlider'),
  rateValue: document.getElementById('rateValue'),
  pitchSlider: document.getElementById('pitchSlider'),
  pitchValue: document.getElementById('pitchValue'),
  volumeSlider: document.getElementById('volumeSlider'),
  volumeValue: document.getElementById('volumeValue'),
};

/**
 * Initialize popup
 */
function initializePopup() {
  logger.info('Popup initialized');
  
  attachEventListeners();
  loadInitialState();
  loadSettings();
}

/**
 * Attach event listeners to all controls
 */
function attachEventListeners() {
  elements.playBtn.addEventListener('click', () => sendCommand('PLAY_COMMAND'));
  elements.pauseBtn.addEventListener('click', () => sendCommand('PAUSE_COMMAND'));
  elements.stopBtn.addEventListener('click', () => sendCommand('STOP_COMMAND'));
  elements.nextBtn.addEventListener('click', () => sendCommand('NEXT_CHAPTER'));
  elements.prevBtn.addEventListener('click', () => sendCommand('PREV_CHAPTER'));
  elements.restartBtn.addEventListener('click', () => sendCommand('RESTART_COMMAND'));
  
  elements.logsBtn.addEventListener('click', openLogsViewer);
  
  // Settings controls
  elements.rateSlider.addEventListener('input', (e) => {
    uiState.speechRate = parseFloat(e.target.value);
    elements.rateValue.textContent = uiState.speechRate.toFixed(1) + 'x';
    saveSettings();
    updateSpeechSettings();
  });

  elements.pitchSlider.addEventListener('input', (e) => {
    uiState.pitch = parseFloat(e.target.value);
    elements.pitchValue.textContent = uiState.pitch.toFixed(1) + 'x';
    saveSettings();
    updateSpeechSettings();
  });

  elements.volumeSlider.addEventListener('input', (e) => {
    uiState.volume = parseFloat(e.target.value);
    elements.volumeValue.textContent = Math.round(uiState.volume * 100) + '%';
    saveSettings();
    updateSpeechSettings();
  });

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
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) {
      updateStatus('No active tab', 'error');
      return;
    }

    chrome.tabs.sendMessage(tabs[0].id, { type: command }, (response) => {
      if (chrome.runtime.lastError) {
        logger.error('Error sending command: ' + chrome.runtime.lastError.message);
        updateStatus('Error: ' + chrome.runtime.lastError.message, 'error');
        return;
      }

      logger.info('Command sent: ' + command);
      if (response && response.error) {
        updateStatus('Error: ' + response.error, 'error');
      } else {
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
    case 'NEXT_CHAPTER':
      if (uiState.currentChapter < uiState.chapters.length - 1) {
        uiState.currentChapter++;
        updateStatus(`Chapter ${uiState.currentChapter + 1}`, 'idle');
      }
      break;
    case 'PREV_CHAPTER':
      if (uiState.currentChapter > 0) {
        uiState.currentChapter--;
        updateStatus(`Chapter ${uiState.currentChapter + 1}`, 'idle');
      }
      break;
  }
  updateUI();
}

/**
 * Update UI elements
 */
function updateUI() {
  // Update chapter title
  if (uiState.chapters.length > 0) {
    const chapter = uiState.chapters[uiState.currentChapter];
    elements.chapterTitle.textContent = chapter.title || `Chapter ${uiState.currentChapter + 1}`;
  } else {
    elements.chapterTitle.textContent = 'No chapters detected';
  }

  // Update chapter count
  elements.chapterCount.textContent = uiState.currentChapter + 1;
  elements.totalChapters.textContent = uiState.chapters.length;

  // Update button states
  updateButtonStates();

  // Update chapters list
  updateChaptersList();

  logger.debug('UI updated', {
    chapter: uiState.currentChapter,
    total: uiState.chapters.length,
    playing: uiState.isPlaying,
  });
}

/**
 * Update button states based on playback status
 */
function updateButtonStates() {
  // Enable/disable navigation buttons
  elements.prevBtn.disabled = uiState.currentChapter === 0;
  elements.nextBtn.disabled = uiState.currentChapter === uiState.chapters.length - 1;

  // Update button visual states
  if (uiState.isPlaying && !uiState.isPaused) {
    elements.playBtn.style.opacity = '0.5';
    elements.pauseBtn.style.opacity = '1';
  } else {
    elements.playBtn.style.opacity = '1';
    elements.pauseBtn.style.opacity = '0.5';
  }

  // Disable play if no chapters
  elements.playBtn.disabled = uiState.chapters.length === 0;
  elements.nextBtn.disabled = uiState.chapters.length === 0 || uiState.currentChapter >= uiState.chapters.length - 1;
  elements.prevBtn.disabled = uiState.chapters.length === 0 || uiState.currentChapter === 0;
  elements.restartBtn.disabled = uiState.chapters.length === 0;
  elements.stopBtn.disabled = !uiState.isPlaying;
}

/**
 * Update chapters list
 */
function updateChaptersList() {
  if (uiState.chapters.length === 0) {
    elements.chaptersContainer.style.display = 'none';
    return;
  }

  elements.chaptersContainer.style.display = 'block';
  elements.chaptersList.innerHTML = '';

  uiState.chapters.forEach((chapter, index) => {
    const item = document.createElement('div');
    item.className = 'chapter-item' + (index === uiState.currentChapter ? ' active' : '');
    item.textContent = `${index + 1}. ${chapter.title || `Chapter ${index + 1}`}`;
    
    item.addEventListener('click', () => {
      uiState.currentChapter = index;
      sendCommand('STOP_COMMAND');
      updateUI();
    });

    elements.chaptersList.appendChild(item);
  });
}

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
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) return;

    chrome.tabs.sendMessage(tabs[0].id, {
      type: 'UPDATE_SPEECH_SETTINGS',
      payload: {
        rate: uiState.speechRate,
        pitch: uiState.pitch,
        volume: uiState.volume,
      }
    }).catch(err => {
      logger.debug('Could not update speech settings: ' + err.message);
    });
  });
}

/**
 * Load settings from Chrome storage
 */
function loadSettings() {
  chrome.storage.local.get(['siteReaderSettings'], (result) => {
    if (result.siteReaderSettings) {
      const settings = result.siteReaderSettings;
      
      if (settings.speechRate) {
        uiState.speechRate = settings.speechRate;
        elements.rateSlider.value = settings.speechRate;
        elements.rateValue.textContent = settings.speechRate.toFixed(1) + 'x';
      }
      
      if (settings.pitch) {
        uiState.pitch = settings.pitch;
        elements.pitchSlider.value = settings.pitch;
        elements.pitchValue.textContent = settings.pitch.toFixed(1) + 'x';
      }
      
      if (settings.volume !== undefined) {
        uiState.volume = settings.volume;
        elements.volumeSlider.value = settings.volume;
        elements.volumeValue.textContent = Math.round(settings.volume * 100) + '%';
      }
      
      logger.info('Settings loaded from storage');
    }
  });
}

/**
 * Save settings to Chrome storage
 */
function saveSettings() {
  chrome.storage.local.set({
    siteReaderSettings: {
      speechRate: uiState.speechRate,
      pitch: uiState.pitch,
      volume: uiState.volume,
    }
  }, () => {
    logger.info('Settings saved');
  });
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
