# Frosted Glass Unification Audit Report

## Canonical Style (Reference from home.css .glass-card)

```css
/* Frosted glass card */
background: rgba(253, 248, 243, 0.55);
backdrop-filter: blur(20px) saturate(140%);
-webkit-backdrop-filter: blur(20px) saturate(140%);
border: 1px solid rgba(255, 255, 255, 0.4);
border-radius: 20px;
box-shadow: 
  0 2px 8px rgba(195, 95, 51, 0.04),
  0 8px 24px rgba(0, 0, 0, 0.05),
  inset 0 1px 1px rgba(255, 255, 255, 0.6);

/* Hover */
background: rgba(253, 248, 243, 0.65);
backdrop-filter: blur(24px) saturate(150%);
transform: translateY(-2px);
box-shadow: 
  0 4px 12px rgba(195, 95, 51, 0.06),
  0 12px 32px rgba(0, 0, 0, 0.07),
  inset 0 1px 2px rgba(255, 255, 255, 0.8);
```

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
