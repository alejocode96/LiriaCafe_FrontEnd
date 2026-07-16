import { useState, useRef, useEffect, useCallback, createContext, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, ShoppingCart, History,
    ArrowDownToLine, List, DollarSign, BarChart3,
    Package, Tag, Users, Shield, Settings,
    TrendingUp, Warehouse, ChevronRight,
    LogOut, UserCircle, KeyRound, CircleDot, Circle, Keyboard,
} from 'lucide-react';
import { useVirtualKeyboard } from '../../context/VirtualKeyboardContext';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/auth.store';
import { canAccess } from '../../utils/permissions';
import { useLogout } from '../../hooks/useLogout';
import api from '../../api/client';


/* ══════════════════════════════════════════════════════
   FLYOUT CONTEXT
══════════════════════════════════════════════════════ */
const FlyoutCtx = createContext(null);

function FlyoutProvider({ children, onMobileClose, isMobile }) {
    const [openId, setOpenId] = useState(null);
    const timer = useRef(null);

    const open = useCallback((id) => { clearTimeout(timer.current); setOpenId(id); }, []);
    const close = useCallback(() => { clearTimeout(timer.current); setOpenId(null); }, []);
    const scheduleClose = useCallback(() => {
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setOpenId(null), 140);
    }, []);
    const cancelClose = useCallback(() => { clearTimeout(timer.current); }, []);

    return (
        <FlyoutCtx.Provider value={{ openId, open, close, scheduleClose, cancelClose, onMobileClose, isMobile }}>
            {children}
        </FlyoutCtx.Provider>
    );
}

/* ── Flyout panel animado (solo desktop collapsed) ── */
function FlyoutPanel({ id, label, triggerRef, profileMode, children }) {
    const { openId, cancelClose, scheduleClose } = useContext(FlyoutCtx);
    const isOpen = openId === id;
    const [mounted, setMounted] = useState(false);
    const [visible, setVisible] = useState(false);
    const [pos, setPos] = useState({ top: 0 });

    useEffect(() => {
        if (isOpen) {
            if (triggerRef.current) {
                const rect = triggerRef.current.getBoundingClientRect();
                if (profileMode) {
                    setPos({ bottom: window.innerHeight - rect.top + 8 });
                } else {
                    setPos({ top: rect.top });
                }
            }
            setMounted(true);
            requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
        } else {
            setVisible(false);
            const t = setTimeout(() => setMounted(false), 220);
            return () => clearTimeout(t);
        }
    }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!mounted) return null;

    const posStyle = profileMode
        ? { bottom: pos.bottom, top: 'auto' }
        : { top: pos.top };

    return (
        <div
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
            style={{
                position: 'fixed', left: '76px', zIndex: 9999, minWidth: '210px', ...posStyle,
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateX(0px)' : 'translateX(-8px)',
                transition: 'opacity 200ms cubic-bezier(0.16,1,0.3,1), transform 200ms cubic-bezier(0.16,1,0.3,1)',
                pointerEvents: visible ? 'auto' : 'none',
            }}
        >
            <div style={{
                background: '#0b1a14',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '14px',
                boxShadow: '0 12px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
                overflow: 'hidden',
            }}>
                {label && (
                    <div style={{ padding: '9px 14px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#9ca3af', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                            {label}
                        </span>
                    </div>
                )}
                <div style={{ padding: '6px' }}>{children}</div>
            </div>
        </div>
    );
}

/* ── Item dentro de un flyout (desktop collapsed) ── */
function FlyoutNavItem({ to, icon: Icon, label, badge }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { close, onMobileClose } = useContext(FlyoutCtx);
    const isActive = location.pathname === to;

    return (
        <button
            onClick={() => { navigate(to); close(); onMobileClose?.(); }}
            style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                padding: '9px 10px', borderRadius: '9px', border: 'none', cursor: 'pointer',
                fontSize: '13px', fontWeight: 500, textAlign: 'left',
                background: isActive ? 'rgba(85,98,74,0.55)' : 'transparent',
                color: isActive ? '#d4c84a' : '#9ca3af',
                transition: 'background 130ms, color 130ms',
            }}
            onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#e5e7eb'; } }}
            onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af'; } }}
        >
            <Icon size={14} style={{ color: 'currentColor', flexShrink: 0 }} />
            <span style={{ flex: 1 }}>{label}</span>
            {badge > 0 && (
                <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '999px', background: 'rgba(212,200,74,0.15)', color: '#d4c84a' }}>
                    {badge}
                </span>
            )}
        </button>
    );
}

/* ── CategoryButton ── */
function CategoryButton({ id, icon: Icon, label, items, collapsed, badge }) {
    const { openId, open, close, scheduleClose, onMobileClose, isMobile } = useContext(FlyoutCtx);
    const [expanded, setExpanded] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const btnRef = useRef(null);
    const isThisOpen = openId === id;

    const isAnyActive = items.some(item => location.pathname === item.to);

    /* ── Modo colapsado: icono + flyout (solo desktop) ── */
    if (collapsed) {
        return (
            <>
                <button
                    ref={btnRef}
                    onMouseEnter={() => open(id)}
                    onMouseLeave={scheduleClose}
                    onClick={() => (isThisOpen ? close() : open(id))}
                    style={{
                        position: 'relative', width: '100%', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        height: '44px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                        background: isAnyActive ? 'rgba(85,98,74,0.55)' : isThisOpen ? 'rgba(255,255,255,0.05)' : 'transparent',
                        color: isAnyActive ? '#d4c84a' : '#6b7280',
                        transition: 'background 130ms, color 130ms',
                    }}
                >
                    <Icon size={18} style={{ color: 'currentColor' }} />
                    {badge > 0 && (
                        <span style={{ position: 'absolute', top: '8px', right: '8px', width: '7px', height: '7px', borderRadius: '50%', background: '#d4c84a' }} />
                    )}
                </button>
                <FlyoutPanel id={id} label={label} triggerRef={btnRef}>
                    {items.map(item => <FlyoutNavItem key={item.to} {...item} />)}
                </FlyoutPanel>
            </>
        );
    }

    /* ── Modo expandido: accordion ── */
    const handleClick = () => {
        if (items.length === 1) { navigate(items[0].to); onMobileClose?.(); return; }
        close();
        setExpanded(prev => !prev);
    };

    const activeExtra = isAnyActive ? { boxShadow: 'inset 4px 0 0 #d4c84a' } : {};

    return (
        <div>
            <button
                onClick={handleClick}
                style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 14px', borderRadius: '12px',
                    border: 'none', cursor: 'pointer',
                    background: isAnyActive ? 'rgba(85,98,74,0.45)' : 'transparent',
                    color: isAnyActive ? '#d4c84a' : '#9ca3af',
                    transition: 'background 130ms, color 130ms',
                    ...activeExtra,
                }}
                onMouseEnter={e => { if (!isAnyActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#e5e7eb'; } }}
                onMouseLeave={e => { if (!isAnyActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af'; } }}
            >
                <Icon size={16} style={{ color: 'currentColor', flexShrink: 0 }} />
                <span style={{
                    flex: 1, fontSize: '13px', fontWeight: 600,
                    textAlign: 'left', letterSpacing: '0.02em',
                    textTransform: 'uppercase',
                }}>
                    {label}
                </span>
                {badge > 0 && (
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '999px', background: 'rgba(212,200,74,0.15)', color: '#d4c84a' }}>
                        {badge}
                    </span>
                )}
                {items.length > 1 && (
                    <ChevronRight size={12} style={{ color: 'currentColor', flexShrink: 0, transition: 'transform 220ms cubic-bezier(0.16,1,0.3,1)', transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }} />
                )}
            </button>

            {items.length > 1 && (
                <div style={{
                    overflow: 'hidden',
                    maxHeight: expanded ? `${items.length * 44 + 12}px` : '0px',
                    transition: 'max-height 230ms cubic-bezier(0.16,1,0.3,1)',
                }}>
                    <div style={{
                        marginLeft: '14px',
                        paddingLeft: '12px',
                        borderLeft: '1px solid rgba(255,255,255,0.07)',
                        paddingTop: '3px', paddingBottom: '3px',
                    }}>
                        {items.map(item => {
                            const isActive = location.pathname === item.to;
                            return (
                                <button
                                    key={item.to}
                                    onClick={() => { navigate(item.to); onMobileClose?.(); }}
                                    style={{
                                        width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                                        padding: '9px 12px 9px 10px',
                                        borderRadius: '10px',
                                        border: 'none', cursor: 'pointer',
                                        fontSize: '13px', fontWeight: 500, textAlign: 'left',
                                        background: isActive ? 'rgba(85,98,74,0.45)' : 'transparent',
                                        color: isActive ? '#d4c84a' : '#6b7280',
                                        transition: 'background 130ms, color 130ms',
                                        ...(isActive ? { boxShadow: 'inset 4px 0 0 #d4c84a' } : {}),
                                    }}
                                    onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#e5e7eb'; } }}
                                    onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280'; } }}
                                >
                                    <item.icon size={14} style={{ color: 'currentColor', flexShrink: 0 }} />
                                    <span style={{ flex: 1 }}>{item.label}</span>
                                    {item.badge > 0 && (
                                        <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '999px', background: 'rgba(212,200,74,0.15)', color: '#d4c84a' }}>
                                            {item.badge}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ── Profile button ── */
function ProfileButton({ usuario, onLogout, collapsed, isMobile }) {
    const [mobileExpanded, setMobileExpanded] = useState(false);
    const { open, close, scheduleClose, cancelClose, onMobileClose } = useContext(FlyoutCtx);
    const navigate = useNavigate();
    const btnRef = useRef(null);
    const PROFILE_ID = '__profile__';

    const initials = (usuario?.nombreCompleto ?? usuario?.nombreUsuario ?? 'U').charAt(0).toUpperCase();
    const nombre   = usuario?.nombreCompleto ?? usuario?.nombreUsuario ?? 'Usuario';
    const username = usuario?.nombreUsuario ?? '';
    const rol      = usuario?.rol?.nombre ?? '';

    const avatarStyle = {
        flexShrink: 0, width: '32px', height: '32px', borderRadius: '50%',
        background: 'linear-gradient(135deg, #55624a 0%, #d4c84a 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#001a12', fontSize: '13px', fontWeight: 700,
    };

    /* ── Modo expandido (desktop o mobile): acordeón inline ── */
    if (!collapsed) {
        return (
            <div style={{ padding: '6px 8px 8px' }}>
                {/* Profile header — expandible */}
                <button
                    onClick={() => setMobileExpanded(v => !v)}
                    style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '10px 12px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                        background: mobileExpanded ? 'rgba(255,255,255,0.05)' : 'transparent',
                        transition: 'background 130ms',
                        boxSizing: 'border-box',
                    }}
                >
                    <div style={avatarStyle}>{initials}</div>
                    <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                        <p style={{ color: '#f9fafb', fontSize: '13px', fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nombre}</p>
                        <p style={{ color: '#6b7280', fontSize: '11px', margin: 0, textTransform: 'capitalize' }}>{rol.toLowerCase()}</p>
                    </div>
                    <ChevronRight
                        size={13} color="#6b7280"
                        style={{ flexShrink: 0, transition: 'transform 220ms cubic-bezier(0.16,1,0.3,1)', transform: mobileExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                    />
                </button>

                {/* Opciones expandibles */}
                <div style={{ overflow: 'hidden', maxHeight: mobileExpanded ? '240px' : '0px', transition: 'max-height 250ms cubic-bezier(0.16,1,0.3,1)' }}>
                    <div style={{ paddingTop: '4px' }}>
                        {[
                            { icon: UserCircle, label: 'Ver perfil',           action: () => { navigate('/perfil');             onMobileClose?.(); } },
                            { icon: KeyRound,   label: 'Cambiar contraseña',   action: () => { navigate('/perfil/contrasena'); onMobileClose?.(); } },
                        ].map(({ icon: Icon, label, action }) => (
                            <button key={label} onClick={action}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500, textAlign: 'left', background: 'transparent', color: '#9ca3af', transition: 'background 130ms, color 130ms' }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#e5e7eb'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af'; }}
                            >
                                <Icon size={14} style={{ color: 'currentColor', flexShrink: 0 }} />
                                {label}
                            </button>
                        ))}

                        <button onClick={onLogout}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500, textAlign: 'left', background: 'transparent', color: '#f87171', transition: 'background 130ms' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.08)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                        >
                            <LogOut size={14} style={{ color: 'currentColor', flexShrink: 0 }} />
                            Cerrar sesión
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    /* ── Versión DESKTOP: flyout ── */
    return (
        <div style={{ padding: '8px' }}>
            <button
                ref={btnRef}
                onMouseEnter={(e) => { open(PROFILE_ID); cancelClose(); e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                onMouseLeave={(e) => { scheduleClose(); e.currentTarget.style.background = 'transparent'; }}
                onClick={() => open(PROFILE_ID)}
                style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    gap: collapsed ? '0' : '10px',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    padding: collapsed ? '10px 0' : '10px 12px',
                    borderRadius: '12px', border: 'none', cursor: 'pointer',
                    background: 'transparent', transition: 'background 130ms',
                }}
            >
                <div style={avatarStyle}>{initials}</div>
                {!collapsed && (
                    <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                        <p style={{ color: '#f9fafb', fontSize: '13px', fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nombre}</p>
                        <p style={{ color: '#6b7280', fontSize: '11px', margin: 0, textTransform: 'capitalize' }}>{rol.toLowerCase()}</p>
                    </div>
                )}
            </button>

            <FlyoutPanel id={PROFILE_ID} triggerRef={btnRef} profileMode>
                <div style={{ padding: '10px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <div style={{ ...avatarStyle, width: '34px', height: '34px' }}>{initials}</div>
                        <div style={{ minWidth: 0 }}>
                            <p style={{ color: '#ffffff', fontSize: '13px', fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nombre}</p>
                            <p style={{ color: '#6b7280', fontSize: '11px', margin: 0 }}>{username}</p>
                        </div>
                    </div>
                    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '999px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', background: 'rgba(212,200,74,0.12)', color: '#d4c84a', border: '1px solid rgba(212,200,74,0.20)' }}>
                        {rol}
                    </span>
                </div>

                {[
                    { icon: UserCircle, label: 'Ver perfil',         action: () => { navigate('/perfil');             close(); onMobileClose?.(); } },
                    { icon: KeyRound,   label: 'Cambiar contraseña', action: () => { navigate('/perfil/contrasena'); close(); onMobileClose?.(); } },
                ].map(({ icon: Icon, label, action }) => (
                    <button key={label} onClick={action}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 10px', borderRadius: '9px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500, textAlign: 'left', background: 'transparent', color: '#9ca3af', transition: 'background 130ms, color 130ms' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#e5e7eb'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af'; }}
                    >
                        <Icon size={14} style={{ color: 'currentColor', flexShrink: 0 }} />
                        {label}
                    </button>
                ))}

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: '4px', paddingTop: '4px' }}>
                    <button onClick={onLogout}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 10px', borderRadius: '9px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500, textAlign: 'left', background: 'transparent', color: '#f87171', transition: 'background 130ms' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.08)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                        <LogOut size={14} style={{ color: 'currentColor', flexShrink: 0 }} />
                        Cerrar sesión
                    </button>
                </div>
            </FlyoutPanel>
        </div>
    );
}

/* ── Keyboard toggle ── */
function VKBToggle({ collapsed, isMobile }) {
    const { enabled, toggle } = useVirtualKeyboard();

    return (
        <div style={{ padding: '4px 8px 6px' }}>
            <button
                onClick={toggle}
                title={enabled ? 'Desactivar teclado táctil' : 'Activar teclado táctil'}
                style={{
                    width: '100%',
                    display: 'flex', alignItems: 'center',
                    gap: collapsed ? 0 : '10px',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    padding: collapsed ? '10px 0' : '10px 12px',
                    borderRadius: '12px',
                    border: `1px solid ${enabled ? 'rgba(212,200,74,0.32)' : 'rgba(255,255,255,0.06)'}`,
                    background: enabled ? 'rgba(212,200,74,0.08)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 180ms',
                    boxSizing: 'border-box',
                }}
                onMouseEnter={e => { if (!enabled) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                onMouseLeave={e => { if (!enabled) e.currentTarget.style.background = 'transparent'; }}
            >
                <Keyboard size={15} color={enabled ? '#d4c84a' : '#6b7280'} style={{ flexShrink: 0 }} />
                {!collapsed && (
                    <>
                        <span style={{ flex: 1, fontSize: '11px', fontWeight: 600, textAlign: 'left', color: enabled ? '#d4c84a' : '#6b7280', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                            Teclado táctil
                        </span>
                        <span style={{
                            fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: '5px',
                            background: enabled ? 'rgba(212,200,74,0.18)' : 'rgba(255,255,255,0.06)',
                            color: enabled ? '#d4c84a' : '#4b5563',
                            letterSpacing: '0.07em',
                        }}>
                            {enabled ? 'ON' : 'OFF'}
                        </span>
                    </>
                )}
            </button>
        </div>
    );
}

/* ══════════════════════════════════════════════════════
   SIDEBAR INNER
══════════════════════════════════════════════════════ */
function SidebarInner({ collapsed, onToggle, isMobile, mobileOpen, onMobileClose }) {
    const { usuario } = useAuthStore();
    const navigate    = useNavigate();
    const location    = useLocation();
    const { handleLogout } = useLogout();

    const esAdmin  = usuario?.rol?.esAdmin ?? false;
    const permisos = usuario?.rol?.permisos ?? [];
    const can      = (key) => canAccess(key, esAdmin, permisos);

    const { data: cashStatus } = useQuery({
        queryKey: ['cash-register', 'status'],
        queryFn: async () => {
            try {
                const res = await api.get('/cash-register/status');
                return res.data?.data ?? { hayTCajaAbierta: false };
            } catch {
                return { hayTCajaAbierta: false };
            }
        },
        enabled: true, retry: false,
        refetchInterval: 60_000, staleTime: 30_000,
    });
    const isOpen     = cashStatus?.hayTCajaAbierta ?? false;
    const formatTime = (iso) => new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

    const navGroups = [
        {
            id: 'caja', label: 'Caja', icon: DollarSign, show: can('caja'),
            items: [
                { to: '/caja',           icon: DollarSign, label: 'Caja Registradora' },
                { to: '/caja/historial', icon: History,    label: 'Historial de Cajas' },
            ],
        },
        {
            id: 'pos', label: 'Punto de Venta', icon: ShoppingCart, show: can('pos'),
            items: [{ to: '/ventas/nueva', icon: ShoppingCart, label: 'Nueva Venta' }],
        },
        {
            id: 'ventas', label: 'Ventas', icon: List, show: can('ventas'),
            items: [
                { to: '/ventas',         icon: List, label: 'Historial'       },
                { to: '/ventas/buscar',  icon: List, label: 'Buscar Factura'  },
            ],
        },
        {
            id: 'flujo_caja', label: 'Flujo de Caja', icon: TrendingUp, show: can('flujo_caja'),
            items: [
                { to: '/flujo-caja/nuevo',    icon: ArrowDownToLine, label: 'Registrar Movimiento' },
                { to: '/flujo-caja',          icon: List,            label: 'Ver Movimientos'       },
                { to: '/flujo-caja/resumen',  icon: TrendingUp,      label: 'Resumen Financiero'    },
            ],
        },
        {
            id: 'inventario', label: 'Inventario', icon: Warehouse, show: can('inventario'),
            items: [
                { to: '/inventario',          icon: Warehouse,      label: 'Ítems'             },
                { to: '/inventario/entrada',  icon: ArrowDownToLine,label: 'Registrar Entrada' },
            ],
        },
        {
            id: 'productos', label: 'Productos', icon: Package, show: can('productos'),
            items: [
                { to: '/productos',   icon: Package, label: 'Catálogo'    },
                { to: '/categorias',  icon: Tag,     label: 'Categorías'  },
            ],
        },
        {
            id: 'reportes', label: 'Reportes', icon: BarChart3, show: can('reportes'),
            items: [
                { to: '/reportes/ventas',        icon: BarChart3,   label: 'Ventas'       },
                { to: '/reportes/rentabilidad',  icon: TrendingUp,  label: 'Rentabilidad' },
                { to: '/reportes/inventario',    icon: Warehouse,   label: 'Inventario'   },
                { to: '/reportes/caja',          icon: DollarSign,  label: 'Caja y Flujo' },
            ],
        },
        {
            id: 'admin', label: 'Administración', icon: Shield,
            show: can('usuarios') || can('roles') || can('configuracion'),
            items: [
                can('usuarios')       && { to: '/admin/usuarios',       icon: Users,    label: 'Usuarios'        },
                can('roles')          && { to: '/admin/roles',          icon: Shield,   label: 'Roles y Permisos'},
                can('configuracion')  && { to: '/admin/configuracion',  icon: Settings, label: 'Configuración'   },
            ].filter(Boolean),
        },
    ].filter(g => g.show && g.items.length > 0);

    const isDash = location.pathname === '/dashboard';

    return (
        <aside style={{
            position: isMobile ? 'fixed' : 'relative',
            ...(isMobile ? { top: 0, left: 0 } : {}),
            display: 'flex', flexDirection: 'column',
            height: '100vh', flexShrink: 0,
            width: isMobile ? '260px' : (collapsed ? '68px' : '240px'),
            transition: isMobile
                ? 'transform 280ms cubic-bezier(0.16,1,0.3,1)'
                : 'width 280ms cubic-bezier(0.16,1,0.3,1)',
            transform: isMobile
                ? (mobileOpen ? 'translateX(0)' : 'translateX(-100%)')
                : undefined,
            background: 'linear-gradient(180deg, #091812 0%, #060f0b 100%)',
            borderRight: '1px solid rgba(255,255,255,0.05)',
            overflow: collapsed ? 'visible' : 'hidden',
            zIndex: 50,
        }}>

            {/* Grain */}
            <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.025,
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                backgroundSize: '180px 180px',
            }} />

            {/* ── HEADER ── */}
            <div style={{
                position: 'relative', height: '60px', flexShrink: 0,
                display: 'flex', alignItems: 'center',
                padding: collapsed ? '0 12px' : '0 16px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                gap: '10px',
            }}>
                <img
                    src="/Logo.png" alt="Logo"
                    style={{ width: collapsed ? '32px' : '40px', height: collapsed ? '32px' : '40px', objectFit: 'contain', flexShrink: 0, transition: 'width 280ms, height 280ms' }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                />
                <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: collapsed ? '0px' : '180px', opacity: collapsed ? 0 : 1, transition: 'max-width 280ms cubic-bezier(0.16,1,0.3,1), opacity 180ms' }}>
                    <span style={{ color: 'white', fontSize: '13px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'Syne', sans-serif" }}>
                        Liria Café
                    </span>
                </div>

                {/* Collapse toggle — solo desktop */}
                {!isMobile && (
                    <button
                        onClick={onToggle}
                        style={{ position: 'absolute', right: '-12px', top: '50%', transform: 'translateY(-50%)', width: '24px', height: '24px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)', background: '#0c1c16', boxShadow: '0 2px 8px rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10, transition: 'border-color 150ms' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#d4c84a'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                    >
                        <ChevronRight size={14} color="#ffffff" style={{ transition: 'transform 280ms cubic-bezier(0.16,1,0.3,1)', transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)' }} />
                    </button>
                )}
            </div>

            {/* ── ESTADO DE CAJA ── */}
            <div style={{
                margin: '10px 10px 4px', borderRadius: '12px',
                border: `1px solid ${isOpen ? 'rgba(74,222,128,0.14)' : 'rgba(248,113,113,0.14)'}`,
                background: isOpen ? 'rgba(0,40,30,0.5)' : 'rgba(40,10,10,0.5)',
                padding: collapsed ? '10px' : '10px 14px',
                display: 'flex', flexDirection: 'column',
                alignItems: collapsed ? 'center' : 'flex-start',
                justifyContent: 'center',
                transition: 'padding 280ms', overflow: 'hidden',
                flexShrink: 0,
            }}>
                {isOpen ? (
                    collapsed ? <CircleDot size={13} color="#4ade80" /> : (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                                <CircleDot size={11} color="#4ade80" />
                                <span style={{ color: '#4ade80', fontSize: '11px', fontWeight: 600 }}>Caja abierta</span>
                            </div>
                            {cashStatus?.fechaApertura && (
                                <span style={{ color: '#86efac', fontSize: '11px' }}>
                                    Desde {formatTime(cashStatus.fechaApertura)}
                                </span>
                            )}
                        </>
                    )
                ) : (
                    collapsed ? <Circle size={13} color="#f87171" /> : (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                                <Circle size={11} color="#f87171" />
                                <span style={{ color: '#f87171', fontSize: '11px', fontWeight: 600 }}>Sin caja abierta</span>
                            </div>
                            <button
                                onClick={() => { navigate('/caja'); onMobileClose?.(); }}
                                style={{ color: '#fca5a5', fontSize: '11px', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                            >
                                Abrir caja →
                            </button>
                        </>
                    )
                )}
            </div>

            {/* ── NAV ── */}
            <nav style={{
                flex: 1, minHeight: 0,
                padding: '10px 10px',
                display: 'flex', flexDirection: 'column', gap: '2px',
                overflowY: 'auto', overflowX: 'hidden',
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(255,255,255,0.08) transparent',
            }}>
                {/* Dashboard */}
                <button
                    onClick={() => { navigate('/dashboard'); onMobileClose?.(); }}
                    style={{
                        width: '100%', display: 'flex', alignItems: 'center',
                        gap: collapsed ? 0 : '10px',
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        padding: collapsed ? '0' : '10px 14px',
                        height: collapsed ? '44px' : undefined,
                        borderRadius: '12px',
                        border: 'none', cursor: 'pointer',
                        background: isDash ? 'rgba(85,98,74,0.55)' : 'transparent',
                        color: isDash ? '#d4c84a' : '#9ca3af',
                        boxShadow: !collapsed && isDash ? 'inset 4px 0 0 #d4c84a' : 'none',
                        transition: 'background 130ms, color 130ms, box-shadow 130ms',
                    }}
                    onMouseEnter={e => { if (!isDash) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#e5e7eb'; } }}
                    onMouseLeave={e => { if (!isDash) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af'; } }}
                >
                    <LayoutDashboard size={collapsed ? 18 : 16} style={{ color: 'currentColor', flexShrink: 0 }} />
                    {!collapsed && (
                        <span style={{ fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                            Dashboard
                        </span>
                    )}
                </button>

                <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '6px 2px' }} />

                {navGroups.map(group => (
                    <CategoryButton
                        key={group.id}
                        id={group.id}
                        icon={group.icon}
                        label={group.label}
                        items={group.items}
                        collapsed={collapsed}
                        badge={group.items.reduce((acc, i) => acc + (i.badge || 0), 0)}
                    />
                ))}

                <div style={{ height: 4, flexShrink: 0 }} />
            </nav>

            {/* ── TECLADO TÁCTIL ── */}
            <div style={{ margin: '0 10px', height: '1px', background: 'rgba(255,255,255,0.05)', flexShrink: 0 }} />
            <VKBToggle collapsed={collapsed} isMobile={isMobile} />

            {/* ── PERFIL ── */}
            <div style={{ margin: '0 10px', height: '1px', background: 'rgba(255,255,255,0.05)', flexShrink: 0 }} />
            <ProfileButton usuario={usuario} onLogout={handleLogout} collapsed={collapsed} isMobile={isMobile} />
        </aside>
    );
}

export default function Sidebar(props) {
    return (
        <FlyoutProvider onMobileClose={props.onMobileClose} isMobile={props.isMobile}>
            <SidebarInner {...props} />
        </FlyoutProvider>
    );
}
