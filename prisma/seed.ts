import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const queries = [
  // Discovery (6)
  { intent: "discovery", priority: 2, text: "What are the best {industry} tools for mid-size companies?" },
  { intent: "discovery", priority: 2, text: "Which {industry} platforms should I consider in 2025?" },
  { intent: "discovery", priority: 2, text: "Give me an overview of {brand} and what they do." },
  { intent: "discovery", priority: 3, text: "What companies compete with {brand}?" },
  { intent: "discovery", priority: 2, text: "Is {brand} a good option for {industry}?" },
  { intent: "discovery", priority: 3, text: "What {industry} software do companies like {brand} offer?" },
  // Evaluation (6)
  { intent: "evaluation", priority: 1, text: "What are the pros and cons of {brand}?" },
  { intent: "evaluation", priority: 1, text: "What do customers say about {brand}?" },
  { intent: "evaluation", priority: 2, text: "What features does {brand} offer?" },
  { intent: "evaluation", priority: 1, text: "How does {brand} compare to {competitor}?" },
  { intent: "evaluation", priority: 2, text: "Is {brand} good for small businesses?" },
  { intent: "evaluation", priority: 2, text: "What are {brand} limitations?" },
  // Pricing (6)
  { intent: "pricing", priority: 1, text: "How much does {brand} cost?" },
  { intent: "pricing", priority: 1, text: "What is {brand} pricing model?" },
  { intent: "pricing", priority: 1, text: "Does {brand} have a free plan or free trial?" },
  { intent: "pricing", priority: 2, text: "Is {brand} expensive compared to alternatives?" },
  { intent: "pricing", priority: 2, text: "What is included in {brand} pricing?" },
  { intent: "pricing", priority: 3, text: "What is the cheapest way to use {brand}?" },
  // Trust (6)
  { intent: "trust", priority: 1, text: "Is {brand} a legitimate company?" },
  { intent: "trust", priority: 1, text: "Is {brand} secure and compliant?" },
  { intent: "trust", priority: 2, text: "Does {brand} have SOC 2 or ISO 27001 certification?" },
  { intent: "trust", priority: 2, text: "What is {brand} refund and cancellation policy?" },
  { intent: "trust", priority: 3, text: "How long has {brand} been around?" },
  { intent: "trust", priority: 2, text: "Is {brand} GDPR compliant?" },
  // Comparison (6)
  { intent: "comparison", priority: 1, text: "What is the best alternative to {brand}?" },
  { intent: "comparison", priority: 1, text: "{brand} vs {competitor} which is better?" },
  { intent: "comparison", priority: 2, text: "Why would someone choose {brand} over {competitor}?" },
  { intent: "comparison", priority: 2, text: "What makes {brand} different from competitors?" },
  { intent: "comparison", priority: 1, text: "Should I use {brand} or {competitor} for my company?" },
  { intent: "comparison", priority: 2, text: "Which is better for enterprise: {brand} or {competitor}?" },
];

async function main() {
  console.log("Seeding database...");

  // Seed queries — skip if already seeded
  const existingCount = await prisma.query.count();
  if (existingCount === 0) {
    await prisma.query.createMany({ data: queries });
    console.log(`✓ Created ${queries.length} queries`);
  } else {
    console.log(`✓ ${existingCount} queries already exist — skipping`);
  }

  // Sample brand — update with real client data before launch
  const brand = await prisma.brand.upsert({
    where: { domain: "acme.com" },
    update: {},
    create: {
      name: "Acme",
      domain: "acme.com",
      industry: "project management software",
      description:
        "Acme is a cloud-based project management platform for mid-market teams. It offers task tracking, resource planning, time tracking, and integrations with Slack, GitHub, and Jira.",
      competitorDomains: ["asana.com", "monday.com", "linear.app"],
      clientEmail: "client@acme.com",
    },
  });

  console.log(`✓ Brand seeded: ${brand.name} (id: ${brand.id})`);
  console.log(`  clientEmail: ${brand.clientEmail}`);
  console.log(`  To trigger a run: POST /api/run?brandId=${brand.id}`);
  console.log("\nDone.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
