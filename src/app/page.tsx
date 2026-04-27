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
    </div>
  );
}


