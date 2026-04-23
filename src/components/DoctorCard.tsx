'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import ChatWindow from './Chat/ChatWindow';

interface Doctor {
  id: string;
  name: string;
  image: string | null;
  specialty: string | null;
  bio: string | null;
  education: string | null;
  doctorReviews?: { rating: number, comment: string, patient: { name: string | null } }[];
}

export default function DoctorCard({ doctor }: { doctor: Doctor }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleChatStart = () => {
    if (!session) {
      router.push('/login?callbackUrl=/hekimlerimiz');
      return;
    }
    setIsChatOpen(true);
  };

  return (
    <>
      <div className="doctor-card glass fade-in">
        <div className="doctor-image-wrapper">
          <div className="image-overlay"></div>
          <img 
            src={doctor.image || '/doctor-placeholder.jpg'} 
            alt={doctor.name} 
            className="doctor-img"
            style={{width: '100%', height: '100%', objectFit: 'cover'}}
          />
        </div>
        <div className="doctor-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span className="specialty-badge">{doctor.specialty || 'Diş Hekimi'}</span>
            {doctor.doctorReviews && doctor.doctorReviews.length > 0 ? (
              <div className="rating-mini">
                ⭐ { (doctor.doctorReviews.reduce((a, b) => a + b.rating, 0) / doctor.doctorReviews.length).toFixed(1) }
                <span style={{fontSize: '0.7rem', opacity: 0.7, marginLeft: '0.3rem'}}>({doctor.doctorReviews.length})</span>
              </div>
            ) : (
               <div className="rating-mini" style={{backgroundColor: '#f1f5f9', color: '#64748b', borderColor: '#e2e8f0'}}>
                ⭐ Yeni
              </div>
            )}
          </div>
          <h2>{doctor.name}</h2>
          <p className="doctor-bio">{doctor.bio || 'Hekimimiz hakkında bilgi yakında eklenecektir.'}</p>
          <div className="doctor-extra">
            <span className="edu-label">Eğitim:</span>
            <p>{doctor.education || 'Bilgi belirtilmemiş'}</p>
          </div>

          {doctor.doctorReviews && doctor.doctorReviews.length > 0 && (
            <div className="reviews-preview" style={{marginTop: '1rem', borderTop: '1px dashed var(--border)', paddingTop: '1rem'}}>
              <p style={{fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem'}}>Son Hasta Yorumları:</p>
              {doctor.doctorReviews.slice(0, 2).map((rev, i) => (
                <div key={i} style={{fontSize: '0.8rem', background: 'rgba(0,0,0,0.03)', padding: '0.5rem', borderRadius: '8px', marginBottom: '0.5rem'}}>
                  <span style={{color: '#d97706', marginRight: '0.5rem'}}>{'⭐'.repeat(rev.rating)}</span>
                  <p style={{fontStyle: 'italic', color: 'var(--text-muted)'}}>&quot;{rev.comment}&quot;</p>
                </div>
              ))}
            </div>
          )}
          <div className="doctor-social">
            <button 
              className="btn-chat" 
              onClick={handleChatStart}
              style={{
                background: 'var(--primary)',
                color: 'white',
                padding: '0.6rem 1.2rem',
                borderRadius: '50px',
                border: 'none',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                flex: 1,
                justifyContent: 'center',
                transition: '0.3s'
              }}
            >
              <span>💬 Sohbet Başlat</span>
            </button>
            <button className="btn-social">LinkedIn</button>
          </div>
        </div>
      </div>

      {isChatOpen && (
        <ChatWindow 
          receiverId={doctor.id} 
          receiverName={doctor.name} 
          onClose={() => setIsChatOpen(false)} 
        />
      )}
    </>
  );
}
