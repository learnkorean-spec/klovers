

## Integrate Stripe Payments

### Overview
Replace the current manual payment flow (pay externally, upload receipt, wait for approval) with direct Stripe checkout. Students will be able to pay online and get instant enrollment confirmation.

### Current State
- 18 product combinations: 3 tiers (Local/Regional/Global) x 2 types (Group/Private) x 3 durations (1/3/6 months)
- Manual flow: student pays externally, uploads receipt image, admin reviews and approves
- Prices are hardcoded in `PricingSection.tsx`

### What Will Change
1. **Enable Stripe** -- Connect your Stripe account to this project
2. **Create Stripe Products/Prices** -- Set up all 18 pricing combinations as Stripe products
3. **Add Checkout Flow** -- When a student clicks "Get Started" on a pricing card, they are taken to a Stripe Checkout session
4. **Handle Payment Confirmation** -- A backend function (webhook) listens for successful payments and automatically creates the enrollment + updates the student profile (no manual admin approval needed for paid enrollments)
5. **Keep Manual Option** -- Optionally keep the receipt upload flow for students who cannot pay via Stripe (e.g., local bank transfers)

### Technical Steps
1. Enable Stripe integration (this will provide more detailed implementation tools)
2. Create Stripe products and prices for all plan combinations
3. Create a backend function for Stripe checkout session creation
4. Create a webhook backend function to handle payment success events
5. Update the pricing page buttons to trigger Stripe checkout
6. Auto-approve enrollments on successful payment

### What You Will Need
- A Stripe account (free to create at stripe.com)
- Your Stripe secret key (found in the Stripe Dashboard under Developers > API Keys)

