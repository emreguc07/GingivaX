// src/app/admin/doctors/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { getDoctors, createDoctor, deleteDoctor, updateDoctor } from '@/app/actions/admin';
import Link from 'next/link';
import '../admin.css';

export default function DoctorManagement() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    specialty: '',
    bio: '',
    education: '',
    image: ''
  });

  useEffect(() => {
    fetchDoctors();
  }, []);

  async function fetchDoctors() {
    try {
      const data = await getDoctors();
      setDoctors(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    
    let res;
    if (editingId) {
      res = await updateDoctor(editingId, formData);
    } else {
      res = await createDoctor(formData);
    }

    if (res.success) {
      setFormData({ name: '', email: '', password: '', specialty: '', bio: '', education: '', image: '' });
      setEditingId(null);
      fetchDoctors();
    } else {
      alert(res.error);
    }
    setFormLoading(false);
  };

  const handleEdit = (doc: any) => {
    setEditingId(doc.id);
    setFormData({
      name: doc.name || '',
      email: doc.email || '',
      password: '', // Password stays empty unless changing
      specialty: doc.specialty || '',
      bio: doc.bio || '',
      education: doc.education || '',
      image: doc.image || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ name: '', email: '', password: '', specialty: '', bio: '', education: '', image: '' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu hekimi silmek istediğinize emin misiniz?')) return;
    const res = await deleteDoctor(id);
    if (res.success) fetchDoctors();
  };

  if (loading) return <div className="loading-container">Hekimler yükleniyor...</div>;

  return (
    <div className="admin-layout">
      <div className="container">
        <div className="admin-header">
          <h1>Hekim Yönetimi</h1>
          <div className="admin-nav">
            <Link href="/admin">Genel Bakış</Link>
            <Link href="/admin/doctors" className="active">Hekim Yönetimi</Link>
          </div>
        </div>

        <div className="doctor-form-card glass fade-in">
          <h2>{editingId ? 'Hekim Bilgilerini Düzenle' : 'Yeni Hekim Ekle'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="admin-input-group">
                <label>Ad Soyad</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Örn: Dr. Elif Nur GÜÇ" />
              </div>
              <div className="admin-input-group">
                <label>E-posta (Giriş İçin)</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="elif@gingivax.com" />
              </div>
              <div className="admin-input-group">
                <label>Şifre {editingId && '(Sadece değiştirmek istiyorsanız doldurun)'}</label>
                <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder={editingId ? 'Yeni şifre...' : "Boş bırakılırsa 'doctor123' olur"} />
              </div>
              <div className="admin-input-group">
                <label>Uzmanlık Alanı</label>
                <input value={formData.specialty} onChange={e => setFormData({...formData, specialty: e.target.value})} placeholder="Örn: Pedodonti" />
              </div>
              <div className="admin-input-group">
                <label>Eğitim Bilgisi</label>
                <input value={formData.education} onChange={e => setFormData({...formData, education: e.target.value})} placeholder="Üniversite bilgisi" />
              </div>
              <div className="admin-input-group">
                <label>Fotoğraf URL</label>
                <input value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} placeholder="https://..." />
              </div>
            </div>
            <div className="admin-input-group">
              <label>Kısa Özgeçmiş</label>
              <textarea rows={3} value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} placeholder="Hekim hakkında kısa bilgi..." />
            </div>
            <div className="form-actions" style={{display: 'flex', gap: '1rem'}}>
              <button className="btn-primary" disabled={formLoading} style={{width: '240px'}}>
                {formLoading ? 'İşleniyor...' : (editingId ? 'Değişiklikleri Kaydet' : 'Hekimi Kaydet')}
              </button>
              {editingId && (
                <button type="button" className="btn-outline" onClick={cancelEdit}>İptal</button>
              )}
            </div>
          </form>
        </div>

        <div className="doctors-table-card glass fade-in">
          <h2>Kayıtlı Hekimler</h2>
          <div className="doctors-list">
            {doctors.map(doc => (
              <div key={doc.id} className="doctor-row">
                <img src={doc.image || '/doctor-placeholder.jpg'} alt="" className="row-img" />
                <div className="row-info">
                  <h4>{doc.name}</h4>
                  <p>{doc.email}</p>
                </div>
                <div className="row-info">
                  <p><strong>{doc.specialty || 'Branş Belirtilmemiş'}</strong></p>
                </div>
                <div className="row-info">
                  <p>{new Date(doc.createdAt).toLocaleDateString('tr-TR')}</p>
                </div>
                <div className="row-actions" style={{display: 'flex', gap: '0.5rem'}}>
                  <button className="btn-social" onClick={() => handleEdit(doc)}>Düzenle</button>
                  <button className="btn-delete" onClick={() => handleDelete(doc.id)}>Sil</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
