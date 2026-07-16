import { useState, useEffect, useMemo } from 'react';
import {
  ShoppingBag, Plus, Search, Pencil, Lock, Unlock,
  Loader2, ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProducts, useDeactivateProduct, useActivateProduct } from '../../hooks/useProducts';
import { useCategories } from '../../hooks/useCategories';
import ProductFormModal from '../../components/products/ProductFormModal';
import toast from 'react-hot-toast';

// ── Constants ────────────────────────────────────────────────────────────────

const GLASS = {
  background: 'rgba(204,204,204,0.22)',
  backdropFilter: 'blur(28px) saturate(1.8)',
  WebkitBackdropFilter: 'blur(28px) saturate(1.8)',
};

const COLS = [
  { key: 'nombre',     label: 'Nombre',      flex: '2fr'   },
  { key: 'categoria',  label: 'Categoría',   flex: '1.4fr' },
  { key: 'precioBase', label: 'Precio base', flex: '0.9fr' },
  { key: 'variantes',  label: 'Variantes',   flex: '0.7fr' },
  { key: 'insumos',    label: 'Insumos',     flex: '0.7fr' },
  { key: 'disponible', label: 'Disponible',  flex: '1.1fr' },
  { key: 'estado',     label: 'Estado',      flex: '0.9fr' },
];
const GRID = COLS.map((c) => c.flex).join(' ');

const STATUS_CFG = {
  ACTIVO:   { label: 'Activos',   dot: '#22c55e', bg: 'rgba(21,128,61,0.08)',    border: 'rgba(21,128,61,0.28)',   color: '#15803d', next: 'INACTIVO' },
  INACTIVO: { label: 'Inactivos', dot: '#9ca3af', bg: 'rgba(156,163,175,0.12)', border: 'rgba(107,114,128,0.22)', color: '#6b7280', next: 'all'      },
  all:      { label: 'Todos',     dot: '#9ca3af', bg: 'rgba(0,0,0,0.04)',        border: 'rgba(0,0,0,0.10)',       color: '#6b7280', next: 'ACTIVO'   },
};

const VARIANTS = {
  neutral: { bg: 'rgba(255,255,255,0.85)', border: 'rgba(0,0,0,0.12)',     color: '#4b5563' },
  blue:    { bg: 'rgba(239,246,255,0.9)',  border: 'rgba(37,99,235,0.2)',  color: '#2563eb' },
  green:   { bg: 'rgba(240,253,244,0.9)',  border: 'rgba(22,163,74,0.2)',  color: '#16a34a' },
  red:     { bg: 'rgba(254,242,242,0.9)',  border: 'rgba(239,68,68,0.2)',  color: '#ef4444' },
};

const CAT_PARAMS = { estado: 'ACTIVO', limit: 100 };
const LIMIT = 20;

const formatCOP = (v) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v || 0);

// ── Sub-components ────────────────────────────────────────────────────────────

function SortableHeader({ col, sortKey, sortDir, onSort }) {
  const active = sortKey === col.key;
  return (
    <button onClick={() => onSort(col.key)}
      style={{ background:'none',border:'none',padding:0,cursor:'pointer',display:'flex',alignItems:'center',gap:4 }}>
      <span style={{ fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.06em',color:active?'#55624a':'#9ca3af',transition:'color 100ms' }}>
        {col.label}
      </span>
      <span style={{ display:'flex',flexDirection:'column',gap:1,marginTop:1 }}>
        <ChevronUp   size={9} style={{ color:active&&sortDir==='asc'  ?'#55624a':'#d1d5db' }} />
        <ChevronDown size={9} style={{ color:active&&sortDir==='desc' ?'#55624a':'#d1d5db',marginTop:-3 }} />
      </span>
    </button>
  );
}

function ActionConfirm({ config, onConfirm, onCancel, busy }) {
  const { icon: Icon, iconBg, iconColor, title, description, confirmText, confirmBg } = config;
  return (
    <div style={{ position:'fixed',inset:0,zIndex:1100,display:'flex',alignItems:'center',justifyContent:'center',padding:16,background:'rgba(0,0,0,0.30)',backdropFilter:'blur(4px)' }}>
      <div style={{ width:'100%',maxWidth:380,background:'white',borderRadius:20,border:'1px solid #e5e7eb',boxShadow:'0 20px 60px rgba(0,0,0,0.15)',padding:24 }}>
        <div style={{ display:'flex',gap:12,marginBottom:20 }}>
          <div style={{ width:40,height:40,borderRadius:12,flexShrink:0,background:iconBg,display:'flex',alignItems:'center',justifyContent:'center' }}>
            <Icon size={17} style={{ color:iconColor }} />
          </div>
          <div>
            <h3 style={{ color:'#111827',fontSize:14,fontWeight:700,margin:'0 0 4px',fontFamily:"'Syne',sans-serif" }}>{title}</h3>
            <p style={{ color:'#6b7280',fontSize:13,margin:0 }}>{description}</p>
          </div>
        </div>
        <div style={{ display:'flex',gap:8 }}>
          <button onClick={onCancel} style={{ flex:1,height:40,borderRadius:10,border:'1px solid #e5e7eb',background:'white',color:'#6b7280',fontSize:13,fontWeight:500,cursor:'pointer' }}>Cancelar</button>
          <button onClick={onConfirm} disabled={busy} style={{ flex:2,height:40,borderRadius:10,border:'none',background:busy?'#e5e7eb':confirmBg,color:busy?'#9ca3af':'white',fontSize:13,fontWeight:700,cursor:busy?'not-allowed':'pointer',fontFamily:"'Syne',sans-serif" }}>
            {busy ? 'Procesando…' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Sort ─────────────────────────────────────────────────────────────────────

function sortProducts(list, key, dir) {
  if (!key) return list;
  return [...list].sort((a, b) => {
    let va, vb;
    if (key === 'categoria')  { va = a.categoria?.nombre ?? ''; vb = b.categoria?.nombre ?? ''; }
    else if (key === 'variantes') { va = a._count?.variantes ?? 0; vb = b._count?.variantes ?? 0; }
    else if (key === 'insumos')   { va = a._count?.insumosBase ?? 0; vb = b._count?.insumosBase ?? 0; }
    else if (key === 'disponible'){ va = a.disponible ? 1 : 0; vb = b.disponible ? 1 : 0; }
    else { va = a[key] ?? ''; vb = b[key] ?? ''; }
    if (typeof va === 'number') return dir === 'asc' ? va - vb : vb - va;
    return dir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
  });
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProductosPage() {
  const navigate = useNavigate();

  const [searchInput, setSearchInput] = useState('');
  const [search,      setSearch]      = useState('');
  const [status,      setStatus]      = useState('ACTIVO');
  const [disponible,  setDisponible]  = useState(false);
  const [categoriaId, setCategoriaId] = useState('');
  const [page,        setPage]        = useState(1);
  const [selectedId,  setSelectedId]  = useState(null);
  const [sortKey,     setSortKey]     = useState('nombre');
  const [sortDir,     setSortDir]     = useState('asc');
  const [confirm,     setConfirm]     = useState(null);
  const [formModal,   setFormModal]   = useState({ open: false, product: null });

  // Debounce search 400ms
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Reset page on filter change
  useEffect(() => { setPage(1); setSelectedId(null); }, [status, disponible, categoriaId]);

  const params = useMemo(() => {
    const p = { page, limit: LIMIT };
    if (status !== 'all') p.estado = status;
    if (search.trim())    p.buscar = search.trim();
    if (disponible)       p.disponible = true;
    if (categoriaId)      p.categoriaId = categoriaId;
    return p;
  }, [page, status, search, disponible, categoriaId]);

  const { data: rawData, isLoading, isFetching } = useProducts(params);
  const { data: categoriesRaw } = useCategories(CAT_PARAMS);
  const deactivate = useDeactivateProduct();
  const activate   = useActivateProduct();

  const products     = useMemo(() => rawData?.data ?? [], [rawData]);
  const meta         = rawData?.meta ?? {};
  const totalPages   = meta.totalPages ?? 1;
  const categoriesList = useMemo(() => categoriesRaw?.data ?? [], [categoriesRaw]);

  const sorted = useMemo(() => sortProducts(products, sortKey, sortDir), [products, sortKey, sortDir]);

  const selected = products.find((p) => p.id === selectedId) ?? null;
  const has      = !!selected;
  const isActive = selected?.estado === 'ACTIVO';

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  const confirmBusy = deactivate.isPending || activate.isPending;

  const handleConfirm = async () => {
    if (!confirm) return;
    try {
      if (confirm.type === 'deactivate') await deactivate.mutateAsync(confirm.product.id);
      else                               await activate.mutateAsync(confirm.product.id);
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
      title: 'Desactivar producto',
      description: `¿Desactivar "${confirm?.product?.nombre}"? No estará disponible para la venta.`,
      confirmText: 'Sí, desactivar', confirmBg: '#ef4444',
    },
    activate: {
      icon: Unlock, iconBg: '#dcfce7', iconColor: '#16a34a',
      title: 'Activar producto',
      description: `¿Activar "${confirm?.product?.nombre}"? Volverá a estar disponible.`,
      confirmText: 'Sí, activar', confirmBg: '#16a34a',
    },
  };

  const sc = STATUS_CFG[status] ?? STATUS_CFG.all;

  const actions = [
    {
      icon: <ExternalLink size={13} />,
      title: 'Ver detalle',
      enabled: has,
      variant: 'blue',
      action: () => navigate(`/productos/${selected.id}`),
    },
    {
      icon: <Pencil size={13} />,
      title: 'Editar producto',
      enabled: has,
      variant: 'neutral',
      action: () => setFormModal({ open: true, product: selected }),
    },
    {
      icon: isActive ? <Lock size={13} /> : <Unlock size={13} />,
      title: isActive ? 'Desactivar producto' : 'Activar producto',
      enabled: has,
      variant: isActive ? 'red' : 'green',
      action: () => setConfirm({ type: isActive ? 'deactivate' : 'activate', product: selected }),
    },
  ];

  return (
    <div className="w-full h-full overflow-hidden flex flex-col">

      {/* ── Top row ──────────────────────────────────────────────────────── */}
      <div className="flex items-end shrink-0 h-10">

        {/* Chrome tab */}
        <div className="relative flex items-center gap-2 px-4 h-10 border border-b-0 border-white/40 shrink-0"
          style={{ width: 'min(75%, 720px)', ...GLASS, borderRadius: '10px 10px 0 0' }}>
          <ShoppingBag size={13} style={{ color:'#55624a',flexShrink:0 }} />
          <span style={{ fontSize:13,fontWeight:700,color:'#374151',fontFamily:"'Syne',sans-serif",flexShrink:0 }}>
            Productos
          </span>
          {isFetching && !isLoading && (
            <Loader2 size={11} className="animate-spin" style={{ color:'#8c916c',flexShrink:0 }} />
          )}

          <div style={{ width:1,height:16,background:'rgba(156,163,175,0.5)',margin:'0 4px',flexShrink:0 }} />

          {/* Search */}
          <div style={{ position:'relative',flexShrink:0 }}>
            <Search size={11} style={{ position:'absolute',left:8,top:'50%',transform:'translateY(-50%)',color:'#9ca3af',pointerEvents:'none' }} />
            <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar producto…"
              style={{ height:24,width:148,borderRadius:8,fontSize:11,paddingLeft:24,paddingRight:8,outline:'none',background:'rgba(0,0,0,0.06)',border:'1px solid rgba(0,0,0,0.08)',color:'#374151',boxSizing:'border-box' }}
              onFocus={(e) => { e.target.style.background='rgba(255,255,255,0.9)';e.target.style.borderColor='#8c916c'; }}
              onBlur={(e)  => { e.target.style.background='rgba(0,0,0,0.06)';    e.target.style.borderColor='rgba(0,0,0,0.08)'; }}
            />
          </div>

          {/* Status chip */}
          <button onClick={() => { setStatus(sc.next); setSelectedId(null); }}
            style={{ display:'flex',alignItems:'center',gap:4,height:24,padding:'0 10px',borderRadius:8,fontSize:11,fontWeight:500,border:`1px solid ${sc.border}`,background:sc.bg,color:sc.color,cursor:'pointer',flexShrink:0,transition:'all 150ms' }}>
            <span style={{ width:6,height:6,borderRadius:'50%',background:sc.dot,display:'inline-block' }} />
            {sc.label}
          </button>

          {/* Disponible toggle */}
          <button onClick={() => setDisponible((v) => !v)}
            style={{ display:'flex',alignItems:'center',gap:4,height:24,padding:'0 10px',borderRadius:8,fontSize:11,fontWeight:500,border:`1px solid ${disponible ? 'rgba(21,128,61,0.35)' : 'rgba(0,0,0,0.10)'}`,background:disponible?'rgba(21,128,61,0.10)':'rgba(0,0,0,0.04)',color:disponible?'#16a34a':'#6b7280',cursor:'pointer',flexShrink:0,transition:'all 150ms' }}>
            Disponibles
          </button>

          {/* Categoría filter */}
          <div style={{ position:'relative',flexShrink:0 }}>
            <select value={categoriaId}
              onChange={(e) => { setCategoriaId(e.target.value); setPage(1); setSelectedId(null); }}
              style={{ height:24,borderRadius:8,fontSize:11,fontWeight:500,border:`1px solid ${categoriaId?'rgba(85,98,74,0.35)':'rgba(0,0,0,0.10)'}`,background:categoriaId?'rgba(85,98,74,0.08)':'rgba(0,0,0,0.04)',color:categoriaId?'#55624a':'#6b7280',padding:'0 22px 0 8px',outline:'none',appearance:'none',WebkitAppearance:'none',cursor:'pointer',maxWidth:130,boxSizing:'border-box' }}>
              <option value="">Categoría</option>
              {categoriesList.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
              ))}
            </select>
            <span style={{ position:'absolute',right:7,top:'50%',transform:'translateY(-50%)',pointerEvents:'none',color:'#9ca3af',fontSize:9 }}>▼</span>
          </div>

          {/* Chrome ear */}
          <span style={{ position:'absolute',bottom:0,right:-28,width:28,height:48,overflow:'hidden',pointerEvents:'none' }}>
            <span style={{ position:'absolute',left:0,bottom:0,width:56,height:56,borderRadius:'50%',boxShadow:'-28px 28px 0 0 rgba(204,204,204,0.22)' }} />
          </span>
        </div>

        {/* Action buttons */}
        <div style={{ display:'flex',alignItems:'center',gap:6,paddingLeft:32,paddingBottom:6 }}>
          <button onClick={() => setFormModal({ open: true, product: null })}
            style={{ display:'flex',alignItems:'center',gap:6,height:28,padding:'0 12px',borderRadius:8,border:'none',background:'#55624a',color:'white',fontSize:12,fontWeight:700,cursor:'pointer',boxShadow:'0 2px 8px rgba(85,98,74,0.30)',fontFamily:"'Syne',sans-serif" }}>
            <Plus size={13} /> Nuevo
          </button>

          <div style={{ width:1,height:16,background:'rgba(156,163,175,0.5)',margin:'0 2px' }} />

          {actions.map(({ icon, title, enabled, variant, action }) => {
            const v = enabled ? VARIANTS[variant] : null;
            return (
              <button key={title} onClick={() => enabled && action()} disabled={!enabled} title={title}
                style={{ display:'flex',alignItems:'center',justifyContent:'center',width:28,height:28,borderRadius:8,background:enabled?v.bg:'rgba(0,0,0,0.04)',border:`1px solid ${enabled?v.border:'rgba(0,0,0,0.06)'}`,color:enabled?v.color:'#c4c9c0',cursor:enabled?'pointer':'not-allowed',boxShadow:enabled?'0 1px 3px rgba(0,0,0,0.08)':'none',transition:'all 150ms' }}
                onMouseEnter={(e) => { if (enabled) e.currentTarget.style.opacity='0.82'; }}
                onMouseLeave={(e) => { if (enabled) e.currentTarget.style.opacity='1'; }}
              >
                {icon}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden rounded-b-2xl rounded-tr-2xl" style={GLASS}>

        <div style={{ flex: 1, minHeight: 0, overflowX: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* Column headers */}
        <div style={{ display:'grid',gridTemplateColumns:GRID,padding:'12px 20px',borderBottom:'1px solid rgba(0,0,0,0.06)',margin:'8px 4px 0',background:'white',borderRadius:'14px 14px 0 0',flexShrink:0,minWidth:700 }}>
          {COLS.map((col) => (
            <SortableHeader key={col.key} col={col} sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
          ))}
        </div>

        {/* Rows */}
        <div style={{ flex:1,minHeight:0,overflowY:'auto',background:'white',margin:'0 4px',minWidth:700 }}>
          {isLoading ? (
            <div style={{ height:'100%',display:'flex',alignItems:'center',justifyContent:'center' }}>
              <Loader2 size={20} className="animate-spin" style={{ color:'#d1d5db' }} />
            </div>
          ) : sorted.length === 0 ? (
            <div style={{ height:'100%',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:8 }}>
              <ShoppingBag size={28} style={{ color:'#d1d5db' }} />
              <p style={{ color:'#9ca3af',fontSize:13 }}>
                {search || categoriaId || disponible ? 'Sin resultados para los filtros aplicados' : 'No hay productos registrados'}
              </p>
            </div>
          ) : (
            <div style={{ display:'flex',flexDirection:'column',paddingTop:4,paddingBottom:4 }}>
              {sorted.map((product, idx) => {
                const isSel   = selectedId === product.id;
                const activo  = product.estado === 'ACTIVO';
                const disp    = product.disponible;

                return (
                  <div key={product.id}
                    onClick={() => setSelectedId(isSel ? null : product.id)}
                    style={{ display:'grid',gridTemplateColumns:GRID,alignItems:'center',padding:'10px 20px',margin:`0 4px ${idx < sorted.length - 1 ? 2 : 0}px`,borderRadius:14,cursor:'pointer',background:isSel?'#a1a682':'transparent',transition:'background 150ms',opacity:activo?1:0.65 }}
                    onMouseEnter={(e) => { if (!isSel) e.currentTarget.style.background='rgba(161,166,130,0.16)'; }}
                    onMouseLeave={(e) => { if (!isSel) e.currentTarget.style.background='transparent'; }}
                  >
                    {/* Nombre */}
                    <div style={{ display:'flex',alignItems:'center',gap:8,minWidth:0 }}>
                      <div style={{ width:30,height:30,borderRadius:8,flexShrink:0,overflow:'hidden',background:isSel?'rgba(255,255,255,0.22)':'#f3f4f6',display:'flex',alignItems:'center',justifyContent:'center' }}>
                        {product.imagenUrl
                          ? <img src={product.imagenUrl} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }} onError={(e) => { e.currentTarget.style.display='none'; }} />
                          : <ShoppingBag size={13} style={{ color:isSel?'white':'#6b7280' }} />
                        }
                      </div>
                      <div style={{ minWidth:0 }}>
                        <p style={{ fontSize:13,fontWeight:600,color:isSel?'white':'#374151',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
                          {product.nombre}
                        </p>
                        {product.descripcion && (
                          <p style={{ fontSize:11,color:isSel?'rgba(255,255,255,0.6)':'#9ca3af',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
                            {product.descripcion}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Categoría */}
                    <span style={{ fontSize:12,color:isSel?'rgba(255,255,255,0.82)':'#6b7280',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
                      {product.categoria?.nombre ?? <span style={{ color:isSel?'rgba(255,255,255,0.3)':'#d1d5db' }}>—</span>}
                    </span>

                    {/* Precio base */}
                    <span style={{ fontSize:13,fontWeight:600,color:isSel?'rgba(255,255,255,0.92)':'#374151' }}>
                      {formatCOP(product.precioBase)}
                    </span>

                    {/* Variantes */}
                    <div>
                      {product.tieneVariantes ? (
                        <span style={{ display:'inline-flex',alignItems:'center',justifyContent:'center',minWidth:22,height:20,padding:'0 7px',borderRadius:999,fontSize:11,fontWeight:700,background:isSel?'rgba(255,255,255,0.18)':'#f3f4f6',color:isSel?'white':'#374151' }}>
                          {product._count?.variantes ?? 0}
                        </span>
                      ) : (
                        <span style={{ fontSize:11,color:isSel?'rgba(255,255,255,0.30)':'#d1d5db' }}>—</span>
                      )}
                    </div>

                    {/* Insumos */}
                    <span style={{ display:'inline-flex',alignItems:'center',justifyContent:'center',minWidth:22,height:20,padding:'0 7px',borderRadius:999,fontSize:11,fontWeight:700,background:isSel?'rgba(255,255,255,0.18)':'#f3f4f6',color:isSel?'white':'#374151',width:'fit-content' }}>
                      {product._count?.insumosBase ?? 0}
                    </span>

                    {/* Disponible */}
                    <div>
                      <span style={{ display:'inline-flex',alignItems:'center',gap:5,padding:'2px 8px',borderRadius:20,fontSize:11,fontWeight:600,background:disp?(isSel?'rgba(21,128,61,0.45)':'#dcfce7'):(isSel?'rgba(239,68,68,0.25)':'#fee2e2'),color:disp?(isSel?'#d1fae5':'#15803d'):(isSel?'#fca5a5':'#dc2626'),border:disp?(isSel?'1px solid rgba(21,128,61,0.6)':'1px solid #bbf7d0'):(isSel?'1px solid rgba(239,68,68,0.4)':'1px solid #fecaca') }}>
                        <span style={{ width:6,height:6,borderRadius:'50%',background:disp?(isSel?'#86efac':'#22c55e'):(isSel?'#fca5a5':'#ef4444') }} />
                        {disp ? 'Disponible' : 'No disponible'}
                      </span>
                    </div>

                    {/* Estado */}
                    <div>
                      <span style={{ display:'inline-flex',alignItems:'center',gap:6,padding:'2px 8px',borderRadius:20,fontSize:11,fontWeight:600,background:activo?(isSel?'rgba(21,128,61,0.55)':'#ecfdf3'):(isSel?'rgba(156,163,175,0.22)':'#f3f4f6'),color:activo?(isSel?'#dcfce7':'#15803d'):(isSel?'rgba(255,255,255,0.6)':'#9ca3af'),border:activo?(isSel?'1px solid rgba(21,128,61,0.7)':'1px solid #bbf7d0'):(isSel?'1px solid rgba(255,255,255,0.15)':'1px solid #e5e7eb') }}>
                        <span style={{ width:6,height:6,borderRadius:'50%',background:activo?(isSel?'#4ade80':'#22c55e'):(isSel?'rgba(255,255,255,0.4)':'#9ca3af') }} />
                        {activo ? 'Activo' : 'Inactivo'}
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
        <div style={{ flexShrink:0,padding:'8px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',background:'white',margin:'0 4px 4px',borderRadius:'0 0 14px 14px',borderTop:'1px solid rgba(0,0,0,0.05)' }}>
          <span style={{ fontSize:11,color:'#9ca3af' }}>
            {meta.total != null ? `${products.length} de ${meta.total} productos` : `${products.length} productos`}
            {selected && <span style={{ color:'#8c916c',fontWeight:500 }}> · Sel: {selected.nombre}</span>}
          </span>

          {totalPages > 1 && (
            <div style={{ display:'flex',alignItems:'center',gap:8 }}>
              <span style={{ fontSize:11,color:'#9ca3af' }}>Pág. {page}/{totalPages}</span>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                style={{ width:26,height:26,borderRadius:7,border:'1px solid #e5e7eb',background:'white',cursor:page===1?'not-allowed':'pointer',color:page===1?'#d1d5db':'#374151',display:'flex',alignItems:'center',justifyContent:'center' }}>
                <ChevronLeft size={13} />
              </button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                style={{ width:26,height:26,borderRadius:7,border:'1px solid #e5e7eb',background:'white',cursor:page===totalPages?'not-allowed':'pointer',color:page===totalPages?'#d1d5db':'#374151',display:'flex',alignItems:'center',justifyContent:'center' }}>
                <ChevronRight size={13} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────── */}
      <ProductFormModal
        open={formModal.open}
        onClose={() => setFormModal({ open: false, product: null })}
        product={formModal.product}
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
