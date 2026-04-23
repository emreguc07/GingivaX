// src/app/admin/reviews/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { getAllReviews, deleteReview } from '@/app/actions/reviews';
import Link from 'next/link';
import '../admin.css';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReviews() {
      try {
        const data = await getAllReviews();
        setReviews(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchReviews();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Bu yorumu silmek istediğinize emin misiniz?")) return;
    const res = await deleteReview(id);
    if (res.success) {
      setReviews(reviews.filter(r => r.id !== id));
    }
  };

  if (loading) return <div className="loading-container">Yorumlar yükleniyor...</div>;

  return (
    <div className="admin-layout">
      <div className="container">
        <div className="admin-header">
          <div>
            <h1>Yorum Yönetimi</h1>
            <p>Hastalardan gelen tüm hekim yorumlarını buradan inceleyebilir ve yönetebilirsiniz.</p>
          </div>
          <div className="admin-nav">
            <Link href="/admin">Dashboard</Link>
            <Link href="/admin/doctors">Hekimler</Link>
            <Link href="/admin/reviews" className="active">Yorumlar</Link>
          </div>
        </div>

        <div className="reviews-admin-list">
          {reviews.length === 0 ? (
            <div className="no-data glass">Henüz hiç yorum yapılmamış.</div>
          ) : (
            reviews.map(rev => (
              <div key={rev.id} className="review-admin-card glass fade-in">
                <div className="rev-meta">
                  <div className="rev-user">
                    <strong>👤 {rev.patient.name}</strong>
                    <span>({rev.patient.email})</span>
                  </div>
                  <div className="rev-stars">{'⭐'.repeat(rev.rating)}</div>
                </div>
                
                <div className="rev-context">
                  <p className="rev-comment">&quot;{rev.comment}&quot;</p>
                  <div className="rev-target">
                    <span>👨‍⚕️ Hekim: <strong>{rev.doctor.name}</strong></span>
                    <span>🦷 Hizmet: {rev.appointment.service}</span>
                    <span>📅 Tarih: {rev.appointment.date}</span>
                  </div>
                </div>

                <div className="rev-actions">
                  <button className="btn-delete-rev" onClick={() => handleDelete(rev.id)}>Yorumu Sil</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <style jsx>{`
        .reviews-admin-list { display: flex; flex-direction: column; gap: 1.5rem; }
        .review-admin-card { padding: 2rem; border-radius: 24px; border: 1px solid var(--border); }
        .rev-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px solid var(--border); padding-bottom: 1rem; }
        .rev-user { display: flex; flex-direction: column; }
        .rev-stars { font-size: 1.2rem; }
        .rev-comment { font-size: 1.1rem; line-height: 1.6; color: var(--secondary); font-style: italic; margin-bottom: 1.5rem; }
        .rev-target { display: flex; gap: 2rem; font-size: 0.85rem; color: var(--text-muted); background: #f8fafc; padding: 1rem; border-radius: 12px; }
        .rev-actions { margin-top: 1.5rem; display: flex; justify-content: flex-end; }
        .btn-delete-rev { padding: 0.6rem 1.5rem; background: #fee2e2; color: #dc2626; border: none; border-radius: 10px; font-weight: 700; cursor: pointer; transition: 0.3s; }
        .btn-delete-rev:hover { background: #dc2626; color: white; }
      `}</style>
    </div>
  );
}
