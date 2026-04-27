import Hero from "@/components/Hero";
import "./page.css";
import { SERVICES } from "@/lib/constants";
import prisma from "@/lib/prisma";

export default async function Home() {
  const reviews = await prisma.review.findMany({
    where: { rating: 5 },
    include: {
      patient: { select: { name: true } },
      appointment: { select: { service: true } }
    },
    take: 10 // Get some latest 5-star reviews
  });

  // Randomly select 2 reviews
  const randomReviews = reviews
    .sort(() => 0.5 - Math.random())
    .slice(0, 2);

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
          {randomReviews.length > 0 ? (
            randomReviews.map((review) => (
              <div key={review.id} className="testimonial-card glass">
                <div className="rating">{'⭐'.repeat(review.rating)}</div>
                <p className="comment">"{review.comment}"</p>
                <div className="patient-info">
                  <div className="patient-avatar">
                    {review.patient.name ? review.patient.name.charAt(0) : 'H'}
                  </div>
                  <div>
                    <span className="patient-name">{review.patient.name || 'Misafir Hasta'}</span>
                    <span className="patient-service">{review.appointment.service}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="no-reviews">Henüz 5 yıldızlı yorum bulunmuyor.</p>
          )}
        </div>
      </section>
    </div>
  );
}


