// src/app/verify/page.tsx
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { verifyEmail } from '@/app/actions/auth';
import Link from 'next/link';

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('E-postanız doğrulanıyor...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Doğrulama kodu eksik.');
      return;
    }

    const performVerification = async () => {
      const res = await verifyEmail(token);
      if (res.error) {
        setStatus('error');
        setMessage(res.error);
      } else {
        setStatus('success');
        setMessage(res.success || '');
      }
    };

    performVerification();
  }, [token]);

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '500px',
        width: '100%',
        background: 'white',
        padding: '40px',
        borderRadius: '30px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
        textAlign: 'center',
        border: '1px solid #f0f0f0'
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '20px' }}>
          {status === 'loading' && '⌛'}
          {status === 'success' && '✅'}
          {status === 'error' && '❌'}
        </div>
        
        <h1 style={{ fontSize: '1.8rem', marginBottom: '15px', color: '#333' }}>
          {status === 'loading' ? 'Doğrulanıyor' : status === 'success' ? 'Harika!' : 'Hata Oluştu'}
        </h1>
        
        <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '30px' }}>
          {message}
        </p>

        {status !== 'loading' && (
          <Link href="/login" style={{
            background: 'var(--primary)',
            color: 'white',
            padding: '12px 30px',
            borderRadius: '50px',
            textDecoration: 'none',
            fontWeight: '700',
            display: 'inline-block',
            transition: '0.3s'
          }}>
            Giriş Yap
          </Link>
        )}
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div>Yükleniyor...</div>}>
      <VerifyContent />
    </Suspense>
  );
}
