// src/app/admin/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { getClinicStats } from '@/app/actions/admin';
import Link from 'next/link';
import './admin.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await getClinicStats();
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) return <div className="loading-container">İstatistikler yükleniyor...</div>;

  return (
    <div className="admin-layout">
      <div className="container">
        <div className="admin-header">
          <h1>Yönetim Paneli</h1>
          <div className="admin-nav">
            <Link href="/admin" className="active">Genel Bakış</Link>
            <Link href="/admin/doctors">Hekim Yönetimi</Link>
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

        <div className="quick-actions glass fade-in" style={{padding: '3rem', borderRadius: '32px'}}>
          <h2>Hızlı İşlemler</h2>
          <div className="admin-nav" style={{marginTop: '2rem'}}>
            <Link href="/admin/doctors">Yeni Hekim Ekle</Link>
            <Link href="/doctor">Randevuları Yönet (Global)</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
