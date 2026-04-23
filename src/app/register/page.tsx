// src/app/register/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { verifyCode, resendVerificationCode } from '@/app/actions/auth';
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
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const [verifying, setVerifying] = useState(false);
  const [resendStatus, setResendStatus] = useState('');
  const router = useRouter();

  const handlePinChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    // Auto-focus next
    if (value && index < 5) {
      const nextInput = document.getElementById(`pin-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleVerifyPin = async () => {
    const code = pin.join('');
    if (code.length < 6) {
      setError("Lütfen 6 haneli kodu tam girin.");
      return;
    }

    setVerifying(true);
    setError('');
    
    const res = await verifyCode(formData.email, code);
    if (res.error) {
      setError(res.error);
      setVerifying(false);
    } else {
      router.push('/login?verified=true');
    }
  };

  const handleResend = async () => {
    setResendStatus('Gönderiliyor...');
    const res = await resendVerificationCode(formData.email);
    if (res.success) {
      setResendStatus('Kod tekrar gönderildi.');
       setTimeout(() => setResendStatus(''), 3000);
    } else {
      setResendStatus('Hata oluştu.');
    }
  };

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
          <div className="auth-card-modern fade-in" style={{ textAlign: 'center', maxWidth: '500px' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔐</div>
            <h1>Kodu Girin</h1>
            <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '2rem' }}>
              <strong>{formData.email}</strong> adresine 6 haneli bir doğrulama kodu gönderdik. Lütfen kodu aşağıya girin.
            </p>

            {error && <div className="auth-error-modern" style={{ marginBottom: '1.5rem' }}>{error}</div>}

            <div className="pin-input-container">
              {pin.map((digit, idx) => (
                <input
                  key={idx}
                  id={`pin-${idx}`}
                  type="text"
                  maxLength={1}
                  className="pin-box"
                  value={digit}
                  onChange={(e) => handlePinChange(idx, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' && !pin[idx] && idx > 0) {
                      document.getElementById(`pin-${idx - 1}`)?.focus();
                    }
                  }}
                />
              ))}
            </div>

            <button 
              className="auth-btn-modern" 
              style={{ marginTop: '2rem' }}
              onClick={handleVerifyPin}
              disabled={verifying}
            >
              {verifying ? 'Doğrulanıyor...' : 'Hesabı Doğrula'}
            </button>

            <div style={{ marginTop: '1.5rem', fontSize: '0.9rem' }}>
              Kod gelmedi mi? {' '}
              <button 
                onClick={handleResend}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
              >
                {resendStatus || 'Tekrar Gönder'}
              </button>
            </div>
          </div>
        </div>
        <style jsx>{`
          .pin-input-container {
            display: flex;
            gap: 10px;
            justify-content: center;
            margin-bottom: 1rem;
          }
          .pin-box {
            width: 50px;
            height: 60px;
            text-align: center;
            font-size: 1.5rem;
            font-weight: 800;
            border: 2px solid var(--border);
            border-radius: 12px;
            background: white;
            color: var(--primary);
            transition: 0.3s;
          }
          .pin-box:focus {
            border-color: var(--primary);
            outline: none;
            box-shadow: 0 0 0 4px rgba(0, 206, 209, 0.1);
          }
          @media (max-width: 480px) {
            .pin-box { width: 40px; height: 50px; font-size: 1.2rem; }
          }
        `}</style>
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
                onChange={(e) => {
                  // Sadece harf ve boşluk kabul et (Rakam ve sembolleri temizle)
                  const val = e.target.value.replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ\s]/g, '');
                  
                  const formatted = val.split(' ').map(word => 
                    word.charAt(0).toLocaleUpperCase('tr-TR') + word.slice(1)
                  ).join(' ');
                  setFormData({...formData, name: formatted});
                }}
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
