'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Image as ImageIcon, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import './DrPerioBot.css';

type Message = {
  id: string;
  role: 'user' | 'bot';
  content: string;
  imageUrl?: string;
};

export default function DrPerioBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'bot',
      content: 'Merhaba! Ben Dr. Perio, GingivaX yapay zeka asistanıyım. Şikayetinizi yazabilir veya dişinizin fotoğrafını yükleyebilirsiniz. Size hangi bölüme randevu almanız gerektiği konusunda yardımcı olabilirim.'
    }
  ]);
  const [input, setInput] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [showTooltip, setShowTooltip] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Occasional tooltip effect
  useEffect(() => {
    if (isOpen) {
      setShowTooltip(false);
      return;
    }
    
    // Show tooltip 5 seconds after page load
    const initialTimer = setTimeout(() => {
      if (!isOpen) setShowTooltip(true);
      
      // Hide after 5 seconds
      setTimeout(() => setShowTooltip(false), 5000);
    }, 5000);

    // Then show it randomly every 30-45 seconds
    const interval = setInterval(() => {
      if (!isOpen) {
        setShowTooltip(true);
        setTimeout(() => setShowTooltip(false), 5000);
      }
    }, 35000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [isOpen]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Fotoğraf boyutu 5MB\'dan küçük olmalıdır.');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Sadece base64 verisini al (data:image/jpeg;base64, kısmını at)
        const base64Data = result.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleSend = async () => {
    if ((!input.trim() && !imageFile) || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      imageUrl: imagePreview || undefined,
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    const currentImageFile = imageFile;
    
    setInput('');
    handleRemoveImage();
    setIsLoading(true);

    try {
      let imageBase64 = undefined;
      let mimeType = undefined;
      
      if (currentImageFile) {
        imageBase64 = await fileToBase64(currentImageFile);
        mimeType = currentImageFile.type;
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: currentInput,
          image: imageBase64,
          mimeType: mimeType,
          history: messages.map(m => ({ role: m.role, content: m.content }))
        }),
      });

      if (!response.ok) {
        throw new Error('Bir hata oluştu');
      }

      const data = await response.json();
      
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        content: data.reply
      }]);

    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        content: 'Üzgünüm, şu anda yanıt veremiyorum. Lütfen daha sonra tekrar deneyin.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="perio-wrapper">
      {!isOpen && (
        <div style={{ position: 'relative' }}>
          <div className={`perio-bubble-tooltip ${showTooltip ? 'visible' : ''}`}>
            Merhaba! Bana sormak istediğin bir şey var mı?
          </div>
          <button 
            className="perio-toggle-btn" 
            onClick={() => setIsOpen(true)}
            aria-label="Dr. Perio ile sohbet et"
            style={{ padding: 0, overflow: 'hidden' }}
          >
            <img src="/dr-perio.png" alt="Dr. Perio" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </button>
        </div>
      )}

      {isOpen && (
        <div className="perio-chat-window">
          <div className="perio-header">
            <div className="perio-header-info">
              <div className="perio-avatar" style={{ padding: 0, overflow: 'hidden' }}>
                <img src="/dr-perio.png" alt="Dr. Perio" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div>
                <h3>Dr. Perio</h3>
                <p>Yapay Zeka Asistanı</p>
              </div>
            </div>
            <button className="perio-close-btn" onClick={() => setIsOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <div className="perio-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`perio-message ${msg.role}`}>
                {msg.imageUrl && (
                  <img src={msg.imageUrl} alt="Yüklenen" className="perio-message-image" />
                )}
                {msg.role === 'bot' ? (
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                ) : (
                  <p>{msg.content}</p>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="perio-typing">
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="perio-input-area">
            {imagePreview && (
              <div className="perio-image-preview">
                <ImageIcon size={14} />
                <span>Fotoğraf eklendi</span>
                <button className="perio-remove-image" onClick={handleRemoveImage}>
                  <X size={14} />
                </button>
              </div>
            )}
            
            <div className="perio-input-row">
              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                onChange={handleImageChange}
              />
              <button 
                className="perio-attach-btn" 
                onClick={() => fileInputRef.current?.click()}
                title="Fotoğraf Yükle"
              >
                <ImageIcon size={20} />
              </button>
              
              <input
                type="text"
                className="perio-input"
                placeholder="Şikayetinizi yazın..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
              />
              
              <button 
                className="perio-send-btn" 
                onClick={handleSend}
                disabled={isLoading || (!input.trim() && !imageFile)}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
