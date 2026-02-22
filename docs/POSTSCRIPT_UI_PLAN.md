# PostScript UI Implementation Plan

*Created: 2026-02-22*

## Overview

PostScripts are scheduled future messages — the core differentiator of YoursTruly. Users can schedule messages, videos, and attachments to be delivered to loved ones at specific dates or life events.

## V2 Schema (Already Exists)

```sql
postscripts (
  id, user_id, recipient_contact_id, recipient_name, recipient_email, recipient_phone,
  title, message, video_url,
  delivery_type ('date' | 'event' | 'after_passing'),
  delivery_date, delivery_event, delivery_recurring,
  requires_confirmation, confirmation_contacts[],
  has_gift, gift_type, gift_details, gift_budget,
  status ('draft' | 'scheduled' | 'sent' | 'opened'),
  sent_at, opened_at, created_at, updated_at
)

postscript_attachments (
  id, postscript_id, file_url, file_key, file_type, file_name, file_size
)
```

## Pages to Create

### 1. `/dashboard/postscripts` - List View
- **Hero**: "Future Messages" with warm coral accent
- **Stats cards**: Total scheduled, Delivered, Opened rate
- **Filter tabs**: All | Scheduled | Drafts | Sent
- **PostScript cards**:
  - Recipient avatar + name
  - Title
  - Delivery date/event badge
  - Status indicator
  - Quick actions (edit, preview, delete)
- **FAB**: "Create PostScript" button

### 2. `/dashboard/postscripts/new` - Creation Wizard
Multi-step wizard (mobile-friendly):

**Step 1: Recipient**
- Select from contacts or enter new
- Recipient name, email (required for delivery)
- Optional phone

**Step 2: Occasion**
- Pre-defined events (Birthday, Wedding, Graduation, etc.)
- Specific date picker
- "After I'm gone" toggle (requires_confirmation)
- Recurring option

**Step 3: Message**
- Title input
- Rich text message area
- Video recording option (use existing VoiceRecorder adapted)
- Attach memories from library
- Attach photos

**Step 4: Review & Schedule**
- Full preview
- Reminder to self option
- Schedule button

### 3. `/dashboard/postscripts/[id]` - Detail/Edit View
- Edit all fields
- Preview exactly as recipient will see
- Delete confirmation
- Resend if already sent

### 4. `/postscript/[token]` - Recipient View (Public)
- Beautiful reveal experience
- Video playback
- Message display
- Attached memories/photos
- "Mark as opened" tracking

## Components to Create

```
src/components/postscripts/
├── PostScriptCard.tsx        # List item card
├── PostScriptWizard.tsx      # Multi-step creation
├── RecipientSelector.tsx     # Contact picker or manual entry
├── OccasionPicker.tsx        # Event/date selection
├── MessageComposer.tsx       # Message + video + attachments
├── PostScriptPreview.tsx     # Preview modal
└── RecipientView.tsx         # Public recipient experience
```

## API Routes to Create

```
src/app/api/postscripts/
├── route.ts                  # GET (list), POST (create)
├── [id]/route.ts             # GET, PUT, DELETE
├── [id]/send/route.ts        # POST - trigger delivery
└── public/[token]/route.ts   # GET - public recipient view
```

## Design System Alignment

- **Primary color**: Coral `#C35F33` (PostScripts are special)
- **Cards**: `bg-white/90 backdrop-blur-sm rounded-3xl`
- **Background**: Warm `#F2F1E5` with organic blobs
- **Icons**: Lucide - Send, Calendar, Heart, Mail

## Event Categories (from V1)

1. **Personal Events**: Birthday, Anniversary, Graduation, Wedding, First Child
2. **Life Milestones**: 18th birthday, 21st birthday, Retirement
3. **Support Messages**: Tough times, When you're proud of yourself
4. **Legacy**: After I'm gone (requires confirmation flow)

## Implementation Order

1. ✅ Schema exists
2. [ ] API routes (list, create, get, update, delete)
3. [ ] List page `/dashboard/postscripts`
4. [ ] Creation wizard `/dashboard/postscripts/new`
5. [ ] Detail/edit page `/dashboard/postscripts/[id]`
6. [ ] Public recipient view `/postscript/[token]`
7. [ ] Email delivery integration (Phase 2)

## Phase 1 Scope (MVP)

- Create, view, edit, delete PostScripts
- Schedule by date
- Text message + video
- Attach photos
- List view with filtering
- Basic preview

## Phase 2 (Later)

- Email delivery
- "After passing" confirmation flow
- Gift integration
- Memory attachments
- Recurring messages
- Analytics (open tracking)
