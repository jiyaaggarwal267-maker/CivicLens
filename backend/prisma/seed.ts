import { seedDatabase } from "../src/services/seedService";
import { prisma } from "../src/db/prisma";

seedDatabase()
  .then((result) => {
    console.log(`Seeded ${result.issueCount} civic issues. Main demo issue: CIV-042 (${result.mainDemoIssueId}).`);
  })
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
