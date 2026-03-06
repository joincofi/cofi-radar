/**
 * GET /api/stripe/portal
 *
 * Creates a Stripe Customer Portal session and redirects the client.
 * Works with session (from dashboard) or email query param (from email link).
 *
 * Client can upgrade, downgrade, cancel, update payment method — all without
 * contacting support.
 */

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-02-24.acacia",
  });
  const base = process.env.NEXTAUTH_URL ?? "https://cofiradar.com";
  const { searchParams } = new URL(req.url);

  // Resolve client email — from session or query param (from email link)
  let clientEmail: string | null = null;

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (token?.email) {
    clientEmail = token.email as string;
  } else {
    clientEmail = searchParams.get("email");
  }

  if (!clientEmail) {
    return NextResponse.redirect(`${base}/auth/signin`);
  }

  // Look up brand to get stripeCustomerId
  const brand = await prisma.brand.findUnique({ where: { clientEmail } });

  if (!brand?.stripeCustomerId) {
    // No Stripe customer — redirect to checkout to subscribe
    return NextResponse.redirect(`${base}/api/stripe/checkout?plan=monthly&email=${encodeURIComponent(clientEmail)}`);
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer:   brand.stripeCustomerId,
      return_url: `${base}/dashboard`,
    });

    return NextResponse.redirect(session.url, 303);

  } catch (err) {
    console.error("[stripe/portal] Error:", err);
    return NextResponse.redirect(`${base}/dashboard?error=portal_failed`);
  }
}
