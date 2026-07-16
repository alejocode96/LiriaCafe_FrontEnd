import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ShoppingBag, Loader2, Pencil,
  Lock, Unlock, Plus, GitBranch, Package,
  AlertTriangle, TrendingUp,
} from 'lucide-react';
import {
  useProductById,
  useDeactivateProduct, useActivateProduct,
  useDeactivateVariant, useActivateVariant,
} from '../../hooks/useProducts';
import ProductFormModal from '../../components/products/ProductFormModal';
import VariantFormModal from '../../components/products/VariantFormModal';
import toast from 'react-hot-toast';

// ── Constants ────────────────────────────────────────────────────────────────

const GLASS = {
  background: 'rgba(204,204,204,0.22)',
  backdropFilter: 'blur(28px) saturate(1.8)',
  WebkitBackdropFilter: 'blur(28px) saturate(1.8)',
};

const VARIANTS_BTN = {
  neutral: { bg: 'rgba(255,255,255,0.85)', border: 'rgba(0,0,0,0.12)',     color: '#4b5563' },
  blue:    { bg: 'rgba(239,246,255,0.9)',  border: 'rgba(37,99,235,0.2)',  color: '#2563eb' },
  green:   { bg: 'rgba(240,253,244,0.9)',  border: 'rgba(22,163,74,0.2)',  color: '#16a34a' },
  red:     { bg: 'rgba(254,242,242,0.9)',  border: 'rgba(239,68,68,0.2)',  color: '#ef4444' },
};

const formatCOP = (v) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v ?? 0);

// ── ActionConfirm ─────────────────────────────────────────────────────────────

function ActionConfirm({ config, onConfirm, onCancel, busy }) {
  const { icon: Icon, iconBg, iconColor, title, description, confirmText, confirmBg } = config;
  return (
    <div style={{ position:'fixed',inset:0,zIndex:1200,display:'flex',alignItems:'center',justifyContent:'center',padding:16,background:'rgba(0,0,0,0.35)',backdropFilter:'blur(4px)' }}>
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

// ── Variant card ─────────────────────────────────────────────────────────────

function VariantCard({ variant, precioBase, productId, onEdit, onConfirmAction }) {
  const activo = variant.estado === 'ACTIVO';
  const disp   = variant.disponible;
  const dif    = variant.precioDiferencial ?? 0;
  const final  = precioBase + dif;

  const cardBg = !activo
    ? 'rgba(243,244,246,0.6)'
    : !disp
    ? 'rgba(254,252,232,0.8)'
    : 'white';

  return (
    <div style={{ background:cardBg,borderRadius:14,border:'1px solid #f3f4f6',padding:'14px 16px',opacity:activo?1:0.7,transition:'opacity 150ms' }}>
      {/* Header */}
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10 }}>
        <div style={{ display:'flex',alignItems:'center',gap:8,minWidth:0 }}>
          <div style={{ width:28,height:28,borderRadius:8,background:activo?'rgba(85,98,74,0.08)':'#e5e7eb',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
            <GitBranch size={12} style={{ color:activo?'#55624a':'#9ca3af' }} />
          </div>
          <div style={{ minWidth:0 }}>
            <p style={{ fontSize:13,fontWeight:700,color:'#111827',margin:0,fontFamily:"'Syne',sans-serif",overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
              {variant.nombre}
            </p>
            <div style={{ display:'flex',alignItems:'center',gap:6,marginTop:2,flexWrap:'wrap' }}>
              {/* Precio diferencial badge */}
              {dif === 0 ? (
                <span style={{ fontSize:10,fontWeight:600,color:'#9ca3af' }}>Precio base</span>
              ) : (
                <span style={{ fontSize:10,fontWeight:700,color:dif>0?'#16a34a':'#ef4444' }}>
                  {dif > 0 ? '+' : '−'}{formatCOP(Math.abs(dif))}
                </span>
              )}
              <span style={{ fontSize:10,color:'#d1d5db' }}>·</span>
              <span style={{ fontSize:11,fontWeight:700,color:'#374151' }}>{formatCOP(final)}</span>
            </div>
          </div>
        </div>

        {/* Badges + buttons */}
        <div style={{ display:'flex',alignItems:'center',gap:6,flexShrink:0 }}>
          {/* Disponible badge — solo si activo pero no disponible */}
          {activo && !disp && (
            <span style={{ display:'inline-flex',alignItems:'center',gap:4,padding:'2px 7px',borderRadius:999,fontSize:10,fontWeight:600,background:'#fef3c7',color:'#d97706',border:'1px solid #fde68a' }}>
              <AlertTriangle size={9} />
              Sin stock
            </span>
          )}
          {/* Estado badge */}
          <span style={{ display:'inline-flex',alignItems:'center',gap:4,padding:'2px 8px',borderRadius:999,fontSize:10,fontWeight:600,background:activo?'#ecfdf3':'#f3f4f6',color:activo?'#15803d':'#9ca3af',border:activo?'1px solid #bbf7d0':'1px solid #e5e7eb' }}>
            <span style={{ width:5,height:5,borderRadius:'50%',background:activo?'#22c55e':'#9ca3af' }} />
            {activo ? 'Activa' : 'Inactiva'}
          </span>
          {/* Editar */}
          <button onClick={() => onEdit(variant)} title="Editar variante"
            style={{ width:28,height:28,borderRadius:8,background:VARIANTS_BTN.neutral.bg,border:`1px solid ${VARIANTS_BTN.neutral.border}`,color:VARIANTS_BTN.neutral.color,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity='0.8'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity='1'; }}>
            <Pencil size={12} />
          </button>
          {/* Desactivar/Activar */}
          <button onClick={() => onConfirmAction(variant, activo ? 'deactivate' : 'activate')} title={activo?'Desactivar variante':'Activar variante'}
            style={{ width:28,height:28,borderRadius:8,background:activo?VARIANTS_BTN.red.bg:VARIANTS_BTN.green.bg,border:`1px solid ${activo?VARIANTS_BTN.red.border:VARIANTS_BTN.green.border}`,color:activo?VARIANTS_BTN.red.color:VARIANTS_BTN.green.color,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity='0.8'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity='1'; }}>
            {activo ? <Lock size={12} /> : <Unlock size={12} />}
          </button>
        </div>
      </div>

      {/* Insumos adicionales */}
      {(variant.insumosAdicionales?.length ?? 0) > 0 && (
        <div style={{ borderTop:'1px solid rgba(0,0,0,0.05)',paddingTop:10 }}>
          <p style={{ fontSize:10,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.06em',color:'#9ca3af',margin:'0 0 6px' }}>
            Insumos adicionales
          </p>
          <div style={{ display:'flex',flexDirection:'column',gap:5 }}>
            {variant.insumosAdicionales.map((inv, i) => {
              const item = inv.itemInventario;
              const noStock = (item?.stockActual ?? 0) <= 0;
              return (
                <div key={i} style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                  <div style={{ display:'flex',alignItems:'center',gap:6 }}>
                    <div style={{ width:20,height:20,borderRadius:6,background:'#f3f4f6',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                      <Package size={10} style={{ color:'#9ca3af' }} />
                    </div>
                    <span style={{ fontSize:12,color:'#374151',fontWeight:500 }}>{item?.nombre ?? '?'}</span>
                    {item?.estado === 'INACTIVO' && (
                      <span style={{ fontSize:9,fontWeight:700,padding:'1px 5px',borderRadius:999,background:'#fee2e2',color:'#ef4444',border:'1px solid #fecaca' }}>INACTIVO</span>
                    )}
                  </div>
                  <div style={{ display:'flex',alignItems:'center',gap:6 }}>
                    <span style={{ fontSize:12,color:'#6b7280' }}>
                      {inv.cantidad} {item?.unidadMedida}
                    </span>
                    <span style={{ fontSize:11,fontWeight:600,color:noStock?'#ef4444':'#16a34a' }}>
                      {noStock ? '⚠ Sin stock' : `Stock: ${item?.stockActual}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProductoDetailPage() {
  const { id }    = useParams();
  const navigate  = useNavigate();

  const { data: product, isLoading, isError } = useProductById(id);
  const deactivateProduct = useDeactivateProduct();
  const activateProduct   = useActivateProduct();
  const deactivateVariant = useDeactivateVariant();
  const activateVariant   = useActivateVariant();

  const [editModal,    setEditModal]    = useState(false);
  const [variantModal, setVariantModal] = useState({ open: false, variant: null });
  const [confirm,      setConfirm]      = useState(null); // { type, target: 'product'|'variant', payload }

  const activo     = product?.estado === 'ACTIVO';
  const confirmBusy = deactivateProduct.isPending || activateProduct.isPending || deactivateVariant.isPending || activateVariant.isPending;

  const handleProductAction = (type) => {
    setConfirm({
      type,
      target: 'product',
      config: type === 'deactivate' ? {
        icon: Lock, iconBg: '#fee2e2', iconColor: '#ef4444',
        title: 'Desactivar producto',
        description: `¿Desactivar "${product.nombre}"? No estará disponible para la venta.`,
        confirmText: 'Sí, desactivar', confirmBg: '#ef4444',
      } : {
        icon: Unlock, iconBg: '#dcfce7', iconColor: '#16a34a',
        title: 'Activar producto',
        description: `¿Activar "${product.nombre}"? Volverá a estar disponible.`,
        confirmText: 'Sí, activar', confirmBg: '#16a34a',
      },
    });
  };

  const handleVariantAction = (variant, type) => {
    setConfirm({
      type,
      target: 'variant',
      variantId: variant.id,
      config: type === 'deactivate' ? {
        icon: Lock, iconBg: '#fee2e2', iconColor: '#ef4444',
        title: 'Desactivar variante',
        description: `¿Desactivar la variante "${variant.nombre}"?`,
        confirmText: 'Sí, desactivar', confirmBg: '#ef4444',
      } : {
        icon: Unlock, iconBg: '#dcfce7', iconColor: '#16a34a',
        title: 'Activar variante',
        description: `¿Activar la variante "${variant.nombre}"?`,
        confirmText: 'Sí, activar', confirmBg: '#16a34a',
      },
    });
  };

  const handleConfirm = async () => {
    if (!confirm) return;
    try {
      if (confirm.target === 'product') {
        if (confirm.type === 'deactivate') await deactivateProduct.mutateAsync(id);
        else                               await activateProduct.mutateAsync(id);
      } else {
        if (confirm.type === 'deactivate') await deactivateVariant.mutateAsync({ productId: id, variantId: confirm.variantId });
        else                               await activateVariant.mutateAsync({ productId: id, variantId: confirm.variantId });
      }
      setConfirm(null);
    } catch (err) {
      toast.error(err?.message ?? 'No se pudo completar la operación');
      setConfirm(null);
    }
  };

  // ── Loading / Error states ────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Loader2 size={24} className="animate-spin" style={{ color:'#d1d5db' }} />
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-4">
        <ShoppingBag size={40} style={{ color:'#e5e7eb' }} />
        <p style={{ color:'#9ca3af',fontSize:14 }}>Producto no encontrado</p>
        <button onClick={() => navigate('/productos')}
          style={{ display:'flex',alignItems:'center',gap:6,height:36,padding:'0 16px',borderRadius:10,border:'1px solid #e5e7eb',background:'white',color:'#374151',fontSize:13,cursor:'pointer' }}>
          <ChevronLeft size={14} /> Volver a productos
        </button>
      </div>
    );
  }

  const variantesActivas   = (product.variantes ?? []).filter((v) => v.estado === 'ACTIVO');
  const variantesInactivas = (product.variantes ?? []).filter((v) => v.estado !== 'ACTIVO');
  const todasVariantes     = [...variantesActivas, ...variantesInactivas];

  return (
    <div className="w-full h-full overflow-hidden flex flex-col">

      {/* ── Top row ──────────────────────────────────────────────────────── */}
      <div className="flex items-end shrink-0 h-10">

        {/* Chrome tab */}
        <div className="relative flex items-center gap-2 px-4 h-10 border border-b-0 border-white/40 shrink-0"
          style={{ width: 'min(70%, 640px)', ...GLASS, borderRadius: '10px 10px 0 0' }}>

          <button onClick={() => navigate('/productos')}
            style={{ display:'flex',alignItems:'center',gap:2,background:'none',border:'none',cursor:'pointer',color:'#9ca3af',fontSize:11,padding:0,flexShrink:0 }}>
            <ChevronLeft size={13} />
            <span>Productos</span>
          </button>

          <span style={{ color:'rgba(156,163,175,0.6)',fontSize:13 }}>/</span>

          <ShoppingBag size={13} style={{ color:'#55624a',flexShrink:0 }} />
          <span style={{ fontSize:13,fontWeight:700,color:'#374151',fontFamily:"'Syne',sans-serif",overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1,minWidth:0 }}>
            {product.nombre}
          </span>

          {/* Disponible badge */}
          <span style={{ display:'inline-flex',alignItems:'center',gap:4,padding:'2px 8px',borderRadius:999,fontSize:10,fontWeight:600,background:product.disponible?'#dcfce7':'#fee2e2',color:product.disponible?'#15803d':'#dc2626',border:product.disponible?'1px solid #bbf7d0':'1px solid #fecaca',flexShrink:0 }}>
            <span style={{ width:5,height:5,borderRadius:'50%',background:product.disponible?'#22c55e':'#ef4444' }} />
            {product.disponible ? 'Disponible' : 'No disponible'}
          </span>

          {/* Chrome ear */}
          <span style={{ position:'absolute',bottom:0,right:-28,width:28,height:48,overflow:'hidden',pointerEvents:'none' }}>
            <span style={{ position:'absolute',left:0,bottom:0,width:56,height:56,borderRadius:'50%',boxShadow:'-28px 28px 0 0 rgba(204,204,204,0.22)' }} />
          </span>
        </div>

        {/* Action buttons */}
        <div style={{ display:'flex',alignItems:'center',gap:6,paddingLeft:32,paddingBottom:6 }}>
          <button onClick={() => setEditModal(true)}
            style={{ display:'flex',alignItems:'center',gap:6,height:28,padding:'0 12px',borderRadius:8,border:'none',background:'#55624a',color:'white',fontSize:12,fontWeight:700,cursor:'pointer',boxShadow:'0 2px 8px rgba(85,98,74,0.30)',fontFamily:"'Syne',sans-serif" }}>
            <Pencil size={12} /> Editar
          </button>
          <button onClick={() => handleProductAction(activo ? 'deactivate' : 'activate')}
            style={{ display:'flex',alignItems:'center',gap:6,height:28,padding:'0 12px',borderRadius:8,border:`1px solid ${activo?'rgba(239,68,68,0.3)':'rgba(22,163,74,0.3)'}`,background:activo?'rgba(254,242,242,0.9)':'rgba(240,253,244,0.9)',color:activo?'#ef4444':'#16a34a',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit' }}>
            {activo ? <><Lock size={12} /> Desactivar</> : <><Unlock size={12} /> Activar</>}
          </button>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden rounded-b-2xl rounded-tr-2xl" style={{ ...GLASS }}>
        <div style={{ display:'flex',gap:16,padding:16,height:'100%',boxSizing:'border-box',overflow:'hidden' }}>

          {/* ── Left panel ─────────────────────────────────────────────── */}
          <div style={{ width:product.tieneVariantes?'360px':'480px',flexShrink:0,overflowY:'auto',display:'flex',flexDirection:'column',gap:12 }}>

            {/* Product info card */}
            <div style={{ background:'white',borderRadius:16,padding:'18px 20px',border:'1px solid #f3f4f6' }}>
              {/* Avatar + name */}
              <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:14 }}>
                <div style={{ width:44,height:44,borderRadius:12,background:'rgba(85,98,74,0.10)',overflow:'hidden',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center' }}>
                  {product.imagenUrl
                    ? <img src={product.imagenUrl} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }} onError={(e) => { e.currentTarget.style.display='none'; }} />
                    : <ShoppingBag size={20} style={{ color:'#55624a' }} />
                  }
                </div>
                <div style={{ flex:1,minWidth:0 }}>
                  <h2 style={{ color:'#111827',fontSize:16,fontWeight:700,margin:'0 0 4px',fontFamily:"'Syne',sans-serif",overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
                    {product.nombre}
                  </h2>
                  <div style={{ display:'flex',alignItems:'center',gap:6,flexWrap:'wrap' }}>
                    {product.categoria && (
                      <span style={{ fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:999,background:'rgba(85,98,74,0.08)',color:'#55624a',border:'1px solid rgba(85,98,74,0.18)' }}>
                        {product.categoria.nombre}
                      </span>
                    )}
                    <span style={{ display:'inline-flex',alignItems:'center',gap:4,padding:'2px 8px',borderRadius:999,fontSize:11,fontWeight:600,background:activo?'#ecfdf3':'#f3f4f6',color:activo?'#15803d':'#9ca3af',border:activo?'1px solid #bbf7d0':'1px solid #e5e7eb' }}>
                      <span style={{ width:5,height:5,borderRadius:'50%',background:activo?'#22c55e':'#9ca3af' }} />
                      {activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
              </div>

              {product.descripcion && (
                <p style={{ color:'#6b7280',fontSize:12,lineHeight:1.5,margin:'0 0 14px',padding:'10px 12px',background:'#f9fafb',borderRadius:10 }}>
                  {product.descripcion}
                </p>
              )}

              {/* Info cards grid */}
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8 }}>
                {[
                  { label: 'Precio base',       value: formatCOP(product.precioBase),           color: '#111827' },
                  { label: 'Costo producción',   value: product.costoProduccion != null ? formatCOP(product.costoProduccion) : '—', color: '#374151' },
                  { label: 'Margen bruto',       value: product.margenBruto != null ? formatCOP(product.margenBruto) : '—', color: '#15803d' },
                  { label: 'Margen %',           value: product.margenPorcentaje != null ? `${product.margenPorcentaje.toFixed(1)}%` : '—', color: product.margenPorcentaje > 0 ? '#15803d' : '#6b7280' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ background:'#f9fafb',borderRadius:10,padding:'10px 12px',border:'1px solid #f3f4f6' }}>
                    <p style={{ color:'#9ca3af',fontSize:10,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.06em',margin:'0 0 3px' }}>{label}</p>
                    <p style={{ color,fontSize:13,fontWeight:700,margin:0,fontFamily:"'Syne',sans-serif" }}>{value}</p>
                  </div>
                ))}
              </div>

              {product.tieneVariantes && (
                <div style={{ marginTop:10,padding:'8px 12px',borderRadius:10,background:'rgba(85,98,74,0.05)',border:'1px solid rgba(85,98,74,0.14)' }}>
                  <p style={{ color:'#55624a',fontSize:12,margin:0 }}>
                    <strong>Producto con variantes</strong> — el precio final depende de la variante seleccionada
                  </p>
                </div>
              )}
            </div>

            {/* Insumos base */}
            <div style={{ background:'white',borderRadius:16,padding:'16px 20px',border:'1px solid #f3f4f6' }}>
              <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:12 }}>
                <div style={{ width:28,height:28,borderRadius:8,background:'rgba(85,98,74,0.08)',display:'flex',alignItems:'center',justifyContent:'center' }}>
                  <Package size={13} style={{ color:'#55624a' }} />
                </div>
                <h3 style={{ color:'#374151',fontSize:13,fontWeight:700,margin:0,fontFamily:"'Syne',sans-serif" }}>
                  Fórmula base
                </h3>
                <span style={{ fontSize:11,color:'#9ca3af' }}>
                  {(product.insumosBase ?? []).length} insumo{(product.insumosBase ?? []).length !== 1 ? 's' : ''}
                </span>
              </div>

              {(product.insumosBase ?? []).length === 0 ? (
                <p style={{ color:'#9ca3af',fontSize:12,margin:0,textAlign:'center',padding:'12px 0' }}>
                  Sin fórmula de insumos definida
                </p>
              ) : (
                <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
                  {product.insumosBase.map((inv, i) => {
                    const item    = inv.itemInventario;
                    const noStock = (item?.stockActual ?? 0) <= 0;
                    const inactivo = item?.estado === 'INACTIVO';
                    return (
                      <div key={inv.id ?? i} style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 12px',borderRadius:10,background:'#f9fafb',border:'1px solid #f3f4f6' }}>
                        <div style={{ display:'flex',alignItems:'center',gap:8,minWidth:0 }}>
                          <Package size={11} style={{ color:'#9ca3af',flexShrink:0 }} />
                          <span style={{ fontSize:12,fontWeight:600,color:'#374151',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
                            {item?.nombre ?? '?'}
                          </span>
                          {inactivo && (
                            <span style={{ fontSize:9,fontWeight:700,padding:'1px 5px',borderRadius:999,background:'#fee2e2',color:'#ef4444',flexShrink:0 }}>INACTIVO</span>
                          )}
                        </div>
                        <div style={{ display:'flex',alignItems:'center',gap:10,flexShrink:0 }}>
                          <span style={{ fontSize:12,color:'#6b7280' }}>
                            {inv.cantidad} {item?.unidadMedida}
                          </span>
                          <div style={{ display:'flex',alignItems:'center',gap:4 }}>
                            {noStock ? (
                              <AlertTriangle size={11} style={{ color:'#ef4444' }} />
                            ) : (
                              <TrendingUp size={11} style={{ color:'#16a34a' }} />
                            )}
                            <span style={{ fontSize:11,fontWeight:600,color:noStock?'#ef4444':'#16a34a' }}>
                              {noStock ? 'Sin stock' : `${item?.stockActual} ${item?.unidadMedida}`}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Right panel — Variantes ────────────────────────────────── */}
          {product.tieneVariantes && (
            <div style={{ flex:1,overflow:'hidden',display:'flex',flexDirection:'column',gap:12 }}>
              {/* Header */}
              <div style={{ background:'white',borderRadius:16,padding:'14px 20px',border:'1px solid #f3f4f6',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0 }}>
                <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                  <div style={{ width:28,height:28,borderRadius:8,background:'rgba(85,98,74,0.08)',display:'flex',alignItems:'center',justifyContent:'center' }}>
                    <GitBranch size={13} style={{ color:'#55624a' }} />
                  </div>
                  <h3 style={{ color:'#374151',fontSize:13,fontWeight:700,margin:0,fontFamily:"'Syne',sans-serif" }}>
                    Variantes
                  </h3>
                  <span style={{ display:'inline-flex',alignItems:'center',justifyContent:'center',minWidth:20,height:20,padding:'0 6px',borderRadius:999,fontSize:11,fontWeight:700,background:'#f3f4f6',color:'#374151' }}>
                    {todasVariantes.length}
                  </span>
                </div>
                {activo && (
                  <button onClick={() => setVariantModal({ open: true, variant: null })}
                    style={{ display:'flex',alignItems:'center',gap:6,height:30,padding:'0 12px',borderRadius:8,border:'none',background:'#55624a',color:'white',fontSize:12,fontWeight:700,cursor:'pointer',boxShadow:'0 2px 6px rgba(85,98,74,0.25)',fontFamily:"'Syne',sans-serif" }}>
                    <Plus size={12} /> Agregar variante
                  </button>
                )}
              </div>

              {/* Variant list */}
              <div style={{ flex:1,minHeight:0,overflowY:'auto',display:'flex',flexDirection:'column',gap:8 }}>
                {todasVariantes.length === 0 ? (
                  <div style={{ background:'white',borderRadius:16,border:'1px solid #f3f4f6',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:8,padding:'40px 20px' }}>
                    <GitBranch size={28} style={{ color:'#e5e7eb' }} />
                    <p style={{ color:'#9ca3af',fontSize:13,margin:0 }}>Sin variantes — agrega la primera</p>
                  </div>
                ) : (
                  todasVariantes.map((variant) => (
                    <VariantCard
                      key={variant.id}
                      variant={variant}
                      precioBase={product.precioBase}
                      productId={id}
                      onEdit={(v) => setVariantModal({ open: true, variant: v })}
                      onConfirmAction={handleVariantAction}
                    />
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────── */}
      <ProductFormModal
        open={editModal}
        onClose={() => setEditModal(false)}
        product={product}
      />

      <VariantFormModal
        open={variantModal.open}
        onClose={() => setVariantModal({ open: false, variant: null })}
        productId={id}
        precioBase={product.precioBase}
        variant={variantModal.variant}
      />

      {confirm && (
        <ActionConfirm
          config={confirm.config}
          onConfirm={handleConfirm}
          onCancel={() => setConfirm(null)}
          busy={confirmBusy}
        />
      )}
    </div>
  );
}
