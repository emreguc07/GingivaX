// src/lib/activity.ts
import { prisma } from "./prisma";

export async function logActivity(type: string, content: string) {
  try {
    await prisma.activity.create({
      data: { type, content }
    });
  } catch (error) {
    console.error("LOG_ACTIVITY_ERROR", error);
  }
}
