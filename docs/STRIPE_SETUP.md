# Stripe Setup Guide for YoursTruly v2

This guide walks through setting up Stripe for subscription billing in YoursTruly.

## Prerequisites

1. A [Stripe account](https://dashboard.stripe.com/register)
2. Access to the YoursTruly Supabase project

## Step 1: Environment Variables

Add these environment variables to your `.env.local` file:

```env
# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs (get these after creating products)
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_YEARLY=price_...
STRIPE_PRICE_FAMILY_MONTHLY=price_...
STRIPE_PRICE_FAMILY_YEARLY=price_...

# Supabase Service Role Key (for webhooks)
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 2: Create Stripe Products & Prices

### Using Stripe Dashboard

1. Go to [Stripe Dashboard > Products](https://dashboard.stripe.com/products)
2. Create three products:

#### Free Plan
- **Name**: Free
- **Description**: Get started with basic memory capture
- **Price**: $0 (no price needed)

#### Pro Plan
- **Name**: Pro
- **Description**: For individuals serious about preserving their legacy
- **Prices**:
  - Monthly: $9.99/month
  - Yearly: $99.90/year (17% savings)

#### Family Plan
- **Name**: Family
- **Description**: Capture your entire family's stories together
- **Prices**:
  - Monthly: $19.99/month
  - Yearly: $199.90/year (17% savings)

3. Copy the Price IDs and add them to your environment variables

### Using Stripe CLI (Alternative)

```bash
# Install Stripe CLI if not already installed
# https://stripe.com/docs/stripe-cli

# Create Pro Monthly Price
stripe prices create \
  --unit-amount=999 \
  --currency=usd \
  --recurring='{"interval":"month"}' \
  --product-data='{"name":"Pro"}'

# Create Pro Yearly Price
stripe prices create \
  --unit-amount=9990 \
  --currency=usd \
  --recurring='{"interval":"year"}' \
  --product-data='{"name":"Pro"}'

# Create Family Monthly Price
stripe prices create \
  --unit-amount=1999 \
  --currency=usd \
  --recurring='{"interval":"month"}' \
  --product-data='{"name":"Family"}'

# Create Family Yearly Price
stripe prices create \
  --unit-amount=19990 \
  --currency=usd \
  --recurring='{"interval":"year"}' \
  --product-data='{"name":"Family"}'
```

## Step 3: Set Up Webhooks

Stripe webhooks are required to keep subscription status in sync.

### Local Development

1. Install Stripe CLI and login:
```bash
stripe login
```

2. Forward webhooks to your local server:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

3. Copy the webhook signing secret and add it to `.env.local`:
```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Production

1. Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
   - `customer.subscription.trial_will_end`
4. Copy the webhook signing secret

## Step 4: Update Plans Table with Stripe Price IDs

After creating products in Stripe, update the database:

```sql
-- Get your actual Stripe Price IDs from the dashboard
UPDATE plans SET stripe_price_id = 'price_pro_monthly_xxx' WHERE name = 'Pro' AND price_monthly > 0;
UPDATE plans SET stripe_price_id = 'price_pro_yearly_xxx' WHERE name = 'Pro' AND price_yearly > 0;
UPDATE plans SET stripe_price_id = 'price_family_monthly_xxx' WHERE name = 'Family' AND price_monthly > 0;
UPDATE plans SET stripe_price_id = 'price_family_yearly_xxx' WHERE name = 'Family' AND price_yearly > 0;
```

## Step 5: Testing

### Test Cards

Use these Stripe test card numbers:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Require 3DS**: `4000 0025 0000 3155`

Use any future date for expiry and any 3-digit CVC.

### Test Flow

1. Sign up for a new account
2. Go to Settings > Subscription
3. Click "Upgrade" on Pro or Family plan
4. Complete checkout with test card
5. Verify subscription appears in dashboard

## Step 6: Going Live

1. Switch to [Stripe Live Mode](https://dashboard.stripe.com/)
2. Create products and prices again (test data doesn't carry over)
3. Update environment variables with live keys
4. Create a new webhook endpoint for production
5. Update plans table with live Price IDs
6. Deploy with updated environment variables

## Webhook Events Handled

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Creates/updates subscription record |
| `customer.subscription.updated` | Updates subscription status and dates |
| `customer.subscription.deleted` | Marks subscription as canceled |
| `invoice.payment_failed` | Marks subscription as past_due |
| `customer.subscription.trial_will_end` | Could trigger reminder email |

## Troubleshooting

### Webhook signature verification failed
- Ensure `STRIPE_WEBHOOK_SECRET` is correct
- Check that webhook URL matches exactly (including protocol)

### Subscription not updating after payment
- Check webhook is configured and forwarding correctly
- Look at webhook delivery logs in Stripe Dashboard
- Check application logs for errors

### Price not found
- Verify Price IDs in environment variables match Stripe dashboard
- Ensure using correct environment (test vs live)

## Feature Limits by Plan

| Feature | Free | Pro | Family |
|---------|------|-----|--------|
| Memories | 50 | Unlimited | Unlimited |
| Storage | 1 GB | 50 GB | 200 GB |
| AI Interviews | 3 total | Unlimited | Unlimited |
| Family Members | 1 | 3 | 10 |
| Video Messages | 0 | 25/year | 100/year |
| Postscripts | 1 | 10 | 50 |

Implement limits in your application code using the helper:

```typescript
import { checkFeatureLimit } from '@/lib/stripe';

const { allowed, remaining } = checkFeatureLimit(currentUsage, planLimit);
if (!allowed) {
  // Show upgrade modal or error
}
```

## Additional Resources

- [Stripe Billing Documentation](https://stripe.com/docs/billing)
- [Stripe Test Cards](https://stripe.com/docs/testing#cards)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
