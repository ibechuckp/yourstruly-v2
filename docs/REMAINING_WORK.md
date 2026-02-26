# YoursTruly V2 - Remaining Work & Required APIs

*Updated: 2026-02-25*

## 🔴 Critical (Pre-Launch)

### Database
- [ ] Verify all migrations applied cleanly

### Subscriptions
- [ ] Test subscription checkout flow end-to-end
- [ ] Set up Stripe webhook endpoint (post-deployment)
- [ ] Test seat management (invite, accept, remove)
- [ ] Verify storage limits work with subscription tiers

### Core Features
- [ ] Fix live transcription (Deepgram integration)
- [ ] Fix live conversations playback
- [ ] Test group interviews end-to-end
- [ ] Test recent activity feed
- [ ] Test photobook builder end-to-end

---

## 🟡 Required APIs

### 1. **Deepgram** - Live Transcription
- **Purpose:** Real-time speech-to-text for interviews
- **Status:** Integrated but needs testing
- **Env var:** `DEEPGRAM_API_KEY`
- **Pricing:** Pay-per-minute (~$0.0043/min)
- **Docs:** https://developers.deepgram.com/

### 2. **ElevenLabs** - Text-to-Speech
- **Purpose:** Voice cloning, AI narration for slideshows
- **Status:** Not integrated
- **Env var:** `ELEVENLABS_API_KEY`
- **Pricing:** $5/mo starter (30k chars), $22/mo creator
- **Docs:** https://elevenlabs.io/docs

### 3. **Prodigi** - Print Products
- **Purpose:** Photobook printing, calendars, gifts
- **Status:** Client integrated, needs end-to-end testing
- **Env vars:** 
  - `PRODIGI_API_KEY` (sandbox)
  - `PRODIGI_API_KEY_LIVE` (production)
- **Pricing:** Cost + 30% markup model
- **Docs:** https://www.prodigi.com/print-api/

### 4. **Florist One** - Flower Delivery
- **Purpose:** Send flowers as gifts/condolences
- **Status:** Not integrated
- **Env var:** `FLORIST_ONE_API_KEY`
- **Pricing:** Affiliate commission model
- **Docs:** https://www.floristone.com/affiliate-program

### 5. **Spocket** - Dropship Gifts
- **Purpose:** Gift marketplace (mugs, blankets, etc.)
- **Status:** Not integrated
- **Env var:** `SPOCKET_API_KEY`
- **Pricing:** Wholesale + markup
- **Docs:** https://www.spocket.co/integrations

### 6. **Stripe** - Payments ✅
- **Purpose:** Subscriptions, marketplace checkout
- **Status:** Integrated
- **Env vars:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- **IDs (Live):**
  - Product: `prod_U2rXLfgtPvpmfE`
  - Monthly: `price_1T4lnyH94XbyUkwA9PV0uiIz`
  - Annual: `price_1T4ltlH94XbyUkwABUSWR6f7`

### 7. **Gemini** - AI Features ✅
- **Purpose:** Image analysis, mood detection, smart tags
- **Status:** Integrated
- **Env var:** `GEMINI_API_KEY`

### 8. **Supabase** - Backend ✅
- **Purpose:** Database, auth, storage
- **Status:** Fully integrated

---

## 🟢 Feature Status

### ✅ Complete
- Dashboard layout & brand design
- Admin portal (all phases)
- Interview system with transcription
- Subscription types, components, pages
- Photobook builder UI
- Slideshow with video export
- Seat management system
- Marketplace cart/checkout UI
- Group interviews
- Memory cards view
- Emergency contacts
- Mood tags (with negative moods)
- Smart Tags (renamed from AI Insights)
- Capsule → Album rename
- User albums in Gallery

### 🔄 In Progress
- Live transcription testing
- Subscription flow testing
- Photobook end-to-end

### ⏳ Not Started
- ElevenLabs voice clone integration
- Florist One integration
- Spocket dropship integration
- Voice messages feature
- Death certificate verification flow

---

## 📊 Testing Checklist

### Interviews
- [ ] Single person interview flow
- [ ] Group interview creation
- [ ] Group interview participation (external link)
- [ ] Live transcription during recording
- [ ] Conversation playback
- [ ] Save to memories

### Subscriptions
- [ ] Free tier limitations work
- [ ] Premium checkout flow
- [ ] Seat addition/removal
- [ ] Stripe webhook handling
- [ ] Storage limit enforcement

### Photobook
- [ ] Template selection
- [ ] Photo picker modal
- [ ] Text editing persistence
- [ ] Preview generation
- [ ] Prodigi order submission
- [ ] Order status tracking

### Activity Feed
- [ ] New memory notifications
- [ ] Shared memory activity
- [ ] Comment notifications
- [ ] Contribution notifications

---


## 📝 Post-Launch Tasks

1. Stripe webhook endpoint setup
2. Production API keys for all services
3. Monitor error rates
4. User feedback collection
5. Performance optimization
6. Mobile responsiveness polish
