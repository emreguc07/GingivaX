'use client';

import { useState, useEffect } from 'react';
import { getDoctorArticles, createArticle, toggleArticlePublish, deleteArticle } from '@/app/actions/blog';
import Link from 'next/link';

export default function DoctorBlogPanel() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({ title: '', content: '', imageUrl: '' });

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    setLoading(true);
    const res = await getDoctorArticles();
    if (res.success) {
      setArticles(res.articles || []);
    }
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await createArticle(formData);
    if (res.success) {
      setFormData({ title: '', content: '', imageUrl: '' });
      setIsCreating(false);
      fetchArticles();
    } else {
      alert(res.error);
    }
    setLoading(false);
  };

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    const res = await toggleArticlePublish(id, !currentStatus);
    if (res.success) {
      setArticles(articles.map(a => a.id === id ? { ...a, published: !currentStatus } : a));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Makaleyi silmek istediğinize emin misiniz?')) return;
    const res = await deleteArticle(id);
    if (res.success) {
      setArticles(articles.filter(a => a.id !== id));
    }
  };

  return (
    <div className="container" style={{ padding: '4rem 0' }}>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--primary)' }}>Makalelerim</h1>
          <p style={{ color: 'var(--text-muted)' }}>Sağlık rehberinde yayınlanan yazılarınızı yönetin.</p>
        </div>
        <div className="flex gap-4">
          <Link href="/doctor" className="btn-outline">Panoya Dön</Link>
          <button className="btn-primary" onClick={() => setIsCreating(!isCreating)}>
            {isCreating ? 'İptal' : '+ Yeni Makale'}
          </button>
        </div>
      </div>

      {isCreating && (
        <form onSubmit={handleCreate} className="glass p-6 rounded-2xl mb-8 fade-in">
          <h2 className="text-xl font-bold mb-4">Yeni Makale Oluştur</h2>
          <div className="mb-4">
            <label className="block mb-2 font-bold">Başlık</label>
            <input 
              type="text" 
              required
              className="w-full p-3 rounded-lg border bg-transparent"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
            />
          </div>
          <div className="mb-4">
            <label className="block mb-2 font-bold">Görsel URL (İsteğe Bağlı)</label>
            <input 
              type="url" 
              className="w-full p-3 rounded-lg border bg-transparent"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
              value={formData.imageUrl}
              onChange={e => setFormData({...formData, imageUrl: e.target.value})}
              placeholder="https://..."
            />
          </div>
          <div className="mb-4">
            <label className="block mb-2 font-bold">İçerik</label>
            <textarea 
              required
              rows={10}
              className="w-full p-3 rounded-lg border bg-transparent"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
              value={formData.content}
              onChange={e => setFormData({...formData, content: e.target.value})}
            ></textarea>
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </form>
      )}

      {loading && !isCreating ? (
        <p>Yükleniyor...</p>
      ) : articles.length === 0 ? (
        <p>Henüz hiç makale yazmadınız.</p>
      ) : (
        <div className="grid gap-4">
          {articles.map(article => (
            <div key={article.id} className="glass p-6 rounded-2xl flex justify-between items-center">
              <div>
                <h3 className="font-bold text-xl">{article.title}</h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {new Date(article.createdAt).toLocaleDateString('tr-TR')} • {article.published ? '🟢 Yayında' : '🟡 Taslak'}
                </p>
              </div>
              <div className="flex gap-2">
                <Link href={`/blog/${article.slug}`} target="_blank" className="btn-outline px-3 py-1">Görüntüle</Link>
                <button 
                  onClick={() => handleTogglePublish(article.id, article.published)}
                  className="px-3 py-1 rounded"
                  style={{ background: article.published ? '#f59e0b' : '#10b981', color: 'white' }}
                >
                  {article.published ? 'Yayından Kaldır' : 'Yayınla'}
                </button>
                <button 
                  onClick={() => handleDelete(article.id)}
                  className="px-3 py-1 rounded"
                  style={{ background: '#ef4444', color: 'white' }}
                >
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
