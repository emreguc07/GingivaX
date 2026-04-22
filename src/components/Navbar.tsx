'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import MessageBadge from './MessageBadge';
import './Navbar.css';

const Navbar = () => {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isAuthPage = pathname === '/login' || pathname === '/register';

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <nav className={`navbar glass ${isMenuOpen ? 'is-open' : ''}`}>
      <div className="container navbar-content">
        {/* LOGO */}
        <Link href="/" className="logo-section" onClick={closeMenu}>
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
              <Link href="/#hizmetler" onClick={closeMenu}>Hizmetler</Link>
              <Link href="/hekimlerimiz" onClick={closeMenu}>Hekimlerimiz</Link>
              <Link href="/#hakkimizda" onClick={closeMenu}>Hakkımızda</Link>
              
              {session?.user?.role === 'ADMIN' && (
                <Link href="/admin" className="doctor-link admin-btn" style={{borderColor: 'gold', color: 'gold'}} onClick={closeMenu}>Admin Panel</Link>
              )}
              {(session?.user?.role === 'DOCTOR' || session?.user?.role === 'ADMIN') && (
                <Link href="/doctor" className="doctor-link flex items-center gap-1" onClick={closeMenu}>
                  Doktor Paneli <MessageBadge />
                </Link>
              )}
              
              <div className="auth-section-nav">
                {session ? (
                  <div className="user-nav">
                    <Link href="/profile" className="user-profile-link" onClick={closeMenu}>
                      <span className="user-name">{session.user.name}</span>
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
