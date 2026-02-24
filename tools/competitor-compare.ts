#!/usr/bin/env npx ts-node
/**
 * YoursTruly V2 - Competitor Comparison Tool
 * 
 * This tool fetches, analyzes, and compares competitors in the digital legacy/memory preservation space.
 * 
 * Usage:
 *   npx ts-node tools/competitor-compare.ts [command]
 * 
 * Commands:
 *   fetch      - Fetch latest competitor data (updates individual files)
 *   compare    - Generate comparison matrix
 *   report     - Full report with positioning analysis
 *   dashboard  - Generate dashboard data JSON
 *   all        - Run all commands
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Competitor definitions with known data
interface Competitor {
  name: string;
  slug: string;
  url: string;
  tagline: string;
  pricing: {
    free?: string;
    basic?: string;
    premium?: string;
    enterprise?: string;
    oneTime?: string;
    notes?: string;
  };
  features: string[];
  targetAudience: string[];
  security: string[];
  easeOfUse: string[];
  visualStyle: string;
  differentiators: string[];
  weaknesses: string[];
  status: 'active' | 'parked' | 'unknown' | 'pivot';
  lastUpdated: string;
}

const COMPETITORS: Competitor[] = [
  {
    name: "StoryWorth",
    slug: "storyworth",
    url: "https://www.storyworth.com/",
    tagline: "Everyone has a story worth sharing",
    pricing: {
      basic: "$99/year",
      notes: "Includes 1 year weekly prompts + 1 hardcover book (up to 300 pages). Extra books ~$69."
    },
    features: [
      "Weekly question prompts via email",
      "Write or voice record responses",
      "Automatic transcription",
      "Hardcover keepsake book",
      "Unlimited photos",
      "PDF e-book downloads",
      "Family sharing/collaboration",
      "10+ years in market (since 2013)",
      "1M+ books printed"
    ],
    targetAudience: [
      "Adults wanting to capture parent/grandparent stories",
      "People who prefer writing to video",
      "Gift givers (popular for holidays)",
      "Families wanting physical keepsake books"
    ],
    security: [
      "Stories are private and downloadable",
      "30-day money-back guarantee"
    ],
    easeOfUse: [
      "No tech savvy needed",
      "Works via email - no app required",
      "Landline phone recording option",
      "Built-in proofreader"
    ],
    visualStyle: "Clean, book-focused, traditional, warm family imagery",
    differentiators: [
      "Market leader with 10+ years trust",
      "Physical book as end product",
      "Email-based (no app)",
      "Founder story prominently featured",
      "Unlimited book projects"
    ],
    weaknesses: [
      "Text-heavy - writing feels like homework",
      "No real-time family sharing",
      "No future message delivery",
      "No video support",
      "1-year deadline pressure",
      "Voice recordings not preserved in book (only text)"
    ],
    status: 'active',
    lastUpdated: "2026-02-24"
  },
  {
    name: "Remento",
    slug: "remento",
    url: "https://www.remento.co/",
    tagline: "Their memories and voice forever at your fingertips",
    pricing: {
      basic: "$84-99/year",
      premium: "$12/month renewal",
      notes: "Includes 1 year prompts + 1 hardcover book. 30-day money-back guarantee."
    },
    features: [
      "Voice-first recording",
      "Speech-to-Story™ AI transcription",
      "QR codes in book to play voice",
      "Video or audio recording",
      "Weekly prompts via email/text",
      "No apps to download",
      "Unlimited collaborators",
      "Story editing/refinement"
    ],
    targetAudience: [
      "Families with elderly parents who won't write",
      "People who want voice preserved, not just text",
      "Shark Tank watchers (brand recognition)"
    ],
    security: [
      "Content downloadable anytime",
      "Physical book as permanent backup"
    ],
    easeOfUse: [
      "No writing required - just talk",
      "No logins or passwords",
      "No apps to download",
      "Grandparent-tested simplicity"
    ],
    visualStyle: "Modern, video-forward, emotional testimonials, Shark Tank branding",
    differentiators: [
      "Voice-first (QR codes play actual voice)",
      "Speech-to-Story™ AI",
      "Shark Tank featured",
      "Book + voice combo"
    ],
    weaknesses: [
      "No future message delivery",
      "No real-time family sharing",
      "Annual commitment model",
      "No AI avatar/chat features",
      "Newer player (less trust than StoryWorth)"
    ],
    status: 'active',
    lastUpdated: "2026-02-24"
  },
  {
    name: "HeritageWhisper",
    slug: "heritagewhisper",
    url: "https://heritagewhisper.com/",
    tagline: "Their Voice. Their Grit. Your Compass.",
    pricing: {
      free: "First 5 stories free",
      basic: "$79/year",
      notes: "Unlimited recordings, unlimited family sharing, data export included."
    },
    features: [
      "Voice-first recording",
      "Pearl AI follow-up questions",
      "Living Book format",
      "Instant family sharing",
      "Auto-transcription",
      "Memory Box (recipes, keepsakes)",
      "Full data export/archive",
      "Print-ready PDF"
    ],
    targetAudience: [
      "Adults 50+ preserving stories",
      "Adult children capturing aging parents",
      "Families scattered geographically"
    ],
    security: [
      "256-bit encryption",
      "No data selling",
      "Full offline archive download",
      "Stories never used for AI training"
    ],
    easeOfUse: [
      "Tap mic to start",
      "No writing required",
      "No deadlines",
      "Grandma-tested simplicity"
    ],
    visualStyle: "Clean, warm, book metaphor, founder-story focused",
    differentiators: [
      "Voice-first with Pearl AI follow-ups",
      "Instant real-time family sharing",
      "Living Book that never closes",
      "Strong data sovereignty messaging",
      "$20 cheaper than StoryWorth"
    ],
    weaknesses: [
      "No future message delivery",
      "No video support",
      "No AI avatar features",
      "No marketplace/gift integration",
      "Newer entrant"
    ],
    status: 'active',
    lastUpdated: "2026-02-24"
  },
  {
    name: "Capsle Stories",
    slug: "capsle-stories",
    url: "https://capslestories.com/",
    tagline: "The app for family stories",
    pricing: {
      free: "14-day free trial",
      basic: "Annual subscription (price unlisted)",
      notes: "Mobile app-based. Recently reduced prices."
    },
    features: [
      "Video story recording",
      "Family collaboration",
      "Question prompts",
      "Private sharing",
      "Heirloom-quality storage"
    ],
    targetAudience: [
      "Mobile-first families",
      "People who prefer video over text",
      "Multi-generational families"
    ],
    security: [
      "Private family sharing",
      "Straightforward privacy controls"
    ],
    easeOfUse: [
      "Intuitive mobile app design",
      "Question-based prompts"
    ],
    visualStyle: "Modern mobile app, family-focused imagery",
    differentiators: [
      "Video-first approach",
      "Mobile app (vs web-based competitors)",
      "Transparent pricing messaging"
    ],
    weaknesses: [
      "App-only (no web access)",
      "Less established brand",
      "No physical book output",
      "No future message delivery",
      "Limited web presence"
    ],
    status: 'active',
    lastUpdated: "2026-02-24"
  },
  {
    name: "Klokbox",
    slug: "klokbox",
    url: "https://www.klokbox.com/",
    tagline: "Turn Your Personal Moments Into Timeless Stories",
    pricing: {
      free: "Free with ads, unlimited albums",
      premium: "$4.99/month",
      notes: "Premium removes ads, adds cloud backup"
    },
    features: [
      "1-click gallery import",
      "Audio message recording",
      "Unlimited albums",
      "Storybook generation",
      "Private sharing",
      "Cloud backup (premium)",
      "Time capsule feature"
    ],
    targetAudience: [
      "Parents documenting children",
      "Photo organization enthusiasts",
      "Privacy-conscious families"
    ],
    security: [
      "Private story boxes",
      "Cloud backup option"
    ],
    easeOfUse: [
      "Gallery duplication with one tap",
      "Simple delete/organize workflow"
    ],
    visualStyle: "Modern app interface, photo-forward",
    differentiators: [
      "Low price point",
      "Gallery import feature",
      "Time capsule concept",
      "Freemium model"
    ],
    weaknesses: [
      "No physical book output",
      "No AI features",
      "Ad-supported free tier",
      "Limited brand recognition",
      "No voice recording emphasis"
    ],
    status: 'active',
    lastUpdated: "2026-02-24"
  },
  {
    name: "Turning Hearts",
    slug: "turning-hearts",
    url: "https://turninghearts.com/",
    tagline: "No Life Should Ever Be Forgotten",
    pricing: {
      oneTime: "Medallion purchase (price varies)",
      notes: "Physical medallion + lifetime digital access. 2 medallions per pack."
    },
    features: [
      "QR medallion for headstones",
      "Unlimited photos/videos",
      "Memory sharing",
      "Tribute collection",
      "Discover feature (find other memorials)",
      "Lifetime warranty"
    ],
    targetAudience: [
      "Grieving families",
      "Cemetery visitors",
      "Memorial gift givers"
    ],
    security: [
      "Physical medallion as backup",
      "Lifetime warranty"
    ],
    easeOfUse: [
      "Scan QR to access",
      "Simple photo/video upload"
    ],
    visualStyle: "Memorial-focused, emotional testimonials, cemetery imagery",
    differentiators: [
      "Physical QR medallion",
      "Cemetery/headstone focus",
      "Discover feature for exploration",
      "One-time purchase model"
    ],
    weaknesses: [
      "Post-death focus only",
      "No living memory capture",
      "No AI features",
      "No future message delivery",
      "Limited to memorials"
    ],
    status: 'active',
    lastUpdated: "2026-02-24"
  },
  {
    name: "23snaps",
    slug: "23snaps",
    url: "https://www.23snaps.com/",
    tagline: "Share Your Precious Family Moments Safely",
    pricing: {
      free: "Free tier available",
      premium: "Premium for prints/books",
      notes: "Private family photo sharing app"
    },
    features: [
      "Private photo/video sharing",
      "Ad-free experience",
      "Photo prints and books",
      "Web and mobile access",
      "Family circle sharing"
    ],
    targetAudience: [
      "Parents with young children",
      "Privacy-conscious families",
      "Grandparent photo sharing"
    ],
    security: [
      "Private by design",
      "No ads",
      "Family-only access"
    ],
    easeOfUse: [
      "Familiar social media UX",
      "Cross-platform access"
    ],
    visualStyle: "Clean, social-media-like, parent-focused",
    differentiators: [
      "Privacy-first positioning",
      "No ads ever",
      "Print-on-demand integration"
    ],
    weaknesses: [
      "Photo sharing focus (not stories)",
      "No voice/video stories",
      "No AI features",
      "No future message delivery",
      "Limited story prompts"
    ],
    status: 'active',
    lastUpdated: "2026-02-24"
  },
  {
    name: "Eternos",
    slug: "eternos",
    url: "https://eternos.life/",
    tagline: "Extend Your Impact, Preserve Your Legacy",
    pricing: {
      basic: "$25/month (Consumer)",
      premium: "$49/month + $995 setup (Prosumer)",
      enterprise: "Custom pricing",
      notes: "AI digital twin with voice cloning. 5-10MB bandwidth/month included."
    },
    features: [
      "AI digital twin creation",
      "Voice replica/cloning",
      "Interactive conversations",
      "Unlimited family sharing",
      "Photo/video/document storage",
      "Personalized AI advice",
      "Continued learning after death"
    ],
    targetAudience: [
      "Legacy-focused individuals",
      "Professionals wanting to scale expertise",
      "Families wanting AI preservation"
    ],
    security: [
      "MemoryVault data storage",
      "Data preserved if membership lapses"
    ],
    easeOfUse: [
      "Self-serve or concierge onboarding",
      "Up to 10 hours setup support (Prosumer)"
    ],
    visualStyle: "Tech-forward, professional, AI-focused",
    differentiators: [
      "Full AI digital twin",
      "Voice cloning technology",
      "Continued learning post-death",
      "Professional/business use cases"
    ],
    weaknesses: [
      "Expensive ($300+/year minimum)",
      "Complex setup for AI quality",
      "No physical book output",
      "Tech-forward may alienate seniors",
      "Bandwidth limitations"
    ],
    status: 'active',
    lastUpdated: "2026-02-24"
  },
  {
    name: "memura.life",
    slug: "memura-life",
    url: "https://memura.life/",
    tagline: "Be part of something bigger",
    pricing: {
      notes: "Pricing not publicly listed. Early stage product."
    },
    features: [
      "Voice preservation",
      "Image preservation",
      "Memory storage",
      "Continued communication after death"
    ],
    targetAudience: [
      "Legacy-focused individuals",
      "People wanting digital immortality"
    ],
    security: [],
    easeOfUse: [],
    visualStyle: "Minimalist, philosophical",
    differentiators: [
      "Digital communication after death",
      "Voice and image preservation"
    ],
    weaknesses: [
      "Very early stage",
      "Limited public information",
      "No proven track record",
      "Unclear pricing/features"
    ],
    status: 'active',
    lastUpdated: "2026-02-24"
  },
  {
    name: "HereAfter AI",
    slug: "hereafter-ai",
    url: "https://www.hereafter.ai/",
    tagline: "The gift of being remembered",
    pricing: {
      notes: "Gift card model. Price varies by gift type."
    },
    features: [
      "Interactive memory app",
      "Voice recording",
      "Gift card delivery",
      "Customized gift experience"
    ],
    targetAudience: [
      "Gift givers (holidays, Mother's/Father's Day)",
      "Families wanting interactive memories"
    ],
    security: [],
    easeOfUse: [
      "Gift card model - no shipping delays",
      "Last-minute purchase friendly"
    ],
    visualStyle: "Gift-focused, emotional, holiday-oriented",
    differentiators: [
      "Gift card delivery model",
      "Interactive memory experience",
      "No shipping delays"
    ],
    weaknesses: [
      "Limited public feature info",
      "Gift-focused (not self-use)",
      "Unclear ongoing costs"
    ],
    status: 'active',
    lastUpdated: "2026-02-24"
  },
  {
    name: "MyFarewelling",
    slug: "myfarewelling",
    url: "https://www.myfarewelling.com/",
    tagline: "Keep Their Memory Alive, Beautifully",
    pricing: {
      free: "Memorial pages free to start",
      oneTime: "$19 funeral planning toolkit",
      notes: "Free memorial pages, paid planning toolkit"
    },
    features: [
      "Memorial page creation",
      "13 themes",
      "Photo gallery",
      "Stories & tributes wall",
      "Virtual candle lighting",
      "Event details sharing",
      "Funeral planning toolkit"
    ],
    targetAudience: [
      "Grieving families",
      "Funeral planners",
      "Memorial gift givers"
    ],
    security: [
      "Pages preserved forever"
    ],
    easeOfUse: [
      "Guided obituary prompts",
      "Real-time preview",
      "Easy family sharing"
    ],
    visualStyle: "Beautiful themes, warm, memorial-focused",
    differentiators: [
      "Free memorial pages",
      "Funeral planning toolkit",
      "Star naming partnership",
      "13 beautiful themes"
    ],
    weaknesses: [
      "Post-death focus only",
      "No living memory capture",
      "No AI features",
      "Limited to memorials"
    ],
    status: 'active',
    lastUpdated: "2026-02-24"
  },
  {
    name: "alivemoment.com",
    slug: "alivemoment",
    url: "https://alivemoment.com/",
    tagline: "AI Photo Animation Tool",
    pricing: {
      notes: "Photo animation service. Not a direct competitor."
    },
    features: [
      "AI photo animation",
      "Bring photos to life"
    ],
    targetAudience: [
      "People wanting to animate old photos"
    ],
    security: [],
    easeOfUse: [
      "No tech skills required",
      "Takes a minute"
    ],
    visualStyle: "Modern, AI-focused",
    differentiators: [
      "Photo animation AI"
    ],
    weaknesses: [
      "Single feature (animation only)",
      "Not a full platform",
      "No story/memory capture"
    ],
    status: 'pivot',
    lastUpdated: "2026-02-24"
  },
  {
    name: "With You App",
    slug: "with-you-app",
    url: "https://www.withyou.app/",
    tagline: "N/A - Domain parked",
    pricing: {},
    features: [],
    targetAudience: [],
    security: [],
    easeOfUse: [],
    visualStyle: "N/A",
    differentiators: [],
    weaknesses: [],
    status: 'parked',
    lastUpdated: "2026-02-24"
  },
  {
    name: "Tales App",
    slug: "tales-app",
    url: "https://www.talesapp.com/",
    tagline: "Unknown - Site blocked",
    pricing: {},
    features: [],
    targetAudience: [],
    security: [],
    easeOfUse: [],
    visualStyle: "Unknown",
    differentiators: [],
    weaknesses: [],
    status: 'unknown',
    lastUpdated: "2026-02-24"
  },
  {
    name: "Legacy Tell",
    slug: "legacy-tell",
    url: "https://legacytell.com/",
    tagline: "Unknown - Site unavailable",
    pricing: {},
    features: [],
    targetAudience: [],
    security: [],
    easeOfUse: [],
    visualStyle: "Unknown",
    differentiators: [],
    weaknesses: [],
    status: 'unknown',
    lastUpdated: "2026-02-24"
  },
  {
    name: "Inalife",
    slug: "inalife",
    url: "https://inalife.com/",
    tagline: "Unknown - Limited content",
    pricing: {},
    features: [],
    targetAudience: [],
    security: [],
    easeOfUse: [],
    visualStyle: "Unknown",
    differentiators: [],
    weaknesses: [],
    status: 'unknown',
    lastUpdated: "2026-02-24"
  }
];

// YoursTruly V2 features for comparison
const YOURSTRULY_V2 = {
  name: "YoursTruly V2",
  tagline: "A life platform for documenting the past, planning the future",
  pricing: {
    notes: "Subscription + marketplace model (TBD)"
  },
  features: [
    "PostScripts - future message delivery",
    "AI Avatar / digital twin",
    "Multi-media memories (photo, video, voice, text)",
    "3D globe map view",
    "Face detection & people grouping",
    "AI categorization",
    "Smart albums",
    "Marketplace integration (Floristone, Printful)",
    "XP/engagement system",
    "Contact management",
    "Event tracking"
  ],
  differentiators: [
    "PostScripts - schedule messages for future delivery",
    "Marketplace - attach physical gifts to messages",
    "AI Avatar - conversational digital legacy",
    "Visual organization - 3D globe, face detection",
    "Comprehensive platform vs single feature"
  ]
};

function generateCompetitorMarkdown(c: Competitor): string {
  const date = new Date().toISOString().split('T')[0];
  
  if (c.status === 'parked' || c.status === 'unknown') {
    return `# ${c.name} - Competitor Analysis

*Analysis Date: ${date}*
*Status: ${c.status.toUpperCase()}*

---

## Overview

| Field | Value |
|-------|-------|
| **Website** | ${c.url} |
| **Status** | ${c.status === 'parked' ? '⚠️ Domain parked/inactive' : '❓ Unknown - site unavailable'} |

---

## Notes

This competitor could not be analyzed as the website is currently ${c.status === 'parked' ? 'parked or inactive' : 'unavailable or blocked'}.

---

*Last checked: ${c.lastUpdated}*
`;
  }

  return `# ${c.name} - Competitor Analysis

*Analysis Date: ${date}*
*Status: ${c.status.toUpperCase()}*

---

## Executive Summary

**${c.name}** - "${c.tagline}"

| Dimension | Details |
|-----------|---------|
| **Website** | ${c.url} |
| **Core Focus** | ${c.features.slice(0, 3).join(', ')} |
| **Target Audience** | ${c.targetAudience.slice(0, 2).join(', ')} |
| **Status** | ✅ Active |

---

## Pricing

${c.pricing.free ? `| **Free Tier** | ${c.pricing.free} |` : ''}
${c.pricing.basic ? `| **Basic** | ${c.pricing.basic} |` : ''}
${c.pricing.premium ? `| **Premium** | ${c.pricing.premium} |` : ''}
${c.pricing.enterprise ? `| **Enterprise** | ${c.pricing.enterprise} |` : ''}
${c.pricing.oneTime ? `| **One-Time** | ${c.pricing.oneTime} |` : ''}

${c.pricing.notes ? `**Notes:** ${c.pricing.notes}` : ''}

---

## Core Features

${c.features.map(f => `- ${f}`).join('\n')}

---

## Target Audience

${c.targetAudience.map(t => `- ${t}`).join('\n')}

---

## Security & Privacy

${c.security.length > 0 ? c.security.map(s => `- ${s}`).join('\n') : '- No specific security messaging found'}

---

## Ease of Use Messaging

${c.easeOfUse.length > 0 ? c.easeOfUse.map(e => `- ${e}`).join('\n') : '- No specific ease of use messaging found'}

---

## Visual Presentation Style

${c.visualStyle}

---

## Unique Differentiators

${c.differentiators.map(d => `- ✨ ${d}`).join('\n')}

---

## Weaknesses vs YoursTruly V2

${c.weaknesses.map(w => `- ❌ ${w}`).join('\n')}

---

## Competitive Position vs YoursTruly V2

### Where ${c.name} Wins:
${c.differentiators.slice(0, 3).map(d => `- ${d}`).join('\n')}

### Where YoursTruly V2 Wins:
- ✅ PostScripts - future message delivery (unique)
- ✅ Marketplace integration with physical gifts
- ✅ AI Avatar / digital twin concept
- ✅ 3D globe map view
- ✅ Comprehensive platform approach

---

*Last updated: ${c.lastUpdated}*
`;
}

function generateComparisonMatrix(): string {
  const date = new Date().toISOString().split('T')[0];
  const activeCompetitors = COMPETITORS.filter(c => c.status === 'active');
  
  return `# YoursTruly V2 - Competitor Comparison Matrix

*Generated: ${date}*

---

## Quick Comparison Table

| Competitor | Price | Voice | Video | Future Msg | AI Avatar | Physical Book | Family Share |
|------------|-------|-------|-------|------------|-----------|---------------|--------------|
| **YoursTruly V2** | TBD | ✅ | ✅ | ✅ | ✅ | ⏳ | ⏳ |
| StoryWorth | $99/yr | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Remento | $84-99/yr | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| HeritageWhisper | $79/yr | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Capsle Stories | Annual | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| Klokbox | Free/$5/mo | ✅ | ✅ | ✅* | ❌ | ❌ | ✅ |
| Eternos | $25-49/mo | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ |
| 23snaps | Free/Paid | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ |
| Turning Hearts | One-time | ❌ | ✅ | ❌ | ❌ | N/A | ✅ |
| MyFarewelling | Free/$19 | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |

*Klokbox has time capsule feature (limited future delivery)

---

## Pricing Comparison

| Competitor | Annual Cost | Model | Free Tier |
|------------|-------------|-------|-----------|
| HeritageWhisper | $79 | Subscription | First 5 stories |
| Remento | $84-99 | Subscription + book | 30-day guarantee |
| StoryWorth | $99 | Subscription + book | 30-day guarantee |
| Capsle Stories | ~$60-80* | Subscription | 14-day trial |
| Klokbox | $60 | Freemium | Yes (ad-supported) |
| Eternos | $300+ | Subscription | No |
| 23snaps | Variable | Freemium | Yes |

*Capsle Stories pricing not publicly listed

---

## Feature Matrix

### Memory Capture

| Feature | YT V2 | Story | Rem | HW | Capsle | Klok | Eternos |
|---------|-------|-------|-----|----|----|------|---------|
| Text input | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Voice recording | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Video recording | ✅ | ❌ | ✅ | ❌ | ✅ | ✅ | ✅ |
| Photo upload | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| AI prompts | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Auto-transcription | ✅ | ✅ | ✅ | ✅ | ? | ❌ | ✅ |

### Organization & Viewing

| Feature | YT V2 | Story | Rem | HW | Capsle | Klok | Eternos |
|---------|-------|-------|-----|----|----|------|---------|
| Timeline view | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 3D Map view | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Face detection | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Smart albums | ✅ | ❌ | ❌ | ❌ | ? | ✅ | ❌ |
| AI categorization | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

### Sharing & Delivery

| Feature | YT V2 | Story | Rem | HW | Capsle | Klok | Eternos |
|---------|-------|-------|-----|----|----|------|---------|
| Family sharing | ⏳ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Real-time sync | ⏳ | ❌ | ❌ | ✅ | ? | ❌ | ❌ |
| Future delivery | ✅ | ❌ | ❌ | ❌ | ❌ | ✅* | ❌ |
| Physical book | ⏳ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Gift marketplace | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

### AI & Digital Legacy

| Feature | YT V2 | Story | Rem | HW | Capsle | Klok | Eternos |
|---------|-------|-------|-----|----|----|------|---------|
| AI Avatar | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Voice synthesis | ⏳ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Chat with deceased | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## Market Positioning Map

\`\`\`
                    COMPREHENSIVE PLATFORM
                           ^
                           |
          Eternos    YoursTruly V2
              •           •
                           |
TECH-FORWARD ----+-------- + ---------> SIMPLE/APPROACHABLE
              |            |
              |    StoryWorth  HeritageWhisper
              |        •           •
              |    Remento •
              |
              |     Capsle •  Klokbox •
              |
                           |
                    SINGLE FEATURE
\`\`\`

---

## Competitive Landscape Summary

### Tier 1: Established Players (5+ years)
- **StoryWorth** - Market leader, 1M+ books, email-based, book focus
- **23snaps** - Photo sharing focus, European market

### Tier 2: Growing Challengers
- **Remento** - Voice-first, Shark Tank boost, competing with StoryWorth
- **HeritageWhisper** - Voice + instant sharing, cheaper than StoryWorth

### Tier 3: Niche/Emerging
- **Capsle Stories** - Mobile-first, video focus
- **Klokbox** - Freemium, photo organization
- **Eternos** - AI digital twin, premium pricing

### Tier 4: Adjacent/Memorial
- **Turning Hearts** - Post-death memorial only
- **MyFarewelling** - Memorial pages + funeral planning

---

## YoursTruly V2 Unique Advantages

### 1. PostScripts (Future Message Delivery)
**No competitor offers this.** Schedule messages for:
- Future birthdays
- Anniversaries  
- "After I'm gone" delivery
- Milestone events

### 2. Marketplace Integration
**Unique to YT.** Attach physical gifts:
- Flowers (Floristone)
- Print-on-demand keepsakes
- Dropship products

### 3. AI Avatar Concept
Only Eternos competes here, but at $300+/year. YT can offer at lower price point.

### 4. Visual Organization
- 3D Mapbox globe
- Face detection grouping
- AWS Rekognition categorization

---

## Strategic Recommendations

### Positioning
> **"Don't just preserve the past. Deliver it to the future."**

### Primary Competitive Advantage
**PostScripts + Marketplace** = Messages that arrive with gifts at exactly the right moment.

### Pricing Strategy
- Match HeritageWhisper at ~$79/year for base
- Premium tier with more PostScript credits
- Marketplace commission as additional revenue

### Feature Priority
1. ✅ PostScripts (unique - protect)
2. ⏳ Real-time family sharing (parity)
3. ⏳ Physical book export (parity)
4. ⏳ AI Avatar (differentiation)

---

*Generated by competitor-compare.ts on ${date}*
`;
}

function generateDashboardData(): object {
  const activeCompetitors = COMPETITORS.filter(c => c.status === 'active');
  
  return {
    generatedAt: new Date().toISOString(),
    totalCompetitors: COMPETITORS.length,
    activeCompetitors: activeCompetitors.length,
    competitors: COMPETITORS.map(c => ({
      name: c.name,
      slug: c.slug,
      url: c.url,
      status: c.status,
      pricing: c.pricing,
      featureCount: c.features.length,
      hasVoice: c.features.some(f => f.toLowerCase().includes('voice')),
      hasVideo: c.features.some(f => f.toLowerCase().includes('video')),
      hasAI: c.features.some(f => f.toLowerCase().includes('ai')),
      hasBook: c.features.some(f => f.toLowerCase().includes('book')),
      differentiatorCount: c.differentiators.length,
      weaknessCount: c.weaknesses.length,
      lastUpdated: c.lastUpdated
    })),
    ytAdvantages: YOURSTRULY_V2.differentiators,
    marketInsights: {
      averagePrice: "$79-99/year",
      commonFeatures: [
        "Voice recording",
        "Photo upload", 
        "Family sharing",
        "Weekly prompts"
      ],
      gapsInMarket: [
        "Future message delivery",
        "Gift marketplace integration",
        "AI avatar at affordable price",
        "Real-time collaboration"
      ]
    }
  };
}

// Main execution
const args = process.argv.slice(2);
const command = args[0] || 'all';

const DOCS_DIR = path.join(__dirname, '..', 'docs', 'competitors');
const date = new Date().toISOString().split('T')[0];

// Ensure directory exists
if (!fs.existsSync(DOCS_DIR)) {
  fs.mkdirSync(DOCS_DIR, { recursive: true });
}

console.log(`🔍 YoursTruly V2 Competitor Comparison Tool`);
console.log(`📅 Date: ${date}`);
console.log(`📁 Output: ${DOCS_DIR}`);
console.log(`---`);

switch (command) {
  case 'fetch':
  case 'all':
    console.log(`\n📝 Generating individual competitor files...`);
    COMPETITORS.forEach(c => {
      const filepath = path.join(DOCS_DIR, `${c.slug}.md`);
      const content = generateCompetitorMarkdown(c);
      fs.writeFileSync(filepath, content);
      console.log(`  ✓ ${c.name} -> ${c.slug}.md`);
    });
    
    if (command === 'fetch') break;
    // Fall through for 'all'
    
  case 'compare':
    console.log(`\n📊 Generating comparison matrix...`);
    const matrix = generateComparisonMatrix();
    fs.writeFileSync(path.join(DOCS_DIR, 'COMPARISON_MATRIX.md'), matrix);
    console.log(`  ✓ COMPARISON_MATRIX.md`);
    
    if (command === 'compare') break;
    
  case 'dashboard':
    console.log(`\n📈 Generating dashboard data...`);
    const dashboard = generateDashboardData();
    fs.writeFileSync(
      path.join(DOCS_DIR, `dashboard-${date}.json`), 
      JSON.stringify(dashboard, null, 2)
    );
    fs.writeFileSync(
      path.join(DOCS_DIR, 'dashboard-latest.json'), 
      JSON.stringify(dashboard, null, 2)
    );
    console.log(`  ✓ dashboard-${date}.json`);
    console.log(`  ✓ dashboard-latest.json`);
    break;
    
  case 'report':
    console.log(`\n📋 Summary Report`);
    console.log(`\nActive Competitors: ${COMPETITORS.filter(c => c.status === 'active').length}`);
    console.log(`Inactive/Unknown: ${COMPETITORS.filter(c => c.status !== 'active').length}`);
    console.log(`\nTop Threats:`);
    console.log(`  1. StoryWorth - Market leader, brand trust`);
    console.log(`  2. Remento - Shark Tank exposure, voice-first`);
    console.log(`  3. HeritageWhisper - Price leader, instant sharing`);
    console.log(`\nYT V2 Unique Advantages:`);
    YOURSTRULY_V2.differentiators.forEach((d, i) => {
      console.log(`  ${i + 1}. ${d}`);
    });
    break;
    
  default:
    console.log(`
Usage: npx ts-node tools/competitor-compare.ts [command]

Commands:
  fetch      Generate individual competitor markdown files
  compare    Generate comparison matrix
  dashboard  Generate dashboard JSON data
  report     Print summary report
  all        Run all commands (default)
`);
}

console.log(`\n✅ Done!`);
