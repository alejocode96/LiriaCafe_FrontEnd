import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useAuthStore } from '../store/auth.store';
import ForcePasswordChangeModal from '../components/auth/ForcePasswordChangeModal';
import { VirtualKeyboardProvider } from '../context/VirtualKeyboardContext';
import GlobalVirtualKeyboard from '../components/ui/GlobalVirtualKeyboard';
import { useMobile } from '../hooks/useMobile';

function MainLayoutInner() {
  const [collapsed, setCollapsed] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useMobile();
  const { isLoading } = useCurrentUser();
  const requiereCambioClave = useAuthStore((s) => s.requiereCambioClave);

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100dvh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #ffffff 0%, #f0f2e9 100%)',
        gap: 14,
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: '50%',
          border: '3px solid rgba(85,98,74,0.15)',
          borderTopColor: '#55624a',
          animation: 'spin 700ms linear infinite',
        }} />
        <p style={{
          color: '#8c916c', fontSize: 13, margin: 0,
          fontFamily: 'system-ui, sans-serif',
        }}>
          Cargando sesión…
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      height: '100dvh',
      width: '100vw',
      overflow: 'hidden',
      fontFamily: 'system-ui, sans-serif',
      background: 'linear-gradient(135deg, #ffffff 0%, #f8f9f5 40%, #f0f2e9 75%, #e8ebdd 100%)',
    }}>
      {/* Mobile backdrop */}
      {isMobile && mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 39,
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        collapsed={isMobile ? false : collapsed}
        onToggle={() => setCollapsed(v => !v)}
        isMobile={isMobile}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Contenido principal */}
      <div style={{
        display: 'flex', flexDirection: 'column',
        flex: 1, minWidth: 0, overflow: 'hidden',
      }}>
        <Header
          isMobile={isMobile}
          onMenuClick={() => setMobileOpen(true)}
        />

        <main style={{
          flex: 1,
          overflowY: 'auto',
          padding: isMobile ? '10px 8px' : '24px',
          paddingBottom: isMobile ? '10px' : '24px',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(85,98,74,0.15) transparent',
        }}>
          <Outlet />
        </main>
      </div>

      {requiereCambioClave && <ForcePasswordChangeModal />}
      <GlobalVirtualKeyboard />
    </div>
  );
}

export default function MainLayout() {
  return (
    <VirtualKeyboardProvider>
      <MainLayoutInner />
    </VirtualKeyboardProvider>
  );
}
