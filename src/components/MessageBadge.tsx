'use client';

import { useState, useEffect } from 'react';
import { getUnreadCount } from '@/app/actions/chat';

export default function MessageBadge() {
  const [count, setCount] = useState(0);

  const fetchCount = async () => {
    const unreadCount = await getUnreadCount();
    setCount(unreadCount);
  };

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, []);

  if (count === 0) return null;

  return (
    <span className="nav-badge" style={{
      background: '#ef4444',
      color: 'white',
      fontSize: '10px',
      padding: '2px 6px',
      borderRadius: '50px',
      marginLeft: '5px',
      fontWeight: 'bold',
      border: '1px solid white'
    }}>
      {count}
    </span>
  );
}
