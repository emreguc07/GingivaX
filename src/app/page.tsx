import Hero from "@/components/Hero";
import "./page.css";
import { SERVICES } from "@/lib/constants";

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
          {SERVICES.map(service => (
            <div key={service.id} className="service-card glass">
              <div className="service-icon">{service.icon}</div>
              <h3>{service.name}</h3>
              <p>{service.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="yorumlar" className="testimonials-section container">
        <div className="section-header">
          <h2>Hasta Yorumları</h2>
          <p>Binlerce mutlu hastamızın deneyimlerine göz atın.</p>
        </div>
        
        <div className="testimonials-grid">
          <div className="testimonial-card glass">
            <div className="rating">⭐⭐⭐⭐⭐</div>
            <p className="comment">"İmplant tedavisi için geldim, süreç beklediğimden çok daha rahat geçti. Tüm ekibe teşekkürler!"</p>
            <div className="patient-info">
              <div className="patient-avatar">A</div>
              <div>
                <span className="patient-name">Ahmet Y.</span>
                <span className="patient-service">İmplant Tedavisi</span>
              </div>
            </div>
          </div>
          
          <div className="testimonial-card glass">
            <div className="rating">⭐⭐⭐⭐⭐</div>
            <p className="comment">"Diş beyazlatma seansı sonrası gülüşüm tamamen değişti. Çok memnun kaldım, herkese tavsiye ederim."</p>
            <div className="patient-info">
              <div className="patient-avatar">S</div>
              <div>
                <span className="patient-name">Selin K.</span>
                <span className="patient-service">Diş Beyazlatma</span>
              </div>
            </div>
          </div>

          <div className="testimonial-card glass">
            <div className="rating">⭐⭐⭐⭐⭐</div>
            <p className="comment">"Kanal tedavisi korkumu bu klinik sayesinde yendim. Hiç acı hissetmedim, doktorlar çok ilgili."</p>
            <div className="patient-info">
              <div className="patient-avatar">M</div>
              <div>
                <span className="patient-name">Murat B.</span>
                <span className="patient-service">Kanal Tedavisi</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}


