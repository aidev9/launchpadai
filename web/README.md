This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Setting Up Stripe Webhooks

For subscription management to work correctly, you need to set up Stripe webhooks:

### Local Development

1. Install the Stripe CLI from [Stripe CLI Installation Guide](https://stripe.com/docs/stripe-cli)

2. Login to your Stripe account with the CLI:

   ```
   stripe login
   ```

3. Forward events to your local webhook endpoint:

   ```
   stripe listen --forward-to http://localhost:3000/api/stripe/webhook
   ```

4. The CLI will provide a webhook signing secret. Add this to your `.env.local` file:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### Production

1. In your Stripe Dashboard, go to Developers > Webhooks

2. Click "Add Endpoint"

3. Enter your production webhook URL: `https://yourdomain.com/api/stripe/webhook`

4. Select the following events to listen for:

   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `payment_intent.succeeded`

5. Get the signing secret from your webhook settings and add it to your environment variables.

### Required Environment Variables

Make sure your `.env.local` file contains all necessary Stripe configuration:

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Price IDs for subscriptions
STRIPE_EXPLORER_MONTHLY_PRICE_ID=price_...
STRIPE_EXPLORER_ANNUAL_PRICE_ID=price_...
STRIPE_BUILDER_MONTHLY_PRICE_ID=price_...
STRIPE_BUILDER_ANNUAL_PRICE_ID=price_...
STRIPE_ACCELERATOR_MONTHLY_PRICE_ID=price_...
STRIPE_ACCELERATOR_ANNUAL_PRICE_ID=price_...
```
