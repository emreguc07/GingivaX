// src/components/Hero.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import './Hero.css';

const Hero = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const handleBookingClick = (e: React.MouseEvent) => {
    // Mobil Safari gibi hızlı tarayıcılarda linke tıklamayı tamamen durdurup 
    // kontrolü JavaScript'e alıyoruz.
    e.preventDefault();
    
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/randevu');
    } else {
      router.push('/randevu');
    }
  };

  return (
    <section className="hero">
      <div className="container hero-content fade-in">
        <div className="hero-text">
          <span className="badge">Gülüşünüz Bizim İçin Değerli</span>
          <h1>Geleceğin Diş Sağlığı <br /> <span className="highlight">GingivaX</span> ile Başlıyor</h1>
          <p>Modern teknoloji, uzman hekim kadrosu ve konforlu klinik ortamıyla hayalinizdeki gülüşe kavuşun.</p>
          <div className="hero-actions">
            <button 
              className="btn-primary btn-lg"
              onClick={handleBookingClick}
              disabled={status === 'loading'}
            >
              Hemen Randevu Al
            </button>
            <button className="btn-secondary">Tedavilerimizi İnceleyin</button>
          </div>
          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-value">15k+</span>
              <span className="stat-label">Mutlu Hasta</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">20+</span>
              <span className="stat-label">Uzman Hekim</span>
            </div>
          </div>
        </div>
        <div className="hero-image-container">
          <div className="hero-blob"></div>
          <div className="hero-tooth-container fade-in">
            <img 
              src="/hero-tooth.png" 
              alt="GingivaX Diş Sağlığı" 
              className="hero-tooth-img" 
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
