// src/app/randevu/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { createAppointment } from '@/app/actions/booking';
import { getDoctorsList } from '@/app/actions/doctors';
import { getBookedSlots } from '@/app/actions/appointment';
import './randevu.css';

interface Doctor {
  id: string;
  name: string | null;
}

export default function BookingPage() {
  const { data: session } = useSession();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [availabilityInfo, setAvailabilityInfo] = useState<{booked: string[], isClosed: boolean, workingHours?: any}>({
    booked: [],
    isClosed: false
  });
  const [formData, setFormData] = useState({
    name: '',
// ... (rest of formData)
  });

  // ... (useEffects)

  useEffect(() => {
    async function fetchBooked() {
      if (formData.doctorId && formData.date) {
        const res = await getBookedSlots(formData.doctorId, formData.date);
        setAvailabilityInfo(res as any);
      }
    }
    fetchBooked();
  }, [formData.doctorId, formData.date]);

  const services = [
    { id: 'implant', name: 'İmplant Tedavisi', icon: '🦷' },
    { id: 'whitening', name: 'Diş Beyazlatma', icon: '✨' },
    { id: 'checkup', name: 'Genel Muayene', icon: '🛡️' },
    { id: 'ortho', name: 'Ortodonti', icon: '📏' }
  ];

  const timeSlots = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

// ... (handleSubmit)

// ... inside Step 3 (render):
              {step === 3 && (
                <div className="step-box fade-in">
                  <h3>Zaman Belirleyin</h3>
                  {availabilityInfo.isClosed ? (
                    <div className="closed-warning glass">
                      <p>Hekimimiz bu tarihte hizmet vermemektedir.</p>
                      <button className="btn-back" onClick={() => setStep(2)}>Başka Hekim Seç</button>
                    </div>
                  ) : (
                    <div className="datetime-wrapper">
                      <input 
                        type="date" 
                        className="full-date-input"
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                        min={new Date().toISOString().split('T')[0]}
                      />
                      <div className="full-time-grid">
                        {timeSlots.map(t => {
                          const isBooked = availabilityInfo.booked.includes(t);
                          
                          // Check working hours range
                          let isOutsideHours = false;
                          if (availabilityInfo.workingHours) {
                             const { start, end } = availabilityInfo.workingHours;
                             isOutsideHours = t < start || t >= end;
                          }

                          const disabled = isBooked || isOutsideHours;

                          return (
                            <button 
                              key={t}
                              className={`time-chip ${formData.time === t ? 'selected' : ''} ${disabled ? 'booked' : ''}`}
                              disabled={disabled}
                              onClick={() => setFormData({...formData, time: t})}
                            >
                              {t} {isBooked ? '(Dolu)' : isOutsideHours ? '(Mola)' : ''}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {!availabilityInfo.isClosed && (
                    <div className="step-actions-row">
                      <button className="btn-back" onClick={() => setStep(2)}>Geri</button>
                      <button 
                        className="btn-next" 
                        disabled={!formData.date || !formData.time}
                        onClick={() => setStep(4)}
                      >Devam Et</button>
                    </div>
                  )}
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
