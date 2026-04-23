// src/app/profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { getProfileData, updateUserProfile } from '@/app/actions/profile';
import './profile.css';

interface Appointment {
  id: number;
  service: string;
  date: string;
  time: string;
  status: string;
  createdAt: string;
  doctor?: { name: string };
}

interface UserProfile {
  name: string | null;
  email: string | null;
  role: string;
  phone: string | null;
  createdAt: string;
}

export default function ProfilePage() {
  const [data, setData] = useState<{ user: UserProfile, appointments: Appointment[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const profileData = await getProfileData();
        setData(profileData as any);
        if (profileData?.user) {
          setEditForm({
            name: profileData.user.name || '',
            phone: (profileData.user as any).phone || ''
          });
        }
      } catch (err: any) {
        setError(err.message || 'Veriler yüklenemedi.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await updateUserProfile(editForm);
    if (res.success) {
      if (data) {
        setData({
          ...data,
          user: { ...data.user, name: editForm.name, phone: editForm.phone }
        });
      }
      setIsEditing(false);
    } else {
      alert(res.error);
    }
    setSaving(false);
  };

  if (loading) return <div className="loading-container">Yükleniyor...</div>;
  if (error) return <div className="error-container">{error}</div>;
  if (!data) return null;

  return (
    <div className="profile-page-wrapper">
      <div className="container">
        <header className="profile-header fade-in">
          <div className="user-info-card glass">
            <div className="avatar-placeholder">
              {data.user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              {!isEditing ? (
                <>
                  <div className="flex-row">
                    <h1>{data.user.name}</h1>
                    <button className="btn-edit-inline" onClick={() => setIsEditing(true)}>Düzenle</button>
                  </div>
                  <p className="email">{data.user.email}</p>
                  <p className="phone">📞 {data.user.phone || 'Telefon eklenmemiş'}</p>
                  <span className="role-tag">{data.user.role === 'DOCTOR' ? 'Doktor' : 'Hasta'}</span>
                  <p className="join-date">Üyelik Tarihi: {new Date(data.user.createdAt).toLocaleDateString('tr-TR')}</p>
                </>
              ) : (
                <form className="edit-form" onSubmit={handleUpdate}>
                  <div className="form-group">
                    <label>Ad Soyad</label>
                    <input 
                      type="text" 
                      value={editForm.name} 
                      onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Telefon</label>
                    <input 
                      type="tel" 
                      value={editForm.phone} 
                      onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                      placeholder="05xx..."
                    />
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="btn-save" disabled={saving}>
                      {saving ? 'Kaydediliyor...' : 'Kaydet'}
                    </button>
                    <button type="button" className="btn-cancel" onClick={() => setIsEditing(false)}>İptal</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </header>

        <section className="appointments-section fade-in">
          <div className="section-title">
            <h2>Randevu Geçmişim</h2>
            <p>Tüm randevu talepleriniz ve durumları.</p>
          </div>

          <div className="appointments-list">
            {data.appointments.length === 0 ? (
              <div className="no-data glass">
                Henüz hiç randevu talebiniz bulunmuyor.
              </div>
            ) : (
              data.appointments.map(app => (
                <div key={app.id} className="appointment-item glass">
                  <div className="app-info">
                    <span className="app-service">{app.service}</span>
                    <div className="app-time-info">
                      <span>📅 {app.date}</span>
                      <span>⏰ {app.time}</span>
                    </div>
                    {app.doctor && (
                      <span className="app-doctor-name">👨‍⚕️ Hekim: {app.doctor.name}</span>
                    )}
                  </div>
                  <div className="app-status">
                    <span className={`status-badge ${app.status.toLowerCase().replace(' ', '-')}`}>
                      {app.status}
                    </span>
                    <span className="created-at">
                      Talep Tarihi: {new Date(app.createdAt).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

