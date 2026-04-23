// src/app/doctor/page.tsx
'use client';

import { useState, useEffect } from 'react';
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

  const isAdmin = (session?.user as any)?.role === 'ADMIN';

  useEffect(() => {
    async function fetchData() {
      try {
        const [appData, patientData] = await Promise.all([
          getAppointments(),
          !isAdmin ? getPatientsByDoctor() : Promise.resolve([])
        ]);
        setAppointments(appData as any);
        setPatients(patientData as any);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
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

  return (
    <div className="container dashboard-container fade-in">
      <header className="dashboard-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div>
            <h1>{isAdmin ? 'Klinik Özeti (Yönetici)' : 'Doktor Paneli'}</h1>
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
                ) : appointments.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem' }}>Randevu bulunmuyor.</td></tr>
                ) : (
                  appointments.map(app => (
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
                        <span className={`status-badge ${app.status.toLowerCase().replace(' ', '-')}`}>
                          {app.status}
                        </span>
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
                            <button className="btn-sm delete" onClick={() => deleteApp(app.id)}>Sil</button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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
                            <div key={app.id} className="history-item">
                              <div className="h-main">
                                <strong>{app.service}</strong>
                                <span>📅 {app.date} | ⏰ {app.time}</span>
                                {(app as any).imageUrl && (
                                  <div className="history-image-preview" style={{marginTop: '0.8rem'}}>
                                    <img 
                                      src={(app as any).imageUrl} 
                                      alt="Röntgen" 
                                      style={{width: '60px', height: '60px', borderRadius: '8px', cursor: 'pointer', border: '1px solid var(--border)'}} 
                                      onClick={() => window.open((app as any).imageUrl, '_blank')}
                                    />
                                    <span style={{fontSize: '0.75rem', color: 'var(--primary)', marginLeft: '0.5rem', cursor: 'pointer'}} onClick={() => window.open((app as any).imageUrl, '_blank')}>🔍 Büyüt</span>
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
                          </div>
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
        .action-btns { display: flex; gap: 0.5rem; }
        .btn-sm { padding: 0.4rem 0.8rem; font-size: 0.75rem; border-radius: 8px; }
        .btn-sm.success { background: var(--primary); color: white; }
        .btn-sm.status-complete { background: #0ea5e9; color: white; }
        .btn-sm.delete { background: #fee2e2; color: #dc2626; }

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
      `}</style>
    </div>
  );
};

export default DoctorDashboard;

