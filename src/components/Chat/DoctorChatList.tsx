'use client';

import { useState, useEffect } from 'react';
import { getChatList } from '@/app/actions/chat';
import ChatWindow from './ChatWindow';

export default function DoctorChatList() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchConversations = async () => {
    const res = await getChatList();
    if (res.success && res.users) {
      setConversations(res.users);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  if (loading) return <div className="p-10 text-center">Yükleniyor...</div>;

  return (
    <div className="doctor-messaging glass p-6">
      <div className="flex gap-8" style={{ minHeight: '400px' }}>
        {/* Sidebar: Chat List */}
        <div className="w-1/3 border-r pr-4">
          <h3 className="mb-4 font-bold text-lg">Mesajlar</h3>
          <div className="chat-list-container">
            {conversations.length === 0 ? (
              <p className="text-muted text-sm italic">Henüz aktif bir sohbetiniz bulunmuyor.</p>
            ) : (
              conversations.map(user => (
                <div 
                  key={user.id} 
                  className={`chat-item ${selectedUser?.id === user.id ? 'active' : ''}`}
                  onClick={() => setSelectedUser(user)}
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xl">
                    {user.role === 'DOCTOR' ? '🩺' : '👤'}
                  </div>
                  <div className="chat-item-info">
                    <h4>{user.name}</h4>
                    <p>{user.specialty || 'Hasta'}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main: Chat View */}
        <div className="w-2/3 flex items-center justify-center relative">
          {selectedUser ? (
            <div className="w-full h-full">
              <ChatWindow 
                receiverId={selectedUser.id} 
                receiverName={selectedUser.name} 
                onClose={() => setSelectedUser(null)} 
              />
            </div>
          ) : (
            <div className="text-center text-muted">
              <div className="text-4xl mb-2">💬</div>
              <p>Sohbete başlamak için birini seçin.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
