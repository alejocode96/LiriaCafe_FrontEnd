import { useState, useRef, useEffect, useCallback, createContext, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, ShoppingCart, TableProperties, ClipboardList,
    DollarSign, History, Package, FlaskConical, TrendingDown,
    BarChart3, Trophy, AlertTriangle, Users, Tag, Settings,
    Shield, LogOut, KeyRound, UserCircle, Coffee,
    CircleDot, Circle, ChevronRight, Zap, BookOpen, Layers,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/auth.store';
import { canAccess } from '../../utils/permissions';
import { useCashStatus } from '../../hooks/useCashStatus';
import api from '../../api/client';

const FlyoutCtx = createContext(null);

function FlyoutProvider({ children }) {
    const [openId, setOpenId] = useState(null);
    const timer = useRef(null);

    const open = useCallback((id) => {
        clearTimeout(timer.current);
        setOpenId(id);
    }, []);

    const close = useCallback(() => {
        clearTimeout(timer.current);
        setOpenId(null);
    }, []);

    const scheduleClose = useCallback(() => {
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setOpenId(null), 140);
    }, []);

    const cancelClose = useCallback(() => {
        clearTimeout(timer.current);
    }, []);

    return (
        <FlyoutCtx.Provider value={{ openId, open, close, scheduleClose, cancelClose }}>
            {children}
        </FlyoutCtx.Provider>
    );
}

/* ── Flyout panel animado ── */
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
                        <span style={{
                            fontSize: '10px', fontWeight: 700, color: '#9ca3af',
                            letterSpacing: '0.12em', textTransform: 'uppercase',
                        }}>
                            {label}
                        </span>
                    </div>
                )}
                <div style={{ padding: '6px' }}>
                    {children}
                </div>
            </div>
        </div>
    );
}

/* ── Item dentro de un flyout ── */
function FlyoutNavItem({ to, icon: Icon, label, badge }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { close } = useContext(FlyoutCtx);
    const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));

    return (
        <button
            onClick={() => { navigate(to); close(); }}
            style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                padding: '9px 10px', borderRadius: '9px', border: 'none', cursor: 'pointer',
                fontSize: '13px', fontWeight: 500, textAlign: 'left',
                background: isActive ? 'rgba(0,58,48,0.65)' : 'transparent',
                color: isActive ? '#ffffff' : '#9ca3af',
                transition: 'background 130ms, color 130ms',
            }}
            onMouseEnter={e => {
                if (!isActive) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.color = '#e5e7eb';
                }
            }}
            onMouseLeave={e => {
                if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#9ca3af';
                }
            }}
        >
            <Icon size={14} style={{ color: 'currentColor', flexShrink: 0 }} />
            <span style={{ flex: 1 }}>{label}</span>
            {badge > 0 && (
                <span style={{
                    fontSize: '10px', fontWeight: 700, padding: '1px 6px',
                    borderRadius: '999px', background: 'rgba(209,213,219,0.12)', color: '#d1d5db',
                }}>
                    {badge}
                </span>
            )}
        </button>
    );
}

/* ── CategoryButton ── */
function CategoryButton({ id, icon: Icon, label, items, collapsed, badge }) {
    const { openId, open, close, scheduleClose } = useContext(FlyoutCtx);
    const [expanded, setExpanded] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const btnRef = useRef(null);
    const isThisOpen = openId === id;

    const isAnyActive = items.some(item =>
        location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to))
    );

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
                        background: isAnyActive ? 'rgba(0,58,48,0.65)' : isThisOpen ? 'rgba(255,255,255,0.05)' : 'transparent',
                        color: isAnyActive ? '#d1d5db' : '#6b7280',
                        transition: 'background 130ms, color 130ms',
                    }}
                >
                    <Icon size={18} style={{ color: 'currentColor' }} />
                    {badge > 0 && (
                        <span style={{
                            position: 'absolute', top: '8px', right: '8px',
                            width: '7px', height: '7px', borderRadius: '50%', background: '#d1d5db',
                        }} />
                    )}
                </button>

                <FlyoutPanel id={id} label={label} triggerRef={btnRef}>
                    {items.map(item => <FlyoutNavItem key={item.to} {...item} />)}
                </FlyoutPanel>
            </>
        );
    }

    const handleClick = () => {
        if (items.length === 1) { navigate(items[0].to); return; }
        close();
        setExpanded(prev => !prev);
    };

    return (
        <div>
            <button
                onClick={handleClick}
                style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '0 12px', height: '44px', borderRadius: '12px',
                    border: 'none', cursor: 'pointer',
                    background: isAnyActive ? 'rgba(0,58,48,0.65)' : 'transparent',
                    color: isAnyActive ? '#ffffff' : '#9ca3af',
                    transition: 'background 130ms, color 130ms',
                }}
                onMouseEnter={e => {
                    if (!isAnyActive) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                        e.currentTarget.style.color = '#e5e7eb';
                    }
                }}
                onMouseLeave={e => {
                    if (!isAnyActive) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#9ca3af';
                    }
                }}
            >
                <Icon size={16} style={{ color: 'currentColor', flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: '13px', fontWeight: 500, textAlign: 'left' }}>{label}</span>
                {badge > 0 && (
                    <span style={{
                        fontSize: '10px', fontWeight: 700, padding: '1px 6px',
                        borderRadius: '999px', background: 'rgba(209,213,219,0.12)', color: '#d1d5db',
                    }}>
                        {badge}
                    </span>
                )}
                {items.length > 1 && (
                    <ChevronRight size={13} style={{
                        color: 'currentColor',
                        transition: 'transform 220ms cubic-bezier(0.16,1,0.3,1)',
                        transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
                        flexShrink: 0,
                    }} />
                )}
            </button>

            {items.length > 1 && (
                <div style={{
                    overflow: 'hidden',
                    maxHeight: expanded ? `${items.length * 40 + 12}px` : '0px',
                    transition: 'max-height 230ms cubic-bezier(0.16,1,0.3,1)',
                }}>
                    <div style={{
                        marginLeft: '14px', paddingLeft: '12px',
                        borderLeft: '1px solid rgba(255,255,255,0.07)',
                        paddingTop: '4px', paddingBottom: '4px',
                    }}>
                        {items.map(item => {
                            const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
                            return (
                                <button
                                    key={item.to}
                                    onClick={() => navigate(item.to)}
                                    style={{
                                        width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                                        padding: '8px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                        fontSize: '12.5px', fontWeight: 500, textAlign: 'left',
                                        background: isActive ? 'rgba(0,58,48,0.5)' : 'transparent',
                                        color: isActive ? '#e5e7eb' : '#6b7280',
                                        transition: 'background 130ms, color 130ms',
                                    }}
                                    onMouseEnter={e => {
                                        if (!isActive) {
                                            e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                                            e.currentTarget.style.color = '#e5e7eb';
                                        }
                                    }}
                                    onMouseLeave={e => {
                                        if (!isActive) {
                                            e.currentTarget.style.background = 'transparent';
                                            e.currentTarget.style.color = '#6b7280';
                                        }
                                    }}
                                >
                                    <item.icon size={13} style={{ color: 'currentColor', flexShrink: 0 }} />
                                    <span style={{ flex: 1 }}>{item.label}</span>
                                    {item.badge > 0 && (
                                        <span style={{
                                            fontSize: '10px', fontWeight: 700, padding: '1px 6px',
                                            borderRadius: '999px', background: 'rgba(209,213,219,0.12)', color: '#d1d5db',
                                        }}>
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

/* ── Profile flyout ── */
function ProfileButton({ user, onLogout, collapsed }) {
    const { open, close, scheduleClose, cancelClose } = useContext(FlyoutCtx);
    const navigate = useNavigate();
    const btnRef = useRef(null);
    const PROFILE_ID = '__profile__';

    const avatarStyle = {
        flexShrink: 0, width: '32px', height: '32px', borderRadius: '50%',
        background: 'linear-gradient(135deg, #b45309 0%, #fbbf24 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#1c1107', fontSize: '13px', fontWeight: 700,
    };

    return (
        <div style={{ padding: '8px' }}>
            <button
                ref={btnRef}
                onMouseEnter={(e) => {
                    open(PROFILE_ID); cancelClose();
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                }}
                onMouseLeave={(e) => {
                    scheduleClose();
                    e.currentTarget.style.background = 'transparent';
                }}
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
                <div style={avatarStyle}>
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                {!collapsed && (
                    <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                        <p style={{
                            color: '#f9fafb', fontSize: '13px', fontWeight: 600, margin: 0,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                            {user?.name}
                        </p>
                        <p style={{ color: '#6b7280', fontSize: '11px', margin: 0, textTransform: 'capitalize' }}>
                            {user?.role}
                        </p>
                    </div>
                )}
            </button>

            <FlyoutPanel id={PROFILE_ID} triggerRef={btnRef} profileMode>
                <div style={{
                    padding: '10px 10px 10px',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    marginBottom: '6px',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <div style={{ ...avatarStyle, width: '34px', height: '34px', fontSize: '13px' }}>
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <p style={{
                                color: '#ffffff', fontSize: '13px', fontWeight: 600, margin: 0,
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                                {user?.name}
                            </p>
                            <p style={{ color: '#6b7280', fontSize: '11px', margin: 0 }}>
                                {user?.username}
                            </p>
                        </div>
                    </div>
                    <span style={{
                        display: 'inline-flex', alignItems: 'center', padding: '2px 8px',
                        borderRadius: '999px', fontSize: '10px', fontWeight: 700,
                        letterSpacing: '0.08em', textTransform: 'uppercase',
                        background: 'rgba(209,213,219,0.10)', color: '#d1d5db',
                        border: '1px solid rgba(209,213,219,0.15)',
                    }}>
                        {user?.role}
                    </span>
                </div>

                {[
                    { icon: UserCircle, label: 'Ver perfil', action: () => { navigate('/profile'); close(); } },
                    { icon: KeyRound, label: 'Cambiar contraseña', action: () => { navigate('/profile/password'); close(); } },
                ].map(({ icon: Icon, label, action }) => (
                    <button
                        key={label}
                        onClick={action}
                        style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '9px 10px', borderRadius: '9px', border: 'none', cursor: 'pointer',
                            fontSize: '13px', fontWeight: 500, textAlign: 'left',
                            background: 'transparent', color: '#9ca3af',
                            transition: 'background 130ms, color 130ms',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                            e.currentTarget.style.color = '#e5e7eb';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = '#9ca3af';
                        }}
                    >
                        <Icon size={14} style={{ color: 'currentColor', flexShrink: 0 }} />
                        {label}
                    </button>
                ))}

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: '4px', paddingTop: '4px' }}>
                    <button
                        onClick={onLogout}
                        style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '9px 10px', borderRadius: '9px', border: 'none', cursor: 'pointer',
                            fontSize: '13px', fontWeight: 500, textAlign: 'left',
                            background: 'transparent', color: '#f87171',
                            transition: 'background 130ms',
                        }}
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

/* ══════════════════════════════════════════════════════
   SIDEBAR PRINCIPAL
   ══════════════════════════════════════════════════════ */
function SidebarInner({ collapsed, onToggle }) {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const role = user?.role || '';

    const { data: cashSession } = useCashStatus();

    const { data: openOrders = 0 } = useQuery({
        queryKey: ['open-orders-count'],
        queryFn: async () => {
            const res = await api.get('/orders?status=abierto&limit=1');
            return res.meta?.total || 0;
        },
        refetchInterval: 60000, retry: 1,
    });

    const { data: lowStockCount = 0 } = useQuery({
        queryKey: ['low-stock-count'],
        queryFn: async () => {
            const res = await api.get('/ingredients?low_stock=true&limit=1');
            return res.meta?.total || 0;
        },
        refetchInterval: 300000, retry: 1,
    });

    const handleLogout = async () => {
        try { await api.post('/auth/logout'); } catch { }
        finally { logout(); navigate('/login'); toast.success('Sesión cerrada'); }
    };

    const formatCOP = (v) =>
        new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v || 0);

    const navGroups = [
        {
            id: 'operacion', label: 'Operación', icon: Zap,
            show: canAccess('dashboard', role) || canAccess('pos', role) || canAccess('tables', role) || canAccess('orders', role),
            items: [
                canAccess('dashboard', role) && { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
                canAccess('pos', role) && { to: '/pos', icon: ShoppingCart, label: 'Punto de Venta' },
                canAccess('tables', role) && { to: '/tables', icon: TableProperties, label: 'Mesas' },
                canAccess('orders', role) && { to: '/orders', icon: ClipboardList, label: 'Pedidos', badge: openOrders },
            ].filter(Boolean),
        },
        {
            id: 'caja', label: 'Caja', icon: DollarSign,
            show: canAccess('cash', role) || canAccess('cashHistory', role),
            items: [
                canAccess('cash', role) && { to: '/cash', icon: DollarSign, label: 'Caja actual' },
                canAccess('cashHistory', role) && { to: '/cash/history', icon: History, label: 'Historial' },
            ].filter(Boolean),
        },
        {
            id: 'inventario', label: 'Inventario', icon: Layers,
            show: canAccess('products', role) || canAccess('ingredients', role) || canAccess('losses', role),
            items: [
                canAccess('products', role) && { to: '/products', icon: Package, label: 'Productos' },
                canAccess('ingredients', role) && { to: '/ingredients', icon: FlaskConical, label: 'Ingredientes', badge: lowStockCount },
                canAccess('losses', role) && { to: '/losses', icon: TrendingDown, label: 'Pérdidas' },
            ].filter(Boolean),
        },
        {
            id: 'reportes', label: 'Reportes', icon: BarChart3,
            show: canAccess('reports', role),
            items: [
                { to: '/reports/sales', icon: BarChart3, label: 'Ventas' },
                { to: '/reports/top-products', icon: Trophy, label: 'Top productos' },
                { to: '/reports/low-stock', icon: AlertTriangle, label: 'Stock bajo' },
            ],
        },
        {
            id: 'admin', label: 'Administración', icon: BookOpen,
            show: canAccess('users', role) || canAccess('categories', role) || canAccess('settings', role) || canAccess('audit', role),
            items: [
                canAccess('users', role) && { to: '/users', icon: Users, label: 'Usuarios' },
                canAccess('categories', role) && { to: '/categories', icon: Tag, label: 'Categorías' },
                canAccess('settings', role) && { to: '/settings', icon: Settings, label: 'Configuración' },
                canAccess('audit', role) && { to: '/audit', icon: Shield, label: 'Auditoría' },
            ].filter(Boolean),
        },
    ].filter(g => g.show && g.items.length > 0);

    return (
        <aside style={{
            position: 'relative', display: 'flex', flexDirection: 'column',
            height: '100vh', flexShrink: 0,
            width: collapsed ? '68px' : '240px',
            transition: 'width 280ms cubic-bezier(0.16,1,0.3,1)',
            background: 'linear-gradient(180deg, #091812 0%, #060f0b 100%)',
            borderRight: '1px solid rgba(255,255,255,0.05)',
            overflow: 'visible',
        }}>
            {/* Grain sutil */}
            <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.025,
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                backgroundSize: '180px 180px',
            }} />

            {/* ── HEADER ── */}
            <div style={{
                position: 'relative', height: '64px', flexShrink: 0,
                display: 'flex', alignItems: 'center',
                padding: collapsed ? '0 12px' : '0 16px',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                gap: '10px',
            }}>
                <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                    <img
                        src="./Logo.png"
                        alt="Logo"
                        style={{
                            width: collapsed ? '36px' : '44px',
                            height: collapsed ? '36px' : '44px',
                            objectFit: 'contain',
                            transition: 'width 280ms cubic-bezier(0.16,1,0.3,1), height 280ms cubic-bezier(0.16,1,0.3,1)',
                        }}
                    />
                </div>

                <div style={{
                    overflow: 'hidden', whiteSpace: 'nowrap',
                    maxWidth: collapsed ? '0px' : '160px',
                    opacity: collapsed ? 0 : 1,
                    transition: 'max-width 280ms cubic-bezier(0.16,1,0.3,1), opacity 180ms',
                }}>
                    <span style={{
                        color: 'white', fontSize: '13px', fontWeight: 700,
                        letterSpacing: '0.12em', textTransform: 'uppercase',
                        fontFamily: "'Syne', sans-serif",
                    }}>
                        Liriacafé
                    </span>
                </div>

                <button
                    onClick={onToggle}
                    style={{
                        position: 'absolute', right: '-12px', top: '50%', transform: 'translateY(-50%)',
                        width: '24px', height: '24px', borderRadius: '50%',
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: '#0c1c16',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.45)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', zIndex: 10, transition: 'border-color 150ms',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#6b7280'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                >
                    <ChevronRight size={12} color="#6b7280" style={{
                        transition: 'transform 280ms cubic-bezier(0.16,1,0.3,1)',
                        transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)',
                    }} />
                </button>
            </div>

            {/* ── ESTADO DE CAJA ── */}
            <div style={{
                margin: '10px 10px 4px', borderRadius: '12px',
                border: `1px solid ${cashSession ? 'rgba(74,222,128,0.14)' : 'rgba(248,113,113,0.14)'}`,
                background: cashSession ? 'rgba(0,40,30,0.5)' : 'rgba(40,10,10,0.5)',
                padding: collapsed ? '10px' : '10px 12px',
                display: 'flex', flexDirection: collapsed ? 'row' : 'column',
                alignItems: collapsed ? 'center' : 'flex-start',
                justifyContent: 'center',
                transition: 'padding 280ms', overflow: 'hidden',
            }}>
                {cashSession ? (
                    collapsed
                        ? <CircleDot size={13} color="#4ade80" />
                        : <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                                <CircleDot size={11} color="#4ade80" />
                                <span style={{ color: '#4ade80', fontSize: '11px', fontWeight: 600 }}>Caja abierta</span>
                            </div>
                            <span style={{ color: '#86efac', fontSize: '12px', fontFamily: 'monospace' }}>
                                {formatCOP(cashSession.opening_amount + (cashSession.sales_total || 0))}
                            </span>
                        </>
                ) : (
                    collapsed
                        ? <Circle size={13} color="#f87171" />
                        : <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                                <Circle size={11} color="#f87171" />
                                <span style={{ color: '#f87171', fontSize: '11px', fontWeight: 600 }}>Sin caja abierta</span>
                            </div>
                            <button
                                onClick={() => navigate('/cash')}
                                style={{
                                    color: '#fca5a5', fontSize: '11px', textDecoration: 'underline',
                                    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                                }}
                            >
                                Abrir caja →
                            </button>
                        </>
                )}
            </div>

            {/* ── NAV ── */}
            <nav style={{
                flex: 1, padding: '8px', display: 'flex',
                flexDirection: 'column', gap: '2px', overflow: 'hidden',
            }}>
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
            </nav>

            {/* ── DIVISOR ── */}
            <div style={{ margin: '0 10px', height: '1px', background: 'rgba(255,255,255,0.05)' }} />

            {/* ── PERFIL ── */}
            <ProfileButton user={user} onLogout={handleLogout} collapsed={collapsed} />
        </aside>
    );
}

export default function Sidebar(props) {
    return (
        <FlyoutProvider>
            <SidebarInner {...props} />
        </FlyoutProvider>
    );
}