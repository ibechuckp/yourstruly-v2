# YoursTruly V2 - Page Layout Audit

**Audit Date:** February 27, 2026  
**Auditor:** Claude (Subagent: yt-page-audit)

---

## Summary

- **Total pages audited:** 18
- **Pages needing work:** 7
- **Priority fixes:** 
  1. Pets Page - Completely different styling (dark theme, legacy code)
  2. Capsules/Albums Page - Missing page-container wrapper
  3. Activity Page - Missing page-background, inconsistent containers
  4. Explore Page - Demo/placeholder page with inconsistent structure
  5. Messages Page - Fixed height issues, non-standard layout approach
  6. Subscription Page - Missing shared CSS classes, custom inline styles

---

## Page-by-Page Analysis

### 1. Dashboard Main Page (`page.tsx`)
- **Path**: /dashboard
- **Current Layout**: Flexbox + CSS Grid Mix
- **Issues**: 
  - Very large file (1457+ lines) - complex component with many inline elements
  - Uses custom `@/styles/home.css`, `@/styles/engagement.css`, `@/styles/conversation.css`
  - Mix of Tailwind grid and custom CSS classes
  - Engagement tiles use fixed grid positioning
- **Recommendation**: Layout is functional but could benefit from component extraction
- **Priority**: Low

---

### 2. Memories Page
- **Path**: /dashboard/memories
- **Current Layout**: Grid + Flexbox Mix ✅
- **Issues**: 
  - Well-structured with `page-container` wrapper
  - Uses shared `page-styles.css` classes
  - Grid layout: `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5`
  - Multiple view modes (grid, cards, scrapbook, timeline) all work correctly
- **Recommendation**: None - good reference implementation
- **Priority**: None

---

### 3. Wisdom Page
- **Path**: /dashboard/wisdom
- **Current Layout**: Flexbox + Grid Mix ✅
- **Issues**:
  - Uses `page-container` with `min-h-screen p-6 lg:p-8`
  - Stats grid: `grid-cols-2 md:grid-cols-4`
  - Category bubbles use flexbox wrap
  - Entries list uses `space-y-4`
- **Recommendation**: Follows conventions well
- **Priority**: None

---

### 4. Contacts Page
- **Path**: /dashboard/contacts
- **Current Layout**: Grid (via `.cards-grid` class) ✅
- **Issues**:
  - Uses `page-container` properly
  - Uses shared `.cards-grid` class for responsive grid
  - Well-structured sections for People and Pets
  - Bubble tiles with proper glass-card styling
- **Recommendation**: None - follows conventions
- **Priority**: None

---

### 5. Circles Page
- **Path**: /dashboard/circles
- **Current Layout**: Grid (via `.cards-grid` class) ✅
- **Issues**:
  - Uses `page-container` properly
  - Max width constraint: `max-w-5xl mx-auto`
  - Uses `.cards-grid` and `.content-card` classes
- **Recommendation**: None - follows conventions
- **Priority**: None

---

### 6. PostScripts Page
- **Path**: /dashboard/postscripts
- **Current Layout**: Grid + Flexbox Mix ✅
- **Issues**:
  - Uses `page-container` properly
  - Stats grid: `grid-cols-2 md:grid-cols-4`
  - Cards grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
  - Has view toggle (grid vs timeline) - both work
- **Recommendation**: None - well implemented
- **Priority**: None

---

### 7. Messages Page
- **Path**: /dashboard/messages
- **Current Layout**: Flexbox (sidebar + main panel) ⚠️
- **Issues**:
  - Uses fixed height: `h-[calc(100vh-56px)]` - rigid
  - Custom max-width approach: `max-w-[80%]`
  - No `page-container` or `page-background` classes
  - Different layout paradigm (messaging app style)
  - Mobile responsive toggle between list and thread views
- **Recommendation**: 
  - Layout is intentionally different (chat-style) so may be acceptable
  - Consider adding page-background blobs for consistency
  - The 80% max-width is unusual but works
- **Priority**: Medium (style consistency)

---

### 8. Profile Page
- **Path**: /dashboard/profile
- **Current Layout**: 3-Column CSS Grid ✅
- **Issues**:
  - Uses `page-container` properly
  - Complex 12-column grid: `grid-cols-1 lg:grid-cols-12`
  - Left: `lg:col-span-3`, Center: `lg:col-span-6`, Right: `lg:col-span-3`
  - Uses `glass-card-page` classes correctly
  - Very large file (1730+ lines) but well-structured
- **Recommendation**: None - sophisticated but correct
- **Priority**: None

---

### 9. Settings Page
- **Path**: /dashboard/settings
- **Current Layout**: Single Column Flexbox ✅
- **Issues**:
  - Uses `page-container` properly
  - Max width constraint: `max-w-2xl`
  - Sections use `glass-card-page` class
  - Uses shared button/form classes
- **Recommendation**: None - follows conventions
- **Priority**: None

---

### 10. Gallery Page
- **Path**: /dashboard/gallery
- **Current Layout**: Grid + Complex Components ✅
- **Issues**:
  - Uses `page-container` properly
  - Main viewer has complex flex layout with sidebar timeline
  - Photo grid: `grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8`
  - Albums grid: `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6`
  - Uses glass-card classes
- **Recommendation**: None - well implemented
- **Priority**: None

---

### 11. Capsules/Albums Page
- **Path**: /dashboard/capsules
- **Current Layout**: Grid ⚠️
- **Issues**:
  - **Missing `page-container` wrapper** - uses bare `pb-8 pb-24` (duplicate pb)
  - **Missing `page-background`** with blobs
  - Uses motion animations for cards
  - Grid: `grid-cols-2 md:grid-cols-3 lg:grid-cols-4`
- **Recommendation**: 
  - Wrap in `page-container`
  - Add `page-background` with blob elements
  - Fix duplicate padding classes
- **Priority**: High

---

### 12. Stats Page
- **Path**: /dashboard/stats
- **Current Layout**: Grid + Flexbox ✅
- **Issues**:
  - Uses `page-container` properly
  - Max width: `max-w-5xl mx-auto`
  - Hero stats: `grid-cols-2 sm:grid-cols-4`
  - Main grid: `grid-cols-1 lg:grid-cols-3`
  - Uses `glass-card-page` classes
- **Recommendation**: None - follows conventions
- **Priority**: None

---

### 13. Activity Page
- **Path**: /dashboard/activity
- **Current Layout**: Flexbox ⚠️
- **Issues**:
  - **Uses `pb-8 pb-24` (duplicate)** instead of `page-container`
  - Uses fixed background but with inline styles: `fixed inset-0 bg-gradient-to-br from-[#F2F1E5]...`
  - Max width: `max-w-3xl mx-auto px-4 py-8`
  - No blob elements
- **Recommendation**:
  - Replace with `page-container` class
  - Add `page-background` with blobs
  - Remove inline background styles
- **Priority**: Medium

---

### 14. Pets Page (Standalone)
- **Path**: /dashboard/pets
- **Current Layout**: Grid ❌ **MAJOR ISSUES**
- **Issues**:
  - **Completely different styling** - uses dark theme (bg-gray-900, text-white)
  - No page-container, no page-background
  - Old styling: `bg-gray-900 rounded-xl p-5 border border-gray-800`
  - Pink accent color instead of brand colors
  - Grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
  - Modal uses different styling too
- **Recommendation**:
  - Complete restyle to match YT v2 design system
  - Apply `page-container` and `page-background`
  - Replace gray-900 with glass-card-page styling
  - Replace pink with brand colors (#406A56, #C35F33, etc.)
  - Note: Pets are also managed on Contacts page which has correct styling
- **Priority**: **High** (visual inconsistency)

---

### 15. Subscription Page
- **Path**: /dashboard/subscription
- **Current Layout**: Custom Flexbox ⚠️
- **Issues**:
  - Uses custom `.subscription-page` class from `subscription.css`
  - Has its own styling system (plan cards, seat lists)
  - No `page-container` or `page-background`
  - Inline styles in modal
- **Recommendation**:
  - Consider wrapping in `page-container` for consistency
  - The custom styling is acceptable for a distinct "settings" page
- **Priority**: Low-Medium

---

### 16. Explore Page
- **Path**: /dashboard/explore
- **Current Layout**: Demo/Placeholder ⚠️
- **Issues**:
  - Uses `pb-8 bg-[#F2F1E5] p-6` instead of `page-container`
  - No `page-background` with blobs
  - Demo data - appears to be a prototype/exploration page
  - Uses component imports (TimelineScroller, GlassCard, etc.)
  - Fixed positioned voice button at bottom
- **Recommendation**:
  - If this is a production page, apply `page-container`
  - If demo/prototype, consider removing or marking clearly
- **Priority**: Medium (depends on intent)

---

### 17. Journalist/Interviews Page
- **Path**: /dashboard/journalist
- **Current Layout**: Custom (App-like) ⚠️
- **Issues**:
  - Uses `bg-[#F2F1E5] pb-8` instead of `page-container`
  - Has header with manual padding `px-6 py-6`
  - Main content with `max-w-4xl mx-auto`
  - Cards use custom styling but match design system colors
  - No page-background blobs
- **Recommendation**:
  - Add `page-container` wrapper
  - Add `page-background` with blobs for consistency
  - Currently functional but visually different from other pages
- **Priority**: Medium

---

### 18. Voice-Personaplex Page
- **Path**: /dashboard/voice-personaplex
- **Current Layout**: Not audited (specialized feature page)
- **Priority**: Out of scope

---

## Layout Classes Reference

The project has a well-designed shared CSS system in `@/styles/page-styles.css`:

### Container Classes
- `.page-container` - Main wrapper (min-h-screen, padding, z-indexing)
- `.page-background` - Fixed background with gradient
- `.page-blob-1/2/3` - Floating gradient blobs for depth

### Card Classes
- `.glass-card-page` - Primary card with blur/transparency
- `.glass-card-page-strong` - Stronger opacity variant
- `.content-card` - For list/grid items
- `.content-card-interactive` - Clickable variant

### Grid Classes
- `.cards-grid` - Responsive grid (1→2→3 columns)

### Header Classes
- `.page-header` - Flex container for back button + title
- `.page-header-back` - Back button styling
- `.page-header-title` / `.page-header-subtitle`

---

## Recommendations Summary

### Immediate Actions (High Priority)
1. **Pets Page** - Complete restyle to match v2 design system
2. **Capsules Page** - Add page-container and page-background

### Short-term (Medium Priority)
3. **Activity Page** - Add proper container/background classes
4. **Journalist Page** - Add page-container wrapper
5. **Messages Page** - Consider adding background consistency

### Low Priority / Optional
6. **Explore Page** - Clarify if production or demo
7. **Subscription Page** - Custom styling acceptable, minor improvements possible
8. **Dashboard Main** - Component extraction for maintainability

---

## Notes

- Most pages follow conventions well - the shared CSS system is effective
- The main inconsistencies are in older pages (Pets) or specialized layouts (Messages, Subscription)
- Consider documenting the page-container pattern more prominently for future development
