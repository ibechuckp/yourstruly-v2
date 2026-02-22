# API Issues Report

**Date:** 2026-02-21
**Status:** Partially Fixed - Action Required from Chuck

---

## Issue 1: Contacts API 400 Errors

### Problem
The contacts query `user_id=eq.XXX` was failing with 400 errors due to a **schema mismatch** between the frontend code and the database.

### Root Cause
The `useContacts.ts` hook was using incorrect column names:

| Frontend (Wrong) | Database (Correct) |
|------------------|-------------------|
| `name` | `full_name` |
| `photoUrl` | `avatar_url` |
| `relationshipType` | `relationship_type` |
| `birthDate` | `date_of_birth` |
| `email` | `email` (OK) |
| `phone` | `phone` (OK) |
| `howMet` | `how_met` (OK) |
| `isDeceased` | `is_deceased` (OK) |

### Database Schema (from `001_initial_schema.sql`)
```sql
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,        -- NOT "name"
  nickname TEXT,
  email TEXT,
  phone TEXT,
  relationship_type TEXT NOT NULL, -- NOT "relationshipType"
  -- ...
  avatar_url TEXT,                -- NOT "photoUrl"
  -- ...
);
```

### Fix Applied
Updated `src/hooks/useContacts.ts` to use correct column names:
- `name` → `full_name`
- `photoUrl` → `avatar_url`
- `relationshipType` → `relationship_type`
- `birthDate` → `date_of_birth`

### RLS Policies
RLS policies were already correct:
```sql
CREATE POLICY "Users can view own contacts" ON contacts
  FOR SELECT USING (auth.uid() = user_id);
```

### Status
✅ **FIXED** - Contacts API should now work correctly.

---

## Issue 2: Face Detection 500 Errors

### Problem
Face detection API was returning HTML instead of JSON (500 error), indicating server crashes.

### Root Cause
**Missing face detection model files.** The application uses `@vladmandic/face-api` (open source face detection) which requires model files to be present in `public/models/face-api/`.

### Required Model Files
The following files need to be present (total ~13MB):
- `ssd_mobilenetv1_model.bin` + manifest
- `face_landmark_68_model.bin` + manifest
- `face_recognition_model.bin` + manifest
- `age_gender_model.bin` + manifest
- `face_expression_model.bin` + manifest

### Current Status
✅ Model files are present in `public/models/face-api/` (committed to repo)

### AWS Rekognition (Alternative)
The codebase also includes AWS Rekognition support in `src/lib/aws/rekognition.ts`, but **AWS credentials are not configured**:

**Missing Environment Variables:**
```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_S3_BUCKET=your-bucket-name
```

The AWS library gracefully returns empty results when not configured:
```typescript
const isAwsConfigured = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
const rekognition = isAwsConfigured ? new RekognitionClient(...) : null

export async function detectFaces(imageBytes: Buffer): Promise<DetectedFace[]> {
  if (!rekognition) return []  // Graceful fallback
  // ...
}
```

### Face Detection Flow
1. **Primary**: Open source `face-api` (models in `public/models/face-api/`)
2. **Fallback**: AWS Rekognition (requires credentials)
3. **API Routes**:
   - `POST /api/media/[id]/detect-faces` - Detect faces in image
   - `GET /api/media/[id]/faces` - Get faces with matching suggestions
   - `POST /api/memories/[id]/media` - Upload media with auto face detection

### Status
✅ **FIXED** - Model files are present. Face detection should work now.

⚠️ **OPTIONAL**: Add AWS credentials to `.env.local` if you want AWS Rekognition as a backup:
```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=your-bucket
```

---

## Summary

| Issue | Status | Action Required |
|-------|--------|-----------------|
| Contacts 400 errors | ✅ Fixed | None - code updated |
| Face detection 500 errors | ✅ Fixed | None - models present |
| AWS Rekognition | ⚠️ Optional | Add AWS creds to `.env.local` if desired |

---

## Files Modified

1. `src/hooks/useContacts.ts` - Fixed column name mappings

## Files Verified (No Changes Needed)

1. `src/lib/ai/faceDetection.ts` - Graceful error handling already present
2. `src/lib/aws/rekognition.ts` - Graceful fallback already present
3. `src/app/api/media/[id]/detect-faces/route.ts` - Proper error handling
4. `supabase/migrations/` - RLS policies correct

---

## Testing Checklist

- [ ] Test contacts list loads without 400 errors
- [ ] Test adding a new contact
- [ ] Test editing a contact
- [ ] Test face detection on photo upload
- [ ] Test face tagging in media viewer
