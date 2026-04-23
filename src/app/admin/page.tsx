// src/app/admin/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { getClinicStats, getActivities } from '@/app/actions/admin';
import Link from 'next/link';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend 
} from 'recharts';
import './admin.css';

const COLORS = ['#00CED1', '#4FD1C5', '#38B2AC', '#81E6D9', '#E6FFFA'];

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsData, actData] = await Promise.all([
          getClinicStats(),
          getActivities()
        ]);
        setStats(statsData);
        setActivities(actData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'APPOINTMENT_NEW': return { icon: '📅', class: 'appointment', label: 'Yeni Randevu' };
      case 'USER_REGISTER': return { icon: '👤', class: 'user', label: 'Yeni Üye' };
      default: return { icon: '💬', class: 'message', label: 'Sistem Mesajı' };
    }
  };

  if (loading) return <div className="loading-container">Veriler hazırlanıyor...</div>;

  return (
    <div className="admin-layout">
      <div className="container">
        <div className="admin-header">
          <div>
            <h1>Yönetim Paneli</h1>
            <p>Klinik genel performansı ve anlık aktiviteler.</p>
          </div>
          <div className="admin-nav">
            <Link href="/admin" className="active">Dashboard</Link>
            <Link href="/admin/doctors">Hekimler</Link>
            <Link href="/admin/reviews">Yorumlar</Link>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card glass fade-in">
            <span className="label">Toplam Randevu</span>
            <span className="value">{stats.totalAppointments}</span>
          </div>
          <div className="stat-card glass fade-in">
            <span className="label">Aktif Hekimler</span>
            <span className="value">{stats.totalDoctors}</span>
          </div>
          <div className="stat-card glass fade-in">
            <span className="label">Kayıtlı Hastalar</span>
            <span className="value">{stats.totalPatients}</span>
          </div>
        </div>

        <div className="charts-grid-admin">
          <div className="chart-card glass fade-in">
            <h3>Aylık Randevu Artışı</h3>
            <div className="chart-container-inner">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.growthData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#718096', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#718096', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)'}}
                  />
                  <Line type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={3} dot={{r: 6, fill: 'var(--primary)', strokeWidth: 2, stroke: '#white'}} activeDot={{r: 8}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-card glass fade-in">
            <h3>Hizmet Dağılımı</h3>
            <div className="chart-container-inner">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.serviceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.serviceData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="chart-card full-width glass fade-in" style={{marginBottom: '2rem'}}>
          <h3>Hekim Performansı (Randevu Sayısı)</h3>
          <div className="chart-container-inner">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={stats.doctorData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f7fafc'}} />
                <Bar dataKey="value" fill="url(#colorBar)" radius={[10, 10, 0, 0]}>
                   <defs>
                    <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="var(--secondary)" stopOpacity={0.8}/>
                    </linearGradient>
                  </defs>
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="admin-section-grid">
          <div className="activity-feed-card glass fade-in">
            <h2>Son Aktiviteler</h2>
            <div className="activity-list">
              {activities.length === 0 ? (
                <p className="no-data">Henüz bir aktivite kaydedilmedi.</p>
              ) : (
                activities.map(act => {
                  const info = getActivityIcon(act.type);
                  return (
                    <div key={act.id} className="activity-item">
                      <div className="activity-time">{new Date(act.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                      <div className={`activity-icon-wrap ${info.class}`}>{info.icon}</div>
                      <div className="activity-body">
                        <span className="activity-type">{info.label}</span>
                        <span className="activity-content">{act.content}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="quick-actions-sidebar glass fade-in" style={{padding: '2.5rem', borderRadius: '32px'}}>
            <h2>Hızlı İşlemler</h2>
            <div className="admin-nav" style={{flexDirection: 'column', marginTop: '2rem', gap: '0.8rem'}}>
              <Link href="/admin/doctors" style={{textAlign: 'center'}}>🆕 Yeni Hekim Ekle</Link>
              <Link href="/admin/reviews" style={{textAlign: 'center'}}>⭐ Yorumları Denetle</Link>
              <Link href="/doctor" style={{textAlign: 'center'}}>🌎 Randevuları Yönet</Link>
              <button 
                className="btn-secondary" 
                style={{width: '100%', padding: '1rem', border: 'none', borderRadius: '50px', background: 'var(--primary)', color: 'white', fontWeight: 700}}
                onClick={() => window.print()}
              >
                📊 Rapor Al (PDF)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

