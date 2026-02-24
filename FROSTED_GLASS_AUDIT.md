# Frosted Glass Unification Audit Report

## Canonical Style (Reference: profile-card in home.css)

```css
/* Card style - CORRECT REFERENCE */
background: rgba(255, 255, 255, 0.8);
backdrop-filter: blur(20px);
-webkit-backdrop-filter: blur(20px);
border: 1px solid rgba(255, 255, 255, 0.5);
border-radius: 20px;
box-shadow: 
  0 4px 16px rgba(195, 95, 51, 0.06),
  0 12px 32px rgba(0, 0, 0, 0.06);

/* Hover */
background: rgba(255, 255, 255, 0.85);
transform: translateY(-2px);
box-shadow: 
  0 6px 20px rgba(195, 95, 51, 0.08),
  0 16px 40px rgba(0, 0, 0, 0.08);
```

**Key points:**
- 80% white opacity (NOT cream, NOT 55%)
- No saturate() filter
- No inset shadow
- Warmer, more opaque appearance

## Files to Update

### 1. page-styles.css
- `.glass-card-page` - Currently uses wrong background, blur, border
- `.glass-card-page-strong` - Needs unification
- `.modal-content-page` - Should use glass-modal style

### 2. engagement.css
- `.bubble-card` - Uses different glass style
- `.progress-tracker` - Uses different glass style

### 3. globals.css
- `.glass`, `.glass-subtle`, `.glass-warm`, `.glass-modal` - Already close but verify

### 4. Dashboard Page Components
- Settings page uses `.glass-card-page` 
- Subscription page uses `.glass-card`
- Profile page uses `.glass-card-page`
- Gallery page uses `.glass-card-page`
- Postscripts pages use `.glass-card-page`
- Memories page uses `.glass-card-page`

### 5. Modal Components
- All Dialog/Modal components need audit
- ui/Modal.tsx
- GiftSelectionModal
- CreateMemoryModal
- ShareMemoryModal
- AddContributionModal
- UpgradeModal
- DigitizeModal
- PhotoMetadataModal
- etc.

## Key Properties to Unify

1. **Background**: `rgba(253, 248, 243, 0.55)` (base), `rgba(253, 248, 243, 0.65)` (hover)
2. **Border Radius**: `20px` (consistent everywhere)
3. **Blur**: `blur(20px) saturate(140%)`
4. **Border**: `1px solid rgba(255, 255, 255, 0.4)`
5. **Box Shadow**: Must include warm YT brand shadow
6. **Hover**: Must include translateY(-2px) and enhanced blur/shadow
