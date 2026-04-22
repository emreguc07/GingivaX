// src/app/randevu/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { createAppointment } from '@/app/actions/booking';
import { getDoctorsList } from '@/app/actions/doctors';
import './randevu.css';

interface Doctor {
  id: string;
  name: string;
}

export default function BookingPage() {
  const { data: session } = useSession();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    service: '',
    doctorId: '',
    doctorName: '',
    date: '',
    time: ''
  });

  // Auto-fill name when session is available
  useEffect(() => {
    if (session?.user?.name) {
      setFormData(prev => ({ ...prev, name: session.user.name as string }));
    }
  }, [session]);

  useEffect(() => {
    async function fetchDoctors() {
      const res = await getDoctorsList();
      if (res.success) {
        setDoctors(res.doctors || []);
      }
    }
    fetchDoctors();
  }, []);

  const services = [
    { id: 'implant', name: 'İmplant Tedavisi', icon: '🦷' },
    { id: 'whitening', name: 'Diş Beyazlatma', icon: '✨' },
    { id: 'checkup', name: 'Genel Muayene', icon: '🛡️' },
    { id: 'ortho', name: 'Ortodonti', icon: '📏' }
  ];

  const timeSlots = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // @ts-ignore
    const res = await createAppointment(formData);
    
    if (res.success) {
      setStep(5);
    } else {
      alert(res.error);
    }
    setLoading(false);
  };

  return (
    <div className="full-booking-page">
      <div className="container">
        <div className="booking-layout glass fade-in">
          <div className="booking-sidebar">
            <h2>Neden GingivaX?</h2>
            <ul className="benefits-list">
              <li>✓ Uzman Hekim Kadrosu</li>
              <li>✓ Modern Teknoloji</li>
              <li>✓ Hijyenik Ortam</li>
              <li>✓ Hasta Odaklı Yaklaşım</li>
            </ul>
            <div className="clinic-mini-card">
              <p>📍 Cumhuriyet Cad. No:123</p>
              <p>📞 +90 555 123 45 67</p>
            </div>
          </div>

          <div className="booking-main">
            <div className="booking-flow-header">
              <h1>Randevu Oluştur</h1>
              <div className="steps-progress">
                {[1, 2, 3, 4].map(s => (
                  <div key={s} className={`progress-dot ${step >= s ? 'active' : ''}`}></div>
                ))}
              </div>
            </div>

            <div className="flow-content">
              {step === 1 && (
                <div className="step-box fade-in">
                  <h3>Hizmet Seçiniz</h3>
                  <div className="services-grid-booking">
                    {services.map(s => (
                      <button 
                        key={s.id}
                        className={`service-btn ${formData.service === s.name ? 'selected' : ''}`}
                        onClick={() => {
                          setFormData({...formData, service: s.name});
                          setStep(2);
                        }}
                      >
                        <span className="btn-icon">{s.icon}</span>
                        <span className="btn-label">{s.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="step-box fade-in">
                  <h3>Hekim Seçiniz</h3>
                  <p className="step-hint">Randevunuzu hangi hekimimizden almak istersiniz?</p>
                  <div className="doctors-list-booking">
                    {doctors.length === 0 ? (
                      <p>Kayıtlı hekim bulunamadı.</p>
                    ) : (
                      doctors.map(doc => (
                        <button 
                          key={doc.id}
                          className={`doctor-option-btn ${formData.doctorId === doc.id ? 'selected' : ''}`}
                          onClick={() => {
                            setFormData({...formData, doctorId: doc.id, doctorName: doc.name || ''});
                            setStep(3);
                          }}
                        >
                          <div className="doc-avatar">{doc.name?.charAt(0)}</div>
                          <span>{doc.name}</span>
                        </button>
                      ))
                    )}
                  </div>
                  <button className="btn-back" onClick={() => setStep(1)}>Geri</button>
                </div>
              )}

              {step === 3 && (
                <div className="step-box fade-in">
                  <h3>Zaman Belirleyin</h3>
                  <div className="datetime-wrapper">
                    <input 
                      type="date" 
                      className="full-date-input"
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      min={new Date().toISOString().split('T')[0]}
                    />
                    <div className="full-time-grid">
                      {timeSlots.map(t => (
                        <button 
                          key={t}
                          className={`time-chip ${formData.time === t ? 'selected' : ''}`}
                          onClick={() => setFormData({...formData, time: t})}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="step-actions-row">
                    <button className="btn-back" onClick={() => setStep(2)}>Geri</button>
                    <button 
                      className="btn-next" 
                      disabled={!formData.date || !formData.time}
                      onClick={() => setStep(4)}
                    >Devam Et</button>
                  </div>
                </div>
              )}

              {step === 4 && (
                <form className="step-box fade-in" onSubmit={handleSubmit}>
                  <h3>Randevuyu Onaylayın</h3>
                  <div className="summary-card">
                    <div className="summary-item">
                      <label>Hasta:</label>
                      <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{session?.user?.name}</span>
                    </div>
                    <div className="summary-item">
                      <label>Hizmet:</label>
                      <span>{formData.service}</span>
                    </div>
                    <div className="summary-item">
                      <label>Hekim:</label>
                      <span>{formData.doctorName}</span>
                    </div>
                    <div className="summary-item">
                      <label>Tarih & Saat:</label>
                      <span>{formData.date} - {formData.time}</span>
                    </div>
                  </div>
                  <p className="confirm-text">Bilgileriniz yukarıdaki gibidir. Onaylıyor musunuz?</p>
                  <div className="step-actions-row">
                    <button type="button" className="btn-back" onClick={() => setStep(3)}>Geri</button>
                    <button type="submit" className="btn-submit" disabled={loading}>
                      {loading ? 'İşleniyor...' : 'Randevuyu Tamamla'}
                    </button>
                  </div>
                </form>
              )}

              {step === 5 && (
                <div className="step-box fade-in success-view">
                  <div className="success-lottie">✅</div>
                  <h3>Randevu Talebiniz Alındı!</h3>
                  <p>Hekimimiz <strong>{formData.doctorName}</strong> talebinizi inceleyip onaylayacaktır. Durumu profilinizden takip edebilirsiniz.</p>
                  <div className="success-actions">
                    <button className="btn-primary" onClick={() => window.location.href = '/profile'}>Randevularıma Git</button>
                    <button className="btn-secondary" onClick={() => (window.location.href = '/')}>Ana Sayfa</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
