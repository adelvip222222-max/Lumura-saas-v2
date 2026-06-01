import Stripe from "stripe";

let stripeClient: Stripe | null = null;

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key.includes("xxxx")) return null;
  if (!stripeClient) {
    stripeClient = new Stripe(key, { apiVersion: "2023-10-16" as Stripe.LatestApiVersion });
  }
  return stripeClient;
}

export async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  name: string
): Promise<string> {
  const stripe = getStripe();
  if (!stripe) return `dev_customer_${userId}`;

  const customer = await stripe.customers.create({ email, name, metadata: { userId } });
  return customer.id;
}

export async function createCheckoutSession(input: {
  customerId: string;
  priceId: string;
  storeId: string;
  userId: string;
  successUrl: string;
  cancelUrl: string;
  trialDays?: number;
}): Promise<{ url: string | null }> {
  const stripe = getStripe();
  if (!stripe) {
    return { url: null };
  }

  const session = await stripe.checkout.sessions.create({
    customer: input.customerId,
    mode: "subscription",
    line_items: [{ price: input.priceId, quantity: 1 }],
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    subscription_data: input.trialDays
      ? { trial_period_days: input.trialDays, metadata: { storeId: input.storeId, userId: input.userId } }
      : { metadata: { storeId: input.storeId, userId: input.userId } },
    metadata: { storeId: input.storeId, userId: input.userId },
  });

  return { url: session.url };
}

export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
): Promise<{ url: string }> {
  const stripe = getStripe();
  if (!stripe) {
    return { url: returnUrl };
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  return { url: session.url };
}

export async function cancelSubscription(
  stripeSubscriptionId: string,
  immediately = false
): Promise<void> {
  const stripe = getStripe();
  if (!stripe) return;

  if (immediately) {
    await stripe.subscriptions.cancel(stripeSubscriptionId);
  } else {
    await stripe.subscriptions.update(stripeSubscriptionId, { cancel_at_period_end: true });
  }
}

export async function reactivateSubscription(stripeSubscriptionId: string): Promise<void> {
  const stripe = getStripe();
  if (!stripe) return;
  await stripe.subscriptions.update(stripeSubscriptionId, { cancel_at_period_end: false });
}

export async function updateSubscriptionPlan(
  stripeSubscriptionId: string,
  newPriceId: string
): Promise<void> {
  const stripe = getStripe();
  if (!stripe) return;

  const sub = await stripe.subscriptions.retrieve(stripeSubscriptionId);
  const itemId = sub.items.data[0]?.id;
  if (!itemId) return;

  await stripe.subscriptions.update(stripeSubscriptionId, {
    items: [{ id: itemId, price: newPriceId }],
    proration_behavior: "create_prorations",
  });
}
