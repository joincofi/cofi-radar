/**
 * GET /api/stripe/checkout?plan=monthly|yearly&email=...
 *
 * Creates a Stripe Checkout session and redirects the user.
 * Email is pre-filled from the query param (carried from free report email).
 */

import { NextResponse } from "next/server";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-02-24.acacia",
  });
  const { searchParams } = new URL(req.url);
  const plan  = searchParams.get("plan")  ?? "monthly";
  const email = searchParams.get("email") ?? "";

  const base = process.env.NEXTAUTH_URL ?? "https://cofi-radar.com";

  const priceId =
    plan === "yearly"
      ? process.env.STRIPE_PRICE_YEARLY!
      : process.env.STRIPE_PRICE_MONTHLY!;

  if (!priceId) {
    return NextResponse.json({ error: "Stripe price ID not configured" }, { status: 500 });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode:               "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],

      // Pre-fill email if we have it
      customer_email: email || undefined,

      // Required checkout fields
      billing_address_collection: "required",

      // Metadata so webhook can link back to lead
      metadata: { leadEmail: email, plan },

      // Subscription metadata
      subscription_data: {
        metadata: { leadEmail: email, plan },
      },

      // Success / cancel redirects
      success_url: `${base}/dashboard?welcome=1`,
      cancel_url:  `${base}/?checkout=cancelled`,

      // Consent text for yearly non-refundable policy
      custom_text: plan === "yearly"
        ? {
            submit: {
              message: "Yearly plans are non-refundable. You can cancel anytime to stop renewal.",
            },
          }
        : {
            submit: {
              message: "Cancel anytime — no refund for current billing period.",
            },
          },

      // Allow promotion codes
      allow_promotion_codes: true,
    });

    if (!session.url) {
      return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
    }

    return NextResponse.redirect(session.url, 303);

  } catch (err) {
    console.error("[stripe/checkout] Error:", err);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
