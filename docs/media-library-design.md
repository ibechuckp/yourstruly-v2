# YoursTruly Media Library & Smart Albums

## The Vision
Users have thousands of photos cluttering their phones. YoursTruly becomes their **photo organizer + meaning maker**:

1. **Dump** — Bulk upload photos/videos from phone
2. **Auto-organize** — We extract metadata, recognize faces, create smart albums
3. **Prompt for context** — AI asks about photos to earn XP
4. **Create memories** — Turn organized photos into meaningful stories

---

## Core Concepts

### Media Library
The raw storage layer. Every photo/video uploaded lives here first.

**Auto-extracted data:**
- EXIF: timestamp, location (GPS), camera info
- Face detection: bounding boxes, face IDs
- AI analysis: scene type, objects, mood

### Smart Albums (Auto-generated)
Albums created automatically based on:

| Type | Example | Logic |
|------|---------|-------|
| **Time** | "Summer 2023", "February 2024" | Group by month/season |
| **Location** | "Photos from Paris", "Home" | Cluster by GPS coords |
| **People** | "Photos with Mom", "Emma" | Face recognition groups |
| **Events** | "Emma's Birthday 2024" | Time + location + people combo |
| **Uncategorized** | "Needs context" | No faces, no location, old timestamps |

### Backstory
The context layer. Each photo can have:
- **Caption**: Quick description
- **Full backstory**: Who, what, when, why
- **Tagged people**: Link to contacts
- **Mood/emotion**: How you felt
- **Why it matters**: Significance

---

## XP Rewards (Photo-related)

| Action | XP | Notes |
|--------|-----|-------|
| Upload photo | 2 | Max 50/day |
| Add caption | 5 | Short description |
| Add full backstory | 15 | Detailed context |
| Tag person in photo | 5 | Link to contact |
| Confirm AI face match | 3 | "Yes, that's Mom" |
| Create memory from photos | 25 | Turn photos into story |
| Complete contact profile | 50 | Name+email+phone+DOB+relation |

### Contact Completion Bonus
Full contact = 50 XP bonus when ALL filled:
- ✓ Full name
- ✓ Email OR Phone
- ✓ Relationship type
- ✓ Date of birth
- ✓ Address (city at minimum)

---

## User Flow

### 1. Bulk Upload
```
[Phone Gallery] → [Select 100+ photos] → [Upload to YT]
                                              ↓
                                    [Processing queue]
                                              ↓
                         [Extract EXIF] [Detect Faces] [AI Analyze]
                                              ↓
                                    [Smart Albums Created]
```

### 2. Review & Earn XP
```
AI: "I found 23 photos from what looks like a birthday party 
     on March 15, 2024 in Raleigh. I see Emma and Jennifer.
     
     Want to tell me about this day?"
     
     [Add Context +15 XP] [Skip for now]
```

### 3. Create Memory
```
User selects photos from Smart Album
        ↓
[Create Memory] → Opens memory editor with photos pre-attached
        ↓
AI: "Based on these photos, here's a draft:
     'Emma's 6th Birthday - March 2024'
     
     Emma turned 6! We had her party at..."
```

---

## Database Schema

### media_items (raw uploads)
```sql
- id, user_id
- file_url, file_key, file_type, mime_type
- file_size, width, height, duration (video)
- taken_at (from EXIF or upload time)
- location_lat, location_lng, location_name
- exif_data (JSONB)
- processing_status: pending|processing|complete|failed
- created_at
```

### media_faces (detected faces)
```sql
- id, media_id, user_id
- face_embedding (vector for matching)
- bounding_box (JSONB: x, y, width, height)
- contact_id (NULL until confirmed)
- confidence (0-1)
- confirmed_by_user (boolean)
```

### face_clusters (grouped faces)
```sql
- id, user_id
- contact_id (once identified)
- representative_face_id
- face_count
- name (user-provided or from contact)
```

### smart_albums
```sql
- id, user_id
- album_type: time|location|people|event|uncategorized
- title, description
- cover_media_id
- auto_generated (boolean)
- criteria (JSONB: date_range, location, face_cluster_ids)
- media_count
- created_at
```

### smart_album_items
```sql
- album_id, media_id
- added_at
```

### media_backstories
```sql
- id, media_id, user_id
- caption (short)
- backstory (long)
- mood
- significance
- xp_awarded
- created_at
```

---

## AI Prompts for Context

### Photo with faces, no backstory
> "I found this photo of you with [Emma] and [Jennifer] from [March 2024] in [Raleigh]. What was happening here?"

### Group of similar photos
> "You have 15 photos from what looks like the same event. Want to create a memory from these?"

### Old photo with no metadata
> "This photo doesn't have a date. Do you remember when it was taken? Even a rough year helps!"

### Location cluster
> "You have 47 photos from Paris! Was this a trip? Tell me about it."

---

## Processing Pipeline

### On Upload
1. Store file in S3/Supabase Storage
2. Queue for processing
3. Extract EXIF metadata
4. Run face detection (AWS Rekognition or local model)
5. Run scene analysis (optional)
6. Match faces to existing clusters
7. Add to relevant smart albums
8. Notify user: "23 new photos organized into 3 albums"

### Nightly Job
1. Re-cluster faces (improve groupings)
2. Generate new smart albums for recent uploads
3. Find photos needing context → queue AI prompts
4. Clean up orphaned data

---

## Phase 1 Implementation
1. ✅ Basic media upload (already have memory_media)
2. Schema for media_items (separate from memories)
3. EXIF extraction on upload
4. Basic smart albums by date
5. "Add backstory" prompt in UI

## Phase 2
1. Face detection integration
2. Face clustering
3. People-based smart albums
4. AI context prompts

## Phase 3
1. Location clustering
2. Event detection
3. Memory suggestions
4. Bulk operations
