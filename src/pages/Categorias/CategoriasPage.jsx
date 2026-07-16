import { useState, useMemo } from 'react';
import {
  Tag, Plus, Search, Pencil,
  Lock, Unlock, Package, Loader2,
  ChevronUp, ChevronDown, Hash,
} from 'lucide-react';
import {
  useCategories,
  useDeactivateCategory,
  useActivateCategory,
} from '../../hooks/useCategories';
import CategoryFormModal from '../../components/categories/CategoryFormModal';
import toast from 'react-hot-toast';

// ── Visual constants (identical to UsersPage / RolesPage) ─────────────────────

const GLASS = {
  background: 'rgba(204,204,204,0.22)',
  backdropFilter: 'blur(28px) saturate(1.8)',
  WebkitBackdropFilter: 'blur(28px) saturate(1.8)',
};

const COLS = [
  { key: 'orden',       label: 'Orden',      flex: '0.55fr' },
  { key: 'nombre',      label: 'Nombre',     flex: '1.8fr'  },
  { key: 'descripcion', label: 'Descripción',flex: '2.6fr'  },
  { key: 'productos',   label: 'Productos',  flex: '0.85fr' },
  { key: 'estado',      label: 'Estado',     flex: '1fr'    },
];
const GRID = COLS.map((c) => c.flex).join(' ');

const STATUS_CFG = {
  ACTIVO:   { label: 'Activos',   dot: '#22c55e', bg: 'rgba(21,128,61,0.08)',    border: 'rgba(21,128,61,0.28)',   color: '#15803d', next: 'INACTIVO' },
  INACTIVO: { label: 'Inactivos', dot: '#9ca3af', bg: 'rgba(156,163,175,0.12)', border: 'rgba(107,114,128,0.22)', color: '#6b7280', next: 'all'      },
  all:      { label: 'Todos',     dot: '#9ca3af', bg: 'rgba(0,0,0,0.04)',        border: 'rgba(0,0,0,0.10)',       color: '#6b7280', next: 'ACTIVO'   },
};

const VARIANTS = {
  neutral: { bg: 'rgba(255,255,255,0.85)', border: 'rgba(0,0,0,0.12)',     color: '#4b5563' },
  red:     { bg: 'rgba(254,242,242,0.9)',  border: 'rgba(239,68,68,0.2)',  color: '#ef4444' },
  green:   { bg: 'rgba(240,253,244,0.9)',  border: 'rgba(22,163,74,0.2)',  color: '#16a34a' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function sortCategories(list, key, dir) {
  if (!key) return list;
  return [...list].sort((a, b) => {
    let va, vb;
    if (key === 'productos') {
      va = a._count?.productos ?? 0;
      vb = b._count?.productos ?? 0;
      return dir === 'asc' ? va - vb : vb - va;
    }
    if (key === 'orden') {
      va = a.orden ?? Infinity;
      vb = b.orden ?? Infinity;
      return dir === 'asc' ? va - vb : vb - va;
    }
    va = a[key] ?? '';
    vb = b[key] ?? '';
    if (va === vb) return 0;
    return dir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
  });
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SortableHeader({ col, sortKey, sortDir, onSort }) {
  const active = sortKey === col.key;
  return (
    <button
      onClick={() => onSort(col.key)}
      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
    >
      <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: active ? '#55624a' : '#9ca3af', transition: 'color 100ms' }}>
        {col.label}
      </span>
      <span style={{ display: 'flex', flexDirection: 'column', gap: 1, marginTop: 1 }}>
        <ChevronUp   size={9} style={{ color: active && sortDir === 'asc'  ? '#55624a' : '#d1d5db' }} />
        <ChevronDown size={9} style={{ color: active && sortDir === 'desc' ? '#55624a' : '#d1d5db', marginTop: -3 }} />
      </span>
    </button>
  );
}

function ActionConfirm({ config, onConfirm, onCancel, busy }) {
  const { icon: Icon, iconBg, iconColor, title, description, confirmText, confirmBg } = config;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.30)', backdropFilter: 'blur(4px)' }}>
      <div style={{ width: '100%', maxWidth: 380, background: 'white', borderRadius: 20, border: '1px solid #e5e7eb', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', padding: 24 }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={17} style={{ color: iconColor }} />
          </div>
          <div>
            <h3 style={{ color: '#111827', fontSize: 14, fontWeight: 700, margin: '0 0 4px', fontFamily: "'Syne', sans-serif" }}>{title}</h3>
            <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>{description}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onCancel} style={{ flex: 1, height: 40, borderRadius: 10, border: '1px solid #e5e7eb', background: 'white', color: '#6b7280', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
            Cancelar
          </button>
          <button onClick={onConfirm} disabled={busy} style={{ flex: 2, height: 40, borderRadius: 10, border: 'none', background: busy ? '#e5e7eb' : confirmBg, color: busy ? '#9ca3af' : 'white', fontSize: 13, fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer', fontFamily: "'Syne', sans-serif" }}>
            {busy ? 'Procesando…' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CategoriasPage() {
  const [search,     setSearch]     = useState('');
  const [status,     setStatus]     = useState('ACTIVO');
  const [selectedId, setSelectedId] = useState(null);
  const [sortKey,    setSortKey]    = useState('orden');
  const [sortDir,    setSortDir]    = useState('asc');
  const [confirm,    setConfirm]    = useState(null); // { type, cat }
  const [formModal,  setFormModal]  = useState({ open: false, category: null });

  const params = useMemo(() => {
    const p = { limit: 100 };
    if (status !== 'all') p.estado = status;
    return p;
  }, [status]);

  const { data: rawData, isLoading, isFetching } = useCategories(params);
  const deactivate = useDeactivateCategory();
  const activate   = useActivateCategory();

  const rawList = useMemo(() => {
    const arr = rawData?.data;
    return Array.isArray(arr) ? arr : [];
  }, [rawData]);

  const categories = useMemo(() => {
    const filtered = rawList.filter((c) =>
      !search ||
      c.nombre?.toLowerCase().includes(search.toLowerCase()) ||
      c.descripcion?.toLowerCase().includes(search.toLowerCase())
    );
    return sortCategories(filtered, sortKey, sortDir);
  }, [rawList, search, sortKey, sortDir]);

  const selected  = categories.find((c) => c.id === selectedId) ?? null;
  const has       = !!selected;
  const isActive  = selected?.estado === 'ACTIVO';

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  const confirmBusy = deactivate.isPending || activate.isPending;

  const handleConfirm = async () => {
    if (!confirm) return;
    try {
      if (confirm.type === 'deactivate') await deactivate.mutateAsync(confirm.cat.id);
      else                               await activate.mutateAsync(confirm.cat.id);
      setConfirm(null);
      setSelectedId(null);
    } catch (err) {
      toast.error(err?.message ?? 'No se pudo completar la operación');
      setConfirm(null);
    }
  };

  const CONFIRM_CONFIGS = {
    deactivate: {
      icon: Lock, iconBg: '#fee2e2', iconColor: '#ef4444',
      title: 'Desactivar categoría',
      description: `¿Desactivar "${confirm?.cat?.nombre}"? Los productos de esta categoría quedarán sin categoría activa.`,
      confirmText: 'Sí, desactivar', confirmBg: '#ef4444',
    },
    activate: {
      icon: Unlock, iconBg: '#dcfce7', iconColor: '#16a34a',
      title: 'Activar categoría',
      description: `¿Activar "${confirm?.cat?.nombre}"? La categoría volverá a estar disponible en el sistema.`,
      confirmText: 'Sí, activar', confirmBg: '#16a34a',
    },
  };

  const sc = STATUS_CFG[status] ?? STATUS_CFG.all;

  const actions = [
    {
      icon: <Pencil size={13} />,
      title: 'Editar categoría',
      enabled: has,
      variant: 'neutral',
      action: () => setFormModal({ open: true, category: selected }),
    },
    {
      icon: isActive ? <Lock size={13} /> : <Unlock size={13} />,
      title: isActive ? 'Desactivar categoría' : 'Activar categoría',
      enabled: has,
      variant: isActive ? 'red' : 'green',
      action: () => setConfirm({ type: isActive ? 'deactivate' : 'activate', cat: selected }),
    },
  ];

  return (
    <div className="w-full h-full overflow-hidden flex flex-col">

      {/* ── Top row ────────────────────────────────────────────────────────── */}
      <div className="flex items-end shrink-0 h-10">

        {/* Chrome tab */}
        <div
          className="relative flex items-center gap-2 px-4 h-10 border border-b-0 border-white/40 shrink-0"
          style={{ width: 'min(65%, 620px)', ...GLASS, borderRadius: '10px 10px 0 0' }}
        >
          <Tag size={13} style={{ color: '#55624a', flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#374151', fontFamily: "'Syne', sans-serif", flexShrink: 0 }}>
            Categorías
          </span>
          {isFetching && !isLoading && (
            <Loader2 size={11} className="animate-spin" style={{ color: '#8c916c', flexShrink: 0 }} />
          )}

          <div style={{ width: 1, height: 16, background: 'rgba(156,163,175,0.5)', margin: '0 4px', flexShrink: 0 }} />

          {/* Search */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <Search size={11} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar…"
              style={{ height: 24, width: 128, borderRadius: 8, fontSize: 11, paddingLeft: 24, paddingRight: 8, outline: 'none', background: 'rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.08)', color: '#374151', boxSizing: 'border-box' }}
              onFocus={(e) => { e.target.style.background = 'rgba(255,255,255,0.9)'; e.target.style.borderColor = '#8c916c'; }}
              onBlur={(e)  => { e.target.style.background = 'rgba(0,0,0,0.06)';     e.target.style.borderColor = 'rgba(0,0,0,0.08)'; }}
            />
          </div>

          {/* Status chip (cyclic) */}
          <button
            onClick={() => { setStatus(sc.next); setSelectedId(null); }}
            style={{ display: 'flex', alignItems: 'center', gap: 4, height: 24, padding: '0 10px', borderRadius: 8, fontSize: 11, fontWeight: 500, border: `1px solid ${sc.border}`, background: sc.bg, color: sc.color, cursor: 'pointer', flexShrink: 0, transition: 'all 150ms' }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.dot, display: 'inline-block' }} />
            {sc.label}
          </button>

          {/* Chrome ear */}
          <span style={{ position: 'absolute', bottom: 0, right: -28, width: 28, height: 48, overflow: 'hidden', pointerEvents: 'none' }}>
            <span style={{ position: 'absolute', left: 0, bottom: 0, width: 56, height: 56, borderRadius: '50%', boxShadow: '-28px 28px 0 0 rgba(204,204,204,0.22)' }} />
          </span>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 32, paddingBottom: 6 }}>
          <button
            onClick={() => setFormModal({ open: true, category: null })}
            style={{ display: 'flex', alignItems: 'center', gap: 6, height: 28, padding: '0 12px', borderRadius: 8, border: 'none', background: '#55624a', color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(85,98,74,0.30)', fontFamily: "'Syne', sans-serif" }}
          >
            <Plus size={13} /> Nueva
          </button>

          <div style={{ width: 1, height: 16, background: 'rgba(156,163,175,0.5)', margin: '0 2px' }} />

          {actions.map(({ icon, title, enabled, variant, action }) => {
            const v = enabled ? VARIANTS[variant] : null;
            return (
              <button
                key={title}
                onClick={() => enabled && action()}
                disabled={!enabled}
                title={title}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 8, background: enabled ? v.bg : 'rgba(0,0,0,0.04)', border: `1px solid ${enabled ? v.border : 'rgba(0,0,0,0.06)'}`, color: enabled ? v.color : '#c4c9c0', cursor: enabled ? 'pointer' : 'not-allowed', boxShadow: enabled ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'all 150ms' }}
                onMouseEnter={(e) => { if (enabled) e.currentTarget.style.opacity = '0.82'; }}
                onMouseLeave={(e) => { if (enabled) e.currentTarget.style.opacity = '1'; }}
              >
                {icon}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden rounded-b-2xl rounded-tr-2xl" style={GLASS}>

        <div style={{ flex: 1, minHeight: 0, overflowX: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* Column headers */}
        <div style={{ display: 'grid', gridTemplateColumns: GRID, padding: '12px 20px', borderBottom: '1px solid rgba(0,0,0,0.06)', margin: '8px 4px 0', background: 'white', borderRadius: '14px 14px 0 0', flexShrink: 0, minWidth: 500 }}>
          {COLS.map((col) => (
            <SortableHeader key={col.key} col={col} sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
          ))}
        </div>

        {/* Rows */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', background: 'white', margin: '0 4px', minWidth: 500 }}>
          {isLoading ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Loader2 size={20} className="animate-spin" style={{ color: '#d1d5db' }} />
            </div>
          ) : categories.length === 0 ? (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Tag size={28} style={{ color: '#d1d5db' }} />
              <p style={{ color: '#9ca3af', fontSize: 13 }}>
                {search ? 'Sin resultados para los filtros aplicados' : 'No hay categorías registradas'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', paddingTop: 4, paddingBottom: 4 }}>
              {categories.map((cat, idx) => {
                const isSel  = selectedId === cat.id;
                const activo = cat.estado === 'ACTIVO';
                const count  = cat._count?.productos ?? 0;

                return (
                  <div
                    key={cat.id}
                    onClick={() => setSelectedId(isSel ? null : cat.id)}
                    style={{ display: 'grid', gridTemplateColumns: GRID, alignItems: 'center', padding: '11px 20px', margin: `0 4px ${idx < categories.length - 1 ? 2 : 0}px`, borderRadius: 14, cursor: 'pointer', background: isSel ? '#a1a682' : 'transparent', transition: 'background 150ms' }}
                    onMouseEnter={(e) => { if (!isSel) e.currentTarget.style.background = 'rgba(161,166,130,0.16)'; }}
                    onMouseLeave={(e) => { if (!isSel) e.currentTarget.style.background = 'transparent'; }}
                  >
                    {/* Orden */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {cat.orden != null ? (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: 26, height: 26, borderRadius: 8, fontSize: 12, fontWeight: 700,
                          background: isSel ? 'rgba(255,255,255,0.18)' : '#f3f4f6',
                          color: isSel ? 'white' : '#374151',
                        }}>
                          {cat.orden}
                        </span>
                      ) : (
                        <span style={{ color: isSel ? 'rgba(255,255,255,0.3)' : '#d1d5db', fontSize: 11 }}>—</span>
                      )}
                    </div>

                    {/* Nombre */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, background: isSel ? 'rgba(255,255,255,0.22)' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Tag size={12} style={{ color: isSel ? 'white' : '#6b7280' }} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: isSel ? 'white' : '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {cat.nombre}
                      </span>
                    </div>

                    {/* Descripción */}
                    <span style={{ fontSize: 12, color: isSel ? 'rgba(255,255,255,0.75)' : '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 12 }}>
                      {cat.descripcion || <span style={{ color: isSel ? 'rgba(255,255,255,0.28)' : '#d1d5db' }}>Sin descripción</span>}
                    </span>

                    {/* Productos */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Package size={11} style={{ color: isSel ? 'rgba(255,255,255,0.55)' : '#9ca3af' }} />
                      <span style={{ fontSize: 12, color: isSel ? 'rgba(255,255,255,0.88)' : '#374151', fontWeight: 500 }}>
                        {count}
                      </span>
                    </div>

                    {/* Estado */}
                    <div>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: activo ? (isSel ? 'rgba(21,128,61,0.55)' : '#ecfdf3') : (isSel ? 'rgba(156,163,175,0.22)' : '#f3f4f6'), color: activo ? (isSel ? '#dcfce7' : '#15803d') : (isSel ? 'rgba(255,255,255,0.6)' : '#9ca3af'), border: activo ? (isSel ? '1px solid rgba(21,128,61,0.7)' : '1px solid #bbf7d0') : (isSel ? '1px solid rgba(255,255,255,0.15)' : '1px solid #e5e7eb') }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: activo ? (isSel ? '#4ade80' : '#22c55e') : (isSel ? 'rgba(255,255,255,0.4)' : '#9ca3af') }} />
                        {activo ? 'Activa' : 'Inactiva'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        </div>
        {/* Footer */}
        {rawList.length > 0 && (
          <div style={{ flexShrink: 0, padding: '8px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', margin: '0 4px 4px', borderRadius: '0 0 14px 14px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
            <span style={{ fontSize: 11, color: '#9ca3af' }}>
              {categories.length} de {rawList.length} {rawList.length === 1 ? 'categoría' : 'categorías'}
            </span>
            {selected && (
              <span style={{ fontSize: 11, color: '#8c916c', fontWeight: 500 }}>
                Seleccionada: {selected.nombre}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      <CategoryFormModal
        open={formModal.open}
        onClose={() => setFormModal({ open: false, category: null })}
        category={formModal.category}
      />

      {confirm && CONFIRM_CONFIGS[confirm.type] && (
        <ActionConfirm
          config={CONFIRM_CONFIGS[confirm.type]}
          onConfirm={handleConfirm}
          onCancel={() => setConfirm(null)}
          busy={confirmBusy}
        />
      )}
    </div>
  );
}
