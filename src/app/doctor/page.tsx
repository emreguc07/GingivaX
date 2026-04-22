// src/app/doctor/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { getAppointments, updateAppointmentStatus, deleteAppointment as apiDeleteAppointment } from '@/app/actions/doctor';

interface Appointment {
  id: number;
  name: string;
  service: string;
  date: string;
  time: string;
  status: string;
  doctor?: { name: string };
}

import DoctorChatList from '@/components/Chat/DoctorChatList';

const DoctorDashboard = () => {
  const { data: session } = useSession();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'appointments' | 'messages'>('appointments');

  const isAdmin = (session?.user as any)?.role === 'ADMIN';

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getAppointments();
        setAppointments(data as any);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const updateStatus = async (id: number, newStatus: string) => {
    if (isAdmin) return; // Prevention
    try {
      await updateAppointmentStatus(id, newStatus);
      setAppointments(appointments.map(app => 
        app.id === id ? { ...app, status: newStatus } : app
      ));
    } catch (err) {
      alert("Durum güncellenemedi. Sadece hekimler bu işlemi yapabilir.");
    }
  };

  const deleteApp = async (id: number) => {
    if (isAdmin) return; // Prevention
    if (!confirm("Bu randevuyu silmek istediğinize emin misiniz?")) return;
    try {
      await apiDeleteAppointment(id);
      setAppointments(appointments.filter(app => app.id !== id));
    } catch (err) {
      alert("Randevu silinemez. Sadece hekimler bu işlemi yapabilir.");
    }
  };

  return (
    <div className="container dashboard-container fade-in">
      <header className="dashboard-header">
        <div>
          <h1>{isAdmin ? 'Klinik Özeti (Yönetici)' : 'Doktor Paneli'}</h1>
          <p>{isAdmin ? 'Tüm doktorların aktif randevuları.' : 'Bugünkü randevularınız ve klinik özeti.'}</p>
        </div>
        <div className="stats-mini">
          <div className="stat-card glass">
            <span className="s-label">Toplam Randevu</span>
            <span className="s-val">{appointments.length}</span>
          </div>
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
          <button 
            className={`tab-btn ${activeTab === 'messages' ? 'active' : ''}`}
            onClick={() => setActiveTab('messages')}
          >
            💬 Mesajlar
          </button>
        )}
      </div>

      <div className="appointments-section">
        {activeTab === 'appointments' ? (
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
                  <tr>
                    <td colSpan={isAdmin ? 7 : 6} style={{ textAlign: 'center', padding: '3rem' }}>
                      Yükleniyor...
                    </td>
                  </tr>
                ) : appointments.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 7 : 6} style={{ textAlign: 'center', padding: '3rem' }}>
                      Henüz hiç randevu kaydı bulunmuyor.
                    </td>
                  </tr>
                ) : (
                  appointments.map(app => (
                    <tr key={app.id}>
                      <td data-label="Hasta Adı"><strong>{app.name}</strong></td>
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
                            <button 
                              className="btn-sm success"
                              onClick={() => updateStatus(app.id, 'Onaylandı')}
                            >
                              Onayla
                            </button>
                            <button 
                              className="btn-sm delete"
                              onClick={() => deleteApp(app.id)}
                            >
                              Sil
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <DoctorChatList />
        )}
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
        .stat-card {
          padding: 1rem 2rem;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .s-label { font-size: 0.8rem; color: var(--text-muted); }
        .s-val { font-size: 1.5rem; font-weight: 800; color: var(--primary); }

        .table-wrapper {
          border-radius: 20px;
          overflow: hidden;
          box-shadow: var(--shadow);
        }
        .appointments-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .appointments-table th {
          background: var(--primary);
          color: white;
          padding: 1.2rem 1.5rem;
          font-weight: 600;
        }
        .appointments-table td {
          padding: 1.2rem 1.5rem;
          border-bottom: 1px solid var(--border);
        }
        .doc-name-tag {
          padding: 0.3rem 0.6rem;
          background: var(--accent);
          color: var(--secondary);
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 700;
        }
        .status-badge {
          padding: 0.4rem 0.8rem;
          border-radius: 50px;
          font-size: 0.8rem;
          font-weight: 700;
        }
        .status-badge.bekliyor { background: #fff3cd; color: #856404; }
        .status-badge.onaylandı { background: #d4edda; color: #155724; }

        .action-btns {
          display: flex;
          gap: 0.5rem;
        }
        .btn-sm {
          padding: 0.4rem 0.8rem;
          font-size: 0.75rem;
          border-radius: 8px;
        }
        .btn-sm.success { background: var(--primary); color: white; }
        .btn-sm.delete { background: #fee2e2; color: #dc2626; }

        @media (max-width: 768px) {
          .dashboard-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1.5rem;
          }
          
          .appointments-table thead {
            display: none;
          }

          .appointments-table, 
          .appointments-table tbody, 
          .appointments-table tr, 
          .appointments-table td {
            display: block;
            width: 100%;
          }

          .appointments-table tr {
            margin-bottom: 1.5rem;
            background: white;
            border-radius: 16px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.05);
            padding: 1rem;
            border: 1px solid var(--border);
          }

          .appointments-table td {
            display: flex;
            justify-content: space-between;
            align-items: center;
            text-align: right;
            padding: 0.8rem 0.5rem;
            border-bottom: 1px solid #f0f0f0;
          }

          .appointments-table td:last-child {
            border-bottom: none;
          }

          .appointments-table td::before {
            content: attr(data-label);
            font-weight: 700;
            color: var(--text-muted);
            font-size: 0.85rem;
            text-align: left;
          }

          .action-btns {
            width: 100%;
            justify-content: flex-end;
          }
          
          .btn-sm {
            padding: 0.6rem 1rem;
            flex: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default DoctorDashboard;
