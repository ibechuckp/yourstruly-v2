# YoursTruly V2 - Design System

**Version:** 2.0  
**Last Updated:** 2026-03-03  
**Purpose:** Complete design system specification for Figma recreation

---

## 🎨 DESIGN TOKENS

### Brand Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **YT Green** | `#406A56` | rgb(64, 106, 86) | Primary brand, buttons, links |
| **YT Green Light** | `#D3E1DF` | rgb(211, 225, 223) | Backgrounds, hover states |
| **YT Green Dark** | `#2d4d3e` | rgb(45, 77, 62) | Dark mode accents |
| **YT Red/Terra Cotta** | `#C35F33` | rgb(195, 95, 51) | Accent, CTAs, warnings |
| **YT Red Light** | `#EBD4CA` | rgb(235, 212, 202) | Soft backgrounds |
| **YT Yellow** | `#D9C61A` | rgb(217, 198, 26) | XP badges, highlights |
| **YT Yellow Light** | `#F5EFBE` | rgb(245, 239, 190) | Light accents |
| **YT Yellow Dark** | `#8a7c08` | rgb(138, 124, 8) | Text on yellow bg |
| **YT Blue** | `#8DACAB` | rgb(141, 172, 171) | Secondary, info |
| **YT Blue Light** | `#C5CDD6` | rgb(197, 205, 214) | Subtle backgrounds |
| **YT Purple** | `#4A3552` | rgb(74, 53, 82) | Interviews, AI features |
| **YT Purple Light** | `#D8D3DA` | rgb(216, 211, 218) | Soft purple |
| **YT Purple Mid** | `#6b4a7a` | rgb(107, 74, 122) | Gradients |
| **YT Cream/Offwhite** | `#F2F1E5` | rgb(242, 241, 229) | Base background |
| **YT Warm BG** | `#FDF8F3` | rgb(253, 248, 243) | Warm variant |

### Semantic Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `#1a1512` | Dark mode base |
| `--foreground` | `#f5f0eb` | Dark mode text |
| `--yt-warm-dark` | `#2a1f1a` | Warm dark accents |
| `--yt-warm-mid` | `#3d2d24` | Mid-tone warm |
| `--yt-warm-accent` | `#c9886d` | Warm glow |
| `--yt-warm-glow` | `#d4a574` | Soft highlights |

### Text Colors

| Usage | Color |
|-------|-------|
| Primary Text | `#2d2d2d` |
| Secondary Text | `#666666` |
| Muted Text | `#888888`, `#999999` |
| Placeholder | `#aaaaaa` |
| White Text | `#ffffff` |
| White/60 | `rgba(255,255,255,0.6)` |

---

## 📐 TYPOGRAPHY

### Font Families

```css
--font-inter-tight: 'Inter Tight', sans-serif;     /* Primary UI font */
--font-playfair: 'Playfair Display', serif;         /* Elegant headlines */
--font-handwritten: 'Caveat', cursive;              /* Personal touches */
--font-patrick-hand: 'Patrick Hand', cursive;       /* Friendly handwritten */
--font-geist-sans: 'Geist Sans', sans-serif;        /* System fallback */
--font-geist-mono: 'Geist Mono', monospace;         /* Code/mono */
```

### Type Scale

| Class | Size | Weight | Line Height | Letter Spacing |
|-------|------|--------|-------------|----------------|
| `.title-elegant` | varies | 500 | 1.2 | -0.02em |
| `.title-elegant-bold` | varies | 700 | 1.2 | -0.02em |
| `.label-refined` | 0.7rem (11px) | 600 | 1.2 | 0.1em (uppercase) |
| Body text | 14px | 400 | 1.5 | normal |
| Small text | 12-13px | 400-500 | 1.4 | normal |
| XS text | 10-11px | 500-600 | 1.2 | 0.05-0.12em |
| Card title | 15-20px | 600-700 | 1.3 | -0.01em |

---

## 📏 SPACING SCALE

Based on 4px unit system:

| Token | Value | Pixels |
|-------|-------|--------|
| 0 | 0 | 0px |
| 0.5 | 0.125rem | 2px |
| 1 | 0.25rem | 4px |
| 1.5 | 0.375rem | 6px |
| 2 | 0.5rem | 8px |
| 2.5 | 0.625rem | 10px |
| 3 | 0.75rem | 12px |
| 4 | 1rem | 16px |
| 5 | 1.25rem | 20px |
| 6 | 1.5rem | 24px |
| 8 | 2rem | 32px |
| 10 | 2.5rem | 40px |
| 12 | 3rem | 48px |
| 16 | 4rem | 64px |

---

## 🔲 BORDER RADIUS

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-lg` | 8px | Inputs, small buttons |
| `rounded-xl` | 12px | Cards, buttons |
| `rounded-2xl` | 16px | Large cards |
| `rounded-[20px]` | 20px | Glass cards, modals |
| `rounded-full` | 9999px | Avatars, pills, badges |
| `rounded-refined` | 14px (0.875rem) | Medium elements |
| `rounded-refined-lg` | 20px (1.25rem) | Large elements |

---

## 🌑 SHADOWS

### Standard Shadows

```css
/* Small - subtle elevation */
card-shadow:
  0 1px 3px rgba(195, 95, 51, 0.04),
  0 4px 12px rgba(195, 95, 51, 0.06);

/* Medium */
card-shadow-md:
  0 2px 4px rgba(195, 95, 51, 0.04),
  0 8px 24px rgba(195, 95, 51, 0.08);

/* Large */
card-shadow-lg:
  0 4px 6px rgba(195, 95, 51, 0.03),
  0 12px 40px rgba(195, 95, 51, 0.12);

/* Glass Card Base */
glass:
  0 4px 16px rgba(195, 95, 51, 0.06),
  0 12px 32px rgba(0, 0, 0, 0.06);

/* Glass Card Hover */
glass:hover:
  0 6px 20px rgba(195, 95, 51, 0.08),
  0 16px 40px rgba(0, 0, 0, 0.08);

/* Modal */
glass-modal:
  0 4px 16px rgba(195, 95, 51, 0.06),
  0 20px 60px rgba(0, 0, 0, 0.1);
```

---

## 🪟 GLASS/FROSTED EFFECTS

### .glass (Primary)
```css
background: rgba(255, 255, 255, 0.8);
backdrop-filter: blur(20px);
-webkit-backdrop-filter: blur(20px);
border: 1px solid rgba(255, 255, 255, 0.5);
border-radius: 20px;
```

### .glass-subtle
```css
background: rgba(255, 255, 255, 0.7);
backdrop-filter: blur(16px);
border: 1px solid rgba(255, 255, 255, 0.4);
```

### .glass-warm
```css
background: rgba(255, 255, 255, 0.8);
/* Same blur as .glass */
/* Used for profile card variants */
```

### .glass-modal
```css
background: rgba(255, 255, 255, 0.9);
backdrop-filter: blur(24px);
border: 1px solid rgba(255, 255, 255, 0.5);
```

### .glass-nav
```css
background: rgba(255, 255, 255, 0.8);
backdrop-filter: blur(20px);
border-bottom: 1px solid rgba(255, 255, 255, 0.5);
```

### .glass-dark
```css
background: rgba(42, 31, 26, 0.75);
backdrop-filter: blur(20px);
border: 1px solid rgba(255, 255, 255, 0.1);
color: white;
```

---

## ⏱️ ANIMATION & MOTION

### Timing Functions

```css
/* Primary easing (spring-like) */
cubic-bezier(0.16, 1, 0.3, 1)

/* Standard ease */
ease-out, ease-in

/* Linear (for rotation) */
linear
```

### Duration Scale

| Token | Value | Usage |
|-------|-------|-------|
| `duration-150` | 150ms | Quick micro-interactions |
| `duration-200` | 200ms | Exit animations |
| `duration-250` | 250ms | Enter animations |
| `duration-300` | 300ms | Page transitions |
| `duration-400` | 400ms | Staggered children |
| `duration-500` | 500ms | Longer reveals |

### Keyframe Animations

```css
@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes fade-out { from { opacity: 1; } to { opacity: 0; } }
@keyframes zoom-in-95 { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes zoom-out-95 { from { transform: scale(1); opacity: 1; } to { transform: scale(0.95); opacity: 0; } }
@keyframes slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
@keyframes slide-in-right { from { transform: translateX(100%); } to { transform: translateX(0); } }
@keyframes slide-in-bottom { from { transform: translateY(100%); } to { transform: translateY(0); } }
@keyframes scale-bounce { 0% { transform: scale(0.9); opacity: 0; } 50% { transform: scale(1.02); } 100% { transform: scale(1); opacity: 1; } }
```

### Hover Effects

```css
.hover-lift:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(195, 95, 51, 0.1), 0 16px 48px rgba(195, 95, 51, 0.08);
}

.button-press:active {
  transform: scale(0.97);
}
```

---

## 🧩 COMPONENTS

### Atoms

#### Button
**Variants:** default, outline, ghost, destructive, secondary, link  
**Sizes:** sm (h-8, px-3), default (h-10, px-4), lg (h-12, px-6), icon (h-10, w-10)

```
Default Button:
- Background: #406A56
- Text: white
- Border-radius: 12px (rounded-xl)
- Focus ring: #406A56/50

Outline Button:
- Border: 1px solid #406A56/20
- Text: #406A56
- Hover bg: #406A56/10

Ghost Button:
- Background: transparent
- Text: #406A56
- Hover bg: #406A56/10
```

#### Input
```
- Background: white
- Border: 1px solid #E5E5E5
- Border-radius: 12px
- Padding: 10px 16px
- Focus: ring-2 #406A56/30, border #406A56
- Placeholder: #9CA3AF
```

#### Badge / Category Pill
Color variants:
- **Yellow (Photo):** bg: rgba(217, 198, 26, 0.15), color: #8a7c08
- **Green (Contact):** bg: rgba(64, 106, 86, 0.12), color: #406A56
- **Blue (Contact):** bg: rgba(141, 172, 171, 0.2), color: #5d7a79
- **Purple (Memory):** bg: rgba(74, 53, 82, 0.15), color: #4A3552
- **Red (Knowledge):** bg: rgba(195, 95, 51, 0.12), color: #C35F33

```
Font: 11px, uppercase, 600 weight, 0.05em letter-spacing
Padding: 4px 10px
Border-radius: 12px
```

#### Avatar
```
- Sizes: 24px, 32px, 40px, 48px
- Border-radius: 50%
- Default bg: gradient from-amber-500 to-orange-600
- Text: white, centered, first initial
- Border: 2px solid white (in stacks)
```

### Molecules

#### Card
**Variants:** default, glass, warm

```
Default Card:
- Background: white
- Border: 1px solid #E5E5E5
- Border-radius: 16px (rounded-2xl)
- Shadow: subtle card-shadow

Glass Card:
- Background: rgba(255, 255, 255, 0.8)
- Backdrop-blur: 20px
- Border: 1px solid rgba(255, 255, 255, 0.5)

Warm Card:
- Background: #F2F1E5
- Border: 1px solid rgba(64, 106, 86, 0.1)
```

#### Modal
```
- Max-width: varies (max-w-md default)
- Background: rgba(255, 255, 255, 0.9)
- Backdrop-blur: 24px
- Border-radius: 20px
- Overlay: bg-black/50 backdrop-blur-sm
- Animation: zoom-in-95, fade-in
```

#### Bubble Tile (Engagement Card)
```
Width: 244px (fixed)
Background: rgba(255, 255, 255, 0.8)
Backdrop-filter: blur(20px)
Border-radius: 20px
Border: 1px solid rgba(255, 255, 255, 0.5)
Shadow: 0 4px 16px rgba(195, 95, 51, 0.06), 0 12px 32px rgba(0, 0, 0, 0.06)

Hover:
- Background: rgba(255, 255, 255, 0.85)
- Transform: translateY(-2px)
- Shadow increased
```

### Organisms

#### Sidebar (Dark Theme)
```
Width: 224px (w-56)
Background: rgb(9, 10, 11) with 95% opacity, backdrop-blur
Position: fixed left
Border-right: 1px solid rgba(255,255,255,0.1)

Nav item:
- Padding: 10px 12px
- Border-radius: 12px
- Active: gradient from-amber-500/20 to-orange-500/20, text-amber-400
- Hover: bg-white/5
```

#### Top Nav (Glass)
```
Height: 56px
Background: rgba(255, 255, 255, 0.8)
Backdrop-filter: blur(20px)
Border-bottom: 1px solid rgba(255, 255, 255, 0.5)
Position: fixed top
```

#### Conversation View
```
Modal container:
- Centered overlay
- bg-black/60 backdrop-blur
- Modal: white/90 with blur(24px)
- Border-radius: 24px
- Max-width: 600px
- Padding: 24-32px
```

---

## 📄 PAGE LAYOUTS

### Landing / Marketing
- Full-width hero with gradient background
- Glass nav bar at top
- Centered content blocks
- Warm gradients: linear-gradient(165deg, #E8E4D6 0%, #B3A888 100%)

### Dashboard Home
- Sidebar: 224px fixed left (dark)
- Top nav: 56px fixed top (glass)
- Main content: offset left by sidebar, top by nav
- ProfileCard: fixed top-left (scaled 0.8)
- Command bar: fixed bottom center

### Onboarding Flow
- Full-screen centered
- Step indicators (dots)
- Large glass cards
- Progress bar at top
- Animated transitions between steps

### Contacts List
- Grid layout: responsive 2-4 columns
- Glass cards for each contact
- Search bar at top
- Filters as pills

### Memory Grid
- Masonry or grid layout
- Square aspect ratio cards
- Hover reveals AI summary
- Mood indicator dots (colored circles)

### Settings
- Stacked sections
- Form inputs in glass containers
- Toggle switches
- Save buttons at section end

---

## 🖼️ SPECIAL ELEMENTS

### Torn Edge Category Labels
SVG backgrounds with "torn paper" effect:
- `torn-edge-yellow.svg`
- `torn-edge-green.svg`
- `torn-edge-blue.svg`
- `torn-edge-red.svg`
- `torn-edge-purple.svg`

Applied via `::before` pseudo-element

### XP Counter
```css
background: linear-gradient(135deg, rgba(217, 198, 26, 0.15), rgba(217, 198, 26, 0.25));
border: 1px solid rgba(217, 198, 26, 0.3);
border-radius: 20px;
padding: 6px 14px;
```

### Progress Tracker
```css
background: rgba(255, 255, 255, 0.8);
backdrop-filter: blur(20px);
border-radius: 20px;
border: 1px solid rgba(255, 255, 255, 0.5);
min-height: 56px;
/* Contains completed tile thumbnails */
```

---

## 🎯 FIGMA SETUP RECOMMENDATIONS

### File Structure
```
YoursTruly V2 - Design System
├── 🎨 Design Tokens
│   ├── Colors
│   ├── Typography
│   ├── Spacing
│   ├── Shadows
│   └── Effects (Glass/Blur)
├── 🧱 Components
│   ├── Atoms
│   │   ├── Buttons
│   │   ├── Inputs
│   │   ├── Badges
│   │   ├── Avatars
│   │   └── Icons
│   ├── Molecules
│   │   ├── Cards
│   │   ├── Form Groups
│   │   ├── Dropdowns
│   │   └── Search
│   └── Organisms
│       ├── Navigation
│       ├── Sidebar
│       ├── Modals
│       ├── Bubble Tiles
│       └── Conversation
├── 📱 Pages
│   ├── Landing
│   ├── Dashboard
│   ├── Onboarding
│   ├── Contacts
│   ├── Memories
│   ├── PostScripts
│   └── Settings
└── 📋 Documentation
```

### Figma Variables to Create
1. **Color Styles:** All brand colors + semantic colors
2. **Text Styles:** All typography variants
3. **Effect Styles:** Glass blur, shadows
4. **Component Sets:** With all variants

### Auto Layout Settings
- Default gap: 8px or 16px
- Padding: 16px, 20px, 24px standard
- All cards use auto layout
