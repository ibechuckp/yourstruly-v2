# YoursTruly V2 — Development Roadmap

> **Vision**: A life platform for documenting the past, planning the future, and staying connected across generations.

---

## 🎯 Core Features

1. **Async Video Journalist** — Capture family stories remotely
2. **AI Avatar** — Digital version of yourself for loved ones
3. **Smart Life Documentation** — Timeline, albums, memories
4. **PostScripts** — Future messages and gifts
5. **Collaboration** — Shared memories, group planning
6. **Trip Planning + AI Deals** — Bucket list adventures

---

## 📦 Tech Stack

| Layer | Technology | Why |
|-------|------------|-----|
| Frontend | Next.js 14 | App router, React Server Components |
| Database | Supabase (Postgres) | Auth, realtime, storage built-in |
| AI | OpenAI + Whisper | Chat, transcription |
| Video | Twilio | SMS prompts, video calls |
| Maps | Mapbox | Globe visualization |
| Payments | Stripe | Subscriptions |
| Storage | Supabase Storage / S3 | Media files |

---

# 🚀 PHASES

## Phase 1: Foundation ✅ COMPLETE
**Goal**: Core app with user profiles and life data capture

### Deliverables
- [x] Next.js app with Supabase auth
- [x] User onboarding flow (login/signup)
- [x] Profile dashboard with all life fields:
  - Basic info (name, DOB, gender, location)
  - Personality traits
  - Interests & skills
  - Personal motto / credo
  - Life goals
  - Religions / beliefs
- [x] Contacts management (add/remove in modal)
- [x] Relationship types
- [x] Glassmorphic UI with scenic backgrounds
- [x] Mobile responsive design
- [x] Avatar upload to Supabase Storage
- [ ] Pet profiles (scaffolded, not fully built)

### Completed: 2026-02-19

---

## Phase 2: Memories & Timeline (Week 3-4)
**Goal**: Smart photo/video storage with timeline view

### Deliverables
- [ ] Memory/Event creation
- [ ] Photo/video upload to Supabase Storage
- [ ] Date, location, people tagging
- [ ] Timeline view (chronological)
- [ ] Mapbox globe view (memories on map)
- [ ] Basic smart albums:
  - By person (manual tag)
  - By location
  - By year
- [ ] Gallery grid view

### Testable
✅ Upload 10 photos → Tag people/locations → View on timeline → View on globe

---

## Phase 3: Async Video Journalist (Week 5-7)
**Goal**: Send questions, capture video responses remotely

### Deliverables
- [ ] Question bank (suggested + custom)
- [ ] Send question to contact (SMS via Twilio)
- [ ] Contact receives link → records video response
- [ ] Video stored and linked to contact
- [ ] Whisper transcription (async job)
- [ ] Topic extraction from transcript
- [ ] Interview history per contact
- [ ] Suggested follow-up questions (AI)

### Testable
✅ Send question to your phone → Record response → See transcribed video in app

---

## Phase 4: AI Avatar (Week 8-9)
**Goal**: Chat with a digital version of yourself/loved one

### Deliverables
- [ ] Extended personality questionnaire
- [ ] Knowledge base builder:
  - Import from profile data
  - Import from video transcripts
  - Manual stories/facts
- [ ] Chat interface
- [ ] Avatar responds in user's "voice"
- [ ] Memory of conversations
- [ ] Optional: Voice synthesis (ElevenLabs)

### Testable
✅ Complete questionnaire → Add 5 stories → Chat with your avatar → It knows your info

---

## Phase 5: PostScripts + Gifts (Week 10-11)
**Goal**: Schedule messages AND gifts for the future

### Deliverables
- [ ] Create future message (text, video, audio)
- [ ] Set delivery date/trigger:
  - Specific date
  - Birthday
  - Anniversary
  - Custom milestone
- [ ] Multiple recipients
- [ ] Attach memories/photos
- [ ] **Gift marketplace**:
  - Browse curated gifts
  - Physical gifts (flowers, merchandise)
  - Digital gifts (gift cards, subscriptions)
  - Custom gift requests
- [ ] Gift scheduling with message
- [ ] Delivery via email/SMS
- [ ] Recipient view (beautiful reveal + gift claim)
- [ ] Order tracking

### Testable
✅ Schedule message + gift for tomorrow → Receive it → Claim gift

---

## Phase 6: Collaboration (Week 12-13)
**Goal**: Shared memories and group efforts

### Deliverables
- [ ] Shared memory albums
- [ ] Invite collaborators
- [ ] Contribution requests:
  - "Add your photos from Mom's 70th"
  - Link to upload directly
- [ ] Activity feed (who added what)
- [ ] Group celebration planning:
  - Surprise milestone events
  - Everyone contributes secretly
  - Reveal to honoree
- [ ] Comments on memories

### Testable
✅ Create shared album → Send invite → Collaborator uploads → See in your app

---

## Phase 7: Smart AI Features (Week 14-15)
**Goal**: AI-powered organization and insights

### Deliverables
- [ ] Face detection (auto-tag people)
- [ ] Auto-location from EXIF
- [ ] AI topic categorization:
  - Travel, Family, Career, Milestones, Pets, Holidays
- [ ] "On This Day" memories
- [ ] AI-generated memory summaries
- [ ] Life story auto-generation

### Testable
✅ Upload photos → AI tags faces/topics → Browse by smart category

---

## Phase 8: Bucket List & Trip Planning (Week 16-18)
**Goal**: Plan adventures together with AI assistance + crowdfunding

### Deliverables
- [ ] Personal bucket list
- [ ] Shared bucket lists
- [ ] Trip workspace:
  - Destination picker
  - Date range
  - Invite travelers
- [ ] AI deal finder:
  - Flight search (Skyscanner API)
  - Hotel search
  - Price alerts
- [ ] Collaborative itinerary
- [ ] **Trip crowdfunding**:
  - Set trip goal amount
  - Invite contributors (family, friends)
  - Everyone sends money toward goal
  - Progress tracker
  - Thank you messages to contributors
  - Stripe Connect for payouts
- [ ] Budget tracking / splitting
- [ ] Convert trip → memories after

### Testable
✅ Create "Family Japan Trip" → Set $5000 goal → Share link → Friends contribute → Hit goal

---

## Phase 9: Polish & Launch (Week 19-22)
**Goal**: Production ready

### Deliverables
- [ ] Mobile responsive (PWA)
- [ ] Email notifications
- [ ] Subscription tiers (Stripe)
- [ ] Onboarding tutorial
- [ ] Data export
- [ ] Privacy controls
- [ ] Performance optimization
- [ ] Security audit

---

# 📊 Summary

| Phase | Name | Duration | Key Testable |
|-------|------|----------|--------------|
| 1 | Foundation | 2 weeks | Profile + Contacts |
| 2 | Memories | 2 weeks | Timeline + Globe |
| 3 | Video Journalist | 3 weeks | Send question → Get video |
| 4 | AI Avatar | 2 weeks | Chat with yourself |
| 5 | PostScripts + Gifts | 2 weeks | Future message + gift delivery |
| 6 | Collaboration | 2 weeks | Shared albums |
| 7 | Smart AI | 2 weeks | Auto-tagging |
| 8 | Trip Planning + Crowdfunding | 3 weeks | AI deals + group funding |
| 9 | Polish | 4 weeks | Launch ready |

**Total: ~22 weeks (5.5 months) to full platform**

---

# 🏃 Quick Start (Phase 1)

```bash
# Clone and setup
git clone https://github.com/ibechuckp/yourstruly-v2
cd yourstruly-v2
npm install

# Configure
cp .env.example .env.local
# Add your Supabase keys

# Run
npm run dev
```

---

*Last updated: 2026-02-19*
