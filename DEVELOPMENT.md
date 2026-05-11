# SiteReader - Development Guide

## Local Development Setup

### Prerequisites

- **Chrome** 90 or higher
- **Git** (for version control)
- **Text editor or IDE** (VS Code recommended)
- **Patience** (debugging browser extensions can be tricky!)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/Defectuous/SiteReader.git
   cd SiteReader
   ```

2. **Load extension in Chrome**
   - Open `chrome://extensions/`
   - Enable "Developer mode" (top right toggle)
   - Click "Load unpacked"
   - Select the SiteReader folder
   - Extension should appear in toolbar

3. **Start developing**
   - Make changes to any file
   - For popup/UI changes: Click extension icon to see updates
   - For content/background changes: Click reload icon next to extension in chrome://extensions

### File Organization

```
src/              Core extension logic
├── background.js  Service worker - message relay and state
├── content.js     Content script - text extraction and TTS
└── logger.js      Logging utility

ui/               User interface
├── popup.html     HTML structure
├── popup.css      Styling
└── popup.js       UI controller

icons/            Extension icons (placeholder docs)
manifest.json     Chrome extension configuration
```

## Architecture Overview

### Message Flow

```
User Interaction
       ↓
    popup.js (UI Controller)
       ↓ chrome.tabs.sendMessage()
    background.js (Message Relay)
       ↓ chrome.tabs.sendMessage()
    content.js (Core Logic)
```

### State Management

- **Popup State**: Managed in `ui/popup.js` - `uiState` object
- **Page State**: Managed in `src/content.js` - `pageState` object
- **Session State**: Managed in `src/background.js` - `currentSession` object
- **Persistent Storage**: Chrome storage API for reading position

### Data Flow for Playback

```
1. User clicks "Play" button
2. popup.js sends PLAY_COMMAND to background.js
3. background.js forwards to content.js
4. content.js:
   - Gets current chapter text
   - Creates SpeechSynthesisUtterance
   - Calls speechSynthesis.speak()
5. Browser plays audio through speakers
6. Playback state updates flow back to popup
```

## Making Changes

### Adding a New Content Extraction Strategy

1. Open `src/content.js`
2. Create a new function:
   ```javascript
   function extractFromMyStrategy() {
     // Your extraction logic
     return chapters; // Array of {title, text, element}
   }
   ```
3. Add to the strategies array in `extractPageContent()`:
   ```javascript
   const strategies = [
     extractFromRoyalRoad(),
     extractFromMyStrategy(),  // Add here
     extractFromArticleTag(),
     // ...
   ];
   ```
4. Test on target website
5. Commit and push to GitHub

### Adding New UI Controls

1. Add button to `ui/popup.html`:
   ```html
   <button id="myBtn" class="control-btn">Label</button>
   ```

2. Add CSS to `ui/popup.css`:
   ```css
   #myBtn { /* styling */ }
   ```

3. Add event listener in `ui/popup.js`:
   ```javascript
   elements.myBtn = document.getElementById('myBtn');
   elements.myBtn.addEventListener('click', () => { /* handler */ });
   ```

4. Add to `elements` object at top of `ui/popup.js`

### Adding Chrome Storage (Persistence)

Example - saving custom setting:
```javascript
// Save
chrome.storage.local.set({ 
  myKey: 'myValue' 
}, () => { 
  console.log('Saved'); 
});

// Load
chrome.storage.local.get(['myKey'], (result) => {
  console.log(result.myKey);
});
```

## Debugging

### Chrome DevTools

**For Popup UI:**
1. Right-click extension icon → "Inspect popup"
2. DevTools opens for the popup
3. Set breakpoints, view console, etc.

**For Content Script:**
1. Open any webpage
2. Press F12 to open DevTools
3. Console shows content script logs
4. Can't set breakpoints easily (limitation of MV3)

**For Background Service Worker:**
1. Go to `chrome://extensions`
2. Find SiteReader extension
3. Click "Service worker" link under extension
4. DevTools opens for background script
5. Console shows all service worker logs

### Viewing Logs

The extension includes a built-in logger. Access logs:

1. Click "Logs" button in popup
2. Logs are exported to browser console
3. Open DevTools (F12) to view
4. Or check `window.logger.getLogs()` in DevTools console

### Enable Debug Mode

In browser console:
```javascript
localStorage.setItem('siteReaderDebug', 'true');
```

This enables verbose logging. Disable with:
```javascript
localStorage.removeItem('siteReaderDebug');
```

### Common Issues and Solutions

**Issue: Changes not appearing**
- Reload extension at `chrome://extensions`
- Close and reopen popup
- Hard refresh website with Ctrl+Shift+R

**Issue: Message errors**
- Check that active tab has content script loaded
- Ensure message type matches expected types
- View console logs for error details

**Issue: Styles not updating**
- Make sure CSS file is saved
- Hard refresh popup (Ctrl+Shift+R on popup itself)
- Check DevTools for CSS override issues

## Testing Methodology

See [TESTING.md](TESTING.md) for comprehensive testing procedures.

## Code Style Guidelines

- **Comments**: Use JSDoc for functions
- **Naming**: camelCase for variables/functions, UPPERCASE for constants
- **Logging**: Use `logger.info()`, `logger.error()`, `logger.debug()`
- **Error Handling**: Try-catch for risky operations, check `chrome.runtime.lastError`
- **Messages**: Always validate request type before handling

Example function:
```javascript
/**
 * Extract content from the page
 * @returns {Array} Array of chapters with {title, text, element}
 */
function extractPageContent() {
  try {
    const chapters = [];
    // ... extraction logic
    logger.info(`Extracted ${chapters.length} chapters`);
    return chapters;
  } catch (error) {
    logger.error('Extraction failed: ' + error.message);
    return [];
  }
}
```

## Commit Message Format

Use clear, descriptive commit messages:

```
feat: Add chapter thumbnail previews
fix: Correct speech rate slider bounds
docs: Update README with API examples
refactor: Simplify content extraction logic
test: Add Royal Road content detection tests
```

Prefix types:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `refactor:` - Code restructuring
- `test:` - Test additions
- `perf:` - Performance improvement
- `chore:` - Build/tooling changes

## Building for Distribution

Prepare extension for Chrome Web Store:

1. **Create icons** (16x16, 48x48, 128x128 PNG)
2. **Create a screenshot** (1280x800)
3. **Update version** in manifest.json and README
4. **Update changelog** with release notes
5. **Test thoroughly** across multiple sites
6. **Create release** on GitHub
7. **Package as ZIP** if submitting to Chrome Web Store

## Performance Tips

- Minimize DOM queries in content script
- Cache frequently accessed elements
- Debounce event listeners
- Keep background script lightweight
- Use lazy loading for non-essential UI components

## Security Considerations

- All user input validated before use
- Avoid `eval()` or `innerHTML` with untrusted content
- Use `textContent` instead of `innerHTML` for text
- Store sensitive data securely (none currently in MVP)
- Review permissions in manifest.json periodically

## Next Phase Development (Phase 2)

Preparation for Kokoro TTS integration:

- [ ] Design worker thread architecture
- [ ] Create GPU detection/configuration module
- [ ] Plan WebGPU compatibility layer
- [ ] Design model loading strategy
- [ ] Create performance monitoring hooks

See [README.md](README.md) for Phase 2 plans.

## Getting Help

1. Check existing code comments
2. Review browser console for errors
3. Search Chrome extension documentation
4. Test with minimal reproduction
5. Create GitHub issue if stuck

## Resources

- [Chrome Extension MV3 Docs](https://developer.chrome.com/docs/extensions/mv3/)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [Chrome Storage API](https://developer.chrome.com/docs/extensions/reference/storage/)
- [JavaScript Guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide)

---

Happy developing! 🎉
