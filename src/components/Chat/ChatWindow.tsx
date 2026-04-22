'use client';

import { useState, useEffect, useRef } from 'react';
import { sendMessage, getMessages, markAsRead } from '@/app/actions/chat';
import './chat.css';

interface Message {
  id: string;
  content: string;
  createdAt: Date;
  senderId: string;
  receiverId: string;
}

interface ChatWindowProps {
  receiverId: string;
  receiverName: string;
  onClose: () => void;
}

export default function ChatWindow({ receiverId, receiverName, onClose }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    const res = await getMessages(receiverId);
    if (res.success && res.messages) {
      setMessages(res.messages as any);
      markAsRead(receiverId);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMessages();
    // Poll for new messages every 5 seconds (simulating real-time)
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [receiverId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const currentInput = input;
    setInput('');

    const res = await sendMessage(receiverId, currentInput);
    if (res.success) {
      fetchMessages();
    } else {
      alert(res.error);
    }
  };

  return (
    <div className="chat-window shadow-xl">
      <div className="chat-header">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">🩺</div>
          <h3>{receiverName}</h3>
        </div>
        <button onClick={onClose} className="close-btn">×</button>
      </div>

      <div className="chat-messages">
        {loading ? (
          <div className="text-center py-10 text-muted">Yükleniyor...</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-10 text-muted text-sm">
            Henüz mesaj yok. Merhaba diyerek başlayın! 👇
          </div>
        ) : (
          messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`message-bubble ${msg.senderId === receiverId ? 'received' : 'sent'}`}
            >
              {msg.content}
              <span className="message-time">
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="chat-input-area">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Mesajınızı yazın..." 
          className="chat-input"
        />
        <button type="submit" className="send-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </form>
    </div>
  );
}
