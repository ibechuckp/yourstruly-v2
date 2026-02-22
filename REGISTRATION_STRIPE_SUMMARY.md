# YoursTruly v2 - User Registration & Stripe Integration

## Summary

I've built a complete user registration flow with Stripe subscription integration for YoursTruly v2.

## What Was Created

### 1. User Registration Flow

**Auth Pages** (matching homepage glassmorphism styling):
- `/login` - Sign in page with email/password
- `/signup` - Registration with password strength indicator and terms
- `/forgot-password` - Password reset request
- `/reset-password` - New password entry (requires auth code)
- `/verify-email` - Email verification pending page
- `/auth/callback` - OAuth/email verification callback handler
- `/onboarding` - 3-step onboarding (name, photo, date of birth)

**Features:**
- Styled with `home.css` glassmorphism design
- Password visibility toggle
- Password strength indicator
- Terms of Service & Privacy Policy checkboxes
- Form validation and error handling
- Progress indicator on onboarding
- Photo upload with preview

### 2. Stripe Integration

**Installed Packages:**
- `@stripe/stripe-js` - Client-side Stripe
- `stripe` - Server-side Stripe

**Files Created:**
- `src/lib/stripe.ts` - Stripe client initialization, helpers, and price formatting
- `src/app/api/webhooks/stripe/route.ts` - Webhook handler for Stripe events
- `src/app/api/stripe/create-checkout-session/route.ts` - Creates checkout sessions
- `src/app/api/stripe/create-portal-session/route.ts` - Creates billing portal sessions
- `src/app/api/subscription/status/route.ts` - Gets current subscription status

**Webhook Events Handled:**
- `checkout.session.completed` - Creates subscription record
- `customer.subscription.updated` - Updates subscription status
- `customer.subscription.deleted` - Marks as canceled
- `invoice.payment_failed` - Marks as past_due
- `customer.subscription.trial_will_end` - Trial ending notification

### 3. Database Schema

**Migration:** `supabase/migrations/028_subscriptions.sql`

**New Tables:**
- `plans` - Subscription tiers (Free, Pro, Family)
- `subscriptions` - User subscription records with Stripe IDs

**Modified Tables:**
- `profiles` - Added `stripe_customer_id`, `subscription_status`, `current_plan_id`

**Placeholder Plans:**
| Plan | Monthly | Yearly | Key Features |
|------|---------|--------|--------------|
| Free | $0 | - | 50 memories, 1GB, 3 AI interviews |
| Pro | $9.99 | $99.90 | Unlimited, 50GB, unlimited interviews, 25 videos |
| Family | $19.99 | $199.90 | 200GB, 10 family members, 100 videos |

### 4. Subscription Components

**Files Created:**
- `src/components/subscription/PricingTable.tsx` - Plan comparison with billing toggle
- `src/components/subscription/SubscriptionStatus.tsx` - Current plan badge with time remaining
- `src/components/subscription/UpgradeModal.tsx` - Checkout confirmation modal
- `src/components/subscription/BillingPortalLink.tsx` - Manage billing button
- `src/components/subscription/index.ts` - Component exports

### 5. API Routes

- `POST /api/stripe/create-checkout-session` - Start upgrade flow
- `POST /api/stripe/create-portal-session` - Manage billing
- `GET /api/subscription/status` - Get subscription + all plans

### 6. Middleware/Guards

**Updated `src/middleware.ts`:**
- Protects `/dashboard/*` routes (requires auth)
- Redirects unauthenticated users to `/login`
- Enforces onboarding completion before dashboard access
- Redirects authenticated users away from auth pages
- Prevents completed users from accessing onboarding again

### 7. Settings Integration

**New Page:**
- `/dashboard/settings/subscription` - Full subscription management

**Updated:**
- `/dashboard/settings` - Added link to subscription page

### 8. Hooks

**Created:** `src/hooks/useSubscription.ts`
- Fetches subscription status
- Provides `isActive` and `isPremium` flags
- `checkFeatureLimit()` helper for enforcing plan limits
- `useFeatureLimit()` hook for individual feature tracking

### 9. Documentation

**Created:** `docs/STRIPE_SETUP.md`
- Environment variable requirements
- Step-by-step Stripe setup instructions
- Product/price creation guide
- Webhook configuration (local and production)
- Test card numbers
- Feature limits reference
- Troubleshooting guide

## Environment Variables Required

Add to `.env.local`:

```env
# Stripe (required)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs (get from Stripe dashboard after creating products)
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_YEARLY=price_...
STRIPE_PRICE_FAMILY_MONTHLY=price_...
STRIPE_PRICE_FAMILY_YEARLY=price_...

# Supabase (should already exist)
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Next Steps

1. **Apply the database migration:**
   ```bash
   # Using Supabase CLI
   supabase db push
   
   # Or run the SQL in 028_subscriptions.sql manually in Supabase dashboard
   ```

2. **Create Stripe account and products:**
   - Follow `docs/STRIPE_SETUP.md`
   - Create products in Stripe dashboard or CLI
   - Copy Price IDs to environment variables

3. **Set up webhooks:**
   - For local: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
   - For production: Configure in Stripe dashboard

4. **Update Price IDs in database:**
   ```sql
   UPDATE plans SET stripe_price_id = 'price_xxx' WHERE name = 'Pro' AND price_monthly = 999;
   -- etc.
   ```

## Files Modified

- `src/middleware.ts` - Added subscription and onboarding checks
- `src/app/(dashboard)/dashboard/settings/page.tsx` - Added subscription link

## Files Created (27 total)

1. `supabase/migrations/028_subscriptions.sql`
2. `src/lib/stripe.ts`
3. `src/lib/supabase/server.ts`
4. `src/app/api/webhooks/stripe/route.ts`
5. `src/app/api/stripe/create-checkout-session/route.ts`
6. `src/app/api/stripe/create-portal-session/route.ts`
7. `src/app/api/subscription/status/route.ts`
8. `src/app/auth/callback/route.ts`
9. `src/app/(auth)/login/page.tsx`
10. `src/app/(auth)/signup/page.tsx`
11. `src/app/(auth)/forgot-password/page.tsx`
12. `src/app/(auth)/reset-password/page.tsx`
13. `src/app/(auth)/verify-email/page.tsx`
14. `src/app/onboarding/page.tsx`
15. `src/app/(dashboard)/dashboard/settings/subscription/page.tsx`
16. `src/components/subscription/PricingTable.tsx`
17. `src/components/subscription/SubscriptionStatus.tsx`
18. `src/components/subscription/UpgradeModal.tsx`
19. `src/components/subscription/BillingPortalLink.tsx`
20. `src/components/subscription/index.ts`
21. `src/hooks/useSubscription.ts`
22. `docs/STRIPE_SETUP.md`

The implementation is ready for Chuck to add real pricing. Just update the database with actual Stripe Price IDs after creating the products in Stripe.
