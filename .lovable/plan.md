

# Connect Stripe Webhook to Your Project

## What This Does
This will create a webhook endpoint in Stripe that listens for successful payments and automatically updates student credits and enrollment records.

## Steps

### 1. Create the Stripe Webhook in Stripe Dashboard
You'll need to manually create a webhook in your Stripe Dashboard pointing to your backend function:

- **Webhook URL**: `https://rahpkflknkofuuhnbfyc.supabase.co/functions/v1/stripe-webhook`
- **Events to listen for**: `checkout.session.completed`

### 2. Save the Webhook Signing Secret
After creating the webhook in Stripe, you'll get a **Webhook Signing Secret** (starts with `whsec_`). I'll securely store this as `STRIPE_WEBHOOK_SECRET` so the backend can verify incoming webhook requests are genuinely from Stripe.

### 3. How to Get the Webhook Secret
1. Go to [Stripe Dashboard > Developers > Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **"Add endpoint"**
3. Enter the URL: `https://rahpkflknkofuuhnbfyc.supabase.co/functions/v1/stripe-webhook`
4. Select event: `checkout.session.completed`
5. Click **"Add endpoint"**
6. Click **"Reveal"** next to the Signing Secret and copy it

### Technical Details
- The `stripe-webhook` backend function is already deployed and ready
- It handles `checkout.session.completed` events to create enrollments and add class credits
- The signing secret ensures only legitimate Stripe events are processed
- No code changes are needed -- only the secret needs to be stored

