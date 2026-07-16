import { useLocation } from 'react-router-dom';
import { Bell, Menu } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';

const PAGE_TITLES = {
    '/dashboard': 'Dashboard',
    '/caja/abrir': 'Abrir Caja',
    '/caja/actual': 'Estado de Caja',
    '/caja/historial': 'Historial de Cajas',
    '/ventas/nueva': 'Nueva Venta',
    '/ventas': 'Historial de Ventas',
    '/ventas/buscar': 'Buscar Factura',
    '/flujo-caja/nuevo': 'Registrar Movimiento',
    '/flujo-caja': 'Movimientos de Caja',
    '/flujo-caja/resumen': 'Resumen Financiero',
    '/inventario': 'Inventario',
    '/inventario/entrada': 'Registrar Entrada',
    '/productos': 'Catálogo de Productos',
    '/categorias': 'Categorías',
    '/reportes/ventas': 'Reporte de Ventas',
    '/reportes/rentabilidad': 'Reporte de Rentabilidad',
    '/reportes/inventario': 'Reporte de Inventario',
    '/reportes/caja': 'Reporte de Caja',
    '/admin/usuarios': 'Usuarios',
    '/admin/roles': 'Roles y Permisos',
    '/admin/configuracion': 'Configuración',
    '/perfil': 'Mi Perfil',
};

export default function Header({ alertCount = 0, isMobile, onMenuClick }) {
    const { pathname } = useLocation();
    const { usuario } = useAuthStore();

    const title = PAGE_TITLES[pathname] ?? 'Liria Café POS';
    const primerNombre = (usuario?.nombreCompleto ?? usuario?.nombreUsuario ?? 'usuario')
        .split(' ')[0];

    return (
        <header style={{
            height: 60, flexShrink: 0,
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            padding: isMobile ? '0 12px' : '0 24px',
            backdropFilter: 'blur(12px)',
            zIndex: 30,
            gap: 8,
        }}>
            {/* Izquierda: hamburger (mobile) + título */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                {isMobile && (
                    <button
                        onClick={onMenuClick}
                        title="Menú"
                        style={{
                            flexShrink: 0,
                            width: 36, height: 36, borderRadius: 10,
                            border: '1px solid rgba(85,98,74,0.15)',
                            background: 'rgba(85,98,74,0.04)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'border-color 150ms, background 150ms',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#55624a';
                            e.currentTarget.style.background = 'rgba(85,98,74,0.08)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'rgba(85,98,74,0.15)';
                            e.currentTarget.style.background = 'rgba(85,98,74,0.04)';
                        }}
                    >
                        <Menu size={18} color="#6b7280" />
                    </button>
                )}

                <h1 style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: isMobile ? 14 : 16, fontWeight: 700,
                    color: '#1f2937', margin: 0,
                    letterSpacing: '-0.01em',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                    {title}
                </h1>
            </div>

            {/* Derecha: campana + saludo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                {/* Campana */}
                <button
                    title="Alertas"
                    style={{
                        position: 'relative',
                        width: 36, height: 36, borderRadius: 10,
                        border: '1px solid rgba(85,98,74,0.15)',
                        background: 'rgba(85,98,74,0.04)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'border-color 150ms, background 150ms',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#55624a';
                        e.currentTarget.style.background = 'rgba(85,98,74,0.08)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(85,98,74,0.15)';
                        e.currentTarget.style.background = 'rgba(85,98,74,0.04)';
                    }}
                >
                    <Bell size={16} color="#6b7280" />
                    {alertCount > 0 && (
                        <span style={{
                            position: 'absolute', top: 7, right: 7,
                            width: 7, height: 7, borderRadius: '50%',
                            background: '#ef4444',
                        }} />
                    )}
                </button>

                {/* Saludo — oculto en mobile para ahorrar espacio */}
                {!isMobile && (
                    <>
                        <div style={{ width: 1, height: 20, background: 'rgba(85,98,74,0.12)' }} />
                        <span style={{ color: '#9ca3af', fontSize: 13 }}>
                            Hola,{' '}
                            <strong style={{ color: '#55624a', fontWeight: 600 }}>
                                {primerNombre}
                            </strong>
                        </span>
                    </>
                )}
            </div>
        </header>
    );
}
