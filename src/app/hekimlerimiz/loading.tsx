// src/app/hekimlerimiz/loading.tsx
import './hekimler.css';

export default function Loading() {
  return (
    <div className="doctors-page-container">
      <div className="container">
        <header className="page-header" style={{opacity: 0.5}}>
          <h1>Hekimlerimiz</h1>
          <p>Alanında uzman ekibimiz yükleniyor...</p>
        </header>
        <div className="loading-container">
          Hekimlerimiz hazırlanıyor...
        </div>
      </div>
    </div>
  );
}
