# SiteReader Chrome Extension - MVP (Phase 1)

A Chrome MV3 extension that adds text-to-speech capabilities to web pages with intelligent chapter detection and playback controls.

## Features (Phase 1 - MVP)

✅ **Intelligent Content Detection**
- Automatically detects and extracts article/chapter text from web pages
- Supports multiple page structures (Royal Road, Medium, blogs, etc.)
- Fallback extraction for unstructured content

✅ **Playback Controls**
- Play/Pause/Stop buttons with smooth state management
- Restart chapter functionality
- Next/Previous chapter navigation

✅ **Web Speech API Integration**
- High-quality text-to-speech using browser's native Web Speech API
- No complex dependencies or external TTS engines required
- Adjustable speech rate (0.5x - 2.0x)
- Adjustable pitch (0.5x - 2.0x)
- Adjustable volume (0% - 100%)

✅ **Reading Position Persistence**
- Automatically saves reading progress to Chrome storage
- Restores position when returning to previously read pages
- Tracks chapter and position separately

✅ **Chapter Navigation**
- Clickable chapter list in popup
- One-click navigation between chapters
- Current chapter highlighting

✅ **Error Handling & Logging**
- Comprehensive console logging throughout
- Debug mode for development
- Error tracking and reporting

✅ **Clean Architecture**
- Separated concerns: content script, background script, popup UI
- Message passing for clean communication
- Modular, maintainable code

## Installation

### For Development

1. **Clone or download** this repository to your machine
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the `SiteReader` folder
6. The extension icon should appear in your toolbar

### Testing

1. Navigate to any article or book page (e.g., Royal Road, Medium, blog posts)
2. Click the SiteReader extension icon
3. The popup should show detected chapters
4. Click "Play" to start reading
5. Use other controls to navigate

## File Structure

```
SiteReader/
├── manifest.json              # Chrome extension configuration (MV3)
├── src/
│   ├── background.js         # Service worker - handles messaging
│   ├── content.js            # Content script - extracts text, handles TTS
│   └── logger.js             # Logging utility
├── ui/
│   ├── popup.html            # Extension popup UI
│   ├── popup.css             # Popup styling
│   └── popup.js              # Popup controller
├── icons/                    # Extension icons (16x16, 48x48, 128x128)
├── README.md                 # This file
└── .gitignore                # Git ignore rules
```

## How It Works

### Content Detection

1. **Page Load**: When a page loads, `content.js` extracts text using multiple strategies:
   - Royal Road specific extraction (chapters with `[property="articleBody"]`)
   - HTML5 semantic tags (`<article>`)
   - Common content containers (`main`, `.content`, `.post-content`)
   - Fallback to largest readable text blocks
   - Last resort: entire page as single chapter

2. **Chapter Information**: Extracted chapters are sent to the background script for state management

### Playback

1. **User Clicks Play**: Popup sends `PLAY_COMMAND` to content script
2. **TTS Creation**: Content script creates a `SpeechSynthesisUtterance` with current chapter text
3. **Audio Output**: Web Speech API synthesizes and plays audio through browser speakers
4. **State Management**: Playback state updates are synchronized between content script and popup

### Position Tracking

1. **Auto-Save**: When playback starts, current chapter and position are saved to Chrome storage
2. **Auto-Restore**: On page load, previous position is retrieved and restored
3. **Persistent Across Sessions**: Reading position survives browser restarts

### Error Handling

- **Try-Catch Blocks**: Critical operations wrapped in error handling
- **Message Validation**: All cross-script messages validated
- **Fallback Strategies**: Multiple detection methods prevent blank content
- **Console Logging**: All errors logged to browser console for debugging

## Usage Guide

### Playing a Chapter

1. Click the SiteReader icon in your toolbar
2. The popup displays the current chapter title and chapter count
3. Click the **Play** button (▶) to start text-to-speech
4. Audio will play through your computer's speakers

### Pausing & Resuming

- Click **Pause** (⏸) to pause playback
- Click **Play** (▶) again to resume from the same position
- Click **Stop** (⏹) to stop completely

### Navigating Chapters

- **Next Chapter** (⏭): Jump to the next chapter
- **Previous Chapter** (⏮): Jump to the previous chapter
- **Restart** (↻): Restart the current chapter from the beginning
- **Chapter List**: Click any chapter in the list to jump directly to it

### Adjusting Settings

- **Speech Rate**: Adjust playback speed from 0.5x to 2.0x
- **Pitch**: Modify voice pitch from 0.5 to 2.0
- **Volume**: Control audio volume from 0% to 100%

All settings are saved and persist across sessions.

### Viewing Logs

- Click the **Logs** button (📋) to export logs to the browser console
- Open DevTools (F12) to view detailed debugging information

## Supported Sites

The extension works on any website with article or chapter content. Specifically optimized for:

- **Royal Road** (royalroad.com) - Primary target for testing
- **Medium** (medium.com)
- **WordPress blogs** with standard structure
- **News sites** with article containers
- **Any site with semantic HTML** (`<article>`, `<main>`, etc.)

For sites with unusual layouts, the fallback extraction should still work, though performance may vary.

## Browser Compatibility

- **Chrome**: 90+ (MV3 support required)
- **Chromium-based**: Edge, Opera, Brave (with possible minor adjustments)
- **Firefox**: Not currently supported (requires MV2 rework)

## Known Limitations (Phase 1)

- **Web Speech API**: Browser-dependent voice quality and language support
- **Rate Limiting**: Web Speech API may have usage limits (varies by browser)
- **No GPU Acceleration**: Phase 1 uses browser APIs only
- **No Custom TTS Models**: Uses default system voices
- **No Offline Support**: Requires internet (for some browsers/TTS engines)
- **No Multi-Tab Reading**: One active reading session per browser window

## Troubleshooting

### Extension Not Loading

1. Verify MV3 support: Chrome 90+
2. Check DevTools > Errors for manifest issues
3. Ensure all files are in the correct directories
4. Try reloading the extension

### No Chapters Detected

1. Open DevTools (F12) > Console
2. Look for extraction debug logs
3. Try the "Logs" button in popup to see detailed extraction attempts
4. Some sites may have unusual HTML structures

### Audio Not Playing

1. Check volume settings in the popup
2. Verify system volume isn't muted
3. Check browser's microphone/speaker permissions
4. Try restarting the browser

### Playback Quality Issues

1. Adjust Speech Rate slider
2. Check system voice settings (varies by OS)
3. Verify no other audio is playing
4. Try different voice options in system settings (OS-level)

## Development Notes

### Console Logging

Enable debug logging by running in DevTools console:
```javascript
localStorage.setItem('siteReaderDebug', 'true');
```

Disable:
```javascript
localStorage.removeItem('siteReaderDebug');
```

### Message Types

All cross-script communication uses these message types:

- `PLAY_COMMAND` - Start playback
- `PAUSE_COMMAND` - Pause playback
- `STOP_COMMAND` - Stop playback
- `RESTART_COMMAND` - Restart chapter
- `NEXT_CHAPTER` - Navigate to next
- `PREV_CHAPTER` - Navigate to previous
- `GET_STATE` - Get current state
- `CHAPTERS_FOUND` - Notify of extracted chapters
- `SAVE_READING_POSITION` - Save progress
- `GET_READING_POSITION` - Retrieve saved progress
- `LOG` - Content script logging

### Adding New Extraction Strategy

1. Edit `src/content.js`
2. Add function: `function extractFromMyStrategy() { ... }`
3. Add to extraction strategies array in `extractPageContent()`
4. Test on target site

## Next Steps (Phase 2 - Future)

- [ ] Kokoro TTS integration for better voice quality
- [ ] GPU/WebGPU acceleration for Kokoro model
- [ ] Performance monitoring and GPU memory management
- [ ] Advanced site-specific configurations
- [ ] Bookmarks and reading history
- [ ] Dark mode support
- [ ] Multi-language support
- [ ] Custom voice profiles

## Contributing

To contribute improvements:

1. Test on various websites
2. Report bugs with:
   - Site URL
   - Expected behavior
   - Actual behavior
   - Console logs (press F12)
3. Suggest feature improvements

## License

This project is open source and available for personal and educational use.

## Support

For issues, questions, or feature requests:

1. Check the Troubleshooting section above
2. Review console logs (F12)
3. Create a GitHub issue with detailed information
4. Include browser version and site where issue occurs

---

**Version**: 0.1.0 (MVP - Phase 1)
**Last Updated**: May 10, 2026
**Status**: Stable for basic usage
