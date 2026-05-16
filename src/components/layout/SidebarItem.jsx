import { NavLink } from 'react-router-dom';

export default function SidebarItem({ to, icon: Icon, label, badge, collapsed, onClick }) {
    return (
        <NavLink
            to={to}
            onClick={onClick}
            className={({ isActive }) =>
                `relative flex items-center gap-3 px-3 py-2.5 rounded-lg
         transition-all duration-150 group
         ${isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`
            }
        >
            {/* Ícono siempre visible */}
            <Icon size={20} className="shrink-0" />

            {/* Texto — oculto cuando está colapsado */}
            {!collapsed && (
                <span className="text-sm font-medium truncate">{label}</span>
            )}

            {/* Badge de alerta */}
            {badge > 0 && (
                <span className={`
          absolute flex items-center justify-center
          min-w-[18px] h-[18px] px-1
          text-[10px] font-bold text-white bg-red-500 rounded-full
          ${collapsed ? 'top-0.5 right-0.5' : 'right-2'}
        `}>
                    {badge > 99 ? '99+' : badge}
                </span>
            )}

            {/* Tooltip cuando está colapsado */}
            {collapsed && (
                <div className="
          absolute left-full ml-3 px-2 py-1 z-50
          bg-gray-900 text-white text-xs rounded-md
          whitespace-nowrap pointer-events-none
          opacity-0 group-hover:opacity-100
          transition-opacity duration-150
          border border-gray-700
        ">
                    {label}
                    {badge > 0 && (
                        <span className="ml-1 text-red-400">({badge})</span>
                    )}
                </div>
            )}
        </NavLink>
    );
}