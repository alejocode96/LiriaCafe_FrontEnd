// src/components/ingredients/MovementsDrawer.jsx
import { useState } from 'react';
import { X, TrendingUp, TrendingDown, RefreshCw, ShoppingCart, Loader2 } from 'lucide-react';
import { useIngredientMovements } from '../../hooks/useIngredients';

const TYPE_META = {
    entrada: { icon: TrendingUp, color: '#003a30', bg: 'rgba(0,58,48,0.09)', activeBorder: 'rgba(0,58,48,0.40)', label: 'Entrada' },
    ajuste: { icon: RefreshCw, color: '#b38600', bg: 'rgba(255,193,7,0.15)', activeBorder: 'rgba(255,193,7,0.60)', label: 'Ajuste' },
    perdida: { icon: TrendingDown, color: '#dc2626', bg: 'rgba(220,38,38,0.10)', activeBorder: 'rgba(220,38,38,0.40)', label: 'Pérdida' },
    consumo: { icon: ShoppingCart, color: '#55624a', bg: 'rgba(85,98,74,0.10)', activeBorder: 'rgba(85,98,74,0.40)', label: 'Consumo' },
};

function formatColombianDate(raw) {
    if (!raw) return '—';
    const utc = raw.endsWith('Z') || raw.includes('+') ? raw : raw + 'Z';
    return new Intl.DateTimeFormat('es-CO', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: 'numeric', minute: '2-digit', hour12: true,
        timeZone: 'America/Bogota',
    }).format(new Date(utc));
}

export default function MovementsDrawer({ open, onClose, ingredient }) {
    const { data, isLoading } = useIngredientMovements(ingredient?.id, open);
    const movements = data?.data || [];
    const [activeFilter, setActiveFilter] = useState(null);

    const stock = ingredient?.stock ?? ingredient?.stock_current;
    const isLow = stock <= ingredient?.min_stock;

    // Counts per type
    const counts = movements.reduce((acc, m) => {
        acc[m.type] = (acc[m.type] || 0) + 1;
        return acc;
    }, {});

    const filtered = activeFilter
        ? movements.filter(m => m.type === activeFilter)
        : movements;

    const toggleFilter = (type) => {
        setActiveFilter(prev => prev === type ? null : type);
    };

    return (
        <>
            <style>{`
                @keyframes mvSlideIn  { from { transform: translateX(100%); } to { transform: translateX(0); } }
                @keyframes mvSlideOut { from { transform: translateX(0); }    to { transform: translateX(100%); } }
                @keyframes mvFadeIn   { from { opacity: 0; } to { opacity: 1; } }
                @keyframes spin       { to { transform: rotate(360deg); } }

                .mv-overlay-in  { animation: mvFadeIn 280ms ease forwards; }
                .mv-filter-btn  {
                    display: flex; flex-direction: column; align-items: flex-start;
                    gap: 3px; padding: 8px 10px; border-radius: 10px;
                    border: 1px solid #e5e7eb; background: #f9fafb;
                    cursor: pointer; text-align: left;
                    transition: background 150ms, border-color 150ms, transform 100ms;
                    flex: 1; min-width: 0;
                }
                .mv-filter-btn:hover { background: #f3f4f6; }
                .mv-filter-btn:active { transform: scale(0.97); }
            `}</style>

            {/* Overlay */}
            {open && (
                <div className="mv-overlay-in" onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.18)', backdropFilter: 'blur(2px)', }} />
            )}

            {/* Panel lateral */}
            <div
                style={{ position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 1001, width: '420px', background: '#ffffff', borderLeft: '1px solid #e5e7eb', boxShadow: '-12px 0 40px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', overflow: 'hidden', transform: open ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 300ms cubic-bezier(0.32,0.72,0,1)', }} >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '20px 20px 18px', borderBottom: '1px solid #f3f4f6', flexShrink: 0, }}>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ color: '#111827', fontSize: '15px', fontWeight: 700, margin: 0, fontFamily: "'Syne', sans-serif", letterSpacing: '0.01em', }}>
                            Historial de movimientos
                        </h3>
                        <p style={{ color: '#9ca3af', fontSize: '12px', margin: 0 }}>
                            {ingredient?.name}
                        </p>
                    </div>
                    <button onClick={onClose} style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'transparent', border: '1px solid #e5e7eb', cursor: 'pointer', color: '#9ca3af', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 150ms, color 150ms', }} onMouseEnter={e => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.color = '#374151'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af'; }} >
                        <X size={15} />
                    </button>
                </div>

                {/* Stock summary + filtros */}
                {ingredient && (
                    <div style={{ padding: '14px 20px 16px', borderBottom: '1px solid #f3f4f6', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '10px', }}>
                        {/* Stock cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <StatCard label="Stock actual" value={`${stock} ${ingredient.unit}`} valueColor={isLow ? '#dc2626' : '#003a30'} bg={isLow ? 'rgba(220,38,38,0.05)' : 'rgba(0,58,48,0.07)'} border={isLow ? 'rgba(220,38,38,0.15)' : 'rgba(0,58,48,0.18)'} />
                            <StatCard label="Stock mínimo" value={`${ingredient.min_stock} ${ingredient.unit}`} valueColor="#6b7280" bg="#f9fafb" border="#e5e7eb" />
                        </div>

                        {/* Filtros por tipo */}
                        <div style={{ display: 'flex', gap: '6px' }}>
                            {Object.entries(TYPE_META).map(([key, meta]) => {
                                const active = activeFilter === key;
                                const count = counts[key] || 0;
                                const Icon = meta.icon;
                                return (
                                    <button key={key} className="mv-filter-btn" onClick={() => toggleFilter(key)} style={{ background: active ? meta.bg : '#f9fafb', border: active ? `1px solid ${meta.activeBorder}` : '1px solid #e5e7eb', }} >
                                        {/* Ícono + contador */}
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', }}>
                                            <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: active ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, }}>
                                                <Icon size={12} color={active ? meta.color : '#9ca3af'} />
                                            </div>
                                            <span style={{ fontSize: '13px', fontWeight: 700, color: active ? meta.color : '#374151', lineHeight: 1, }}>
                                                {count}
                                            </span>
                                        </div>
                                        {/* Label */}
                                        <span style={{ fontSize: '10px', fontWeight: 600, color: active ? meta.color : '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1, }}>
                                            {meta.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Lista de movimientos */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '14px 20px' }}>
                    {isLoading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '48px' }}>
                            <Loader2 size={20} color="#9ca3af" style={{ animation: 'spin 1s linear infinite' }} />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div style={{ textAlign: 'center', paddingTop: '48px', color: '#9ca3af', fontSize: '13px', }}>
                            {activeFilter
                                ? `Sin movimientos de tipo "${TYPE_META[activeFilter]?.label}"`
                                : 'Sin movimientos registrados'
                            }
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {filtered.map((m) => {
                                const meta = TYPE_META[m.type] || TYPE_META.entrada;
                                const delta = m.type === 'ajuste' ? m.stock_after - m.stock_before : m.type === 'entrada' ? m.quantity : -m.quantity; const deltaPositive = delta >= 0;

                                return (
                                    <div key={m.id} style={{ background: '#fafafa', border: '1px solid #f3f4f6', borderRadius: '12px', padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: '12px', }}  >
                                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', }}>
                                            <meta.icon size={14} color={meta.color} />
                                        </div>

                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px', }}>
                                                <span style={{ color: meta.color, fontSize: '12px', fontWeight: 700 }}>
                                                    {meta.label}
                                                </span>
                                                <span style={{ fontSize: '12px', fontWeight: 700, color: deltaPositive ? '#003a30' : '#dc2626', }}>
                                                    {deltaPositive ? '+' : ''}{delta}
                                                </span>
                                            </div>

                                            <p style={{ color: '#374151', fontSize: '12px', margin: '0 0 5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', }}>
                                                {m.reason}
                                            </p>

                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', }}>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#9ca3af', fontSize: '11px', }}>
                                                    <span style={{ color: '#d1d5db' }}>{m.stock_before}</span>
                                                    <span style={{ color: '#d1d5db' }}>→</span>
                                                    <span style={{ color: '#6b7280', fontWeight: 600 }}>{m.stock_after}</span>
                                                </span>
                                                <span style={{ color: '#e5e7eb', fontSize: '11px' }}>·</span>
                                                <span style={{ color: '#9ca3af', fontSize: '11px' }}>
                                                    {formatColombianDate(m.created_at)}
                                                </span>
                                                {m.user?.name && (
                                                    <>
                                                        <span style={{ color: '#e5e7eb', fontSize: '11px' }}>·</span>
                                                        <span style={{ color: '#9ca3af', fontSize: '11px' }}>
                                                            {m.user.name}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

function StatCard({ label, value, valueColor, bg, border }) {
    return (
        <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: '10px', padding: '10px 14px', }}>
            <p style={{ color: '#9ca3af', fontSize: '10px', margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, }}>
                {label}
            </p>
            <p style={{ color: valueColor, fontSize: '14px', fontWeight: 700, margin: 0 }}>
                {value}
            </p>
        </div>
    );
}