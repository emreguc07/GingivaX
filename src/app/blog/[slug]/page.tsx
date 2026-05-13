import { getArticleBySlug } from '@/app/actions/blog';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import '../blog.css';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  // Await the entire params object before destructuring its properties
  const awaitedParams = await params;
  const res = await getArticleBySlug(awaitedParams.slug);
  if (!res.success || !res.article) {
    return { title: 'Makale Bulunamadı | GingivaX' };
  }
  return {
    title: `${res.article.title} | GingivaX Sağlık Rehberi`,
    description: res.article.content.substring(0, 150) + '...',
  };
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  // Await the entire params object before destructuring its properties
  const awaitedParams = await params;
  const res = await getArticleBySlug(awaitedParams.slug);
  
  if (!res.success || !res.article) {
    notFound();
  }

  const { article } = res;

  return (
    <div className="article-container fade-in">
      <Link href="/blog" className="btn-back" style={{ display: 'inline-block', marginBottom: '2rem', color: 'var(--primary)' }}>
        ← Tüm Makalelere Dön
      </Link>

      {article.imageUrl && (
        <img src={article.imageUrl} alt={article.title} className="article-hero-img" />
      )}

      <div className="article-header">
        <h1 className="article-title">{article.title}</h1>
        
        <div className="article-meta">
          <div className="blog-author" style={{ fontSize: '1rem' }}>
            {article.author?.image ? (
              <img src={article.author.image} alt={article.author.name || ''} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
                {article.author?.name?.charAt(0) || 'D'}
              </div>
            )}
            <span>{article.author?.name || 'GingivaX Hekimi'}</span>
            {article.author?.specialty && <span style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>({article.author.specialty})</span>}
          </div>
          <div className="blog-date">
            {new Date(article.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>

      <div className="article-content">
        {article.content}
      </div>
    </div>
  );
}
