/**
 * SiteReader - Content Script
 * Extracts text from web pages, handles TTS playback, and manages chapter navigation
 */

// Initialize logger (created globally by logger.js before this script loads)
const logger = window.logger || {
  info: console.log,
  warn: console.warn,
  error: console.error,
  debug: console.debug,
};

logger.info('Content script initialized for URL: ' + document.location.href);

// Global state
let pageState = {
  chapters: [],
  currentChapterIndex: 0,
  currentPosition: 0,
  isPlaying: false,
  isPaused: false,
  utterance: null,
  extractedText: '',
};

/**
 * Initialize content script
 */
function initializeContentScript() {
  // Extract chapters/articles from the page
  extractPageContent();
  
  // Listen for messages from popup and background
  chrome.runtime.onMessage.addListener(handlePopupMessage);
  
  logger.info('Content script ready, chapters detected: ' + pageState.chapters.length);
}

/**
 * Extract article/chapter content from the page
 * This supports multiple page structures (Royal Road, Medium, blogs, etc.)
 */
function extractPageContent() {
  pageState.chapters = [];
  
  // Try multiple extraction strategies
  const strategies = [
    extractFromRoyalRoad(),
    extractFromArticleTag(),
    extractFromMainContent(),
    extractFromReadableContent(),
  ];

  for (const chapters of strategies) {
    if (chapters && chapters.length > 0) {
      pageState.chapters = chapters;
      logger.info(`Extracted ${chapters.length} chapters using best strategy`);
      return;
    }
  }

  // Fallback: treat entire page as one chapter
  if (pageState.chapters.length === 0) {
    const bodyText = document.body.innerText;
    if (bodyText.trim().length > 0) {
      pageState.chapters = [{
        title: document.title || 'Chapter 1',
        text: bodyText,
        element: document.body,
      }];
      logger.warn('Using entire page as single chapter (no structure detected)');
    }
  }

  // Send chapters to background
  if (pageState.chapters.length > 0) {
    chrome.runtime.sendMessage({
      type: 'CHAPTERS_FOUND',
      chapters: pageState.chapters.map(ch => ({
        title: ch.title,
        text: ch.text.substring(0, 200), // Truncate for storage
        id: pageState.chapters.indexOf(ch),
      })),
    });
  }
}

/**
 * Royal Road specific extraction
 * Target: https://www.royalroad.com/
 * Primary selectors: .chapter-inner.chapter-content
 */
function extractFromRoyalRoad() {
  const chapters = [];
  
  // Royal Road primary selector (most reliable)
  let contentDivs = document.querySelectorAll('.chapter-inner.chapter-content');
  
  // Fallback to alternate selectors if primary not found
  if (contentDivs.length === 0) {
    contentDivs = document.querySelectorAll('[property="articleBody"], .fiction-text');
  }
  
  contentDivs.forEach((div) => {
    const text = div.innerText?.trim();
    if (text && text.length > 100) {
      chapters.push({
        title: extractChapterTitle() || 'Chapter',
        text: text,
        element: div,
      });
    }
  });

  logger.debug('Royal Road extraction', { chaptersFound: chapters.length, selector: contentDivs.length > 0 ? 'primary' : 'fallback' });
  return chapters;
}

/**
 * Extract from semantic article tags
 */
function extractFromArticleTag() {
  const chapters = [];
  
  const articles = document.querySelectorAll('article');
  articles.forEach((article) => {
    const text = article.innerText?.trim();
    if (text && text.length > 100) {
      const title = article.querySelector('h1, h2, .title, [itemprop="headline"]')?.innerText || 'Chapter';
      chapters.push({
        title: title.substring(0, 100),
        text: text,
        element: article,
      });
    }
  });

  return chapters;
}

/**
 * Extract from common content containers
 */
function extractFromMainContent() {
  const chapters = [];
  
  const selectors = [
    'main', '.main-content', '.content', '.post-content', 
    '.entry-content', '.article-content', '.story-content'
  ];

  for (const selector of selectors) {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      elements.forEach((el) => {
        const text = el.innerText?.trim();
        if (text && text.length > 100) {
          chapters.push({
            title: extractChapterTitle() || 'Chapter',
            text: text,
            element: el,
          });
        }
      });
      if (chapters.length > 0) break;
    }
  }

  return chapters;
}

/**
 * Fallback readable content extraction
 */
function extractFromReadableContent() {
  const chapters = [];
  
  // Look for large text containers
  const allElements = document.querySelectorAll('div, section, main, article');
  
  allElements.forEach((el) => {
    const text = el.innerText?.trim();
    
    // Skip if has too many children (likely layout container)
    if (text && text.length > 500 && el.children.length < 20) {
      // Skip elements that contain forms, scripts, etc.
      const hasBlockingContent = el.querySelector('form, script, style, nav, [role="navigation"]');
      if (!hasBlockingContent) {
        chapters.push({
          title: extractChapterTitle() || 'Content',
          text: text,
          element: el,
        });
      }
    }
  });

  return chapters.slice(0, 1); // Only use first if this is fallback
}

/**
 * Extract chapter title from page
 */
function extractChapterTitle() {
  // Try multiple selectors in order of specificity
  const selectors = [
    'h1.chapter-title',
    'h1.title',
    '[class*="chapter-title"]',
    'h1',
    'h2',
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      const text = element.innerText?.trim();
      if (text && text.length > 0) {
        return text.substring(0, 100);
      }
    }
  }

  return null;
}

/**
 * Handle messages from popup
 */
function handlePopupMessage(request, sender, sendResponse) {
  logger.info(`Received command: ${request.type}`);

  switch (request.type) {
    case 'GET_PAGE_TITLE':
      sendResponse({ title: getPageTitle() });
      break;
    case 'GET_NEXT_CHAPTER_LINK':
      sendResponse({ url: getNextChapterLink() });
      break;
    case 'GET_PREV_CHAPTER_LINK':
      sendResponse({ url: getPreviousChapterLink() });
      break;
    case 'PLAY_COMMAND':
      playAudio();
      sendResponse({ success: true, state: 'playing' });
      break;
    case 'PAUSE_COMMAND':
      pauseAudio();
      sendResponse({ success: true, state: 'paused' });
      break;
    case 'STOP_COMMAND':
      stopAudio();
      sendResponse({ success: true, state: 'stopped' });
      break;
    case 'RESTART_COMMAND':
      restartAudio();
      sendResponse({ success: true, state: 'restarted' });
      break;
    case 'GET_STATE':
      sendResponse({
        chapters: pageState.chapters.map(ch => ({ title: ch.title, id: pageState.chapters.indexOf(ch) })),
        currentChapter: pageState.currentChapterIndex,
        isPlaying: pageState.isPlaying,
        isPaused: pageState.isPaused,
      });
      break;
    default:
      logger.warn(`Unknown command: ${request.type}`);
      sendResponse({ error: 'Unknown command' });
  }

  return true;
}

/**
 * Play current chapter with Web Speech API
 */
function playAudio() {
  if (pageState.chapters.length === 0) {
    logger.error('No chapters available to play');
    return;
  }

  // Cancel any existing utterance
  speechSynthesis.cancel();

  const chapter = pageState.chapters[pageState.currentChapterIndex];
  const text = chapter.text;

  pageState.utterance = new SpeechSynthesisUtterance(text);
  pageState.utterance.rate = 1.0;
  pageState.utterance.pitch = 1.0;
  pageState.utterance.volume = 1.0;

  pageState.utterance.onstart = () => {
    pageState.isPlaying = true;
    pageState.isPaused = false;
    logger.info(`Started playing: ${chapter.title}`);
    updatePopupUI();
  };

  pageState.utterance.onpause = () => {
    pageState.isPaused = true;
    logger.info('Playback paused');
    updatePopupUI();
  };

  pageState.utterance.onresume = () => {
    pageState.isPaused = false;
    logger.info('Playback resumed');
    updatePopupUI();
  };

  pageState.utterance.onend = () => {
    pageState.isPlaying = false;
    pageState.isPaused = false;
    logger.info(`Finished playing: ${chapter.title}`);
    
    // Auto-advance to next chapter if available
    if (pageState.currentChapterIndex < pageState.chapters.length - 1) {
      logger.info('Auto-advancing to next chapter');
      nextChapter();
      playAudio();
    } else {
      logger.info('End of book reached');
    }
    updatePopupUI();
  };

  pageState.utterance.onerror = (event) => {
    logger.error(`Speech synthesis error: ${event.error}`);
    pageState.isPlaying = false;
    updatePopupUI();
  };

  // Save position before playing
  const url = window.location.href;
  chrome.runtime.sendMessage({
    type: 'SAVE_READING_POSITION',
    url: url,
    position: pageState.currentPosition,
    chapterId: pageState.currentChapterIndex,
  });

  speechSynthesis.speak(pageState.utterance);
}

/**
 * Pause audio playback
 */
function pauseAudio() {
  if (pageState.isPlaying && !pageState.isPaused) {
    speechSynthesis.pause();
    logger.info('Paused playback');
  }
}

/**
 * Stop audio playback
 */
function stopAudio() {
  speechSynthesis.cancel();
  pageState.isPlaying = false;
  pageState.isPaused = false;
  pageState.utterance = null;
  logger.info('Stopped playback');
  updatePopupUI();
}

/**
 * Restart current chapter
 */
function restartAudio() {
  stopAudio();
  pageState.currentPosition = 0;
  playAudio();
  logger.info(`Restarted chapter ${pageState.currentChapterIndex}`);
}

/**
 * Navigate to next chapter
 */
function nextChapter() {
  if (pageState.currentChapterIndex < pageState.chapters.length - 1) {
    stopAudio();
    pageState.currentChapterIndex++;
    pageState.currentPosition = 0;
    const chapter = pageState.chapters[pageState.currentChapterIndex];
    logger.info(`Navigated to next chapter (${pageState.currentChapterIndex}): ${chapter.title}`);
    updatePopupUI();
  } else {
    logger.warn('Already at last chapter');
  }
}

/**
 * Navigate to previous chapter
 */
function previousChapter() {
  if (pageState.currentChapterIndex > 0) {
    stopAudio();
    pageState.currentChapterIndex--;
    pageState.currentPosition = 0;
    const chapter = pageState.chapters[pageState.currentChapterIndex];
    logger.info(`Navigated to previous chapter (${pageState.currentChapterIndex}): ${chapter.title}`);
    updatePopupUI();
  } else {
    logger.warn('Already at first chapter');
  }
}

/**
 * Update popup UI with current state
 */
function updatePopupUI() {
  chrome.runtime.sendMessage({
    type: 'STATE_UPDATED',
    payload: {
      chapters: pageState.chapters.map(ch => ({ title: ch.title })),
      currentChapter: pageState.currentChapterIndex,
      isPlaying: pageState.isPlaying,
      isPaused: pageState.isPaused,
    },
  }).catch(err => {
    // Popup might not be open, that's OK
    logger.debug('Could not send state update to popup: ' + err.message);
  });
}

/**
 * Get page title from og:title meta tag
 */
function getPageTitle() {
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle && ogTitle.content) {
    return ogTitle.content.trim();
  }
  
  // Fallback to regular title tag
  const titleTag = document.querySelector('title');
  if (titleTag && titleTag.textContent) {
    return titleTag.textContent.trim();
  }
  
  return document.title || 'Unknown Page';
}

/**
 * Find next chapter link on the page
 */
function getNextChapterLink() {
  // Look for HTML link rel='next' tag (most reliable)
  let link = document.querySelector('link[rel="next"]');
  if (link && link.href) {
    logger.info('Found next chapter via link[rel="next"]: ' + link.href);
    return link.href;
  }
  
  // Royal Road specific selectors - look for navigation buttons
  const allLinks = document.querySelectorAll('a[href*="/chapter/"]');
  for (const a of allLinks) {
    const text = a.textContent.toLowerCase().trim();
    if (text === 'next chapter' || text === 'next' || text.includes('next chapter')) {
      logger.info('Found next chapter via Royal Road selector');
      return a.href;
    }
  }
  
  // Generic selectors - look for any next link
  const allPageLinks = document.querySelectorAll('a');
  for (const a of allPageLinks) {
    const text = a.textContent.toLowerCase().trim();
    if (text.includes('next') && text.includes('chapter')) {
      logger.info('Found next chapter via text match');
      return a.href;
    }
  }
  
  logger.warn('No next chapter link found');
  return null;
}

/**
 * Find previous chapter link on the page
 */
function getPreviousChapterLink() {
  // Look for HTML link rel='prev' tag (most reliable)
  let link = document.querySelector('link[rel="prev"]');
  if (link && link.href) {
    logger.info('Found previous chapter via link[rel="prev"]: ' + link.href);
    return link.href;
  }
  
  // Royal Road specific selectors - look for navigation buttons
  const allLinks = document.querySelectorAll('a[href*="/chapter/"]');
  for (const a of allLinks) {
    const text = a.textContent.toLowerCase().trim();
    if (text === 'previous chapter' || text === 'previous' || text.includes('previous chapter')) {
      logger.info('Found previous chapter via Royal Road selector');
      return a.href;
    }
  }
  
  // Generic selectors - look for any previous link
  const allPageLinks = document.querySelectorAll('a');
  for (const a of allPageLinks) {
    const text = a.textContent.toLowerCase().trim();
    if (text.includes('previous') && text.includes('chapter')) {
      logger.info('Found previous chapter via text match');
      return a.href;
    }
  }
  
  logger.warn('No previous chapter link found');
  return null;
}

/**
 * Restore reading position from storage
 */
function restoreReadingPosition() {
  const url = window.location.href;
  chrome.runtime.sendMessage(
    { type: 'GET_READING_POSITION', url: url },
    (response) => {
      if (response && response.position !== undefined) {
        pageState.currentChapterIndex = response.chapterId || 0;
        pageState.currentPosition = response.position || 0;
        logger.info(`Restored position: chapter ${pageState.currentChapterIndex}, position ${pageState.currentPosition}`);
      }
    }
  );
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeContentScript();
    restoreReadingPosition();
  });
} else {
  initializeContentScript();
  restoreReadingPosition();
}
