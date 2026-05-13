'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import { 
  getUserNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications
} from '@/app/actions/notification';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    const res = await getUserNotifications();
    if (res.success && res.notifications) {
      setNotifications(res.notifications);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 5 seconds (reduced from 30 for real-time feel)
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = async (id: string) => {
    await markNotificationAsRead(id);
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleDeleteNotification = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteNotification(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleDeleteAllNotifications = async () => {
    if (confirm("Tüm bildirimleri silmek istediğinize emin misiniz?")) {
      await deleteAllNotifications();
      setNotifications([]);
    }
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }
    if (notification.link) {
      window.location.href = notification.link;
    }
  };

  return (
    <div className="notification-wrapper" ref={dropdownRef}>
      <button 
        className="notification-btn" 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Bildirimler"
      >
        <Bell size={20} className="notification-icon" />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h4>Bildirimler</h4>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="mark-all-read-btn">
                <Check size={14} /> Tümünü Okundu İşaretle
              </button>
            )}
          </div>
          
          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="empty-notifications">
                <p>Henüz bildiriminiz yok.</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`notification-item ${!notification.isRead ? 'unread' : ''} ${notification.link ? 'clickable' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-content">
                    <h5 className="notification-title">{notification.title}</h5>
                    <p className="notification-message">{notification.message}</p>
                    <span className="notification-time">
                      {new Date(notification.createdAt).toLocaleDateString('tr-TR', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div className="notification-actions">
                    {!notification.isRead && (
                      <button 
                        className="mark-read-single-btn" 
                        onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notification.id); }}
                        title="Okundu olarak işaretle"
                      >
                        <span className="read-dot"></span>
                      </button>
                    )}
                    <button 
                      className="delete-single-btn" 
                      onClick={(e) => handleDeleteNotification(e, notification.id)}
                      title="Bildirimi sil"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          {notifications.length > 0 && (
            <div className="notification-footer">
              <button onClick={handleDeleteAllNotifications} className="delete-all-btn">
                <Trash2 size={14} /> Tümünü Sil
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
