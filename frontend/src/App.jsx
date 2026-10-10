import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useApp } from './context/AppContext.jsx';
import LanguageSelector from './components/LanguageSelector.jsx';
import { ConnectionBanner, SimBanner } from './components/Banners.jsx';
import Dashboard from './pages/Dashboard.jsx';
import CrisisMapPage from './pages/CrisisMapPage.jsx';
import SafetyCenter from './pages/SafetyCenter.jsx';
import PassportPage from './pages/PassportPage.jsx';

function Logo() {
  return (
    <svg className="logo" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="sjShieldGrad" x1="8" y1="4" x2="56" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="50%" stopColor="#0284C7" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <linearGradient id="sjRouteGrad" x1="16" y1="52" x2="48" y2="16" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="50%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#FFFFFF" />
        </linearGradient>
        <filter id="sjGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0284C7" floodOpacity="0.4" />
        </filter>
      </defs>
      <path
        d="M32 4L10 13.5v16.2c0 14.8 9.4 28.6 22 32.3 12.6-3.7 22-17.5 22-32.3V13.5L32 4z"
        fill="url(#sjShieldGrad)"
        filter="url(#sjGlow)"
      />
      <path
        d="M32 7.5L13.5 15.5v14.2c0 12.8 8 24.8 18.5 28.1 10.5-3.3 18.5-15.3 18.5-28.1V15.5L32 7.5z"
        stroke="rgba(255,255,255,0.32)"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M20 48c4-12 18-10 20-22s-8-9-8-9"
        stroke="url(#sjRouteGrad)"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="32" cy="17" r="4.5" fill="#FBBF24" />
      <circle cx="32" cy="17" r="7" stroke="#FDE68A" strokeWidth="1.5" strokeOpacity="0.8" />
      <circle cx="20" cy="48" r="3" fill="#10B981" stroke="#FFFFFF" strokeWidth="1.5" />
    </svg>
  );
}

export default function App() {
  const { t, status, bundle, reload } = useApp();
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  return (
    <>
      <a href="#main" className="skip">Skip to content</a>
      <header className="top noprint">
        <div className="top-in">
          <NavLink to="/" className="brand" aria-label="SafeJourney AI">
            <Logo />
            <span>SafeJourney AI</span>
            <span className="live-shield-pill">LIVE</span>
          </NavLink>
          <LanguageSelector />
        </div>
        <nav className="tabs" aria-label="Main">
          <NavLink to="/" end>{t('nav.dashboard')}</NavLink>
          <NavLink to="/map">{t('nav.map')}</NavLink>
          <NavLink to="/safety">{t('nav.safety')}</NavLink>
          <NavLink to="/passport">{t('nav.passport')}</NavLink>
        </nav>
      </header>
      <SimBanner />
      <ConnectionBanner />
      <main id="main">
        {status === 'loading' || !bundle ? (
          <div className="page"><p className="loading" role="status">{t('common.loading')}</p></div>
        ) : (
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/map" element={<CrisisMapPage />} />
            <Route path="/safety/:id?" element={<SafetyCenter />} />
            <Route path="/passport" element={<PassportPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </main>
      <footer className="foot noprint"><p>{t('footer.disclaimer')}</p></footer>
    </>
  );
}
