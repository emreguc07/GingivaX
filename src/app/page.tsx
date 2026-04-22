import Hero from "@/components/Hero";
import "./page.css";

export default function Home() {
  return (
    <div className="page-wrapper">
      <Hero />
      
      <section id="hizmetler" className="services-section container">
        <div className="section-header">
          <h2>Klinik Hizmetlerimiz</h2>
          <p>En son teknoloji ve uzman kadromuzla yanınızdayız.</p>
        </div>
        
        <div className="services-grid">
          <div className="service-card glass">
            <div className="service-icon">🦷</div>
            <h3>İmplant Tedavisi</h3>
            <p>Eksik dişlerinizi en doğal ve sağlam şekilde tamamlıyoruz.</p>
          </div>
          <div className="service-card glass">
            <div className="service-icon">✨</div>
            <h3>Diş Beyazlatma</h3>
            <p>Daha parlak ve estetik bir gülüşe sadece bir seansta kavuşun.</p>
          </div>
          <div className="service-card glass">
            <div className="service-icon">🛡️</div>
            <h3>Genel Muayene</h3>
            <p>Düzenli kontrollerle diş sağlığınızı ömür boyu koruyun.</p>
          </div>
        </div>
      </section>

    </div>
  );
}


