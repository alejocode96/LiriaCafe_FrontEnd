import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
    // Recordar preferencia de colapso en localStorage
    const [collapsed, setCollapsed] = useState(() => {
        return localStorage.getItem('sidebar-collapsed') === 'true';
    });

    // En tablet (< 1024px) colapsar automáticamente
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setCollapsed(true);
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleToggle = () => {
        setCollapsed(prev => {
            const next = !prev;
            localStorage.setItem('sidebar-collapsed', String(next));
            return next;
        });
    };

    return (
        <div className="flex h-screen bg-xinc-100 overflow-hidden">
            {/* Sidebar */}
            <Sidebar collapsed={collapsed} onToggle={handleToggle} />

            {/* Contenido principal */}
            <main className="flex-1 overflow-y-auto">
                {/* Área de contenido donde se renderizan las páginas */}
                <div className="p-6 min-h-full">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}