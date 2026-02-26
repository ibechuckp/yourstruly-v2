# Contact Import API Research

*Research Date: February 26, 2026*

## Executive Summary

This document analyzes contact import options for YoursTruly V2. **Google Contacts** is the clear winner for first implementation—it offers the best data access, reasonable rate limits, and mature SDKs. **Microsoft/Outlook** is a solid second choice. **Apple** has no web API for contacts. **Facebook** deprecated friend access in 2018 and is essentially unusable for this purpose.

---

## 1. Google Contacts (People API)

### Overview
Google People API is the modern replacement for the deprecated Contacts API (sunset January 2022). It provides full read/write access to a user's Google Contacts.

### API Details

| Property | Value |
|----------|-------|
| **API Name** | Google People API |
| **Base URL** | `https://people.googleapis.com/v1/` |
| **Auth** | OAuth 2.0 |
| **Documentation** | https://developers.google.com/people |

### Key Endpoints

```
GET /people/me                        # Get authenticated user info
GET /people/{resourceName}            # Get specific person
GET /people/me/connections            # List all contacts (paginated)
GET /people:batchGet                  # Batch get multiple contacts
```

### OAuth Scopes

| Scope | Access Level |
|-------|--------------|
| `https://www.googleapis.com/auth/contacts.readonly` | **Read-only contacts** (recommended) |
| `https://www.googleapis.com/auth/contacts` | Read/write contacts |
| `https://www.googleapis.com/auth/contacts.other.readonly` | "Other contacts" (people you've emailed) |
| `https://www.googleapis.com/auth/userinfo.email` | User's email address |
| `https://www.googleapis.com/auth/userinfo.profile` | Basic profile info |

**Recommended for YT:** `contacts.readonly` + `userinfo.email` + `userinfo.profile`

### Available Data Fields

Using `personFields` parameter, we can request:

| Field | Description |
|-------|-------------|
| `names` | Full name, given/family names |
| `emailAddresses` | All email addresses |
| `phoneNumbers` | All phone numbers |
| `photos` | Profile photos (URLs) |
| `addresses` | Physical addresses |
| `birthdays` | Birthday |
| `organizations` | Company, job title |
| `biographies` | Notes |
| `relations` | Relationships (spouse, etc.) |

### Rate Limits

| Limit Type | Value |
|------------|-------|
| Read requests | 90 queries/minute per user |
| Write requests | 60 queries/minute per user |
| Full sync (first page) | Additional quota check (429 if exceeded) |
| Daily quota | Configurable in Cloud Console |

### Ease of Implementation: ⭐⭐⭐⭐⭐ (Excellent)

**Pros:**
- Mature, well-documented API
- Official client libraries for JS, Python, Go, Java, PHP
- Excellent OAuth flow integration
- No app review required for basic scopes
- Can paginate through thousands of contacts

**Cons:**
- Requires Google Cloud Console setup
- Sensitive scope review for publishing (but not for limited users)

### Code Example (TypeScript)

```typescript
import { google } from 'googleapis';

const people = google.people({ version: 'v1', auth: oauth2Client });

const response = await people.people.connections.list({
  resourceName: 'people/me',
  pageSize: 100,
  personFields: 'names,emailAddresses,phoneNumbers,photos',
});

const contacts = response.data.connections?.map(person => ({
  name: person.names?.[0]?.displayName,
  email: person.emailAddresses?.[0]?.value,
  phone: person.phoneNumbers?.[0]?.value,
  photo: person.photos?.[0]?.url,
}));
```

---

## 2. Microsoft/Outlook Contacts (Graph API)

### Overview
Microsoft Graph API provides access to Outlook.com and Microsoft 365 contacts. Works with both personal Microsoft accounts and work/school accounts.

### API Details

| Property | Value |
|----------|-------|
| **API Name** | Microsoft Graph API |
| **Base URL** | `https://graph.microsoft.com/v1.0/` |
| **Auth** | OAuth 2.0 (Microsoft Identity Platform) |
| **Documentation** | https://learn.microsoft.com/en-us/graph/ |

### Key Endpoints

```
GET /me/contacts                      # List all contacts
GET /me/contacts/{id}                 # Get specific contact
GET /me/contacts/{id}/photo/$value    # Get contact photo
GET /me/contactFolders                # List contact folders
```

### OAuth Scopes

| Scope | Access Level |
|-------|--------------|
| `Contacts.Read` | **Read-only contacts** (recommended) |
| `Contacts.ReadWrite` | Read/write contacts |
| `User.Read` | Basic profile (always include) |

**Recommended for YT:** `Contacts.Read` + `User.Read`

### Available Data Fields

| Field | Description |
|-------|-------------|
| `displayName` | Full display name |
| `givenName`, `surname` | First/last name |
| `emailAddresses[]` | Array of emails |
| `businessPhones[]` | Business phone numbers |
| `homePhones[]` | Home phone numbers |
| `mobilePhone` | Mobile number |
| `photo` | Profile photo (relationship) |
| `homeAddress`, `businessAddress` | Addresses |
| `birthday` | Birthday |
| `companyName`, `jobTitle` | Work info |

### Rate Limits

| Limit Type | Value |
|------------|-------|
| Personal accounts | **60 requests/minute** per app |
| Work/school accounts | Higher limits (varies by tenant size) |
| Global limit | 130,000 requests/10 seconds per app |

**Note:** Personal Microsoft account limits are stricter than work accounts.

### Ease of Implementation: ⭐⭐⭐⭐ (Good)

**Pros:**
- Well-documented, official SDKs available
- Works with both personal and work accounts
- No app review for basic scopes
- Rich contact data including photos

**Cons:**
- Microsoft Identity Platform setup is more complex than Google
- Lower rate limits for personal accounts
- Two different sign-in audiences to handle (personal vs work)

### Code Example (TypeScript)

```typescript
import { Client } from '@microsoft/microsoft-graph-client';

const client = Client.init({
  authProvider: (done) => done(null, accessToken),
});

const response = await client
  .api('/me/contacts')
  .select('displayName,emailAddresses,mobilePhone,businessPhones,homePhones')
  .top(100)
  .get();

const contacts = response.value.map((contact: any) => ({
  name: contact.displayName,
  email: contact.emailAddresses?.[0]?.address,
  phone: contact.mobilePhone || contact.businessPhones?.[0],
}));
```

---

## 3. Apple Contacts (CloudKit / Sign in with Apple)

### Overview
**⚠️ Apple does NOT provide a web API for accessing user contacts.**

### The Reality

| Method | Can Access Contacts? |
|--------|---------------------|
| Sign in with Apple | ❌ No - Only provides email (possibly hidden relay) |
| CloudKit JS | ❌ No - Can only access YOUR app's CloudKit data |
| iCloud Web Services | ❌ No - No public API |
| Native iOS App | ✅ Yes - But requires App Store app |

### Sign in with Apple Data

Sign in with Apple only provides:
- User ID (unique per app)
- Email (or private relay email like `xyz@privaterelay.appleid.com`)
- Full name (only on first sign-in, user can decline)

**There is no OAuth scope or API to access a user's iCloud contacts from a web application.**

### Workarounds (Not Recommended)

1. **Native iOS App:** Build an iOS app that reads contacts with `CNContactStore` and syncs to your server
2. **vCard Export:** Ask users to export contacts as .vcf file and upload
3. **CardDAV Direct Access:** Would require user's iCloud password (security nightmare)

### Ease of Implementation: ❌ (Not Possible)

Apple deliberately restricts contact access to native apps to protect user privacy. This is by design and unlikely to change.

### Recommendation

**Skip Apple Contacts for MVP.** Consider:
- Implementing Sign in with Apple for authentication only
- Offering manual contact upload via vCard file
- Building a native iOS companion app later if demand exists

---

## 4. Facebook Contacts (Graph API)

### Overview
**⚠️ Facebook deprecated friend/contact access in 2018.** The API is essentially useless for contact import.

### Historical Context

In April 2018, following the Cambridge Analytica scandal, Facebook severely restricted the Graph API:

| Before 2018 | After 2018 |
|-------------|------------|
| `/me/friends` returned all friends | Only returns friends who also use your app |
| Could access friend emails | No email access whatsoever |
| Could access friend phone numbers | No phone access |
| Could access friend list for invites | Only mutual app users |

### Current API State

```
GET /me/friends
```

**Returns:** Only friends who have ALSO authorized your specific app.

For a new app, this means `/me/friends` returns **empty** because no one else has installed it yet.

### Available Data (Extremely Limited)

| Data | Accessible? |
|------|-------------|
| User's own email | ✅ Yes (with `email` scope) |
| User's own name | ✅ Yes |
| User's own profile photo | ✅ Yes |
| Friend list | ❌ Only friends who use your app |
| Friend emails | ❌ No |
| Friend phone numbers | ❌ No |
| "Contacts" (phone contacts synced to FB) | ❌ No API access |

### Current Scopes

| Scope | What It Does |
|-------|--------------|
| `email` | User's own email |
| `public_profile` | User's name, profile pic |
| `user_friends` | **DEPRECATED** - Only shows mutual app users |

### Ease of Implementation: ❌ (Not Useful)

Even if implemented, it provides zero value for contact import. The only contacts you'd get are people who already have your app.

### Recommendation

**Do not implement Facebook contact import.** It's technically impossible to get useful data. Instead:
- Use Facebook Login for authentication only (if desired)
- Don't mislead users by showing a "Import from Facebook" option

---

## Comparison Matrix

| Feature | Google | Microsoft | Apple | Facebook |
|---------|--------|-----------|-------|----------|
| **Web API Available** | ✅ Yes | ✅ Yes | ❌ No | ⚠️ Useless |
| **Read Contacts** | ✅ Full access | ✅ Full access | ❌ N/A | ❌ Only mutual users |
| **Names** | ✅ | ✅ | ❌ | ❌ |
| **Emails** | ✅ | ✅ | ❌ | ❌ |
| **Phone Numbers** | ✅ | ✅ | ❌ | ❌ |
| **Photos** | ✅ | ✅ | ❌ | ❌ |
| **Rate Limits** | Good | Moderate | N/A | N/A |
| **SDK Quality** | Excellent | Good | N/A | N/A |
| **Setup Complexity** | Low | Medium | N/A | N/A |
| **User Base** | Huge | Large | Huge (but no API) | Irrelevant |

---

## Recommendations for YoursTruly V2

### Priority Order

1. **🥇 Google Contacts (Implement First)**
   - Largest addressable user base (Gmail users)
   - Best API, documentation, and SDKs
   - Full data access (name, email, phone, photo)
   - Reasonable rate limits
   - Implementation time: ~1-2 days

2. **🥈 Microsoft/Outlook Contacts (Implement Second)**
   - Captures Outlook.com and corporate users
   - Similar data access to Google
   - Slightly more complex auth setup
   - Implementation time: ~2-3 days

3. **🥉 Manual vCard Upload (Consider for MVP)**
   - Works for any contact source (iPhone, Android, Outlook desktop)
   - No OAuth complexity
   - Users export .vcf from their device and upload
   - Implementation time: ~0.5-1 day

4. **❌ Apple Contacts - Skip**
   - No web API exists
   - Would require native iOS app
   - Consider for future native app roadmap

5. **❌ Facebook Contacts - Skip**
   - API is deprecated and useless
   - Would confuse/frustrate users
   - Don't waste time implementing

### Implementation Notes

#### Security Considerations
- Store OAuth tokens encrypted
- Request minimum scopes needed
- Implement token refresh properly
- Log access for compliance

#### UX Recommendations
- Clear explanation of what data will be accessed
- Show preview before import
- Allow users to select specific contacts
- Handle duplicate detection
- Provide undo/delete imported contacts

#### Privacy Compliance
- GDPR: Get explicit consent, allow deletion
- CCPA: Similar requirements
- Store minimal data needed
- Document data retention policy

---

## Technical Implementation Plan

### Phase 1: Google Contacts (Week 1)
1. Set up Google Cloud Console project
2. Configure OAuth consent screen
3. Implement OAuth flow with PKCE
4. Build contact sync service
5. Create import UI with preview
6. Handle pagination for large contact lists
7. Implement duplicate detection

### Phase 2: Microsoft Contacts (Week 2)
1. Register app in Azure AD
2. Configure Microsoft Identity Platform
3. Implement OAuth flow (slightly different from Google)
4. Adapt contact sync service for Graph API
5. Test with both personal and work accounts
6. Handle rate limit differences

### Phase 3: Polish & vCard (Week 3)
1. Add vCard file upload option
2. Parse .vcf files (use vcard-parser library)
3. Unified contact matching across sources
4. Bulk import UI improvements
5. Error handling and retry logic

---

## Appendix: Library Recommendations

### Google People API
```bash
npm install googleapis
# or
npm install @google-cloud/local-auth  # For simpler auth
```

### Microsoft Graph API
```bash
npm install @microsoft/microsoft-graph-client
npm install @azure/msal-browser  # For auth
```

### vCard Parsing
```bash
npm install vcard-parser
# or
npm install ical.js  # More robust, handles edge cases
```

---

*Document created for YoursTruly V2 contact import feature planning.*
