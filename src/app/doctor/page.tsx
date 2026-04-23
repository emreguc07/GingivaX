// src/app/doctor/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { getAppointments, updateAppointmentStatus, deleteAppointment as apiDeleteAppointment, getPatientsByDoctor, saveClinicalNote } from '@/app/actions/doctor';

interface Appointment {
  id: number;
  name: string;
  service: string;
  date: string;
  time: string;
  status: string;
  userId?: string;
  doctor?: { name: string };
  imageUrl?: string | null;
}

interface Patient {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  appointments: {
    id: number;
    service: string;
    date: string;
    time: string;
    status: string;
    imageUrl?: string | null;
    clinicalNote?: string | null;
  }[];
}

import DoctorChatList from '@/components/Chat/DoctorChatList';

const DoctorDashboard = () => {
  const { data: session } = useSession();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'appointments' | 'messages' | 'patients'>('appointments');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Hepsi');
  const [visibleCount, setVisibleCount] = useState(15);

  const isAdmin = (session?.user as any)?.role === 'ADMIN';

  useEffect(() => {
    async function fetchData() {
      try {
        const [appData, patientData] = await Promise.all([
          getAppointments(),
          !isAdmin ? getPatientsByDoctor() : Promise.resolve([])
        ]);
        setAppointments(appData as any);
        if (!isAdmin) setPatients(patientData as any);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();

    // Real-time Update: Poll every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [isAdmin]);

  const updateStatus = async (id: number, newStatus: string) => {
    if (isAdmin) return;
    try {
      await updateAppointmentStatus(id, newStatus);
      setAppointments(appointments.map(app => 
        app.id === id ? { ...app, status: newStatus } : app
      ));
    } catch (err) {
      alert("Durum güncellenemedi.");
    }
  };

  const deleteApp = async (id: number) => {
    if (isAdmin) return;
    if (!confirm("Bu randevuyu silmek istediğinize emin misiniz?")) return;
    try {
      await apiDeleteAppointment(id);
      setAppointments(appointments.filter(app => app.id !== id));
    } catch (err) {
      alert("Randevu silinemez.");
    }
  };

  const handlePatientClick = (patientId: string) => {
    setSelectedPatientId(patientId);
    setActiveTab('patients');
  };

  const handleSaveNote = async (appId: number) => {
    try {
      await saveClinicalNote(appId, noteContent);
      setPatients(patients.map(p => ({
        ...p,
        appointments: p.appointments.map(app => 
          app.id === appId ? { ...app, clinicalNote: noteContent } : app
        )
      })));
      setEditingNoteId(null);
    } catch (err) {
      alert("Not kaydedilemedi.");
    }
  };

  const filteredAppointments = appointments.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         app.service.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'Hepsi' || app.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container dashboard-container fade-in">
      <header className="dashboard-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <h1>{isAdmin ? 'Klinik Özeti (Yönetici)' : 'Doktor Paneli'}</h1>
              <div className="live-indicator">
                <span className="live-dot"></span>
                CANLI
              </div>
            </div>
            <p>{isAdmin ? 'Tüm doktorların aktif randevuları.' : 'Bugünkü randevularınız ve klinik özeti.'}</p>
          </div>
          {!isAdmin && (
            <button 
              className="btn-settings-nav"
              onClick={() => window.location.href = '/doctor/ayarlar'}
              style={{
                padding: '0.8rem 1.2rem',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                background: 'white',
                cursor: 'pointer',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: '0.3s'
              }}
            >
              ⚙️ Ayarlar
            </button>
          )}
        </div>
        <div className="stats-row">
          <div className="stat-card glass">
            <span className="s-label">Toplam Randevu</span>
            <span className="s-val">{appointments.length}</span>
          </div>
          {!isAdmin && (
            <div className="stat-card glass">
              <span className="s-label">Toplam Hasta</span>
              <span className="s-val">{patients.length}</span>
            </div>
          )}
        </div>
      </header>

      {/* Tabs */}
      <div className="dashboard-tabs">
        <button 
          className={`tab-btn ${activeTab === 'appointments' ? 'active' : ''}`}
          onClick={() => setActiveTab('appointments')}
        >
          📅 Randevular
        </button>
        {!isAdmin && (
          <>
            <button 
              className={`tab-btn ${activeTab === 'patients' ? 'active' : ''}`}
              onClick={() => setActiveTab('patients')}
            >
              👥 Hastalarım
            </button>
            <button 
              className={`tab-btn ${activeTab === 'messages' ? 'active' : ''}`}
              onClick={() => setActiveTab('messages')}
            >
              💬 Mesajlar
            </button>
          </>
        )}
      </div>

      <div className="dashboard-content">
        {activeTab === 'appointments' && (
          <div className="appointments-section">
            <div className="filter-bar glass">
              <div className="search-wrap">
                <span className="search-icon">🔍</span>
                <input 
                  type="text" 
                  placeholder="Hasta adı veya hizmet ara..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="status-filter">
                <label>Durum:</label>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="Hepsi">Tüm Randevular</option>
                  <option value="Bekliyor">Bekleyenler</option>
                  <option value="Onaylandı">Onaylananlar</option>
                  <option value="Tamamlandı">Tamamlananlar</option>
                  <option value="İptal Edildi">İptal Edilenler</option>
                </select>
              </div>
            </div>

            <div className="table-wrapper glass">
              <table className="appointments-table">
              <thead>
                <tr>
                  <th>Hasta Adı</th>
                  <th>Hizmet</th>
                  {isAdmin && <th>Hekim</th>}
                  <th>Tarih</th>
                  <th>Saat</th>
                  <th>Durum</th>
                  {!isAdmin && <th>İşlemler</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem' }}>Yükleniyor...</td></tr>
                ) : filteredAppointments.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem' }}>Eşleşen randevu bulunmuyor.</td></tr>
                ) : (
                  filteredAppointments.slice(0, visibleCount).map(app => (
                    <tr key={app.id}>
                      <td data-label="Hasta Adı">
                        <button 
                          className="patient-link-btn"
                          onClick={() => {
                            const pId = app.userId || (app as any).user?.id;
                            if (pId) handlePatientClick(pId);
                          }}
                          disabled={(!app.userId && !(app as any).user?.id) || isAdmin}
                        >
                          {app.name}
                        </button>
                      </td>

                      <td data-label="Hizmet">{app.service}</td>
                      {isAdmin && <td data-label="Hekim"><span className="doc-name-tag">{app.doctor?.name || 'Atanmamış'}</span></td>}
                      <td data-label="Tarih">{app.date}</td>
                      <td data-label="Saat">{app.time}</td>
                      <td data-label="Durum">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className={`status-badge ${app.status.toLowerCase().replace(' ', '-')}`}>
                            {app.status}
                          </span>
                          {app.imageUrl && (
                            <span title="Fotoğraf yüklendi" style={{ fontSize: '1.2rem', cursor: 'help' }}>📸</span>
                          )}
                        </div>
                      </td>
                      {!isAdmin && (
                        <td data-label="İşlemler">
                          <div className="action-btns">
                            {app.status === 'Bekliyor' && (
                              <button className="btn-sm success" onClick={() => updateStatus(app.id, 'Onaylandı')}>Onayla</button>
                            )}
                            {app.status === 'Onaylandı' && (
                              <button className="btn-sm status-complete" onClick={() => updateStatus(app.id, 'Tamamlandı')}>Tamamla</button>
                            )}
                            {app.status !== 'İptal Edildi' && app.status !== 'Tamamlandı' && (
                              <button className="btn-sm cancel" onClick={() => {
                                if(confirm("Bu randevuyu iptal etmek istediğinize emin misiniz?")) {
                                  updateStatus(app.id, 'İptal Edildi');
                                }
                              }}>İptal Et</button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {filteredAppointments.length > visibleCount && (
            <div className="load-more-container">
              <button 
                className="btn-load-more" 
                onClick={() => setVisibleCount(prev => prev + 15)}
              >
                Daha Fazla Göster ({filteredAppointments.length - visibleCount} randevu daha var)
              </button>
            </div>
          )}
        </div>
      )}

        {activeTab === 'patients' && (
          <div className="patients-view-layout">
            <div className="patients-sidebar glass">
              <h3>Kayıtlı Hastalar</h3>
              <div className="patient-list">
                {patients.length === 0 ? (
                  <p className="no-data">Henüz kayıtlı hastanız yok.</p>
                ) : (
                  patients.map(p => (
                    <div 
                      key={p.id} 
                      className={`patient-item ${selectedPatientId === p.id ? 'active' : ''}`}
                      onClick={() => setSelectedPatientId(p.id)}
                    >
                      <div className="p-avatar">{p.name?.[0]}</div>
                      <div className="p-info">
                        <strong>{p.name}</strong>
                        <span>{p.email}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="patient-details-view glass">
              {selectedPatientId ? (
                (() => {
                  const patient = patients.find(p => p.id === selectedPatientId);
                  if (!patient) return <div className="detail-placeholder">Hasta bulunamadı.</div>;
                  return (
                    <div className="detail-content fade-in">
                      <div className="detail-header">
                        <div className="big-avatar">{patient.name?.[0]}</div>
                        <div>
                          <h2>{patient.name}</h2>
                          <div className="contact-info">
                            <span>📧 {patient.email}</span>
                            <span>📞 {patient.phone || 'Telefon belirtilmemiş'}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="patient-history">
                        <h3>Randevu Geçmişi</h3>
                        <div className="history-list">
                          {patient.appointments.map(app => (
                            <React.Fragment key={app.id}>
                              <div className="history-item">
                              <div className="h-main">
                                <strong>{app.service}</strong>
                                <span>📅 {app.date} | ⏰ {app.time}</span>
                                {(app as any).imageUrl && (
                                  <div className="history-image-preview" style={{marginTop: '0.8rem'}}>
                                    <img 
                                      src={(app as any).imageUrl} 
                                      alt="Röntgen" 
                                      style={{width: '60px', height: '60px', borderRadius: '8px', cursor: 'pointer', border: '1px solid var(--border)'}} 
                                      onClick={() => setSelectedImageUrl((app as any).imageUrl)}
                                    />
                                    <span style={{fontSize: '0.75rem', color: 'var(--primary)', marginLeft: '0.5rem', cursor: 'pointer'}} onClick={() => setSelectedImageUrl((app as any).imageUrl)}>🔍 Büyüt</span>
                                  </div>
                                )}
                              </div>
                              <span className={`status-badge sm ${app.status.toLowerCase().replace(' ', '-')}`}>
                                {app.status}
                              </span>
                            </div>

                            <div className="history-note-section">
                              {editingNoteId === app.id ? (
                                <div className="note-editor fade-in">
                                  <textarea 
                                    className="note-textarea"
                                    value={noteContent}
                                    onChange={(e) => setNoteContent(e.target.value)}
                                    placeholder="Klinik notlarınızı buraya yazın..."
                                  />
                                  <div className="note-actions">
                                    <button className="btn-save-note" onClick={() => handleSaveNote(app.id)}>Kaydet</button>
                                    <button className="btn-cancel-note" onClick={() => setEditingNoteId(null)}>İptal</button>
                                  </div>
                                </div>
                              ) : (
                                <div className="note-display">
                                  {app.clinicalNote ? (
                                    <div className="note-box">
                                      <p>{app.clinicalNote}</p>
                                      <button className="btn-edit-note" onClick={() => {
                                        setEditingNoteId(app.id);
                                        setNoteContent(app.clinicalNote || '');
                                      }}>Notu Düzenle</button>
                                    </div>
                                  ) : app.status === 'Tamamlandı' ? (
                                    <button className="btn-add-note" onClick={() => {
                                      setEditingNoteId(app.id);
                                      setNoteContent('');
                                    }}>+ Tedavi Notu Ekle</button>
                                  ) : (
                                    <p className="note-hint">Not eklemek için randevunun tamamlanmış olması gerekir.</p>
                                  )}
                                </div>
                              )}
                            </div>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="detail-placeholder">
                  <div className="placeholder-icon">👤</div>
                  <p>Bilgilerini görüntülemek için bir hasta seçin.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'messages' && <DoctorChatList />}
      </div>

      {/* Image Modal */}
      {selectedImageUrl && (
        <div className="image-modal-overlay" onClick={() => setSelectedImageUrl(null)}>
          <div className="image-modal-container fade-in" onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setSelectedImageUrl(null)}>×</button>
            <img src={selectedImageUrl} alt="Büyük Görünüm" className="modal-image" />
          </div>
        </div>
      )}

      <style jsx>{`
        .dashboard-tabs {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          border-bottom: 1px solid var(--border);
          padding-bottom: 1rem;
        }
        .tab-btn {
          padding: 0.8rem 1.5rem;
          border: none;
          background: transparent;
          font-weight: 700;
          cursor: pointer;
          border-radius: 12px;
          transition: 0.3s;
          color: var(--text-muted);
        }
        .tab-btn:hover { background: var(--accent-light); }
        .tab-btn.active {
          background: var(--primary);
          color: white;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }

        .dashboard-container {
          padding-top: 2rem;
          padding-bottom: 5rem;
        }
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 3rem;
        }
        .stats-row { display: flex; gap: 1rem; }
        .stat-card {
          padding: 1rem 2rem;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 140px;
        }
        .s-label { font-size: 0.8rem; color: var(--text-muted); }
        .s-val { font-size: 1.5rem; font-weight: 800; color: var(--primary); }

        .patient-link-btn {
          background: none;
          border: none;
          color: var(--primary);
          font-weight: 700;
          cursor: pointer;
          text-decoration: underline;
          padding: 0;
          font-size: inherit;
        }
        .patient-link-btn:disabled {
          color: inherit;
          text-decoration: none;
          cursor: default;
        }
        .patient-link-btn:hover:not(:disabled) {
          color: var(--secondary);
        }

        .table-wrapper { border-radius: 20px; overflow: hidden; box-shadow: var(--shadow); }
        .appointments-table { width: 100%; border-collapse: collapse; text-align: left; }
        .appointments-table th { background: var(--primary); color: white; padding: 1.2rem 1.5rem; }
        .appointments-table td { padding: 1.2rem 1.5rem; border-bottom: 1px solid var(--border); }
        .doc-name-tag { padding: 0.3rem 0.6rem; background: var(--accent); color: var(--secondary); border-radius: 6px; font-size: 0.85rem; font-weight: 700; }
        .status-badge { padding: 0.4rem 0.8rem; border-radius: 50px; font-size: 0.8rem; font-weight: 700; }
        .status-badge.sm { padding: 0.2rem 0.6rem; font-size: 0.7rem; }
         .status-badge.bekliyor { background: #fff3cd; color: #856404; }
        .status-badge.onaylandı { background: #d4edda; color: #155724; }
         .status-badge.tamamlandı { background: #e0f2fe; color: #0369a1; }
        .status-badge.iptal-edildi { background: #fef2f2; color: #b91c1c; }
        .action-btns { display: flex; gap: 0.5rem; }
        .btn-sm { padding: 0.4rem 0.8rem; font-size: 0.75rem; border-radius: 8px; border: none; cursor: pointer; transition: 0.3s; }
        .btn-sm:hover { opacity: 0.8; transform: translateY(-1px); }
        .btn-sm.success { background: var(--primary); color: white; }
        .btn-sm.status-complete { background: #0ea5e9; color: white; }
        .btn-sm.cancel { background: #fee2e2; color: #dc2626; }

        /* Patients View Layout */
        .patients-view-layout {
          display: grid;
          grid-template-columns: 350px 1fr;
          gap: 2rem;
          min-height: 500px;
        }
        .patients-sidebar {
          padding: 1.5rem;
          border-radius: 24px;
          display: flex;
          flex-direction: column;
        }
        .patients-sidebar h3 { margin-bottom: 1.5rem; font-size: 1.2rem; }
        .patient-list {
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
          overflow-y: auto;
          max-height: 600px;
        }
        .patient-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          border-radius: 16px;
          cursor: pointer;
          transition: 0.3s;
          border: 1px solid transparent;
        }
        .patient-item:hover { background: var(--accent-light); }
        .patient-item.active {
          background: white;
          border-color: var(--primary);
          box-shadow: 0 4px 15px rgba(0,0,0,0.05);
        }
        .p-avatar {
          width: 45px;
          height: 45px;
          background: var(--primary);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 1.2rem;
        }
        .p-info { display: flex; flex-direction: column; }
        .p-info span { font-size: 0.75rem; color: var(--text-muted); }

        .patient-details-view {
          padding: 2.5rem;
          border-radius: 24px;
          display: flex;
          flex-direction: column;
        }
        .detail-placeholder {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          gap: 1rem;
        }
        .placeholder-icon { font-size: 4rem; opacity: 0.2; }
        
        .detail-header {
          display: flex;
          align-items: center;
          gap: 2rem;
          padding-bottom: 2rem;
          border-bottom: 1px solid var(--border);
          margin-bottom: 2.5rem;
        }
        .big-avatar {
          width: 90px;
          height: 90px;
          background: linear-gradient(135deg, var(--primary), var(--secondary));
          color: white;
          border-radius: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.5rem;
          font-weight: 800;
        }
        .contact-info { display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.5rem; color: var(--text-muted); }
        
        .patient-history h3 { margin-bottom: 1.5rem; }
        .history-list { display: flex; flex-direction: column; gap: 1rem; }
        .history-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.2rem;
          background: rgba(255,255,255,0.5);
          border-radius: 12px;
          border: 1px solid var(--border);
        }
        .h-main { display: flex; flex-direction: column; gap: 0.3rem; }
        .h-main span { font-size: 0.85rem; color: var(--text-muted); }

        @media (max-width: 992px) {
          .patients-view-layout { grid-template-columns: 1fr; }
          .patients-sidebar { max-height: 300px; }
        }

        @media (max-width: 768px) {
          .dashboard-header { flex-direction: column; align-items: flex-start; gap: 1.5rem; }
          .appointments-table thead { display: none; }
          .appointments-table tr { margin-bottom: 1.5rem; background: white; border-radius: 16px; padding: 1rem; border: 1px solid var(--border); display: block; }
          .appointments-table td { display: flex; justify-content: space-between; align-items: center; padding: 0.8rem 0.5rem; border-bottom: 1px solid #f0f0f0; }
          .appointments-table td::before { content: attr(data-label); font-weight: 700; color: var(--text-muted); }
        }

        /* Note Section Styles */
        .history-note-section {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px dashed var(--border);
        }
        .note-textarea {
          width: 100%;
          min-height: 100px;
          padding: 1rem;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: white;
          font-family: inherit;
          font-size: 0.9rem;
          resize: vertical;
          margin-bottom: 0.5rem;
        }
        .note-actions { display: flex; gap: 0.5rem; }
        .btn-save-note { background: var(--primary); color: white; padding: 0.5rem 1rem; border-radius: 8px; border: none; cursor: pointer; font-weight: 700; }
        .btn-cancel-note { background: var(--text-muted); color: white; padding: 0.5rem 1rem; border-radius: 8px; border: none; cursor: pointer; }
        .note-box { background: #f8fafc; padding: 1rem; border-radius: 12px; position: relative; }
        .note-box p { font-size: 0.9rem; color: #475569; line-height: 1.5; margin-bottom: 0.8rem; white-space: pre-wrap; }
        .btn-edit-note { font-size: 0.75rem; color: var(--primary); background: none; border: none; cursor: pointer; font-weight: 700; text-decoration: underline; padding: 0; }
        .btn-add-note { font-size: 0.85rem; color: var(--primary); background: none; border: 1px dashed var(--primary); padding: 0.6rem 1rem; border-radius: 8px; cursor: pointer; font-weight: 700; transition: 0.3s; }
        .btn-add-note:hover { background: var(--accent-light); }
        .note-hint { font-size: 0.8rem; color: var(--text-muted); font-style: italic; }

        /* Image Modal Styles */
        .image-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.85);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 2rem;
        }
        .image-modal-container {
          position: relative;
          max-width: 90vw;
          max-height: 90vh;
        }
        .modal-image {
          max-width: 100%;
          max-height: 90vh;
          border-radius: 12px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.5);
          border: 4px solid white;
        }
        .modal-close-btn {
          position: absolute;
          top: -40px;
          right: -40px;
          background: white;
          border: none;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          font-size: 24px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          transition: 0.3s;
        }
        .modal-close-btn:hover { transform: scale(1.1); background: var(--primary); color: white; }
        
        .load-more-container {
          display: flex;
          justify-content: center;
          margin-top: 2rem;
        }
        .btn-load-more {
          padding: 0.8rem 2rem;
          background: white;
          color: var(--primary);
          border: 2px solid var(--primary);
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: 0.3s;
        }
        .btn-load-more:hover {
          background: var(--primary);
          color: white;
          box-shadow: 0 5px 15px rgba(0, 206, 209, 0.2);
        }

        .filter-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.2rem 2rem;
          margin-bottom: 2rem;
          gap: 1.5rem;
          border-radius: 20px;
        }
        .search-wrap {
          flex: 1;
          position: relative;
          display: flex;
          align-items: center;
        }
        .search-icon {
          position: absolute;
          left: 1rem;
          opacity: 0.5;
        }
        .search-wrap input {
          width: 100%;
          padding: 0.8rem 1rem 0.8rem 2.8rem;
          border-radius: 12px;
          border: 1px solid var(--border);
          font-family: inherit;
          font-size: 0.9rem;
          transition: 0.3s;
        }
        .search-wrap input:focus {
          border-color: var(--primary);
          outline: none;
          box-shadow: 0 0 0 4px rgba(0, 206, 209, 0.1);
        }
        .status-filter {
          display: flex;
          align-items: center;
          gap: 0.8rem;
        }
        .status-filter label {
          font-weight: 700;
          font-size: 0.9rem;
          color: var(--text-muted);
        }
        .status-filter select {
          padding: 0.8rem 1.2rem;
          border-radius: 12px;
          border: 1px solid var(--border);
          font-family: inherit;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          background: white;
        }

        @media (max-width: 768px) {
          .filter-bar { flex-direction: column; align-items: stretch; }
        }
        
        .live-indicator {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
          padding: 0.3rem 0.6rem;
          border-radius: 50px;
          font-size: 0.7rem;
          font-weight: 800;
          letter-spacing: 1px;
        }
        .live-dot {
          width: 8px;
          height: 8px;
          background: #10b981;
          border-radius: 50%;
          display: inline-block;
          animation: pulse-green 2s infinite;
        }
        @keyframes pulse-green {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }

        @media (max-width: 768px) {
          .modal-close-btn { top: -50px; right: 0; }
        }
      `}</style>
    </div>
  );
};

export default DoctorDashboard;

