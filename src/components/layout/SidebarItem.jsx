import { NavLink } from 'react-router-dom';

export default function SidebarItem({ to, icon: Icon, label, badge, collapsed, onClick }) {
    return (
        <NavLink
            to={to}
            end={to === '/dashboard'}
            onClick={onClick}
            style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: collapsed ? 0 : 10,
                justifyContent: collapsed ? 'center' : 'flex-start',
                padding: collapsed ? '10px 0' : '8px 12px',
                borderRadius: 10,
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: isActive ? 600 : 500,
                transition: 'background 130ms, color 130ms',
                background: isActive ? 'rgba(85,98,74,0.10)' : 'transparent',
                color: isActive ? '#3d4a2e' : '#6b7280',
                width: '100%',
                boxSizing: 'border-box',
                position: 'relative',
            })}
            onMouseEnter={(e) => {
                const bg = e.currentTarget.style.background;
                if (!bg.includes('0.10')) {
                    e.currentTarget.style.background = 'rgba(85,98,74,0.06)';
                    e.currentTarget.style.color = '#3d4a2e';
                }
            }}
            onMouseLeave={(e) => {
                const bg = e.currentTarget.style.background;
                if (!bg.includes('0.10')) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#6b7280';
                }
            }}
        >
            {({ isActive }) => (
                <>
                    {/* Indicador lateral cuando activo */}
                    {isActive && (
                        <span style={{
                            position: 'absolute', left: 0, top: '50%',
                            transform: 'translateY(-50%)',
                            width: 3, height: 16, borderRadius: 99,
                            background: '#55624a',
                        }} />
                    )}

                    <Icon
                        size={17}
                        style={{
                            flexShrink: 0,
                            color: isActive ? '#55624a' : 'currentColor',
                            marginLeft: isActive ? 4 : 0,
                            transition: 'margin 130ms, color 130ms',
                        }}
                    />

                    {!collapsed && (
                        <span style={{
                            flex: 1,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}>
                            {label}
                        </span>
                    )}

                    {/* Badge */}
                    {badge > 0 && (
                        <span style={{
                            position: collapsed ? 'absolute' : 'static',
                            top: collapsed ? 4 : 'auto',
                            right: collapsed ? 4 : 'auto',
                            minWidth: 18, height: 18,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            borderRadius: 999, padding: '0 5px',
                            fontSize: 10, fontWeight: 700,
                            background: '#ef4444', color: 'white',
                            flexShrink: 0,
                        }}>
                            {badge > 99 ? '99+' : badge}
                        </span>
                    )}

                    {/* Tooltip modo colapsado */}
                    {collapsed && (
                        <span
                            className="sidebar-tooltip"
                            style={{
                                position: 'absolute',
                                left: '100%', marginLeft: 12,
                                padding: '5px 10px', borderRadius: 8,
                                background: '#2d3a25',
                                color: '#f0ede6',
                                fontSize: 12, fontWeight: 500,
                                whiteSpace: 'nowrap',
                                pointerEvents: 'none',
                                opacity: 0,
                                transition: 'opacity 150ms',
                                zIndex: 9999,
                                boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                            }}
                        >
                            {label}
                            {badge > 0 && (
                                <span style={{ marginLeft: 6, color: '#ef4444' }}>({badge})</span>
                            )}
                        </span>
                    )}
                </>
            )}
        </NavLink>
    );
}