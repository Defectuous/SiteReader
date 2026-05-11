# SiteReader - Testing Guide

Comprehensive testing procedures for the SiteReader Chrome extension.

## Pre-Testing Setup

1. **Load extension** in Chrome following [DEVELOPMENT.md](DEVELOPMENT.md)
2. **Enable debug mode**:
   ```javascript
   localStorage.setItem('siteReaderDebug', 'true');
   ```
3. **Open DevTools**: Press F12
4. **Clear console** before each test: `clear()`

## Phase 1 - MVP Testing Checklist

### 1. Content Extraction Tests

#### Royal Road (Primary Target)
- [ ] Navigate to any Royal Road chapter: https://www.royalroad.com/
- [ ] Click extension icon
- [ ] Verify: Chapter title displays correctly
- [ ] Verify: Text content loads without truncation
- [ ] Verify: Multiple chapters detected (if series page)
- [ ] Check console: No extraction errors
- [ ] Test URL: royalroad.com/fiction/[story-id]/chapter/[num]

#### Medium Articles
- [ ] Navigate to Medium article: https://medium.com
- [ ] Click extension icon
- [ ] Verify: Article title displays
- [ ] Verify: Full article text extracted
- [ ] Verify: No ad content included
- [ ] Check console: Extraction method identified

#### News Sites
- [ ] Test: BBC News (bbc.com/news)
- [ ] Test: CNN (cnn.com)
- [ ] Verify: Article content extracted
- [ ] Check for false positives (sidebars, ads)

#### Blog Posts
- [ ] Test: Medium Self-Hosted Blog
- [ ] Test: WordPress Blog
- [ ] Verify: Main content extracted
- [ ] Verify: Comments not included

#### Edge Cases
- [ ] Empty page with no content → Should show "No chapters detected"
- [ ] Page with only images → Should handle gracefully
- [ ] Page with dynamically loaded content → May need refresh
- [ ] Very long articles (10,000+ words) → Should handle without lag

### 2. Playback Controls Tests

#### Play Button
- [ ] Click "Play" button
- [ ] Audio should start within 2 seconds
- [ ] Button should change visual state
- [ ] Status should show "Playing..."
- [ ] Speaker icon should show (OS-dependent)
- [ ] Audio quality should be clear

#### Pause Button
- [ ] While playing, click "Pause"
- [ ] Audio should stop immediately
- [ ] Status should show "Paused"
- [ ] Play button should be available to resume
- [ ] Click Play again → Resume from pause point

#### Stop Button
- [ ] While playing, click "Stop"
- [ ] Audio should stop completely
- [ ] Position should reset to chapter start
- [ ] Status should show "Stopped"
- [ ] Clicking Play → Should start from beginning

#### Restart Button
- [ ] Start playback (play for 5+ seconds)
- [ ] Click "Restart"
- [ ] Audio should restart from chapter beginning
- [ ] No gap in playback

### 3. Navigation Tests

#### Next Chapter Button
- [ ] While on first chapter, click "Next"
- [ ] Should advance to chapter 2
- [ ] Chapter title should update
- [ ] Chapter progress should show (2/N)
- [ ] Playback should NOT auto-start
- [ ] Button should disable on last chapter

#### Previous Chapter Button
- [ ] While on chapter 2+, click "Previous"
- [ ] Should go to previous chapter
- [ ] Chapter title should update
- [ ] Playback should NOT auto-start
- [ ] Button should disable on first chapter

#### Chapter List
- [ ] Click extension icon
- [ ] All chapters should be listed
- [ ] Current chapter should be highlighted
- [ ] Click any chapter → Should navigate to it
- [ ] List should be scrollable if many chapters (10+)

### 4. Speech Settings Tests

#### Speech Rate
- [ ] Move slider to 0.5x (slowest)
- [ ] Play audio → Should be noticeably slower
- [ ] Move slider to 2.0x (fastest)
- [ ] Play audio → Should be noticeably faster
- [ ] Default (1.0x) → Normal speed
- [ ] Settings persist after refresh ✓ (if implemented)

#### Pitch
- [ ] Move slider to 0.5 (lowest)
- [ ] Audio pitch should be lower
- [ ] Move slider to 2.0 (highest)
- [ ] Audio pitch should be higher
- [ ] Default (1.0) → Normal pitch

#### Volume
- [ ] Set to 0% → No audio
- [ ] Set to 50% → Medium volume
- [ ] Set to 100% → Full volume
- [ ] System volume should also work

### 5. State Persistence Tests

#### Reading Position Save
- [ ] Play chapter 1 for 10 seconds
- [ ] Refresh page (Ctrl+R)
- [ ] Extension should restore to same chapter
- [ ] Position should be remembered
- [ ] Check DevTools → Application → Storage → Chrome storage

#### Across Session
- [ ] Play chapter 2
- [ ] Close browser completely
- [ ] Reopen browser
- [ ] Navigate back to same site
- [ ] Chapter 2 should be selected (if supported)

#### Different Sites
- [ ] Play chapter 1 on Site A
- [ ] Go to Site B, play chapter 5
- [ ] Return to Site A → Should be at chapter 1
- [ ] Each site's position tracked independently ✓

### 6. Error Handling Tests

#### Content Script Unavailable
- [ ] Open extension popup
- [ ] Open page with no content (blank page)
- [ ] Click Play → Should show error message
- [ ] No console crashes
- [ ] Extension remains functional

#### Large Text Content
- [ ] Find article with 20,000+ words
- [ ] Click Play
- [ ] Should handle without lag
- [ ] Performance acceptable (< 5 second delay)

#### Rapid Clicking
- [ ] Rapidly click Play/Pause (10+ times fast)
- [ ] Extension should not crash
- [ ] Final state should be consistent
- [ ] No memory leaks

#### Missing Permissions
- [ ] Remove storage permissions (hypothetically)
- [ ] Application should degrade gracefully
- [ ] Warn user in console

### 7. UI/UX Tests

#### Popup Responsiveness
- [ ] Click extension icon → Popup opens within 500ms
- [ ] All buttons clickable without lag
- [ ] Sliders smooth and responsive
- [ ] Text readable at any zoom level

#### Popup Layout
- [ ] At 400px width (standard popup)
- [ ] All elements visible without scrolling
- [ ] Buttons don't overlap
- [ ] Text doesn't wrap awkwardly

#### Visual Feedback
- [ ] Hover over buttons → visual change
- [ ] Disabled buttons appear grayed out
- [ ] Current chapter highlighted in list
- [ ] Status indicator changes color

### 8. Browser Compatibility Tests

#### Chrome
- [ ] Latest Chrome stable
- [ ] Chrome beta
- [ ] Chrome developer version
- [ ] Minimum supported (Chrome 90)

#### Chromium-Based
- [ ] Microsoft Edge
- [ ] Opera (if available)
- [ ] Brave

### 9. Logging Tests

#### Console Logging
- [ ] Open DevTools (F12)
- [ ] Console shows initialization logs
- [ ] Each action logged with timestamp
- [ ] Error messages appear on failures
- [ ] Format: `[SiteReader:timestamp] message`

#### Logs Export
- [ ] Click "Logs" button
- [ ] Console contains exported logs
- [ ] Can copy logs for debugging
- [ ] Logs include timestamps

#### Debug Mode
- [ ] Enable: `localStorage.setItem('siteReaderDebug', 'true')`
- [ ] Extra debug messages appear
- [ ] Disable: `localStorage.removeItem('siteReaderDebug')`
- [ ] Debug messages disappear

## Performance Testing

### Load Time
- **Extension Load**: Should be < 500ms
- **Popup Open**: Should be < 300ms
- **Content Script Injection**: Should be < 1000ms
- **Text Extraction**: Should be < 2000ms for typical pages

### Memory Usage
- **Initial**: < 50MB
- **During Playback**: < 75MB
- **After Stop**: Should return to near-initial
- **No memory leaks** after extended use (1+ hour)

### CPU Usage
- **Idle**: < 2% CPU
- **Text Extraction**: < 10% CPU briefly
- **Playback**: < 5% CPU
- **Normal operation**: Shouldn't heat up device

## Test Site Recommendations

### Must Test (Priority 1)
- https://www.royalroad.com/fiction/21220/mother-of-learning
- https://medium.com (any article)

### Should Test (Priority 2)
- https://www.bbc.com/news
- https://www.wikipedia.org (any article)
- https://www.theonion.com (any article)

### Nice to Test (Priority 3)
- https://www.hackernews.com
- https://www.reddit.com/r/todayilearned
- Local HTML file with article

## Regression Testing

Run this checklist before each release:

- [ ] Extension loads in Chrome
- [ ] All buttons functional
- [ ] Extraction works on Royal Road
- [ ] Playback works (plays audio)
- [ ] Navigation between chapters works
- [ ] Settings persist
- [ ] No console errors
- [ ] No memory leaks
- [ ] All features from checklist work

## Known Issues Tracking

Document any issues found:

| Issue | Steps to Reproduce | Expected | Actual | Status |
|-------|-------------------|----------|--------|--------|
| | | | | |

## Test Report Template

```
Date: [Date]
Tester: [Name]
Browser: [Chrome Version]
OS: [Windows/Mac/Linux]

Tests Passed: X/Y

Issues Found:
1. [Description]
   - Steps: [How to reproduce]
   - Impact: [High/Medium/Low]

Notes:
- [General observations]
```

## Continuous Testing

For ongoing quality:

- [ ] Test on new major Chrome release
- [ ] Test on 3+ different websites monthly
- [ ] Test on different OS occasionally
- [ ] Monitor GitHub issues
- [ ] Get user feedback

## Automated Testing (Future)

For Phase 2+:
- Unit tests for extraction logic
- Integration tests for message passing
- E2E tests for full user workflows
- Performance benchmarks

---

**Last Updated**: May 10, 2026
**Phase**: MVP (Phase 1)
**Status**: Ready for Manual Testing
