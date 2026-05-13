'use client';

import { Camera, Clock, Stethoscope, Sparkles } from 'lucide-react';
import './dr-perio.css';

export default function DrPerioPage() {
  const handleTryClick = () => {
    // Find the toggle button in the DOM and click it to open the chat
    const toggleBtn = document.querySelector('.perio-toggle-btn') as HTMLButtonElement;
    if (toggleBtn) {
      toggleBtn.click();
    }
  };

  return (
    <div className="perio-page-container">
      {/* Hero Section */}
      <section className="perio-hero">
        <div className="perio-hero-content fade-in">
          <h1>
            Geleceğin Asistanıyla Tanışın: 
            <span>Dr. Perio ✨</span>
          </h1>
          <p>
            GingivaX vizyonunun en yeni parçası olan Dr. Perio, yapay zeka destekli akıllı klinik asistanınızdır. Randevu öncesi şikayetlerinizi dinler, dişlerinizin fotoğrafını analiz eder ve sizi en doğru diş hekimliği uzmanlığına yönlendirir.
          </p>
          <button className="btn-primary" onClick={handleTryClick} style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
            Hemen Ücretsiz Deneyin
          </button>
        </div>
        <div className="perio-hero-image fade-in" style={{ animationDelay: '0.2s' }}>
          <img src="/dr-perio.png" alt="Dr. Perio Yapay Zeka Asistanı" />
        </div>
      </section>

      {/* Features Section */}
      <section className="perio-features-section fade-in" style={{ animationDelay: '0.4s' }}>
        <h2 className="section-title">Neden Dr. Perio?</h2>
        
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <Camera size={36} />
            </div>
            <h3>Fotoğraflı Ön Değerlendirme</h3>
            <p>
              Ağzınızda fark ettiğiniz bir sorunun (çürük, diş eti çekilmesi vb.) fotoğrafını çekip yükleyin. Gelişmiş yapay zeka modelimiz saniyeler içinde görseli analiz edip size bilgi versin.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <Stethoscope size={36} />
            </div>
            <h3>Akıllı Klinik Yönlendirme</h3>
            <p>
              "Hangi bölüme gitmeliyim?" derdine son. Dr. Perio şikayetinizi dinleyerek sizi doğrudan Periodontoloji, Ortodonti veya Çene Cerrahisi gibi en doğru birime yönlendirir.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <Clock size={36} />
            </div>
            <h3>7/24 Kesintisiz Destek</h3>
            <p>
              Gecenin bir yarısı dişiniz mi ağrıdı? Kliniğimiz kapalı olsa bile Dr. Perio her an yanınızda. Sorularınızı yanıtlar ve sabah için en uygun adıma karar vermenizi sağlar.
            </p>
          </div>
        </div>
      </section>

      {/* Try It Section */}
      <section className="try-it-section fade-in" style={{ animationDelay: '0.6s' }}>
        <h2>Hazır mısınız?</h2>
        <p>Yenilikçi diş sağlığı deneyimine hemen adım atın.</p>
        <button className="try-btn" onClick={handleTryClick}>
          <Sparkles className="inline mr-2" size={20} /> Sohbeti Başlat
        </button>
      </section>
    </div>
  );
}
