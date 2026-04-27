// src/components/Footer.tsx
import Link from 'next/link';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer glass">
      <div className="container footer-content">
        <div className="footer-brand">
          <div className="logo-section">
            <div className="logo-wrapper">
               <img src="/logo.png" alt="GingivaX Logo" width={32} height={32} />
            </div>
            <span className="logo-text">Gingiva<span className="text-primary">X</span></span>
          </div>
          <p className="footer-description">
            Modern diş hekimliği anlayışını teknoloji ile birleştirerek, hastalarımıza en konforlu ve kaliteli hizmeti sunuyoruz.
          </p>

        </div>

        <div className="footer-links">
          <h4>Hızlı Bağlantılar</h4>
          <ul>
            <li><Link href="/">Ana Sayfa</Link></li>
            <li><Link href="/#hizmetler">Hizmetlerimiz</Link></li>
            <li><Link href="/hekimlerimiz">Hekimlerimiz</Link></li>
            <li><Link href="/randevu">Randevu Al</Link></li>
          </ul>
        </div>

        <div className="footer-contact">
          <h4>İletişim</h4>
          <p>📍 Cumhuriyet Cad. No:123, Beşiktaş/İstanbul</p>
          <p>📞 +90 546 473 40 63</p>
          <p>📧 info@gingivax.com</p>
        </div>
      </div>
      <div className="footer-bottom container">
        <p>&copy; {new Date().getFullYear()} GingivaX. Tüm hakları saklıdır.</p>
        <div className="footer-bottom-links">
          <a href="#">Gizlilik Politikası</a>
          <a href="#">KVKK Aydınlatma Metni</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
