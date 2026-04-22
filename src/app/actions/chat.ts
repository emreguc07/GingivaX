'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

/**
 * Sends a message from the current session user to a receiver.
 */
export async function sendMessage(receiverId: string, content: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { success: false, error: 'Oturum açmanız gerekiyor.' };

  try {
    const senderId = (session.user as any).id;
    
    const message = await prisma.message.create({
      data: {
        content,
        senderId,
        receiverId,
      },
    });

    revalidatePath('/doctor');
    return { success: true, message };
  } catch (error) {
    console.error('Mesaj gönderilemedi:', error);
    return { success: false, error: 'Mesaj gönderilemedi.' };
  }
}

/**
 * Fetches message history between the current user and another user.
 */
export async function getMessages(otherUserId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { success: false, error: 'Oturum açmanız gerekiyor.' };

  try {
    const currentUserId = (session.user as any).id;

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: currentUserId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: currentUserId },
        ],
      },
      orderBy: {
        createdAt: 'asc',
      },
      include: {
        sender: { select: { name: true, image: true, role: true } },
      },
    });

    return { success: true, messages };
  } catch (error) {
    console.error('Mesajlar getirilemedi:', error);
    return { success: false, error: 'Mesajlar getirilemedi.' };
  }
}

/**
 * Gets a list of conversations for the current user.
 */
export async function getChatList() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { success: false, error: 'Oturum açmanız gerekiyor.' };

  try {
    const currentUserId = (session.user as any).id;

    // Get unique other users who have exchanged messages with current user
    const sentTo = await prisma.message.findMany({
      where: { senderId: currentUserId },
      select: { receiverId: true },
      distinct: ['receiverId'],
    });

    const receivedFrom = await prisma.message.findMany({
      where: { receiverId: currentUserId },
      select: { senderId: true },
      distinct: ['senderId'],
    });

    const otherUserIds = Array.from(new Set([
      ...sentTo.map(m => m.receiverId),
      ...receivedFrom.map(m => m.senderId)
    ]));

    const users = await prisma.user.findMany({
      where: { id: { in: otherUserIds } },
      select: { id: true, name: true, image: true, role: true, specialty: true },
    });

    return { success: true, users };
  } catch (error) {
    console.error('Sohbet listesi getirilemedi:', error);
    return { success: false, error: 'Sohbet listesi getirilemedi.' };
  }
}

/**
 * Marks messages from a specific sender as read.
 */
export async function markAsRead(senderId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return;

  try {
    const currentUserId = (session.user as any).id;
    await prisma.message.updateMany({
      where: {
        senderId: senderId,
        receiverId: currentUserId,
        isRead: false,
      },
      data: { isRead: true },
    });
  } catch (error) {
    console.error('Okundu işaretlenemedi:', error);
  }
}

/**
 * Gets the total count of unread messages for the current user.
 */
export async function getUnreadCount() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return 0;

  try {
    const currentUserId = (session.user as any).id;
    return await prisma.message.count({
      where: {
        receiverId: currentUserId,
        isRead: false,
      },
    });
  } catch (error) {
    console.error('Okunmamış mesaj sayısı alınamadı:', error);
    return 0;
  }
}
