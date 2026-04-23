// src/app/doctor/ayarlar/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { getDoctorAvailability, updateWorkingDay, addOffDate, removeOffDate } from '@/app/actions/settings';
import './ayarlar.css';

const DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

export default function DoctorSettings() {
  const [loading, setLoading] = useState(true);
  const [workingDays, setWorkingDays] = useState<any[]>([]);
  const [offDates, setOffDates] = useState<any[]>([]);
  const [newOffDate, setNewOffDate] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getDoctorAvailability();
        setWorkingDays(data.workingDays);
        setOffDates(data.offDates);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleDayUpdate = async (dayOfWeek: number, startTime: string, endTime: string, isClosed: boolean) => {
    try {
      await updateWorkingDay(dayOfWeek, startTime, endTime, isClosed);
      // Optimistic update
      setWorkingDays(prev => {
        const index = prev.findIndex(d => d.dayOfWeek === dayOfWeek);
        if (index > -1) {
          const next = [...prev];
          next[index] = { ...next[index], startTime, endTime, isClosed };
          return next;
        }
        return [...prev, { dayOfWeek, startTime, endTime, isClosed }];
      });
    } catch (err) {
      alert("Hata oluştu.");
    }
  };

  const handleAddOffDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOffDate) return;
    await addOffDate(newOffDate);
    window.location.reload(); // Simple refresh for now
  };

  const handleRemoveOffDate = async (id: string) => {
    await removeOffDate(id);
    setOffDates(prev => prev.filter(d => d.id !== id));
  };

  if (loading) return <div className="container" style={{padding: '5rem'}}>Yükleniyor...</div>;

  return (
    <div className="container settings-container fade-in">
      <h1>Hekim Ayarları</h1>
      <p>Çalışma saatlerinizi ve tatil günlerinizi buradan yönetebilirsiniz.</p>

      <div className="settings-grid">
        <section className="settings-card glass">
          <h2>Haftalık Çalışma Düzeni</h2>
          <div className="working-days-list">
            {[1, 2, 3, 4, 5, 6, 0].map(dayIdx => {
              const config = workingDays.find(d => d.dayOfWeek === dayIdx) || {
                startTime: '09:00',
                endTime: '18:00',
                isClosed: false
              };

              return (
                <div key={dayIdx} className="day-row">
                  <span className="day-name">{DAYS[dayIdx]}</span>
                  <div className="time-inputs">
                    <input 
                      type="time" 
                      value={config.startTime} 
                      disabled={config.isClosed}
                      onChange={(e) => handleDayUpdate(dayIdx, e.target.value, config.endTime, config.isClosed)}
                    />
                    <span>-</span>
                    <input 
                      type="time" 
                      value={config.endTime} 
                      disabled={config.isClosed}
                      onChange={(e) => handleDayUpdate(dayIdx, config.startTime, e.target.value, config.isClosed)}
                    />
                  </div>
                  <label className="day-toggle">
                    <input 
                      type="checkbox" 
                      checked={config.isClosed}
                      onChange={(e) => handleDayUpdate(dayIdx, config.startTime, config.endTime, e.target.checked)}
                    />
                    Kapalı
                  </label>
                </div>
              );
            })}
          </div>
        </section>

        <section className="settings-card glass">
          <h2>Tatil ve İzin Günleri</h2>
          <div className="off-dates-section">
            <form className="add-off-date-form" onSubmit={handleAddOffDate}>
              <input 
                type="date" 
                value={newOffDate} 
                onChange={(e) => setNewOffDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
              <button type="submit" className="btn-primary">Ekle</button>
            </form>

            <div className="off-dates-list">
              {offDates.length === 0 ? (
                <p className="no-data">Henüz eklenmiş bir izin günü yok.</p>
              ) : (
                offDates.map(d => (
                  <div key={d.id} className="off-date-item">
                    <span>{d.date}</span>
                    <button className="btn-remove-date" onClick={() => handleRemoveOffDate(d.id)}>×</button>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
