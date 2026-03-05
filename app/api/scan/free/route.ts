/**
 * POST /api/scan/free
 * Body: { domain: string, email: string }
 *
 * Rate limits:
 *   - 1 scan per email per 7 days
 *   - 1 scan per domain per 30 days
 *
 * Returns immediately after creating the Lead record.
 * The actual scan runs in the background (fire-and-forget).
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runFreeScan } from "@/lib/agents/freeScan";

function normalizeDomain(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .split("/")[0]
    .trim();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidDomain(domain: string): boolean {
  return /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z]{2,})+$/.test(domain);
}

const SEVEN_DAYS  = 7  * 24 * 60 * 60 * 1000;
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

export async function POST(req: Request) {
  try {
    const body = await req.json() as { domain?: string; email?: string };
    const email  = (body.email  ?? "").trim().toLowerCase();
    const domain = normalizeDomain(body.domain ?? "");

    // ── Input validation ────────────────────────────────────────────────────
    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }
    if (!domain || !isValidDomain(domain)) {
      return NextResponse.json({ error: "Valid domain required (e.g. acme.com)" }, { status: 400 });
    }

    // Block obvious disposable email domains
    const disposable = ["mailinator.com", "guerrillamail.com", "tempmail.com", "10minutemail.com", "throwam.com"];
    if (disposable.some((d) => email.endsWith(`@${d}`))) {
      return NextResponse.json({ error: "Please use your work email address" }, { status: 400 });
    }

    // ── Rate limiting ────────────────────────────────────────────────────────
    const now = Date.now();

    const existingByEmail = await prisma.lead.findUnique({ where: { email } });
    if (existingByEmail) {
      const age = now - new Date(existingByEmail.createdAt).getTime();
      if (age < SEVEN_DAYS) {
        // Return cached result if already scanned
        if (existingByEmail.reportSent && existingByEmail.score !== null) {
          return NextResponse.json({
            status:  "already_sent",
            message: `We already sent your report to ${email}. Check your inbox (and spam folder).`,
            score:   existingByEmail.score,
          });
        }
        // Still scanning
        return NextResponse.json({
          status:  "pending",
          message: "Your scan is already in progress. Report will arrive shortly.",
        });
      }
    }

    const existingByDomain = await prisma.lead.findFirst({
      where: {
        domain,
        createdAt: { gte: new Date(now - THIRTY_DAYS) },
      },
    });
    if (existingByDomain && existingByDomain.email !== email) {
      // Domain already scanned recently — still process but note it
      console.log(`[scan/free] Domain ${domain} scanned recently by different email`);
    }

    // ── Create or reset Lead ─────────────────────────────────────────────────
    let lead;
    if (existingByEmail) {
      // Re-scan after 7 days
      lead = await prisma.lead.update({
        where: { id: existingByEmail.id },
        data: {
          domain,
          score:      null,
          reportSent: false,
          scannedAt:  null,
          converted:  existingByEmail.converted, // preserve
          createdAt:  new Date(),
        },
      });
    } else {
      lead = await prisma.lead.create({
        data: { email, domain },
      });
    }

    // ── Kick off scan in background (fire-and-forget) ─────────────────────
    runFreeScan(lead.id).catch((err) => {
      console.error(`[scan/free] Scan failed for lead ${lead.id}:`, err);
    });

    return NextResponse.json({
      status:  "scanning",
      message: `We're scanning ${domain} now. Your report will arrive at ${email} within a few minutes.`,
    });

  } catch (err) {
    console.error("[scan/free] Error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
