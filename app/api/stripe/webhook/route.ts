/**
 * POST /api/stripe/webhook
 *
 * Handles the full Stripe subscription lifecycle — zero human input required.
 *
 * Events handled:
 *   checkout.session.completed     → provision brand, start onboarding agent
 *   customer.subscription.updated  → update Brand status / plan
 *   customer.subscription.deleted  → cancel brand, send offboarding email
 *   invoice.payment_failed         → mark past_due, send dunning email
 *   invoice.payment_succeeded      → restore active after past_due
 */

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { onboardBrand } from "@/lib/agents/onboard";
import { sendEmail } from "@/lib/email/send";

export const dynamic = "force-dynamic";

const CORAL  = "#C96442";
const T2     = "#6B5E56";
const T3     = "#9B8E85";
const BORDER = "#EDE7E0";
const WHITE  = "#FFFFFF";
const BG     = "#FAF7F4";

// ─── Email helpers ────────────────────────────────────────────────────────────

async function sendCancellationEmail(clientEmail: string, brandName: string, periodEnd: Date) {
  const base = process.env.NEXTAUTH_URL ?? "https://cofiradar.com";
  const endStr = periodEnd.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  await sendEmail({
    to:      clientEmail,
    subject: `Your CoFi Radar subscription has been cancelled`,
    html: `<!DOCTYPE html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:${BG};padding:32px 16px;margin:0;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table style="max-width:560px;background:${WHITE};border-radius:12px;border:1px solid ${BORDER};overflow:hidden;">
  <tr><td style="padding:32px;">
    <p style="margin:0 0 4px;font-size:11px;color:${CORAL};font-weight:700;letter-spacing:0.1em;text-transform:uppercase;">CoFi Radar</p>
    <h1 style="margin:0 0 20px;font-size:20px;font-weight:800;color:#1C1714;">Subscription cancelled</h1>
    <p style="margin:0 0 16px;font-size:15px;color:${T2};line-height:1.65;">
      Your CoFi Radar subscription for <strong>${brandName}</strong> has been cancelled.
      You&rsquo;ll keep full access until <strong>${endStr}</strong>.
    </p>
    <p style="margin:0 0 24px;font-size:14px;color:${T3};line-height:1.65;">
      After that date, your weekly runs will stop and your dashboard will become read-only for 30 days before data is purged.
    </p>
    <a href="${base}/api/stripe/checkout?plan=monthly&email=${encodeURIComponent(clientEmail)}" style="display:inline-block;background:${CORAL};color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:700;">
      Reactivate anytime →
    </a>
  </td></tr>
  <tr><td style="background:${BG};border-top:1px solid ${BORDER};padding:16px 32px;text-align:center;">
    <p style="margin:0;font-size:12px;color:${T3};">CoFi Radar · AI Visibility Intelligence</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`,
  });
}

async function sendDunningEmail(clientEmail: string, brandName: string) {
  const base = process.env.NEXTAUTH_URL ?? "https://cofiradar.com";
  await sendEmail({
    to:      clientEmail,
    subject: `Action required: payment failed for CoFi Radar`,
    html: `<!DOCTYPE html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:${BG};padding:32px 16px;margin:0;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table style="max-width:560px;background:${WHITE};border-radius:12px;border:1px solid ${BORDER};overflow:hidden;">
  <tr><td style="padding:32px;">
    <p style="margin:0 0 4px;font-size:11px;color:#dc2626;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;">Payment failed</p>
    <h1 style="margin:0 0 20px;font-size:20px;font-weight:800;color:#1C1714;">We couldn&rsquo;t process your payment</h1>
    <p style="margin:0 0 16px;font-size:15px;color:${T2};line-height:1.65;">
      Your payment for <strong>${brandName}</strong>&rsquo;s CoFi Radar subscription failed.
      Weekly monitoring is paused until your payment is updated.
    </p>
    <a href="${base}/api/stripe/portal?email=${encodeURIComponent(clientEmail)}" style="display:inline-block;background:${CORAL};color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:700;">
      Update payment method →
    </a>
    <p style="margin:20px 0 0;font-size:13px;color:${T3};">Stripe will retry automatically. If payment fails 3 times, your subscription will be cancelled.</p>
  </td></tr>
  <tr><td style="background:${BG};border-top:1px solid ${BORDER};padding:16px 32px;text-align:center;">
    <p style="margin:0;font-size:12px;color:${T3};">CoFi Radar · AI Visibility Intelligence</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`,
  });
}

async function sendPaymentRestoredEmail(clientEmail: string, brandName: string) {
  await sendEmail({
    to:      clientEmail,
    subject: `Payment restored — CoFi Radar is back`,
    html: `<!DOCTYPE html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:${BG};padding:32px 16px;margin:0;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table style="max-width:560px;background:${WHITE};border-radius:12px;border:1px solid ${BORDER};overflow:hidden;">
  <tr><td style="padding:32px;">
    <p style="margin:0 0 4px;font-size:11px;color:#16a34a;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;">Payment successful</p>
    <h1 style="margin:0 0 20px;font-size:20px;font-weight:800;color:#1C1714;">You&rsquo;re back on track</h1>
    <p style="margin:0;font-size:15px;color:${T2};line-height:1.65;">
      Payment for <strong>${brandName}</strong> has been processed. Weekly monitoring resumes this Sunday.
    </p>
  </td></tr>
  <tr><td style="background:${BG};border-top:1px solid ${BORDER};padding:16px 32px;text-align:center;">
    <p style="margin:0;font-size:12px;color:${T3};">CoFi Radar · AI Visibility Intelligence</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`,
  });
}

// ─── 48-hour grace period refund ─────────────────────────────────────────────

async function checkAndRefund48h(
  stripe: Stripe,
  subscriptionId: string,
  customerId: string,
  invoiceId: string
): Promise<boolean> {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const createdAt    = subscription.created * 1000;
    const age          = Date.now() - createdAt;
    const FORTY_EIGHT_H = 48 * 60 * 60 * 1000;

    if (age <= FORTY_EIGHT_H) {
      await stripe.refunds.create({ charge: (await stripe.invoices.retrieve(invoiceId)).charge as string });
      await stripe.subscriptions.cancel(subscriptionId);
      console.log(`[webhook] 48h grace refund issued for subscription ${subscriptionId}`);
      return true;
    }
  } catch (err) {
    console.error("[webhook] Grace period refund check failed:", err);
  }
  return false;
}

// ─── Main webhook handler ─────────────────────────────────────────────────────

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-02-24.acacia",
  });

  const body      = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("[webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  console.log(`[webhook] ${event.type}`);

  try {
    switch (event.type) {

      // ── New subscription ────────────────────────────────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") break;

        const customerId     = session.customer     as string;
        const subscriptionId = session.subscription as string;
        const clientEmail    = session.customer_email ?? session.metadata?.leadEmail ?? "";
        const plan           = session.metadata?.plan ?? "monthly";

        if (!clientEmail) {
          console.error("[webhook] No email in checkout session");
          break;
        }

        // Get the price ID from subscription
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId      = subscription.items.data[0]?.price.id ?? "";

        // Look up domain from Lead
        const lead = await prisma.lead.findUnique({ where: { email: clientEmail } });
        if (!lead?.domain) {
          console.error(`[webhook] No lead found for ${clientEmail}`);
          break;
        }

        // Onboard in background
        onboardBrand({
          clientEmail,
          domain:               lead.domain,
          stripeCustomerId:     customerId,
          stripeSubscriptionId: subscriptionId,
          stripePriceId:        priceId,
        }).catch((err) => console.error("[webhook] onboardBrand failed:", err));

        console.log(`[webhook] Onboarding started for ${clientEmail} (${plan})`);
        break;
      }

      // ── Plan change ─────────────────────────────────────────────────────────
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const brand = await prisma.brand.findFirst({
          where: { stripeSubscriptionId: sub.id },
        });
        if (!brand) break;

        const priceId = sub.items.data[0]?.price.id ?? "";
        const status  = sub.status === "active" ? "active"
                      : sub.status === "past_due" ? "past_due"
                      : sub.status === "canceled" ? "cancelled"
                      : "active";

        await prisma.brand.update({
          where: { id: brand.id },
          data: { stripePriceId: priceId, status },
        });

        console.log(`[webhook] Subscription updated for ${brand.domain}: ${sub.status}`);
        break;
      }

      // ── Cancellation ────────────────────────────────────────────────────────
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const brand = await prisma.brand.findFirst({
          where: { stripeSubscriptionId: sub.id },
        });
        if (!brand) break;

        await prisma.brand.update({
          where: { id: brand.id },
          data: { status: "cancelled" },
        });

        const periodEnd = new Date((sub as Stripe.Subscription & { current_period_end: number }).current_period_end * 1000);
        await sendCancellationEmail(brand.clientEmail, brand.name, periodEnd);

        console.log(`[webhook] Subscription cancelled for ${brand.domain}`);
        break;
      }

      // ── Payment failed ──────────────────────────────────────────────────────
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subId   = (invoice as Stripe.Invoice & { subscription?: string }).subscription ?? "";
        if (!subId) break;

        const brand = await prisma.brand.findFirst({
          where: { stripeSubscriptionId: subId },
        });
        if (!brand) break;

        await prisma.brand.update({
          where: { id: brand.id },
          data: { status: "past_due" },
        });

        await sendDunningEmail(brand.clientEmail, brand.name);
        console.log(`[webhook] Payment failed for ${brand.domain}`);
        break;
      }

      // ── Payment succeeded ───────────────────────────────────────────────────
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subId   = (invoice as Stripe.Invoice & { subscription?: string }).subscription ?? "";
        if (!subId) break;

        const brand = await prisma.brand.findFirst({
          where: { stripeSubscriptionId: subId },
        });
        if (!brand) break;

        // Only notify if restoring from past_due
        if (brand.status === "past_due") {
          await prisma.brand.update({
            where: { id: brand.id },
            data: { status: "active" },
          });
          await sendPaymentRestoredEmail(brand.clientEmail, brand.name);
          console.log(`[webhook] Payment restored for ${brand.domain}`);
        }
        break;
      }

      default:
        console.log(`[webhook] Unhandled event: ${event.type}`);
    }
  } catch (err) {
    console.error(`[webhook] Handler error for ${event.type}:`, err);
    // Return 200 anyway so Stripe doesn't retry endlessly
  }

  return NextResponse.json({ received: true });
}
