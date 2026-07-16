import { useState, useEffect } from 'react';
import { History, X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useKardex } from '../../hooks/useInventory';

const formatCOP = (v) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v || 0);

const formatDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const TIPO_CFG = {
  ENTRADA:          { label: 'Entrada',        bg: '#dcfce7', color: '#16a34a', dot: '#22c55e' },
  CONSUMO:          { label: 'Consumo',         bg: '#fff7ed', color: '#ea580c', dot: '#f97316' },
  DEVOLUCION:       { label: 'Devolución',      bg: '#eff6ff', color: '#2563eb', dot: '#3b82f6' },
  AJUSTE_POSITIVO:  { label: 'Ajuste +',        bg: '#ecfdf5', color: '#0d9488', dot: '#14b8a6' },
  AJUSTE_NEGATIVO:  { label: 'Ajuste −',        bg: '#fef2f2', color: '#dc2626', dot: '#ef4444' },
};

const LIMIT = 15;

export default function KardexModal({ open, onClose, item }) {
  const [mounted, setMounted] = useState(false);
  const [page,    setPage]    = useState(1);

  useEffect(() => {
    if (open) { setMounted(true); setPage(1); }
    else { const t = setTimeout(() => setMounted(false), 300); return () => clearTimeout(t); }
  }, [open]);

  const { data: rawData, isLoading } = useKardex(open ? item?.id : null, { page, limit: LIMIT });
  const movimientos = rawData?.data ?? [];
  const meta = rawData?.meta ?? {};
  const totalPages = meta.totalPages ?? 1;

  if (!mounted) return null;

  const unidad = item?.unidadMedida ?? '';

  return (
    <>
      <style>{`
        @keyframes kxSlideIn  { from{transform:translateX(100%)} to{transform:translateX(0)} }
        @keyframes kxSlideOut { from{transform:translateX(0)}   to{transform:translateX(100%)} }
        @keyframes kxFadeIn   { from{opacity:0} to{opacity:1} }
        @keyframes kxFadeOut  { from{opacity:1} to{opacity:0} }
        .kx-ov-in  { animation: kxFadeIn  280ms ease forwards; }
        .kx-ov-out { animation: kxFadeOut 280ms ease forwards; }
        .kx-pan-in { animation: kxSlideIn  300ms cubic-bezier(0.32,0.72,0,1) forwards; }
        .kx-pan-out{ animation: kxSlideOut 280ms cubic-bezier(0.32,0.72,0,1) forwards; }
      `}</style>

      <div className={open ? 'kx-ov-in' : 'kx-ov-out'} onClick={onClose}
        style={{ position:'fixed',inset:0,zIndex:1000,background:'rgba(0,0,0,0.18)',backdropFilter:'blur(2px)' }} />

      <div className={open ? 'kx-pan-in' : 'kx-pan-out'}
        style={{ position:'fixed',top:0,right:0,bottom:0,zIndex:1001,width:640,background:'#ffffff',borderLeft:'1px solid #e5e7eb',boxShadow:'-12px 0 40px rgba(0,0,0,0.08)',display:'flex',flexDirection:'column',overflow:'hidden' }}>

        {/* Header */}
        <div style={{ display:'flex',alignItems:'center',gap:10,padding:'20px 20px 18px',borderBottom:'1px solid #f3f4f6',flexShrink:0 }}>
          <div style={{ width:34,height:34,borderRadius:10,background:'rgba(85,98,74,0.10)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
            <History size={16} color="#55624a" />
          </div>
          <div style={{ flex:1,minWidth:0 }}>
            <h3 style={{ color:'#111827',fontSize:15,fontWeight:700,margin:0,fontFamily:"'Syne',sans-serif" }}>
              Kardex
            </h3>
            <p style={{ color:'#9ca3af',fontSize:12,margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
              {item?.nombre ?? ''}
            </p>
          </div>
          <button onClick={onClose}
            style={{ width:30,height:30,borderRadius:8,background:'transparent',border:'1px solid #e5e7eb',cursor:'pointer',color:'#9ca3af',display:'flex',alignItems:'center',justifyContent:'center' }}>
            <X size={15} />
          </button>
        </div>

        {/* Info summary */}
        {item && (
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,padding:'14px 20px',borderBottom:'1px solid #f3f4f6',flexShrink:0,background:'#fafafa' }}>
            {[
              { label: 'Stock actual', value: `${item.stockActual ?? 0} ${unidad}`, highlight: (item.stockActual ?? 0) > (item.stockMinimo ?? 0) ? '#15803d' : '#ef4444' },
              { label: 'Costo promedio', value: formatCOP(item.costoPromedio) },
              { label: 'Valor inventario', value: formatCOP((item.stockActual ?? 0) * (item.costoPromedio ?? 0)) },
            ].map(({ label, value, highlight }) => (
              <div key={label} style={{ background:'white',borderRadius:10,padding:'10px 12px',border:'1px solid #f3f4f6' }}>
                <p style={{ color:'#9ca3af',fontSize:10,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.06em',margin:'0 0 4px' }}>{label}</p>
                <p style={{ color: highlight ?? '#374151',fontSize:13,fontWeight:700,margin:0 }}>{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Leyenda tipos */}
        <div style={{ display:'flex',gap:8,padding:'10px 20px 8px',borderBottom:'1px solid #f3f4f6',flexShrink:0,flexWrap:'wrap' }}>
          {Object.entries(TIPO_CFG).map(([tipo, cfg]) => (
            <span key={tipo} style={{ display:'inline-flex',alignItems:'center',gap:4,padding:'2px 8px',borderRadius:999,fontSize:10,fontWeight:600,background:cfg.bg,color:cfg.color }}>
              <span style={{ width:5,height:5,borderRadius:'50%',background:cfg.dot }} />
              {cfg.label}
            </span>
          ))}
        </div>

        {/* Tabla kardex */}
        <div style={{ flex:1,minHeight:0,overflowY:'auto' }}>
          {/* Header */}
          <div style={{ display:'grid',gridTemplateColumns:'1.4fr 0.7fr 0.8fr 0.8fr 2fr 0.9fr',padding:'10px 20px',borderBottom:'1px solid rgba(0,0,0,0.05)',background:'#f9fafb',flexShrink:0,position:'sticky',top:0,zIndex:2 }}>
            {['Tipo','Cantidad','Antes','Después','Motivo','Fecha'].map((h) => (
              <span key={h} style={{ fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',color:'#9ca3af' }}>{h}</span>
            ))}
          </div>

          {isLoading ? (
            <div style={{ height:200,display:'flex',alignItems:'center',justifyContent:'center' }}>
              <Loader2 size={20} className="animate-spin" style={{ color:'#d1d5db' }} />
            </div>
          ) : movimientos.length === 0 ? (
            <div style={{ height:200,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:8 }}>
              <History size={24} style={{ color:'#e5e7eb' }} />
              <p style={{ color:'#9ca3af',fontSize:13,margin:0 }}>Sin movimientos registrados</p>
            </div>
          ) : (
            movimientos.map((mov, idx) => {
              const cfg = TIPO_CFG[mov.tipo] ?? { label: mov.tipo, bg: '#f3f4f6', color: '#6b7280', dot: '#9ca3af' };
              return (
                <div key={mov.id ?? idx}
                  style={{ display:'grid',gridTemplateColumns:'1.4fr 0.7fr 0.8fr 0.8fr 2fr 0.9fr',padding:'11px 20px',alignItems:'center',borderBottom:'1px solid rgba(0,0,0,0.04)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#fafafa'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  {/* Tipo */}
                  <span style={{ display:'inline-flex',alignItems:'center',gap:5,padding:'2px 8px',borderRadius:999,fontSize:10,fontWeight:700,background:cfg.bg,color:cfg.color,whiteSpace:'nowrap',width:'fit-content' }}>
                    <span style={{ width:5,height:5,borderRadius:'50%',background:cfg.dot,flexShrink:0 }} />
                    {cfg.label}
                  </span>
                  {/* Cantidad */}
                  <span style={{ fontSize:12,fontWeight:600,color: mov.tipo === 'CONSUMO' || mov.tipo === 'AJUSTE_NEGATIVO' ? '#ef4444' : '#16a34a' }}>
                    {mov.tipo === 'CONSUMO' || mov.tipo === 'AJUSTE_NEGATIVO' ? '−' : '+'}{mov.cantidad}
                  </span>
                  {/* Stock antes */}
                  <span style={{ fontSize:12,color:'#9ca3af' }}>{mov.stockAntes ?? '—'}</span>
                  {/* Stock después */}
                  <span style={{ fontSize:12,color:'#374151',fontWeight:500 }}>{mov.stockDespues ?? '—'}</span>
                  {/* Motivo */}
                  <span style={{ fontSize:11,color:'#6b7280',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',paddingRight:8 }}
                    title={mov.motivo ?? ''}>
                    {mov.motivo ?? '—'}
                  </span>
                  {/* Fecha */}
                  <span style={{ fontSize:10,color:'#9ca3af',whiteSpace:'nowrap' }}>
                    {formatDate(mov.createdAt)}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div style={{ flexShrink:0,padding:'10px 20px',borderTop:'1px solid #f3f4f6',display:'flex',alignItems:'center',justifyContent:'space-between',background:'white' }}>
            <span style={{ fontSize:11,color:'#9ca3af' }}>
              Página {page} de {totalPages} · {meta.total ?? 0} movimientos
            </span>
            <div style={{ display:'flex',gap:6 }}>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                style={{ width:30,height:30,borderRadius:8,border:'1px solid #e5e7eb',background:'white',cursor:page===1?'not-allowed':'pointer',color:page===1?'#d1d5db':'#374151',display:'flex',alignItems:'center',justifyContent:'center' }}>
                <ChevronLeft size={14} />
              </button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                style={{ width:30,height:30,borderRadius:8,border:'1px solid #e5e7eb',background:'white',cursor:page===totalPages?'not-allowed':'pointer',color:page===totalPages?'#d1d5db':'#374151',display:'flex',alignItems:'center',justifyContent:'center' }}>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
