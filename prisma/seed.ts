import { PrismaClient, UserRole } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...\n");

  // ── Admin User ──
  const adminPassword = await bcrypt.hash("admin123!", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@glamworldface.com" },
    update: {},
    create: {
      name: "GlamWorld Admin",
      email: "admin@glamworldface.com",
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
      emailVerified: new Date(),
    },
  });
  console.log(`  ✓ Admin user: ${admin.email} (role: ${admin.role})`);

  // ── Demo Contestant ──
  const contestantPassword = await bcrypt.hash("contestant123!", 12);
  const contestant = await prisma.user.upsert({
    where: { email: "demo@glamworldface.com" },
    update: {},
    create: {
      name: "Jane Doe",
      email: "demo@glamworldface.com",
      passwordHash: contestantPassword,
      role: UserRole.CONTESTANT,
      emailVerified: new Date(),
      contestant: {
        create: {
          bio: "Aspiring model and beauty pageant enthusiast from New York.",
          country: "United States",
          gender: "Female",
          height: 170,
          weight: 58,
          hairColor: "Brunette",
          eyeColor: "Brown",
          instagram: "@janedoe_glam",
        },
      },
    },
  });
  console.log(`  ✓ Contestant: ${contestant.email} (role: ${contestant.role})`);

  // ── Public User ──
  const publicPassword = await bcrypt.hash("public123!", 12);
  const publicUser = await prisma.user.upsert({
    where: { email: "viewer@glamworldface.com" },
    update: {},
    create: {
      name: "Public Viewer",
      email: "viewer@glamworldface.com",
      passwordHash: publicPassword,
      role: UserRole.PUBLIC,
      emailVerified: new Date(),
    },
  });
  console.log(`  ✓ Public user: ${publicUser.email} (role: ${publicUser.role})`);

  // ── Demo Competition ──
  const competition = await prisma.competition.upsert({
    where: { id: "demo-comp-001" },
    update: {},
    create: {
      id: "demo-comp-001",
      title: "Spring Beauty Gala 2026",
      description:
        "Join the most prestigious beauty pageant of the season. Compete in front of our expert jury panel and showcase your talent, style, and confidence.",
      competitionType: "JURY",
      startDate: new Date("2026-06-01"),
      endDate: new Date("2026-06-30"),
      status: "UPCOMING",
    },
  });
  console.log(`  ✓ Competition: ${competition.title}`);

  const publicComp = await prisma.competition.upsert({
    where: { id: "demo-comp-002" },
    update: {},
    create: {
      id: "demo-comp-002",
      title: "People's Choice Awards 2026",
      description:
        "A public voting competition where the audience decides. Get votes from fans and supporters to climb the leaderboard!",
      competitionType: "PUBLIC_VOTING",
      startDate: new Date("2026-07-01"),
      endDate: new Date("2026-07-31"),
      status: "UPCOMING",
    },
  });
  console.log(`  ✓ Competition: ${publicComp.title}`);

  console.log("\n✅ Seed complete!");
  console.log("\n📋 Test credentials:");
  console.log("   Admin:      admin@glamworldface.com / admin123!");
  console.log("   Contestant: demo@glamworldface.com / contestant123!");
  console.log("   Public:     viewer@glamworldface.com / public123!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
