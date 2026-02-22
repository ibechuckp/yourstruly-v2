# YoursTruly Feature Gap Analysis: V1 (Laravel) → V2 (Next.js)

*Generated: 2026-02-22*
*Updated: 2026-02-22 — Removed Day Of, Healthcare, and Assets from V2 scope*

This document comprehensively lists features in the original YoursTruly Laravel application that are **NOT yet implemented** in the V2 Next.js rebuild.

---

## Executive Summary

| Category | V1 Features | V2 Implemented | Gap | In Scope |
|----------|-------------|----------------|-----|----------|
| User Profiles & Onboarding | 15+ | ~10 | ~5 | ✅ |
| AI & Chatbot | 5 | 1 (basic) | 4 | ✅ |
| Memories & Events | 12 | 8 | 4 | ✅ |
| Contacts | 10 | 6 | 4 | ✅ |
| PostScripts (Future Messages) | 15+ | 3 (schema only) | 12+ | ✅ **PRIORITY** |
| Subscriptions & Payments | 8 | 3 (basic) | 5 | ✅ |
| Marketplace | 20+ | 0 | 20+ | ⏸️ Phase 2 |
| "Day Of" (End of Life Planning) | 25+ | 0 | 25+ | ❌ **OUT OF SCOPE** |
| Healthcare/Medical | 8 | 0 | 8 | ❌ **OUT OF SCOPE** |
| Assets/Belongings | 15 | 0 | 15 | ❌ **OUT OF SCOPE** |
| Bucket List | 8 | 0 | 8 | ⏸️ Phase 2 |
| Social Features | 12 | 2 | 10 | ✅ |
| Admin (Nova) | 30+ | 0 | 30+ | ⏸️ Phase 2 |
| **V2 SCOPE TOTAL** | **~75** | **~33** | **~42** | |

---

## 🔴 CRITICAL GAPS (Core Value Proposition)

### 1. PostScripts System (Future Messages & Gifts)
**V1 Implementation:** Full-featured scheduled message system with gifts

**Missing in V2:**
- [ ] PostScript creation wizard (multi-step form)
- [ ] Scheduled message delivery (date-based, event-based, "after passing")
- [ ] Multiple recipients per PostScript
- [ ] Video/audio recording for PostScripts
- [ ] Photo/memory attachment to PostScripts
- [ ] PostScript gift marketplace integration
- [ ] PostScript plans/packages (tiered pricing)
- [ ] Gift checkout flow with product selection
- [ ] Email delivery system with beautiful templates
- [ ] Recipient view ("open your message" experience)
- [ ] PostScript reminders (send preview to self before delivery)
- [ ] "Show Received" - inbox for received PostScripts
- [ ] PostScript payment history
- [ ] Recurring PostScripts (annual birthday messages, etc.)
- [ ] Delivery confirmation tracking
- [ ] Contact-specific PostScript grouping

**V2 Status:** Schema exists (`postscripts` table) but no UI or API implementation.

---

### 2. AI Chat / Digital Avatar
**V1 Implementation:** React-based AI chat with personality modeling

**Missing in V2:**
- [ ] AI Chat interface (full conversation UI)
- [ ] Personality extraction from user data
- [ ] Knowledge base builder (from memories, events, profile)
- [ ] Chat with "digital version of yourself"
- [ ] Conversation memory/history
- [ ] Onboarding questions for AI training
- [ ] AI-generated responses in user's "voice"

**V2 Status:** Basic `/api/ai/chat` endpoint exists but no user-facing chat UI. Engagement prompts exist but aren't the same as conversational AI.

---

### ~~3. "Day Of" - End of Life Planning~~ ❌ OUT OF SCOPE
> **Decision (2026-02-22):** Removed from V2 scope. Not a differentiator for initial launch.

---

### ~~4. Healthcare & Medical Directives~~ ❌ OUT OF SCOPE  
> **Decision (2026-02-22):** Removed from V2 scope. Complex compliance requirements, not needed for MVP.

---

### ~~5. Assets & Belongings (Estate Planning)~~ ❌ OUT OF SCOPE
> **Decision (2026-02-22):** Removed from V2 scope. Feature can be added post-launch if needed.

---

## 🟠 MAJOR GAPS (Important Features)

### 6. Marketplace
**V1 Implementation:** Full e-commerce platform

**Entirely Missing in V2:**
- [ ] Product catalog (funeral goods, gifts, etc.)
- [ ] Product categories with hierarchy
- [ ] Shopping cart
- [ ] Checkout flow
- [ ] Payment processing (Stripe integration for purchases)
- [ ] Order management
- [ ] Order history/tracking
- [ ] Doba integration (dropshipping)
- [ ] Floristone integration (flowers)
- [ ] Printful integration (print products)
- [ ] Custom products
- [ ] "Our Offers" / deals section
- [ ] Best offers showcase
- [ ] Last viewed products
- [ ] Favorite products
- [ ] Product search
- [ ] Product filtering (price, color, size, etc.)
- [ ] Trending services
- [ ] Coupons/discounts
- [ ] News subscription for deals

**V2 Status:** Not implemented. No schema.

---

### 7. Bucket List System
**V1 Implementation:** Full bucket list with categories and wishes

**Missing in V2:**
- [ ] Bucket list management
- [ ] Bucket list categories (custom)
- [ ] Wish creation (title, description, due date)
- [ ] Wish completion tracking
- [ ] Wish priority
- [ ] Wish sharing with contacts
- [ ] "Add to my list" from suggestions
- [ ] Wish media attachments
- [ ] Integration with trip planning (future)

**V2 Status:** Not implemented. No schema.

---

### 8. Social Sharing & Collaboration
**V1 Implementation:** Comprehensive sharing system

**Missing in V2:**
- [ ] Memory sharing with specific contacts
- [ ] Event sharing with contacts
- [ ] Knowledge sharing
- [ ] Social media share cards (Facebook, Twitter)
- [ ] Dynamic OG image generation for shared links
- [ ] Share statistics tracking
- [ ] Shared album contributions
- [ ] Family member invitation system (beyond basic invite)
- [ ] Premium seat management (share subscription)
- [ ] Contribution requests ("add your photos")
- [ ] Activity feed (who added what)
- [ ] Comments on shared items

**V2 Status:** Basic `/api/memories/[id]/share` endpoint exists. No UI.

---

### 9. Subscriptions & Premium Features
**V1 Implementation:** Full Stripe Cashier integration

**Missing in V2:**
- [ ] Subscription trial management
- [ ] Grace period handling
- [ ] Multiple subscription tiers (enforced limits)
- [ ] Payment method management (add/remove cards)
- [ ] Premium seats (invite family to your plan)
- [ ] Seat invitation flow
- [ ] Subscription pause/resume
- [ ] Yearly trial tracking
- [ ] PostScript credit balance
- [ ] Storage quota enforcement
- [ ] Feature gating by plan

**V2 Status:** Basic schema exists. Stripe checkout/portal endpoints exist but aren't fully integrated.

---

### 10. Daily Prompts / Engagement System
**V1 Implementation:** Rotating daily prompts with XP rewards

**Partially Implemented in V2:**
- [x] Engagement prompts exist
- [x] Multiple prompt types
- [ ] XP reward system (schema exists, not functional)
- [ ] Prompt rotation/skip functionality
- [ ] "Hide prompt for 50 days" feature
- [ ] Prompt categories
- [ ] Admin prompt management
- [ ] Prompt scheduling
- [ ] Completion statistics

**V2 Status:** Engagement bubbles exist with basic prompt display. Missing gamification elements.

---

## 🟡 MODERATE GAPS

### 11. Memories & Events (Existing but Incomplete)
**V1 Additional Features Missing:**
- [ ] Memory categories (admin-defined)
- [ ] Event categories (admin-defined)
- [ ] Shared memory viewing (other user's memories)
- [ ] Memory/event duplication
- [ ] Bulk media upload
- [ ] Media reordering
- [ ] Full-screen preview mode
- [ ] Print to PDF
- [ ] Memory blocks (structured sections within a memory)

**V2 Status:** Core memories/events work. Missing some UX enhancements.

---

### 12. Knowledge / Wisdom (MySelf)
**V1 Implementation:** "MySelf" section for life wisdom

**Partially Implemented in V2:**
- [x] Basic wisdom/knowledge entries exist
- [x] Knowledge videos schema
- [ ] Knowledge categories
- [ ] Knowledge sharing
- [ ] "Shared with me" knowledge view
- [ ] Rich text editor for knowledge
- [ ] Knowledge search
- [ ] Featured knowledge

**V2 Status:** Basic wisdom pages exist. Missing categorization and sharing.

---

### 13. Contacts (Existing but Incomplete)
**V1 Additional Features Missing:**
- [ ] Google Contacts import (OAuth flow exists in V1)
- [ ] Facebook friends import
- [ ] Contact verification status
- [ ] Emergency contact designation
- [ ] Contact notes
- [ ] Contact document uploads
- [ ] Address book export
- [ ] Contact merge/dedup
- [ ] Contact communication preferences

**V2 Status:** Basic CRUD works. Missing import features.

---

### 14. Media & Gallery Features
**V1 Additional Features Missing:**
- [ ] Gallery map view (location-based)
- [ ] Gallery people view (face-grouped)
- [ ] Video recording in-browser
- [ ] Audio recording in-browser
- [ ] Media download (original quality)
- [ ] Media usage bar (storage quota visualization)
- [ ] Media organization (drag-drop albums)
- [ ] EXIF data extraction and display
- [ ] Media compression options

**V2 Status:** Basic gallery exists. Face detection exists. Missing map and organization features.

---

### 15. User Profile (Existing but Incomplete)
**V1 Additional Features Missing:**
- [ ] Background image customization (carousel)
- [ ] Custom background image upload
- [ ] 2FA (Google Authenticator)
- [ ] Account deletion workflow (soft delete with restore)
- [ ] Data export (GDPR compliance)
- [ ] Email preferences management
- [ ] Notification preferences
- [ ] Language/locale settings
- [ ] Timezone settings
- [ ] Theme selection (user themes)

**V2 Status:** Profile page exists. Missing personalization and security features.

---

## 🟢 MINOR GAPS / POLISH ITEMS

### 16. Blog / Content
**V1 Implementation:** Blog with posts and categories
- [ ] Blog post listing
- [ ] Blog post detail
- [ ] Blog categories
- [ ] Blog author
- [ ] Blog search

**V2 Status:** Not implemented (low priority).

---

### 17. Presentation Site
**V1 Implementation:** Public marketing pages
- [ ] How It Works page
- [ ] Features page
- [ ] About Us page
- [ ] Pricing page (public)
- [ ] Contact form
- [ ] Privacy policy
- [ ] Terms and conditions

**V2 Status:** Landing page exists. Missing marketing pages.

---

### 18. Admin Panel (Nova)
**V1 Implementation:** Full Laravel Nova admin

**Entirely Missing in V2:**
- [ ] User management
- [ ] Content moderation
- [ ] Product management
- [ ] Category management
- [ ] Order management
- [ ] Daily prompt management
- [ ] Theme management
- [ ] Subscription management
- [ ] Metrics/dashboards
- [ ] Email template management
- [ ] System settings

**V2 Status:** No admin panel.

---

### 19. Global Search
**V1 Implementation:** Unified search across all content

**Missing in V2:**
- [ ] Global search bar
- [ ] Search across memories, events, contacts, knowledge
- [ ] Search results grouping
- [ ] Recent searches
- [ ] Search suggestions

**V2 Status:** AI search endpoint exists but no global search UI.

---

### 20. Email System
**V1 Implementation:** Transactional and marketing emails

**Missing in V2:**
- [ ] PostScript delivery emails
- [ ] Invitation emails
- [ ] Reminder emails
- [ ] Welcome email sequence
- [ ] PostScript reminder previews
- [ ] Death notification emails
- [ ] Mailjet integration (or alternative)

**V2 Status:** No email sending implemented.

---

## Priority Recommendations (Updated 2026-02-22)

### Phase 1 (Immediate - Core Value) 🎯 CURRENT FOCUS
1. **PostScripts UI** - This is the core differentiator ⬅️ **STARTING NOW**
2. **AI Chat Interface** - Key feature for digital legacy
3. **Subscription Enforcement** - Monetization

### Phase 2 (Near-term)
4. **Social Sharing** - Growth driver
5. **Bucket List** - Engagement feature
6. **Enhanced Profiles** - Personalization

### Phase 3 (Medium-term)
7. **Marketplace** - Revenue diversification  
8. **Admin Panel** - Operations
9. **Email System** - Engagement

### ~~Phase 4~~ REMOVED FROM SCOPE
- ~~Day Of Planning~~ ❌
- ~~Healthcare Directives~~ ❌
- ~~Assets/Estate Planning~~ ❌

---

## Technical Notes

### External Integrations Needed
| Service | V1 Usage | V2 Status |
|---------|----------|-----------|
| Stripe (Subscriptions) | Cashier | Basic endpoints |
| Stripe (Checkout) | Full | Basic |
| Google OAuth | Contacts import | Not implemented |
| Facebook OAuth | Login/import | Not implemented |
| Mailjet | Emails | Not implemented |
| Twilio | SMS | Not implemented |
| Doba | Dropshipping | Not implemented |
| Floristone | Flowers | Not implemented |
| Printful | Print products | Not implemented |
| AWS Rekognition | Face detection | Implemented ✓ |

### Database Schema Comparison
| V1 Tables | V2 Tables | Notes |
|-----------|-----------|-------|
| ~100 tables | ~25 tables | Major gap |
| Spatie Media Library | Supabase Storage | Different approach |
| MySQL | PostgreSQL | Compatible |
| Eloquent | Supabase Client | Different ORM |

---

*This document should be updated as features are implemented in V2.*
