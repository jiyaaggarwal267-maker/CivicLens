import { prisma } from "../db/prisma";

export async function nextIssueCode(): Promise<string> {
  const count = await prisma.civicIssue.count();
  const next = count + 1;
  return `CIV-${String(next).padStart(3, "0")}`;
}
