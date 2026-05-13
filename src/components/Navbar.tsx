'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import MessageBadge from './MessageBadge';
import NotificationBell from './NotificationBell';
import { smoothScrollTo } from '@/lib/utils';
import './Navbar.css';

const Navbar = () => {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isAuthPage = pathname === '/login' || pathname === '/register';

  const closeMenu = () => setIsMenuOpen(false);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('/#') && pathname === '/') {
      e.preventDefault();
      const id = href.replace('/#', '');
      smoothScrollTo(id, 1500);
      closeMenu();
    }
  };

  const handleSamePageClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (pathname === href) {
      e.preventDefault();
      smoothScrollTo('top', 1500);
    }
    closeMenu();
  };

  return (
    <nav className={`navbar glass ${isMenuOpen ? 'is-open' : ''}`}>
      <div className="container navbar-content">
        {/* LOGO */}
        <Link href="/" className="logo-section" onClick={(e) => handleSamePageClick(e, '/')}>
          <div className="logo-wrapper">
             <img src="/logo.png" alt="GingivaX Logo" width={32} height={32} className="logo-img" />
          </div>
          <span className="logo-text">Gingiva<span className="text-primary">X</span></span>
        </Link>
        
        {!isAuthPage && (
          <>
            {/* MOBILE TOGGLE BUTTON */}
            <button 
              className="menu-toggle" 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle Menu"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>

            {/* NAVIGATION LINKS */}
            <div className="nav-links">
              <Link href="/" onClick={(e) => handleSamePageClick(e, '/')}>Ana Sayfa</Link>
              <Link href="/#hizmetler" onClick={e => { handleNavClick(e, '/#hizmetler'); closeMenu(); }}>Hizmetler</Link>
              <Link href="/hekimlerimiz" onClick={(e) => handleSamePageClick(e, '/hekimlerimiz')}>Hekimlerimiz</Link>
              <Link href="/dr-perio" className="dr-perio-nav-link" onClick={(e) => handleSamePageClick(e, '/dr-perio')}>
                Dr. Perio ✨
              </Link>
              
              {(session?.user as any)?.role === 'ADMIN' && (
                <Link href="/admin" className="doctor-link admin-btn" style={{borderColor: 'gold', color: 'gold'}} onClick={closeMenu}>Admin Panel</Link>
              )}
              {((session?.user as any)?.role === 'DOCTOR' || (session?.user as any)?.role === 'ADMIN') && (
                <Link href="/doctor" className="doctor-link flex items-center gap-1" onClick={closeMenu}>
                  Doktor Paneli <MessageBadge />
                </Link>
              )}
              
              <div className="auth-section-nav">
                {session ? (
                  <div className="user-nav">
                    <NotificationBell />
                    <Link href="/profile" className="user-profile-link" onClick={closeMenu}>
                      <span className="user-name">{session?.user?.name}</span>
                    </Link>
                    <button 
                      className="btn-outline btn-sm" 
                      onClick={() => { signOut(); closeMenu(); }}
                    >
                      Çıkış
                    </button>
                  </div>
                ) : (
                  <div className="auth-links">
                    <Link href="/login" className="login-link" onClick={closeMenu}>Giriş</Link>
                    <Link href="/register" className="btn-primary btn-sm" onClick={closeMenu}>Kaydol</Link>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
