import { getPublicArticles } from '@/app/actions/blog';
import Link from 'next/link';
import './blog.css';

export const metadata = {
  title: 'Sağlık Rehberi | GingivaX',
  description: 'Ağız ve diş sağlığı hakkında uzman hekimlerimizden güncel makaleler ve ipuçları.',
};

export default async function BlogPage() {
  const res = await getPublicArticles();
  const articles = res.success ? res.articles : [];

  return (
    <div className="blog-container">
      <div className="container">
        <div className="blog-header fade-in">
          <h1>Sağlık Rehberi</h1>
          <p>Uzman hekimlerimizden ağız ve diş sağlığına dair en güncel bilgiler.</p>
        </div>

        <div className="blog-grid">
          {articles?.length === 0 ? (
            <div className="glass" style={{ padding: '3rem', textAlign: 'center', gridColumn: '1 / -1' }}>
              <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>Henüz yayınlanmış bir makale bulunmuyor.</p>
            </div>
          ) : (
            articles?.map((article: any, index: number) => (
              <Link href={`/blog/${article.slug}`} key={article.id} className="blog-card glass fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                {article.imageUrl ? (
                  <img src={article.imageUrl} alt={article.title} className="blog-card-img" />
                ) : (
                  <div className="blog-card-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>
                    🦷
                  </div>
                )}
                
                <div className="blog-card-content">
                  <h3 className="blog-card-title">{article.title}</h3>
                  <p className="blog-card-excerpt">
                    {article.content.length > 120 ? article.content.substring(0, 120) + '...' : article.content}
                  </p>
                  
                  <div className="blog-card-footer">
                    <div className="blog-author">
                      {article.author?.image ? (
                        <img src={article.author.image} alt={article.author.name || ''} style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
                          {article.author?.name?.charAt(0) || 'D'}
                        </div>
                      )}
                      <span>{article.author?.name || 'GingivaX Hekimi'}</span>
                    </div>
                    <div className="blog-date">
                      {new Date(article.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
