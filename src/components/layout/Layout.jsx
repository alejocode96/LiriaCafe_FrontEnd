import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
    const [collapsed, setCollapsed] = useState(() => {
        return localStorage.getItem('sidebar-collapsed') === 'true';
    });

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) setCollapsed(true);
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
        <div
            className="flex h-screen w-screen overflow-hidden"
            style={{
                /* Diagonal derecha-abajo → izquierda-arriba, oliva muy diluido */
                background: 'linear-gradient(135deg, #ffffff 0%, #f8f9f5 40%, #f0f2e9 75%, #e8ebdd 100%)',
            }}
        >
            {/* Sidebar */}
            <Sidebar collapsed={collapsed} onToggle={handleToggle} />

            {/* Contenido principal — nunca desborda */}
            <main className="flex-1 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-hidden p-6">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}