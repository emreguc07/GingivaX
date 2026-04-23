// src/app/login/page.tsx
'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import '../auth.css';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      if (res.error === "CredentialsSignin") {
        setError("Hatalı e-posta veya şifre.");
      } else {
        setError(res.error);
      }
      setLoading(false);
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  };

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
              animationDuration: `${12 + Math.random() * 18}s`,
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
            <h1>Hoş Geldiniz</h1>
            <p>GingivaX portalına giriş yaparak devam edin.</p>
          </header>

          {error && <div className="auth-error-modern">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form-modern">
            <div className="input-group-modern">
              <label>E-posta Adresi</label>
              <input 
                type="email" 
                className="input-modern"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
                placeholder="isim@gingivax.com"
              />
            </div>
            <div className="input-group-modern">
              <label>Şifreniz</label>
              <input 
                type="password" 
                className="input-modern"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                placeholder="••••••••"
              />
            </div>
            <button type="submit" className="auth-btn-modern" disabled={loading}>
              {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>

          <footer className="auth-switch-modern">
            Hesabınız yok mu? <Link href="/register">Yeni Hesap Oluşturun</Link>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="loading-container">Sayfa Yükleniyor...</div>}>
      <LoginForm />
    </Suspense>
  );
}
