/**
 * Support agent — handles inbound support emails automatically.
 *
 * Called by a Resend inbound webhook (POST /api/support/inbound).
 *
 * Handles:
 *   - Refund requests within 48h grace period → auto-process via Stripe
 *   - Cancellation requests → redirect to portal
 *   - General questions → Claude-generated response
 *   - Anything uncertain → friendly escalation message to Farid
 */

import Anthropic from "@anthropic-ai/sdk";
import Stripe from "stripe";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

// Lazy getters — clients created at call time so build succeeds without keys
const getAnthropic = () => new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const getStripe    = () => new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-02-24.acacia" });
const getResend    = () => new Resend(process.env.RESEND_API_KEY);

const CORAL  = "#C96442";
const T2     = "#6B5E56";
const T3     = "#9B8E85";
const BORDER = "#EDE7E0";
const WHITE  = "#FFFFFF";
const BG     = "#FAF7F4";

type SupportIntent =
  | "refund_48h"
  | "refund_denied"
  | "cancel"
  | "billing"
  | "technical"
  | "general"
  | "escalate";

interface EmailIn {
  from:    string;
  subject: string;
  text:    string;
}

// ─── Intent classification ────────────────────────────────────────────────────

async function classifyIntent(email: EmailIn): Promise<SupportIntent> {
  const res = await getAnthropic().messages.create({
    model: "claude-haiku-4-20250514",
    max_tokens: 100,
    system: `Classify the intent of this support email. Return ONLY one of these labels:
refund_request | cancel_request | billing_question | technical_question | general_question | escalate

escalate if: legal threat, abuse, very angry, sensitive complaint, anything you're unsure about.`,
    messages: [{
      role: "user",
      content: `From: ${email.from}
Subject: ${email.subject}
Body: ${email.text.slice(0, 1000)}`,
    }],
  });

  const block = res.content[0];
  const label = block.type === "text" ? block.text.trim().toLowerCase() : "";

  if (label.includes("refund"))    return "refund_48h"; // will check timing below
  if (label.includes("cancel"))    return "cancel";
  if (label.includes("billing"))   return "billing";
  if (label.includes("technical")) return "technical";
  if (label.includes("escalate"))  return "escalate";
  return "general";
}

// ─── Refund check ─────────────────────────────────────────────────────────────

async function checkRefundEligibility(clientEmail: string): Promise<{
  eligible: boolean;
  subscriptionId: string | null;
  invoiceId: string | null;
}> {
  const brand = await prisma.brand.findUnique({ where: { clientEmail } });
  if (!brand?.stripeSubscriptionId) return { eligible: false, subscriptionId: null, invoiceId: null };

  try {
    const sub     = await getStripe().subscriptions.retrieve(brand.stripeSubscriptionId);
    const age     = Date.now() - sub.created * 1000;
    const LIMIT   = 48 * 60 * 60 * 1000;
    if (age > LIMIT) return { eligible: false, subscriptionId: sub.id, invoiceId: null };

    // Find the first invoice
    const invoices = await getStripe().invoices.list({ subscription: sub.id, limit: 1 });
    const invoice  = invoices.data[0];
    return {
      eligible:       true,
      subscriptionId: sub.id,
      invoiceId:      invoice?.id ?? null,
    };
  } catch {
    return { eligible: false, subscriptionId: null, invoiceId: null };
  }
}

async function processRefund(subscriptionId: string, invoiceId: string): Promise<void> {
  const stripe = getStripe();
  const invoice = await stripe.invoices.retrieve(invoiceId);
  if (invoice.charge) {
    await stripe.refunds.create({ charge: invoice.charge as string });
  }
  await stripe.subscriptions.cancel(subscriptionId);
  await prisma.brand.updateMany({
    where: { stripeSubscriptionId: subscriptionId },
    data:  { status: "cancelled" },
  });
}

// ─── Response generation ──────────────────────────────────────────────────────

async function generateResponse(intent: SupportIntent, email: EmailIn, context: string): Promise<string> {
  const base = process.env.NEXTAUTH_URL ?? "https://cofi-radar.com";

  const templates: Record<SupportIntent, string> = {
    refund_48h:     `You are a helpful customer support agent for CoFi Radar, an AI brand monitoring tool. A customer requested a refund within 48 hours and it has been processed. Write a brief, warm confirmation. Mention the refund will appear in 5-10 business days.`,
    refund_denied:  `You are a helpful customer support agent for CoFi Radar. A customer requested a refund but it's past the 48-hour window. Politely explain the no-refund policy, but offer to cancel so they won't be charged again. Be empathetic. Include a link to manage their subscription: ${base}/api/stripe/portal`,
    cancel:         `You are a helpful customer support agent for CoFi Radar. A customer wants to cancel. Acknowledge their request, provide the self-serve cancellation link: ${base}/api/stripe/portal. Keep it brief and professional — no guilt or pressure.`,
    billing:        `You are a helpful customer support agent for CoFi Radar. Answer the billing question helpfully. Portal link: ${base}/api/stripe/portal. Keep it under 3 sentences.`,
    technical:      `You are a helpful customer support agent for CoFi Radar, an AI brand visibility monitoring platform. Answer the technical question based on this context: ${context}. Be specific and practical. If you're unsure, say so and offer to investigate.`,
    general:        `You are a helpful customer support agent for CoFi Radar. Answer this question warmly and concisely. Context: ${context}`,
    escalate:       `Write a brief acknowledgement that the message has been received and that a team member will respond within 24 hours. Do not make any promises or decisions.`,
  };

  const system = templates[intent] || templates.general;

  const res = await getAnthropic().messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 400,
    system,
    messages: [{
      role: "user",
      content: `Customer email:
From: ${email.from}
Subject: ${email.subject}

${email.text.slice(0, 800)}

Write a response email body (no subject line, no "Dear X", just the body).`,
    }],
  });

  const block = res.content[0];
  return block.type === "text" ? block.text : "Thank you for reaching out. We'll get back to you shortly.";
}

// ─── Send response ────────────────────────────────────────────────────────────

async function sendSupportReply(to: string, subject: string, body: string): Promise<void> {
  const reSubject = subject.startsWith("Re:") ? subject : `Re: ${subject}`;
  await getResend().emails.send({
    from:    process.env.RESEND_FROM_EMAIL!,
    to,
    subject: reSubject,
    html: `<!DOCTYPE html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:${BG};padding:32px 16px;margin:0;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table style="max-width:560px;background:${WHITE};border-radius:12px;border:1px solid ${BORDER};overflow:hidden;">
  <tr><td style="padding:32px;">
    <p style="margin:0 0 4px;font-size:11px;color:${CORAL};font-weight:700;letter-spacing:0.1em;text-transform:uppercase;">CoFi Radar Support</p>
    <div style="margin-top:16px;font-size:15px;color:${T2};line-height:1.75;white-space:pre-wrap;">${body}</div>
  </td></tr>
  <tr><td style="background:${BG};border-top:1px solid ${BORDER};padding:16px 32px;text-align:center;">
    <p style="margin:0;font-size:12px;color:${T3};">CoFi Radar · <a href="mailto:${process.env.RESEND_FROM_EMAIL}" style="color:${T3};">Reply to this email</a> for further help.</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`,
  });
}

// ─── Escalation to Farid ──────────────────────────────────────────────────────

async function escalateToOwner(email: EmailIn, reason: string): Promise<void> {
  const ownerEmail = process.env.OWNER_EMAIL;
  if (!ownerEmail) return;

  await getResend().emails.send({
    from:    process.env.RESEND_FROM_EMAIL!,
    to:      ownerEmail,
    subject: `[Escalation needed] ${email.subject}`,
    html: `<p>A support email needs human review.</p>
<p><strong>Reason:</strong> ${reason}</p>
<p><strong>From:</strong> ${email.from}</p>
<p><strong>Subject:</strong> ${email.subject}</p>
<pre style="background:#f5f5f5;padding:16px;border-radius:8px;font-size:13px;">${email.text.slice(0, 2000)}</pre>`,
  });
}

// ─── Public handler ───────────────────────────────────────────────────────────

export async function handleSupportEmail(email: EmailIn): Promise<void> {
  console.log(`[support] Handling email from ${email.from}: "${email.subject}"`);

  let intent = await classifyIntent(email);
  let context = "";

  // Gather context about this customer
  const brand = await prisma.brand.findUnique({ where: { clientEmail: email.from } }).catch(() => null);
  if (brand) {
    const latestScore = await prisma.score.findFirst({
      where: { brandId: brand.id },
      orderBy: { createdAt: "desc" },
    }).catch(() => null);
    context = `Customer: ${brand.name} (${brand.domain}), Status: ${brand.status}, Latest score: ${latestScore?.scoreTotal ?? "none"}`;
  }

  // Handle refund requests — check timing
  if (intent === "refund_48h") {
    const refundCheck = await checkRefundEligibility(email.from);

    if (refundCheck.eligible && refundCheck.subscriptionId && refundCheck.invoiceId) {
      await processRefund(refundCheck.subscriptionId, refundCheck.invoiceId);
      const body = await generateResponse("refund_48h", email, context);
      await sendSupportReply(email.from, email.subject, body);
      console.log(`[support] Refund processed for ${email.from}`);
      return;
    } else {
      intent = "refund_denied";
    }
  }

  // Escalate if flagged
  if (intent === "escalate") {
    const ackBody = await generateResponse("escalate", email, context);
    await sendSupportReply(email.from, email.subject, ackBody);
    await escalateToOwner(email, "Classified as requiring human review");
    return;
  }

  // Generate and send automated response
  const body = await generateResponse(intent, email, context);
  await sendSupportReply(email.from, email.subject, body);
  console.log(`[support] Responded to ${email.from} with intent: ${intent}`);
}
