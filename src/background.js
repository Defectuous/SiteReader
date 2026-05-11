/**
 * SiteReader - Background Service Worker (MV3)
 * Handles communication between content scripts and popup
 * Manages state and persists reading progress
 */

console.log('[SiteReader:background] Service worker loaded');

// State for current reading session
let currentSession = {
  tabId: null,
  chapterId: null,
  position: 0,
  isPlaying: false,
  chapters: [],
};

/**
 * Message handler from content script and popup
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const origin = sender.url ? new URL(sender.url).hostname : 'popup';
  
  log(`Message received from ${origin}: ${request.type}`, request);

  switch (request.type) {
    case 'CHAPTERS_FOUND':
      handleChaptersFound(request, sender, sendResponse);
      break;
    case 'GET_SESSION_STATE':
      sendResponse(currentSession);
      break;
    case 'SET_SESSION_STATE':
      currentSession = { ...currentSession, ...request.payload };
      log('Session state updated', currentSession);
      sendResponse({ success: true });
      break;
    case 'SAVE_READING_POSITION':
      saveReadingPosition(request, sendResponse);
      break;
    case 'GET_READING_POSITION':
      getReadingPosition(request, sendResponse);
      break;
    case 'PLAY_COMMAND':
      forwardToContent(sender.tab.id, request, sendResponse);
      break;
    case 'PAUSE_COMMAND':
      forwardToContent(sender.tab.id, request, sendResponse);
      break;
    case 'STOP_COMMAND':
      forwardToContent(sender.tab.id, request, sendResponse);
      break;
    case 'RESTART_COMMAND':
      forwardToContent(sender.tab.id, request, sendResponse);
      break;
    case 'NEXT_CHAPTER':
      forwardToContent(sender.tab.id, request, sendResponse);
      break;
    case 'PREV_CHAPTER':
      forwardToContent(sender.tab.id, request, sendResponse);
      break;
    case 'LOG':
      // Content script logging
      log(request.message, request.data || '');
      sendResponse({ received: true });
      break;
    default:
      log(`Unknown message type: ${request.type}`);
      sendResponse({ error: 'Unknown message type' });
  }
  return true; // Keep channel open for async response
});

/**
 * Handle chapters found from content script
 */
function handleChaptersFound(request, sender, sendResponse) {
  const tabId = sender.tab.id;
  currentSession = {
    tabId,
    chapters: request.chapters,
    chapterId: 0,
    position: 0,
    isPlaying: false,
  };
  
  log(`Chapters found for tab ${tabId}: ${request.chapters.length} chapters`);
  log('Chapter list', request.chapters.map(c => c.title || c.text.substring(0, 50)));
  
  sendResponse({ success: true, sessionId: tabId });
}

/**
 * Save reading position to Chrome storage
 */
function saveReadingPosition(request, sendResponse) {
  const { url, position, chapterId } = request;
  const key = `reading_${url}`;
  
  chrome.storage.local.set({
    [key]: {
      position,
      chapterId,
      timestamp: Date.now(),
    }
  }, () => {
    if (chrome.runtime.lastError) {
      log(`Error saving position: ${chrome.runtime.lastError.message}`, null);
      sendResponse({ error: chrome.runtime.lastError.message });
    } else {
      log(`Position saved for ${url}: position=${position}, chapter=${chapterId}`);
      sendResponse({ success: true });
    }
  });
}

/**
 * Get saved reading position from Chrome storage
 */
function getReadingPosition(request, sendResponse) {
  const { url } = request;
  const key = `reading_${url}`;
  
  chrome.storage.local.get([key], (result) => {
    if (chrome.runtime.lastError) {
      log(`Error retrieving position: ${chrome.runtime.lastError.message}`, null);
      sendResponse({ error: chrome.runtime.lastError.message });
    } else {
      const position = result[key] || { position: 0, chapterId: 0, timestamp: null };
      log(`Position retrieved for ${url}:`, position);
      sendResponse(position);
    }
  });
}

/**
 * Forward commands to content script
 */
function forwardToContent(tabId, request, sendResponse) {
  if (!tabId) {
    sendResponse({ error: 'No active tab' });
    return;
  }

  chrome.tabs.sendMessage(tabId, request, (response) => {
    if (chrome.runtime.lastError) {
      log(`Error forwarding message: ${chrome.runtime.lastError.message}`);
    }
    sendResponse(response);
  });
}

/**
 * Simple logging function
 */
function log(message, data) {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[SiteReader:${timestamp}] ${message}`, data);
  } else {
    console.log(`[SiteReader:${timestamp}] ${message}`);
  }
}
