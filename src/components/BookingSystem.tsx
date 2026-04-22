// src/components/BookingSystem.tsx
'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { createAppointment } from '@/app/actions/booking';

const BookingSystem = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    service: '',
    date: '',
    time: ''
  });

  const services = [
    { id: 'implant', name: 'İmplant Tedavisi', icon: '🦷' },
    { id: 'whitening', name: 'Diş Beyazlatma', icon: '✨' },
    { id: 'checkup', name: 'Genel Muayene', icon: '🛡️' },
    { id: 'ortho', name: 'Ortodonti', icon: '📏' }
  ];

  const timeSlots = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'];

  const handleActionWithAuth = (action: () => void) => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/');
      return;
    }
    action();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    setLoading(true);
    const res = await createAppointment(formData);
    
    if (res.success) {
      setStep(4); // Success step
    } else {
      alert(res.error);
    }
    setLoading(false);
  };

  return (
    <div className="booking-card glass" id="randevu-al">
      <div className="booking-header">
        <h2>Hızlı Randevu</h2>
        <div className="steps-indicator">
          <div className="step-item">
            <div className={`step-dot ${step >= 1 ? 'active' : ''}`}>1</div>
            <span>Hizmet</span>
          </div>
          <div className="step-line"></div>
          <div className="step-item">
            <div className={`step-dot ${step >= 2 ? 'active' : ''}`}>2</div>
            <span>Zaman</span>
          </div>
          <div className="step-line"></div>
          <div className="step-item">
            <div className={`step-dot ${step >= 3 ? 'active' : ''}`}>3</div>
            <span>Bilgiler</span>
          </div>
        </div>
      </div>

      <div className="booking-content">
        {step === 1 && (
          <div className="step-container fade-in">
            <h3>Hangi hizmetle ilgileniyorsunuz?</h3>
            <div className="services-selector">
              {services.map(s => (
                <button 
                  key={s.id}
                  className={`service-option ${formData.service === s.name ? 'selected' : ''}`}
                  onClick={() => {
                    handleActionWithAuth(() => {
                      setFormData({...formData, service: s.name});
                      setStep(2);
                    });
                  }}
                  disabled={status === 'loading'}
                >
                  <span className="s-icon">{s.icon}</span>
                  <span className="s-name">{s.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="step-container fade-in">
            <h3>Tarih ve Saat Seçin</h3>
            <div className="date-time-picker">
              <input 
                type="date" 
                className="date-input"
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                min={new Date().toISOString().split('T')[0]}
              />
              <div className="time-grid">
                {timeSlots.map(t => (
                  <button 
                    key={t}
                    className={`time-slot ${formData.time === t ? 'selected' : ''}`}
                    onClick={() => setFormData({...formData, time: t})}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="step-actions">
              <button className="btn-secondary" onClick={() => setStep(1)}>Geri</button>
              <button 
                className="btn-primary" 
                disabled={!formData.date || !formData.time}
                onClick={() => setStep(3)}
              >
                Devam Et
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <form className="step-container fade-in" onSubmit={handleSubmit}>
            <h3>Randevuyu Onaylayın</h3>
            <div className="summary-info">
              <p><strong>Hasta:</strong> <span style={{ color: 'var(--primary)' }}>{session?.user?.name}</span></p>
              <p><strong>Hizmet:</strong> {formData.service}</p>
              <p><strong>Zaman:</strong> {formData.date} - {formData.time}</p>
            </div>
            <p style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
              Bilgileriniz doğrudur, değil mi?
            </p>
            <div className="step-actions">
              <button type="button" className="btn-secondary" onClick={() => setStep(2)}>Geri</button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Kaydediliyor...' : 'Randevuyu Tamamla'}
              </button>
            </div>
          </form>
        )}

        {step === 4 && (
          <div className="step-container fade-in success-step">
            <div className="success-icon">✅</div>
            <h3>Randevunuz Alındı!</h3>
            <p>Size en kısa sürede ulaşıp randevunuzu onaylayacağız.</p>
            <button className="btn-primary" onClick={() => {
              setStep(1);
              setFormData({name: '', service: '', date: '', time: ''});
            }}>
              Yeni Randevu Al
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingSystem;
