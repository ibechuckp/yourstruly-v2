# YoursTruly V2 - TODO

## Post-Deployment Tasks

### Stripe Webhook Setup
- [ ] Create webhook endpoint at `https://yourstruly.love/api/webhooks/stripe`
- [ ] Subscribe to events:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_failed`
  - `invoice.payment_succeeded`
- [ ] Add `STRIPE_WEBHOOK_SECRET` to production environment
- [ ] Test webhook delivery in Stripe Dashboard

### Interview Security & Claiming
- [ ] Add optional email/phone verification for interviewees
- [ ] Prompt "Save a copy to your account?" at interview completion
- [ ] Check for claimable interviews during signup (match email/phone)
- [ ] UI for claiming past interview responses when signing up
- [ ] Migration 061 created: `interview_respondents` table + claim functions

### Testing
- [ ] Test face detection on uploaded photos
- [ ] Verify Resend email delivery for seat invites
- [ ] Test photobook builder flow end-to-end
- [ ] Test live transcription/conversations end-to-end
- [ ] Test group interviews end-to-end

### Other
- [ ] Set up Prodigi API keys (production)

## Stripe IDs (Live)

| Item | ID |
|------|-----|
| Product: Premium | `prod_U2rXLfgtPvpmfE` |
| Price: Monthly ($20/mo) | `price_1T4lnyH94XbyUkwA9PV0uiIz` |
| Price: Annual ($220/yr) | `price_1T4ltlH94XbyUkwABUSWR6f7` |

## Pricing Model

- **Premium Base**: $20/month or $220/year (1 month free)
- **Included**: 2 family seats
- **Additional Seats**:
  - Seats 3-5: $8/seat/month
  - Seats 6-10: $6/seat/month
- **Max seats**: 10 per subscription
