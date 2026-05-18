// src/pages/Ingredients/IngredientsPage.jsx
import { useState, useMemo } from 'react';
import { Plus, Search, AlertTriangle, FlaskConical, Edit2, Trash2, ArrowUpDown, History, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import { useIngredients, useDeleteIngredient } from '../../hooks/useIngredients';
import IngredientFormModal from '../../components/ingredients/IngredientFormModal';
import StockMovementModal from '../../components/ingredients/StockMovementModal';
import MovementsDrawer from '../../components/ingredients/MovementsDrawer';
import { formatCurrency } from '../../utils/formatters';

/* ── Confirm delete ── */
function DeleteConfirm({ ingredient, onConfirm, onCancel, busy }) {
    return (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
            <div className="w-full max-w-[380px] bg-white rounded-2xl border border-gray-200 shadow-xl p-6">
                <div className="flex gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl shrink-0 bg-red-50 flex items-center justify-center">
                        <Trash2 size={17} className="text-red-500" />
                    </div>
                    <div>
                        <h3 className="text-gray-900 text-sm font-semibold mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>
                            Desactivar ingrediente
                        </h3>
                        <p className="text-gray-500 text-[13px]">
                            ¿Desactivar <strong className="text-gray-800">{ingredient.name}</strong>? Esta acción se puede revertir editándolo.
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={onCancel} className="flex-1 h-10 rounded-xl border border-gray-200 bg-white text-gray-600 text-[13px] font-medium cursor-pointer hover:bg-gray-50 transition-colors">
                        Cancelar
                    </button>
                    <button onClick={onConfirm} disabled={busy} className={`flex-[2] h-10 rounded-xl border-none text-[13px] font-semibold transition-colors ${busy ? 'bg-red-100 text-red-300 cursor-not-allowed' : 'bg-red-500 text-white cursor-pointer hover:bg-red-600'}`}>
                        {busy ? 'Desactivando…' : 'Sí, desactivar'}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ── Badge: stock bajo ── */
function LowStockBadge() {
    return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-500 border border-red-200">
            <AlertTriangle size={9} />
            Bajo
        </span>
    );
}

const CELL_COLOR = '#6b7280';
const CELL_COLOR_SELECTED = 'rgba(255,255,255,0.88)';

// Columnas: key para sort, label, flex
const TABLE_COLS_DEF = [
    { key: 'name', label: 'Nombre', flex: '2fr' },
    { key: 'description', label: 'Descripción', flex: '1.5fr' },
    { key: 'unit', label: 'Unidad', flex: '1fr' },
    { key: 'stock', label: 'Stock actual', flex: '1fr' },
    { key: 'min_stock', label: 'Stock mín.', flex: '1fr' },
    { key: 'cost_price', label: 'Costo unit.', flex: '1fr' },
    { key: 'is_active', label: 'Estado', flex: '1fr' },
];

const TABLE_COLS = TABLE_COLS_DEF.map(c => c.flex).join(' ');

const GLASS = {
    background: 'rgba(204,204,204,0.22)',
    backdropFilter: 'blur(28px) saturate(1.8)',
    WebkitBackdropFilter: 'blur(28px) saturate(1.8)',
};

// Función de comparación para sort
function sortIngredients(list, sortKey, sortDir) {
    if (!sortKey) return list;
    return [...list].sort((a, b) => {
        let va = a[sortKey];
        let vb = b[sortKey];

        // Nulos al final siempre
        if (va == null && vb == null) return 0;
        if (va == null) return 1;
        if (vb == null) return -1;

        // Comparación por tipo
        if (typeof va === 'string') {
            va = va.toLowerCase();
            vb = (vb ?? '').toString().toLowerCase();
            return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
        }

        // booleano → activos primero en asc
        if (typeof va === 'boolean' || va === 0 || va === 1) {
            return sortDir === 'asc' ? vb - va : va - vb;
        }

        return sortDir === 'asc' ? va - vb : vb - va;
    });
}

/* ── Encabezado de columna con sort ── */
function SortableHeader({ col, sortKey, sortDir, onSort }) {
    const active = sortKey === col.key;
    return (
        <button onClick={() => onSort(col.key)} className="flex items-center gap-1 group" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', }}>
            <span className="text-[11px] font-semibold uppercase tracking-[0.06em] transition-colors duration-100" style={{ color: active ? '#55624a' : '#9ca3af' }}>
                {col.label}
            </span>
            <span className="flex flex-col" style={{ gap: 1, marginTop: 1 }}>
                <ChevronUp size={9} style={{ color: active && sortDir === 'asc' ? '#55624a' : '#d1d5db', transition: 'color 100ms', }} />
                <ChevronDown size={9} style={{ color: active && sortDir === 'desc' ? '#55624a' : '#d1d5db', transition: 'color 100ms', marginTop: -3, }} />
            </span>
        </button>
    );
}

/* ══ PÁGINA PRINCIPAL ══ */
export default function IngredientsPage() {

    const [search, setSearch] = useState('');
    const [lowStockOnly, setLowOnly] = useState(false);
    const [page, setPage] = useState(1);
    const [selectedId, setSelectedId] = useState(null);
    const [status, setStatus] = useState('active');

    // Sort state: key de columna + dirección
    const [sortKey, setSortKey] = useState('name');
    const [sortDir, setSortDir] = useState('asc');

    const [formModal, setFormModal] = useState({ open: false, ingredient: null });
    const [stockModal, setStockModal] = useState({ open: false, ingredient: null });
    const [drawer, setDrawer] = useState({ open: false, ingredient: null });
    const [deleteTarget, setDelete] = useState(null);

    const { data, isLoading, isFetching } = useIngredients({ search, low_stock: lowStockOnly, page, status });
    const deleteIng = useDeleteIngredient();

    const rawIngredients = data?.data || [];
    const meta = data?.meta || {};
    const totalPages = Math.ceil((meta.total || 0) / (meta.per_page || 20));

    // Sort local sobre los datos de la página actual
    const ingredients = useMemo(
        () => sortIngredients(rawIngredients, sortKey, sortDir),
        [rawIngredients, sortKey, sortDir]
    );

    // Ciclo: misma columna alterna asc↔desc, columna nueva empieza asc
    const handleSort = (key) => {
        if (sortKey === key) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDir('asc');
        }
    };

    const openCreate = () => setFormModal({ open: true, ingredient: null });
    const openEdit = (i) => setFormModal({ open: true, ingredient: i });
    const openStock = (i) => setStockModal({ open: true, ingredient: i });
    const openDrawer = (i) => setDrawer({ open: true, ingredient: i });

    const selectedIngredient = ingredients.find(i => i.id === selectedId) || null;
    const hasSelection = !!selectedIngredient;

    return (
        <div className='w-full h-full overflow-hidden flex flex-col'>

            {/* ══ FILA SUPERIOR ══ */}
            <div className='flex items-end shrink-0 h-[40px]'>

                {/* ── Pestaña ── */}
                <div className='relative flex items-center gap-2 px-4 h-10 border border-b-0 border-white/40 shrink-0' style={{ width: 'min(55%, 630px)', ...GLASS, borderRadius: '10px 10px 0 0' }}>

                    <FlaskConical size={13} style={{ color: '#55624a', flexShrink: 0 }} />
                    <span className="text-[13px] font-semibold text-gray-700 shrink-0" style={{ fontFamily: "'Syne', sans-serif" }}>
                        Ingredientes
                    </span>
                    {isFetching && !isLoading && (
                        <Loader2 size={11} className="animate-spin shrink-0" style={{ color: '#8c916c' }} />
                    )}

                    <div className="w-px h-4 bg-gray-300/50 mx-1 shrink-0" />

                    {/* Búsqueda */}
                    <div className="relative shrink-0">
                        <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Buscar…" className="h-6 w-32 rounded-lg text-[11px] pl-6 pr-2 outline-none transition-colors" style={{ background: 'rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.08)', color: '#374151' }} onFocus={e => { e.target.style.background = 'rgba(255,255,255,0.9)'; e.target.style.borderColor = '#8c916c'; }} onBlur={e => { e.target.style.background = 'rgba(0,0,0,0.06)'; e.target.style.borderColor = 'rgba(0,0,0,0.08)'; }} />
                    </div>

                    {/* Chip stock bajo */}
                    <button onClick={() => { setLowOnly(v => !v); setPage(1); }} className={`flex items-center gap-1 h-6 px-2.5 rounded-lg text-[11px] font-medium border cursor-pointer transition-all duration-150 shrink-0 ${lowStockOnly ? 'border-[#8c916c] text-[#55624a]' : 'border-gray-300/60 text-gray-500 hover:border-gray-400/60 hover:text-gray-700'}`} style={lowStockOnly ? { background: 'rgba(140,145,108,0.15)' } : { background: 'rgba(0,0,0,0.04)' }} >
                        <AlertTriangle size={10} />
                        Stock bajo
                    </button>

                    {/* Chip estado cíclico */}
                    {(() => {
                        const cfg = {
                            all: { label: 'Todos', dot: '#9ca3af', bg: 'rgba(0,0,0,0.04)', border: 'rgba(0,0,0,0.10)', color: '#6b7280' },
                            active: { label: 'Activos', dot: '#22c55e', bg: 'rgba(21,128,61,0.08)', border: 'rgba(21,128,61,0.28)', color: '#15803d' },
                            inactive: { label: 'Inactivos', dot: '#9ca3af', bg: 'rgba(156,163,175,0.12)', border: 'rgba(107,114,128,0.22)', color: '#6b7280' },
                        };
                        const next = { all: 'active', active: 'inactive', inactive: 'all' };
                        const c = cfg[status];
                        return (
                            <button onClick={() => { setStatus(s => next[s]); setPage(1); }} className="flex items-center gap-1 h-6 px-2.5 rounded-lg text-[11px] font-medium border cursor-pointer transition-all duration-150 shrink-0" style={{ background: c.bg, borderColor: c.border, color: c.color }} >
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot, display: 'inline-block', flexShrink: 0 }} />
                                {c.label}
                            </button>
                        );
                    })()}

                    {/* Oreja derecha estilo Chrome */}
                    <span className="absolute bottom-0 pointer-events-none" style={{ right: -28, width: 28, height: 48, overflow: 'hidden' }}>
                        <span style={{ position: 'absolute', left: 0, bottom: 0, width: 56, height: 56, borderRadius: '50%', boxShadow: '-28px 28px 0 0 rgba(204,204,204,0.22)' }} />
                    </span>
                </div>

                {/* ── Botones de acción ── */}
                <div className="flex items-center gap-1.5 pl-8 pb-1.5">

                    <button onClick={openCreate} className="flex items-center gap-1.5 h-7 px-3 rounded-lg border-none text-white text-[12px] font-semibold cursor-pointer hover:opacity-90 transition-opacity" style={{ background: '#55624a', boxShadow: '0 2px 8px rgba(85,98,74,0.30)', fontFamily: "'Syne', sans-serif" }}>
                        <Plus size={13} />
                        Agregar
                    </button>

                    <div className="w-px h-4 bg-gray-300/50 mx-0.5" />

                    <button onClick={() => hasSelection && openDrawer(selectedIngredient)} disabled={!hasSelection} title="Ver historial" className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[12px] font-medium border transition-all duration-150" style={{ background: hasSelection ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.04)', border: hasSelection ? '1px solid rgba(0,0,0,0.12)' : '1px solid rgba(0,0,0,0.06)', color: hasSelection ? '#4b5563' : '#c4c9c0', cursor: hasSelection ? 'pointer' : 'not-allowed', boxShadow: hasSelection ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' }} onMouseEnter={e => { if (hasSelection) e.currentTarget.style.background = 'rgba(255,255,255,1)'; }} onMouseLeave={e => { if (hasSelection) e.currentTarget.style.background = 'rgba(255,255,255,0.85)'; }}>
                        <History size={12} /> Historial
                    </button>

                    <button onClick={() => hasSelection && openStock(selectedIngredient)} disabled={!hasSelection} title="Registrar movimiento" className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[12px] font-medium border transition-all duration-150" style={{ background: hasSelection ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.04)', border: hasSelection ? '1px solid rgba(0,0,0,0.12)' : '1px solid rgba(0,0,0,0.06)', color: hasSelection ? '#4b5563' : '#c4c9c0', cursor: hasSelection ? 'pointer' : 'not-allowed', boxShadow: hasSelection ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' }} onMouseEnter={e => { if (hasSelection) e.currentTarget.style.background = 'rgba(255,255,255,1)'; }} onMouseLeave={e => { if (hasSelection) e.currentTarget.style.background = 'rgba(255,255,255,0.85)'; }}>
                        <ArrowUpDown size={12} />
                        Movimiento
                    </button>

                    <button onClick={() => hasSelection && openEdit(selectedIngredient)} disabled={!hasSelection} title="Editar ingrediente" className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[12px] font-medium border transition-all duration-150" style={{ background: hasSelection ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.04)', border: hasSelection ? '1px solid rgba(0,0,0,0.12)' : '1px solid rgba(0,0,0,0.06)', color: hasSelection ? '#4b5563' : '#c4c9c0', cursor: hasSelection ? 'pointer' : 'not-allowed', boxShadow: hasSelection ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' }} onMouseEnter={e => { if (hasSelection) e.currentTarget.style.background = 'rgba(255,255,255,1)'; }} onMouseLeave={e => { if (hasSelection) e.currentTarget.style.background = 'rgba(255,255,255,0.85)'; }}>
                        <Edit2 size={12} />
                        Editar
                    </button>

                    <button onClick={() => hasSelection && setDelete(selectedIngredient)} disabled={!hasSelection} title="Desactivar ingrediente" className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[12px] font-medium border transition-all duration-150" style={{ background: hasSelection ? 'rgba(254,242,242,0.9)' : 'rgba(0,0,0,0.04)', border: hasSelection ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(0,0,0,0.06)', color: hasSelection ? '#ef4444' : '#c4c9c0', cursor: hasSelection ? 'pointer' : 'not-allowed', boxShadow: hasSelection ? '0 1px 3px rgba(239,68,68,0.1)' : 'none' }} onMouseEnter={e => { if (hasSelection) e.currentTarget.style.background = 'rgba(254,226,226,0.95)'; }} onMouseLeave={e => { if (hasSelection) e.currentTarget.style.background = 'rgba(254,242,242,0.9)'; }}>
                        <Trash2 size={12} />
                        Desactivar
                    </button>
                </div>
            </div>

            {/* ══ CUERPO PRINCIPAL ══ */}
            <div className="flex-1 flex flex-col overflow-hidden border border-white/40 rounded-b-2xl rounded-tr-2xl" style={{ ...GLASS }}>

                {/* Encabezado de columnas — sorteable */}
                <div className="grid shrink-0 px-5 py-3 border-b mt-2 ml-1 mr-1 bg-white rounded-t-2xl" style={{ gridTemplateColumns: TABLE_COLS, borderColor: 'rgba(0,0,0,0.06)' }} >
                    {TABLE_COLS_DEF.map(col => (
                        <SortableHeader key={col.key} col={col} sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                    ))}
                </div>

                {/* Filas */}
                <div className="flex-1 min-h-0 overflow-y-auto bg-white ml-1 mr-1">
                    {isLoading ? (
                        <div className="h-full flex justify-center items-center">
                            <Loader2 size={20} className="animate-spin text-gray-300" />
                        </div>
                    ) : ingredients.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center gap-2">
                            <FlaskConical size={28} className="text-gray-300" />
                            <p className="text-gray-400 text-[13px]">
                                {search || lowStockOnly
                                    ? 'Sin resultados para los filtros aplicados'
                                    : 'No hay ingredientes registrados aún'}
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col pt-1 pb-1">
                            {ingredients.map((ing, idx) => {
                                const isLow = ing.stock <= ing.min_stock;
                                const isSelected = selectedId === ing.id;

                                return (
                                    <div key={ing.id} onClick={() => setSelectedId(isSelected ? null : ing.id)} className={`grid items-center px-5 py-3 mx-1 rounded-2xl cursor-pointer transition-all duration-150 ${idx < ingredients.length - 1 ? 'mb-[2px]' : ''}`} style={{ gridTemplateColumns: TABLE_COLS, background: isSelected ? '#a1a682' : isLow ? 'rgba(239,68,68,0.04)' : 'transparent', }} onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(161,166,130,0.16)'; }} onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isLow ? 'rgba(239,68,68,0.04)' : 'transparent'; }} >
                                        {/* Nombre */}
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="text-[13px] font-medium truncate" style={{ color: isSelected ? 'white' : CELL_COLOR }}>
                                                {ing.name}
                                            </span>
                                            {isLow && !isSelected && <LowStockBadge />}
                                        </div>

                                        {/* Descripción */}
                                        <span className="text-[12px] truncate" style={{ color: isSelected ? CELL_COLOR_SELECTED : CELL_COLOR }}>
                                            {ing.description || '—'}
                                        </span>

                                        {/* Unidad */}
                                        <span className="text-[13px]" style={{ color: isSelected ? CELL_COLOR_SELECTED : CELL_COLOR }}>
                                            {ing.unit}
                                        </span>

                                        {/* Stock actual */}
                                        <span className="text-[13px] font-semibold" style={{ color: isSelected ? 'white' : isLow ? '#ef4444' : CELL_COLOR }}>
                                            {ing.stock}
                                        </span>

                                        {/* Stock mín */}
                                        <span className="text-[13px]" style={{ color: isSelected ? CELL_COLOR_SELECTED : CELL_COLOR }}>
                                            {ing.min_stock}
                                        </span>

                                        {/* Costo */}
                                        <span className="text-[13px]" style={{ color: isSelected ? CELL_COLOR_SELECTED : CELL_COLOR }}>
                                            {ing.cost_price != null ? formatCurrency(ing.cost_price) : '—'}
                                        </span>

                                        {/* Estado */}
                                        <div>
                                            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-semibold" style={{ background: ing.is_active ? isSelected ? 'rgba(21,128,61,0.55)' : '#ecfdf3' : isSelected ? 'rgba(156,163,175,0.22)' : '#f3f4f6', color: ing.is_active ? isSelected ? '#dcfce7' : '#15803d' : isSelected ? 'rgba(255,255,255,0.6)' : '#9ca3af', border: ing.is_active ? isSelected ? '1px solid rgba(21,128,61,0.7)' : '1px solid #bbf7d0' : isSelected ? '1px solid rgba(255,255,255,0.15)' : '1px solid #e5e7eb', }}>
                                                <span className="w-1.5 h-1.5 rounded-full" style={{ background: ing.is_active ? isSelected ? '#4ade80' : '#22c55e' : isSelected ? 'rgba(255,255,255,0.4)' : '#9ca3af' }} />
                                                {ing.is_active ? 'Activo' : 'Inactivo'}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {meta.total > 0 && (
                    <div className="shrink-0 px-5 py-2 flex items-center justify-between bg-white ml-1 mr-1 mb-1 rounded-b-2xl" style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                        <span className="text-[11px] text-gray-400">
                            Mostrando {ingredients.length} de {meta.total} ingredientes
                        </span>
                        <div className="flex items-center gap-2">
                            {totalPages > 1 && (
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                        <button key={p} onClick={() => setPage(p)} className="w-6 h-6 rounded-md text-[11px] font-semibold border-none cursor-pointer transition-colors" style={{ background: page === p ? '#55624a' : 'rgba(0,0,0,0.06)', color: page === p ? '#fff' : '#6b7280' }}>
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            )}
                            {totalPages > 1 && (
                                <span className="text-[11px] text-gray-400">
                                    Página {page} de {totalPages}
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ══ MODALES ══ */}
            <IngredientFormModal open={formModal.open} ingredient={formModal.ingredient} onClose={() => setFormModal({ open: false, ingredient: null })} />
            <StockMovementModal open={stockModal.open} ingredient={stockModal.ingredient} onClose={() => setStockModal({ open: false, ingredient: null })} />
            <MovementsDrawer open={drawer.open} ingredient={drawer.ingredient} onClose={() => setDrawer({ open: false, ingredient: null })} />
            {deleteTarget && (
                <DeleteConfirm ingredient={deleteTarget} busy={deleteIng.isPending} onConfirm={() => deleteIng.mutate(deleteTarget.id, { onSuccess: () => { setDelete(null); setSelectedId(null); }, })} onCancel={() => setDelete(null)} />
            )}
        </div>
    );
}