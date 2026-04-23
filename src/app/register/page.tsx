// src/app/register/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import '../auth.css';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || 'Kayıt sırasında bir hata oluştu.');
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-page">
         <div className="teeth-background">
          {[...Array(30)].map((_, i) => (
            <div key={i} className="mini-tooth" style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, animationDuration: `${14 + Math.random() * 20}s`, opacity: 0.1 }}>🦷</div>
          ))}
        </div>
        <div className="auth-form-side" style={{ flex: 1 }}>
          <div className="auth-card-modern fade-in" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📧</div>
            <h1>E-postanızı Kontrol Edin</h1>
            <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '2rem' }}>
              Kaydınız başarıyla oluşturuldu! Giriş yapabilmek için <strong>{formData.email}</strong> adresine gönderdiğimiz doğrulama linkine tıklamanız gerekmektedir.
            </p>
            <Link href="/login" className="auth-btn-modern" style={{ display: 'inline-block', textDecoration: 'none' }}>
              Giriş Ekranına Dön
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      {/* Immersive Emoji Teeth Background */}
      <div className="teeth-background">
        {[...Array(30)].map((_, i) => (
          <div 
            key={i} 
            className="mini-tooth"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDuration: `${14 + Math.random() * 20}s`,
              animationDelay: `${-Math.random() * 25}s`,
              opacity: 0.05 + Math.random() * 0.15,
            }}
          >
            🦷
          </div>
        ))}
      </div>

      {/* Left Visual Side */}
      <div className="auth-visual-side">
        <img src="/auth-side.png" alt="Dental Illustration" className="auth-side-img" />
      </div>

      {/* Right Form Side */}
      <div className="auth-form-side">
        <div className="auth-card-modern">
          <header className="auth-header-modern">
            <h1>Kaydol</h1>
            <p>Yeni bir hesap oluşturarak GingivaX ailesine katılın.</p>
          </header>

          {error && <div className="auth-error-modern">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form-modern">
            <div className="input-group-modern">
              <label>Tam Adınız</label>
              <input 
                type="text" 
                className="input-modern"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required 
                placeholder="Örn: Mehmet Öz"
              />
            </div>
            <div className="input-group-modern">
              <label>E-posta Adresi</label>
              <input 
                type="email" 
                className="input-modern"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required 
                placeholder="mehmet@email.com"
              />
            </div>
            <div className="input-group-modern">
              <label>Şifre Belirleyin</label>
              <input 
                type="password" 
                className="input-modern"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required 
                placeholder="••••••••"
              />
            </div>
            <button type="submit" className="auth-btn-modern" disabled={loading}>
              {loading ? 'Kaydediliyor...' : 'Hesabı Oluştur'}
            </button>
          </form>

          <footer className="auth-switch-modern">
            Zaten hesabınız mı var? <Link href="/login">Giriş Yapın</Link>
          </footer>
        </div>
      </div>
    </div>
  );
}
