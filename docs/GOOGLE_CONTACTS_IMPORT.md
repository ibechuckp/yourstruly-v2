# Google Contacts Import Feature

This feature allows users to import their Google Contacts into YoursTruly V2.

## Overview

The Google Contacts import flow consists of:
1. OAuth 2.0 authentication with Google (PKCE flow)
2. Fetching contacts from Google People API
3. Selecting which contacts to import
4. Saving contacts to Supabase with avatar uploads

## Files Created

### 1. OAuth Library
- `src/lib/oauth/google.ts` - Google OAuth 2.0 flow implementation
  - PKCE code generation
  - Token exchange
  - Contact fetching from Google People API
  - Contact normalization

### 2. API Routes
- `src/app/api/contacts/import/google/route.ts` - API endpoints
  - `GET`: Initiates OAuth flow or handles callback
  - `POST`: Saves selected contacts to database

### 3. React Component
- `src/components/contacts/GoogleContactsImport.tsx` - Import UI component
  - OAuth popup handling
  - Contact selection interface
  - Duplicate detection
  - Progress indicators

### 4. OAuth Callback Page
- `src/app/auth/google-callback/page.tsx` - Handles popup callback
  - Receives authorization code from Google
  - Posts message to parent window

### 5. Integration
- Updated `src/app/(dashboard)/dashboard/contacts/page.tsx`
  - Added import button next to "Add Contact"

## Environment Variables

Add these to your `.env.local`:

```bash
# Google OAuth - Required for Google Contacts Import
# Get these from Google Cloud Console:
# 1. Go to https://console.cloud.google.com/
# 2. Create/select project
# 3. Enable Google People API
# 4. Create OAuth 2.0 credentials (Web application type)
# 5. Add redirect URI: http://localhost:3000/auth/google-callback
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

## Google Cloud Console Setup

1. **Create Project**
   - Go to https://console.cloud.google.com/
   - Create a new project or select existing

2. **Enable API**
   - Navigate to "APIs & Services" > "Library"
   - Search for "People API" and click "Enable"

3. **Configure OAuth Consent Screen**
   - Go to "APIs & Services" > "OAuth consent screen"
   - Select user type: "External" (or "Internal" for Google Workspace)
   - Fill in required fields:
     - App name: "YoursTruly"
     - User support email
     - Developer contact email
   - Add scopes:
     - `https://www.googleapis.com/auth/contacts.readonly`
     - `https://www.googleapis.com/auth/userinfo.email`
     - `https://www.googleapis.com/auth/userinfo.profile`
   - Add test users (required while in testing mode)
   - Save and continue

4. **Create Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Select "Web application"
   - Add authorized redirect URIs:
     - Development: `http://localhost:3000/auth/google-callback`
     - Production: `https://yourdomain.com/auth/google-callback`
   - Click "Create"
   - Copy the Client ID and Client Secret

5. **Update Environment**
   - Add Client ID and Secret to `.env.local`
   - Restart the development server

## Data Mapping

Google Contact fields are mapped to YoursTruly contacts table:

| Google Field | YoursTruly Field |
|--------------|------------------|
| `names[0].displayName` | `full_name` |
| `names[0].givenName` | (stored in metadata) |
| `names[0].familyName` | (stored in metadata) |
| `emailAddresses[0].value` | `email` |
| `phoneNumbers[0].value` | `phone` |
| `photos[0].url` | `avatar_url` (downloaded & uploaded to Supabase) |
| `addresses[0].formattedValue` | `address` |
| `addresses[0].city` | `city` |
| `addresses[0].region` | `state` |
| `addresses[0].country` | `country` |
| `addresses[0].postalCode` | `zipcode` |
| `birthdays[0].date` | `date_of_birth` |
| `organizations[0].name` | (stored in metadata) |
| `organizations[0].title` | (stored in metadata) |
| `biographies[0].value` | `notes` |

## User Flow

1. User clicks "Import from Google" button on Contacts page
2. Popup window opens to Google OAuth consent screen
3. User authorizes access to contacts
4. Popup redirects to callback page which posts code to parent
5. Parent window calls API to exchange code for access token
6. API fetches all contacts from Google People API
7. Contacts are normalized and displayed for selection
8. User selects contacts and chooses default relationship
9. API saves selected contacts to Supabase
10. Avatars are downloaded from Google and uploaded to Supabase Storage

## Security Considerations

- **PKCE Flow**: Uses PKCE (Proof Key for Code Exchange) for secure OAuth
- **Minimal Scopes**: Only requests `contacts.readonly` scope
- **No Token Storage**: Access tokens are used immediately and not stored
- **State Parameter**: CSRF protection via state parameter
- **Origin Check**: PostMessage includes origin verification
- **Duplicate Detection**: Checks against existing contacts by email/phone

## Rate Limits

Google People API rate limits:
- 90 read requests per minute per user
- 60 write requests per minute per user

The import implements:
- Pagination (100 contacts per page)
- Maximum 10 pages (1000 contacts) to prevent timeouts
- Batch inserts (50 contacts at a time)

## Error Handling

The feature handles:
- OAuth errors (user denied, invalid scope)
- Network failures
- Invalid tokens
- Missing environment variables (shows setup instructions)
- Duplicate contacts (marked in UI)
- Avatar download failures (gracefully continues)

## Future Improvements

Potential enhancements:
- Real-time import progress for large contact lists
- Better duplicate detection (fuzzy matching)
- Automatic relationship detection from contact groups
- Support for importing contact groups/labels
- Microsoft Outlook contacts import
- vCard file upload as fallback
