// src/lib/tokens.ts
import { v4 as uuidv4 } from "uuid";
import { prisma } from "./prisma";

export const generateVerificationToken = async (email: string) => {
  // Generate a random 6-digit code
  const token = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = new Date(new Date().getTime() + 3600 * 1000); // 1 hour

  const existingToken = await prisma.verificationToken.findFirst({
    where: { email }
  });

  if (existingToken) {
    await prisma.verificationToken.delete({
      where: { id: existingToken.id }
    });
  }

  const verficationToken = await prisma.verificationToken.create({
    data: {
      email,
      token,
      expires
    }
  });

  return verficationToken;
};
