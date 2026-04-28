// src/components/WhatsAppButton.tsx
'use client';

import { usePathname } from 'next/navigation';
import './WhatsAppButton.css';

const WhatsAppButton = () => {
  const pathname = usePathname();
  
  if (pathname.startsWith('/doctor') || pathname.startsWith('/profile') || pathname.startsWith('/admin') || pathname.startsWith('/hekimlerimiz')) {
    return null;
  }

  const phoneNumber = '905464734063'; // Format: country code + number
  const message = encodeURIComponent('Merhaba, GingivaX üzerinden randevu hakkında bilgi almak istiyorum.');
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

  return (
    <a 
      href={whatsappUrl} 
      className="whatsapp-float" 
      target="_blank" 
      rel="noopener noreferrer"
      aria-label="WhatsApp üzerinden bizimle iletişime geçin"
    >
      <div className="whatsapp-icon-wrapper">
        <svg viewBox="0 0 32 32" className="whatsapp-svg">
          <path d="M16 0c-8.837 0-16 7.163-16 16 0 2.825 0.733 5.476 2.016 7.788l-2.016 7.375 7.545-1.981c2.259 1.201 4.852 1.883 7.614 1.883 8.837 0 16-7.163 16-16s-7.163-16-16-16zM16 29.273c-2.453 0-4.757-0.641-6.756-1.761l-0.484-0.272-4.484 1.176 1.196-4.375-0.299-0.475c-1.211-1.92-1.916-4.201-1.916-6.643 0-7.319 5.955-13.273 13.273-13.273s13.273 5.955 13.273 13.273-5.955 13.273-13.273 13.273zM23.364 19.382c-0.404-0.202-2.391-1.179-2.761-1.314s-0.64-0.202-0.909 0.202c-0.269 0.404-1.044 1.314-1.279 1.583s-0.471 0.303-0.875 0.101c-0.404-0.202-1.706-0.628-3.249-2.004-1.201-1.071-2.011-2.393-2.247-2.797s-0.025-0.622 0.177-0.823c0.181-0.181 0.404-0.471 0.606-0.707s0.269-0.404 0.404-0.674c0.135-0.269 0.067-0.505-0.034-0.707s-0.909-2.189-1.246-3c-0.328-0.789-0.663-0.683-0.909-0.695s-0.505-0.014-0.774-0.014c-0.269 0-0.707 0.101-1.078 0.505s-1.414 1.381-1.414 3.367c0 1.986 1.447 3.906 1.649 4.175s2.847 4.349 6.9 6.095c0.964 0.415 1.716 0.663 2.303 0.85 0.968 0.308 1.85 0.265 2.546 0.161 0.776-0.116 2.391-0.976 2.728-1.919s0.337-1.751 0.236-1.919c-0.101-0.168-0.37-0.269-0.774-0.471z" fill="currentColor"></path>
        </svg>
      </div>
    </a>
  );
};

export default WhatsAppButton;
