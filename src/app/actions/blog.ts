'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Utility function to generate a URL-friendly slug
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export async function createArticle(data: { title: string, content: string, imageUrl?: string, published?: boolean }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'DOCTOR') {
      return { success: false, error: 'Yetkisiz erişim' };
    }

    const slug = generateSlug(data.title) + '-' + Date.now().toString().slice(-4);

    const article = await prisma.article.create({
      data: {
        title: data.title,
        slug,
        content: data.content,
        imageUrl: data.imageUrl || null,
        published: data.published || false,
        authorId: (session.user as any).id
      }
    });

    return { success: true, article };
  } catch (error: any) {
    console.error('Error creating article:', error);
    return { success: false, error: error.message };
  }
}

export async function getDoctorArticles() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'DOCTOR') {
      return { success: false, error: 'Yetkisiz erişim' };
    }

    const articles = await prisma.article.findMany({
      where: { authorId: (session.user as any).id },
      orderBy: { createdAt: 'desc' }
    });

    return { success: true, articles };
  } catch (error: any) {
    console.error('Error fetching doctor articles:', error);
    return { success: false, error: error.message };
  }
}

export async function getPublicArticles() {
  try {
    const articles = await prisma.article.findMany({
      where: { published: true },
      include: {
        author: {
          select: { name: true, specialty: true, image: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return { success: true, articles };
  } catch (error: any) {
    console.error('Error fetching public articles:', error);
    return { success: false, error: error.message };
  }
}

export async function getArticleBySlug(slug: string) {
  try {
    const article = await prisma.article.findUnique({
      where: { slug },
      include: {
        author: {
          select: { name: true, specialty: true, image: true }
        }
      }
    });

    if (!article) return { success: false, error: 'Makale bulunamadı' };
    return { success: true, article };
  } catch (error: any) {
    console.error('Error fetching article:', error);
    return { success: false, error: error.message };
  }
}

export async function toggleArticlePublish(id: string, published: boolean) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'DOCTOR') {
      return { success: false, error: 'Yetkisiz erişim' };
    }

    // Verify ownership
    const article = await prisma.article.findUnique({ where: { id } });
    if (!article || article.authorId !== (session.user as any).id) {
      return { success: false, error: 'Bu işlem için yetkiniz yok' };
    }

    await prisma.article.update({
      where: { id },
      data: { published }
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error toggling article publish status:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteArticle(id: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'DOCTOR') {
      return { success: false, error: 'Yetkisiz erişim' };
    }

    // Verify ownership
    const article = await prisma.article.findUnique({ where: { id } });
    if (!article || article.authorId !== (session.user as any).id) {
      return { success: false, error: 'Bu işlem için yetkiniz yok' };
    }

    await prisma.article.delete({ where: { id } });

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting article:', error);
    return { success: false, error: error.message };
  }
}
