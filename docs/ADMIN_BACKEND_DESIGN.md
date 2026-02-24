# YoursTruly V2 - Admin Backend Design Document

> **Version:** 1.0  
> **Date:** 2026-02-24  
> **Status:** Design Phase  

## Executive Summary

Comprehensive admin backend for YoursTruly V2, covering user management, analytics, marketplace, AI configuration, engagement tiles, content moderation, and system settings.

---

## 1. Feature Matrix

### 1.1 User Management
| Feature | Priority | Description |
|---------|----------|-------------|
| User Listing | P0 | Paginated list with search, filter by plan/status/date |
| User Detail View | P0 | Profile, activity timeline, subscriptions |
| Impersonation | P1 | View-as-user for debugging |
| Account Actions | P0 | Suspend, delete, reset password, upgrade/downgrade |
| User Segments | P2 | Cohort creation and management |
| Export Users | P1 | CSV/JSON export |

### 1.2 Analytics
| Feature | Priority | Description |
|---------|----------|-------------|
| Real-time Activity | P1 | Live feed of logins, actions, errors |
| Usage Metrics | P0 | DAU/MAU, retention, feature usage |
| Engagement Metrics | P0 | Tiles completed, XP, streaks |
| Funnel Analysis | P1 | Signup → Onboarding → Active → Paid |
| Revenue Metrics | P0 | MRR, churn, LTV |

### 1.3 Subscription & Billing
| Feature | Priority | Description |
|---------|----------|-------------|
| Plan Management | P0 | Create/edit pricing tiers |
| Subscriber List | P0 | Filter by status, plan |
| Coupon Management | P1 | Promo codes, usage limits |
| Stripe Integration | P0 | Webhook status, sync |

### 1.4 Marketplace
| Feature | Priority | Description |
|---------|----------|-------------|
| Product Catalog | P0 | Add/edit/disable products |
| Provider Settings | P0 | API keys for Prodigi, Spocket, Floristone |
| Category Management | P0 | Product categories |
| Order Tracking | P0 | View orders, fulfillment status |
| Markup Settings | P0 | Margin percentages |

### 1.5 AI Configuration
| Feature | Priority | Description |
|---------|----------|-------------|
| System Prompts | P0 | Manage prompts per conversation type |
| Model Selection | P0 | GPT-4, Claude, Gemini per use case |
| Temperature/Tokens | P0 | Creativity vs consistency |
| RAG Settings | P0 | Embedding model, chunk size, retrieval params |
| Voice Clone | P0 | ElevenLabs config, usage limits |

### 1.6 Engagement Tiles
| Feature | Priority | Description |
|---------|----------|-------------|
| Prompt Templates | P0 | CRUD for questions |
| Category Config | P0 | Prompt types and categories |
| XP Values | P0 | Rewards per tile type |
| Scheduling Rules | P0 | Frequency, priority |
| Seasonal Prompts | P1 | Time-based activation |

### 1.7 Content Moderation
| Feature | Priority | Description |
|---------|----------|-------------|
| Flagged Queue | P0 | Review reported content |
| Auto-Moderation | P0 | AWS Rekognition filters |
| User Reports | P0 | View and resolve reports |

### 1.8 System Settings
| Feature | Priority | Description |
|---------|----------|-------------|
| Feature Flags | P0 | Enable/disable features |
| Maintenance Mode | P0 | Toggle with custom message |
| Email Templates | P0 | Transactional emails |
| Storage Quotas | P0 | Limits by plan |

---

## 2. Database Schema

### Admin Users & Audit
```sql
CREATE TYPE admin_role AS ENUM ('super_admin', 'admin', 'support', 'billing', 'content_moderator', 'readonly');

CREATE TABLE admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  role admin_role NOT NULL DEFAULT 'support',
  permissions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admin_users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Feature Flags
```sql
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  enabled BOOLEAN DEFAULT false,
  targeting_type TEXT DEFAULT 'global',
  targeting_config JSONB DEFAULT '{}',
  rollout_percentage INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### System Settings
```sql
CREATE TABLE system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  category TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### AI Configuration
```sql
CREATE TABLE ai_model_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  use_case TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  temperature DECIMAL(3,2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 2000,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false
);

CREATE TABLE system_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  use_case TEXT NOT NULL,
  name TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true
);
```

### Analytics
```sql
CREATE TABLE daily_analytics (
  date DATE PRIMARY KEY,
  total_users INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  active_users_dau INTEGER DEFAULT 0,
  mrr_cents INTEGER DEFAULT 0,
  memories_created INTEGER DEFAULT 0,
  engagement_prompts_answered INTEGER DEFAULT 0
);

CREATE TABLE user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  activity_type TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 3. API Routes

### Authentication
```
POST /api/admin/auth/login
POST /api/admin/auth/logout
GET  /api/admin/auth/me
```

### Users
```
GET    /api/admin/users
GET    /api/admin/users/:id
PUT    /api/admin/users/:id
POST   /api/admin/users/:id/suspend
POST   /api/admin/users/:id/impersonate
POST   /api/admin/users/export
```

### Analytics
```
GET /api/admin/analytics/dashboard
GET /api/admin/analytics/users
GET /api/admin/analytics/retention
GET /api/admin/analytics/engagement
GET /api/admin/analytics/revenue
```

### Billing
```
GET/POST /api/admin/billing/plans
GET/POST /api/admin/billing/coupons
GET      /api/admin/billing/subscriptions
```

### Marketplace
```
GET/POST/PUT /api/admin/marketplace/products
GET/PUT      /api/admin/marketplace/providers
GET          /api/admin/marketplace/orders
```

### AI Config
```
GET/POST/PUT /api/admin/ai/models
GET/POST/PUT /api/admin/ai/prompts
GET/PUT      /api/admin/ai/rag
GET/PUT      /api/admin/ai/voice
```

### Engagement
```
GET/POST/PUT/DELETE /api/admin/engagement/prompts
GET/PUT             /api/admin/engagement/config
GET/POST            /api/admin/engagement/seasonal
```

### Moderation
```
GET      /api/admin/moderation/queue
PUT      /api/admin/moderation/queue/:id
GET/POST /api/admin/moderation/rules
```

### Settings
```
GET/PUT /api/admin/settings/feature-flags
GET/PUT /api/admin/settings/system
GET/PUT /api/admin/settings/email-templates
```

---

## 4. UI Structure

### Admin Layout
```
/admin
  /dashboard          - Key metrics, quick actions
  /users              - User list, detail, actions
  /analytics          - Charts, funnels, exports
  /billing            - Plans, subscriptions, coupons
  /marketplace        - Products, orders, providers
  /ai                 - Models, prompts, RAG, voice
  /engagement         - Prompt templates, config
  /moderation         - Flagged content queue
  /settings           - Feature flags, system config
```

### Tech Stack
- **Data Tables**: TanStack Table (sorting, filtering, pagination)
- **Charts**: Recharts (line, bar, pie, area)
- **Forms**: React Hook Form + Zod
- **Date Picker**: react-day-picker
- **Code Editor**: Monaco (for prompts/templates)

---

## 5. Implementation Phases

### Phase 1 - Foundation (Week 1-2)
- [ ] Admin auth + role system
- [ ] Audit logging
- [ ] Basic user management
- [ ] Admin layout/navigation

### Phase 2 - Core Features (Week 3-4)
- [ ] Analytics dashboard
- [ ] Engagement prompt CRUD
- [ ] Feature flags
- [ ] System settings

### Phase 3 - Business (Week 5-6)
- [ ] Billing/subscription management
- [ ] Marketplace admin
- [ ] AI configuration

### Phase 4 - Advanced (Week 7-8)
- [ ] Content moderation
- [ ] User segments
- [ ] Advanced analytics
- [ ] Export capabilities

---

## 6. Security

- **Authentication**: Separate admin auth with MFA option
- **Authorization**: Role-based with granular permissions
- **Audit Trail**: All actions logged with admin ID, timestamp, IP
- **Impersonation**: Requires super_admin, fully logged
- **Rate Limiting**: Stricter limits on admin endpoints
- **Session Management**: Short expiry, single session
