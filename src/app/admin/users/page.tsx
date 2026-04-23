// src/app/admin/users/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { getAllUsers, verifyUserManually, deleteUser } from '@/app/actions/admin_users';
import Link from 'next/link';
import '../admin.css';

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUsers = async () => {
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleVerify = async (id: string, name: string) => {
    if (!confirm(`${name} isimli kullanıcıyı manuel olarak doğrulamak istediğinize emin misiniz?`)) return;
    try {
      await verifyUserManually(id);
      fetchUsers();
    } catch (err) {
      alert("Hata oluştu.");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`${name} isimli kullanıcıyı ve tüm verilerini KALICI olarak silmek istediğinize emin misiniz?`)) return;
    try {
      await deleteUser(id);
      fetchUsers();
    } catch (err) {
      alert("Hata oluştu.");
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-layout fade-in">
      <div className="container">
        <div className="admin-header">
          <div>
            <h1>Kullanıcı Yönetimi</h1>
            <p>Tüm kayıtlı kullanıcıları ve doğrulama durumlarını buradan yönetebilirsiniz.</p>
          </div>
          <div className="admin-nav">
            <Link href="/admin">Dashboard</Link>
            <Link href="/admin/users" className="active">Kullanıcılar</Link>
            <Link href="/admin/doctors">Hekimler</Link>
          </div>
        </div>

        <div className="filter-bar glass" style={{ marginBottom: '2rem' }}>
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input 
              type="text" 
              placeholder="İsim veya e-posta ile ara..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="table-wrapper glass">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Kullanıcı Bilgisi</th>
                <th>Rol</th>
                <th>Doğrulama</th>
                <th>Kayıt Tarihi</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem' }}>Yükleniyor...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem' }}>Kullanıcı bulunamadı.</td></tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id}>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 700 }}>{user.name}</span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{user.email}</span>
                      </div>
                    </td>
                    <td><span className={`role-badge ${user.role.toLowerCase()}`}>{user.role}</span></td>
                    <td>
                      {user.emailVerified ? (
                        <span style={{ color: '#10b981', fontWeight: 700 }}>✅ Doğrulandı</span>
                      ) : (
                        <span style={{ color: '#f59e0b', fontWeight: 700 }}>⏳ Bekliyor</span>
                      )}
                    </td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {!user.emailVerified && (
                          <button className="btn-verify-sm" onClick={() => handleVerify(user.id, user.name)}>Manuel Onayla</button>
                        )}
                        <button className="btn-delete-sm" onClick={() => handleDelete(user.id, user.name)}>Sil</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        .role-badge { 
          padding: 0.3rem 0.6rem; 
          border-radius: 6px; 
          font-size: 0.75rem; 
          font-weight: 800; 
        }
        .role-badge.admin { background: #fee2e2; color: #dc2626; }
        .role-badge.doctor { background: #e0f2fe; color: #0369a1; }
        .role-badge.user { background: #f1f5f9; color: #475569; }

        .btn-verify-sm {
          padding: 0.4rem 0.8rem;
          background: #d1fae5;
          color: #065f46;
          border: none;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          transition: 0.3s;
        }
        .btn-verify-sm:hover { background: #10b981; color: white; }

        .btn-delete-sm {
          padding: 0.4rem 0.8rem;
          background: #fee2e2;
          color: #b91c1c;
          border: none;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          transition: 0.3s;
        }
        .btn-delete-sm:hover { background: #b91c1c; color: white; }

        .admin-table { width: 100%; border-collapse: collapse; }
        .admin-table th { text-align: left; padding: 1.2rem; border-bottom: 2px solid var(--border); color: var(--text-muted); font-size: 0.85rem; }
        .admin-table td { padding: 1.2rem; border-bottom: 1px solid var(--border); }
      `}</style>
    </div>
  );
}
