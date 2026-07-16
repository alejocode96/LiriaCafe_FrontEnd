import { useState, useEffect } from 'react';
import { ArrowDownToLine, Loader2, X, CheckCircle } from 'lucide-react';
import { useRegisterEntry } from '../../hooks/useInventory';

const formatCOP = (v) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v || 0);

const EMPTY = { cantidad: '', precioUnitario: '', proveedor: '', facturaRef: '', notas: '' };

export default function EntryModal({ open, onClose, item }) {
  const register = useRegisterEntry();

  const [form,    setForm]    = useState(EMPTY);
  const [errors,  setErrors]  = useState({});
  const [mounted, setMounted] = useState(false);
  const [result,  setResult]  = useState(null);

  useEffect(() => {
    if (open) { setMounted(true); setResult(null); }
    else { const t = setTimeout(() => setMounted(false), 300); return () => clearTimeout(t); }
  }, [open]);

  useEffect(() => {
    if (open) { setForm(EMPTY); setErrors({}); setResult(null); }
  }, [open]);

  const setField = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: '' }));
  };

  const totalCompra = (() => {
    const c = parseFloat(form.cantidad);
    const p = parseFloat(form.precioUnitario);
    return !isNaN(c) && !isNaN(p) && c > 0 && p > 0 ? c * p : null;
  })();

  const validate = () => {
    const e = {};
    if (!form.cantidad || isNaN(parseFloat(form.cantidad)) || parseFloat(form.cantidad) <= 0)
      e.cantidad = 'La cantidad debe ser mayor a cero';
    if (!form.precioUnitario || isNaN(parseFloat(form.precioUnitario)) || parseFloat(form.precioUnitario) <= 0)
      e.precioUnitario = 'El precio unitario debe ser mayor a cero';
    return e;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const payload = {
      id:             item.id,
      cantidad:       parseFloat(form.cantidad),
      precioUnitario: parseFloat(form.precioUnitario),
    };
    if (form.proveedor.trim())  payload.proveedor  = form.proveedor.trim();
    if (form.facturaRef.trim()) payload.facturaRef  = form.facturaRef.trim();
    if (form.notas.trim())      payload.notas       = form.notas.trim();

    try {
      const res = await register.mutateAsync(payload);
      setResult(res.data?.data ?? res.data);
    } catch (err) {
      const code = err?.code;
      const responseData = err?.original?.response?.data;
      if (code === 'VALIDATION_ERROR' && Array.isArray(responseData?.errors)) {
        const mapped = {};
        responseData.errors.forEach(({ campo, mensaje }) => { mapped[campo] = mensaje; });
        setErrors((p) => ({ ...p, ...mapped }));
      } else {
        setErrors((p) => ({ ...p, cantidad: err.message ?? 'Error al registrar la entrada' }));
      }
    }
  };

  const handleClose = () => { setResult(null); onClose(); };

  if (!mounted) return null;
  const busy = register.isPending;
  const nombre = item?.nombre ?? '';
  const unidad = item?.unidadMedida ?? '';

  return (
    <>
      <style>{`
        @keyframes emIn  { from{opacity:0;transform:scale(0.96) translateY(8px)} to{opacity:1;transform:none} }
        .em-input {
          width:100%; height:40px; border-radius:10px;
          background:#f9fafb; border:1px solid #e5e7eb;
          color:#1f2937; font-size:13px; padding:0 12px;
          outline:none; box-sizing:border-box; font-family:inherit;
          transition:border-color 150ms,box-shadow 150ms;
        }
        .em-input:focus{border-color:#8c916c;box-shadow:0 0 0 3px rgba(140,145,108,0.12);background:#fff;}
        .em-input.err{border-color:rgba(239,68,68,0.5);}
        .em-input.err:focus{box-shadow:0 0 0 3px rgba(239,68,68,0.10);}
        .em-label{color:#6b7280;font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;}
        .em-opt{color:#b0b5b0;font-size:11px;}
      `}</style>

      {/* Overlay */}
      <div onClick={handleClose}
        style={{ position:'fixed',inset:0,zIndex:1000,background:'rgba(0,0,0,0.28)',backdropFilter:'blur(3px)' }} />

      {/* Modal centrado */}
      <div style={{
        position:'fixed',inset:0,zIndex:1001,display:'flex',alignItems:'center',justifyContent:'center',padding:20,pointerEvents:'none'
      }}>
        <div style={{
          width:'100%',maxWidth:480,background:'#ffffff',borderRadius:20,
          boxShadow:'0 24px 60px rgba(0,0,0,0.18)',overflow:'hidden',pointerEvents:'auto',
          animation:'emIn 280ms cubic-bezier(0.34,1.1,0.64,1)',
        }}>
          {/* Header */}
          <div style={{ display:'flex',alignItems:'center',gap:10,padding:'18px 20px 16px',borderBottom:'1px solid #f3f4f6' }}>
            <div style={{ width:34,height:34,borderRadius:10,background:'rgba(22,163,74,0.10)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
              <ArrowDownToLine size={16} color="#16a34a" />
            </div>
            <div style={{ flex:1,minWidth:0 }}>
              <h3 style={{ color:'#111827',fontSize:14,fontWeight:700,margin:0,fontFamily:"'Syne',sans-serif" }}>
                Registrar entrada
              </h3>
              <p style={{ color:'#9ca3af',fontSize:12,margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
                {nombre}
              </p>
            </div>
            <button onClick={handleClose}
              style={{ width:28,height:28,borderRadius:8,background:'transparent',border:'1px solid #e5e7eb',cursor:'pointer',color:'#9ca3af',display:'flex',alignItems:'center',justifyContent:'center' }}>
              <X size={14} />
            </button>
          </div>

          {result ? (
            /* ── Success panel ── */
            <div style={{ padding:'24px 20px 20px' }}>
              <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:14,marginBottom:20 }}>
                <div style={{ width:48,height:48,borderRadius:'50%',background:'rgba(22,163,74,0.10)',display:'flex',alignItems:'center',justifyContent:'center' }}>
                  <CheckCircle size={24} color="#16a34a" />
                </div>
                <div style={{ textAlign:'center' }}>
                  <p style={{ color:'#111827',fontWeight:700,fontSize:14,margin:'0 0 2px',fontFamily:"'Syne',sans-serif" }}>
                    Entrada registrada exitosamente
                  </p>
                  <p style={{ color:'#9ca3af',fontSize:12,margin:0 }}>{nombre}</p>
                </div>
              </div>

              <div style={{ background:'#f9fafb',borderRadius:12,padding:'14px 16px',display:'flex',flexDirection:'column',gap:10,marginBottom:20 }}>
                {/* Stock */}
                <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                  <span style={{ fontSize:12,color:'#6b7280',fontWeight:500 }}>Stock</span>
                  <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                    <span style={{ fontSize:13,color:'#9ca3af' }}>
                      {result.item?.stockAnterior ?? '?'} {unidad}
                    </span>
                    <span style={{ fontSize:11,color:'#d1d5db' }}>→</span>
                    <span style={{ fontSize:13,fontWeight:700,color:'#16a34a' }}>
                      {result.item?.stockActual ?? '?'} {unidad}
                    </span>
                  </div>
                </div>
                {/* Costo promedio */}
                <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                  <span style={{ fontSize:12,color:'#6b7280',fontWeight:500 }}>Costo promedio</span>
                  <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                    <span style={{ fontSize:13,color:'#9ca3af' }}>
                      {formatCOP(result.item?.costoPromedioAnterior)}
                    </span>
                    <span style={{ fontSize:11,color:'#d1d5db' }}>→</span>
                    <span style={{ fontSize:13,fontWeight:700,color:'#374151' }}>
                      {formatCOP(result.item?.costoPromedioActual)}
                    </span>
                  </div>
                </div>
                {/* Total compra */}
                <div style={{ paddingTop:8,borderTop:'1px solid #e5e7eb',display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                  <span style={{ fontSize:12,color:'#6b7280',fontWeight:500 }}>Total compra</span>
                  <span style={{ fontSize:14,fontWeight:700,color:'#111827' }}>
                    {formatCOP(result.entrada?.precioTotal)}
                  </span>
                </div>
              </div>

              <button onClick={handleClose}
                style={{ width:'100%',height:40,borderRadius:10,border:'none',background:'#55624a',color:'white',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:"'Syne',sans-serif" }}>
                Cerrar
              </button>
            </div>
          ) : (
            /* ── Form ── */
            <div style={{ padding:'18px 20px 20px',display:'flex',flexDirection:'column',gap:14 }}>
              {/* Cantidad + Precio — 2 col */}
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
                <div style={{ display:'flex',flexDirection:'column',gap:5 }}>
                  <label className="em-label">Cantidad <span style={{ color:'#ef4444' }}>*</span></label>
                  <input type="number" min="0.01" step="0.01" className={`em-input${errors.cantidad ? ' err' : ''}`}
                    value={form.cantidad} onChange={(e) => setField('cantidad', e.target.value)}
                    placeholder={`0 ${unidad}`} />
                  {errors.cantidad && <span style={{ color:'#ef4444',fontSize:12 }}>{errors.cantidad}</span>}
                </div>
                <div style={{ display:'flex',flexDirection:'column',gap:5 }}>
                  <label className="em-label">Precio unitario <span style={{ color:'#ef4444' }}>*</span></label>
                  <input type="number" min="0.01" step="0.01" className={`em-input${errors.precioUnitario ? ' err' : ''}`}
                    value={form.precioUnitario} onChange={(e) => setField('precioUnitario', e.target.value)}
                    placeholder="$ 0" />
                  {errors.precioUnitario && <span style={{ color:'#ef4444',fontSize:12 }}>{errors.precioUnitario}</span>}
                </div>
              </div>

              {/* Total preview */}
              <div style={{
                display:'flex',justifyContent:'space-between',alignItems:'center',
                padding:'10px 14px',borderRadius:10,
                background: totalCompra ? 'rgba(22,163,74,0.06)' : 'rgba(0,0,0,0.03)',
                border: `1px solid ${totalCompra ? 'rgba(22,163,74,0.18)' : 'rgba(0,0,0,0.07)'}`,
              }}>
                <span style={{ fontSize:12,color:'#6b7280',fontWeight:500 }}>Total compra</span>
                <span style={{ fontSize:15,fontWeight:700,color: totalCompra ? '#15803d' : '#d1d5db' }}>
                  {totalCompra ? formatCOP(totalCompra) : '—'}
                </span>
              </div>

              {/* Proveedor */}
              <div style={{ display:'flex',flexDirection:'column',gap:5 }}>
                <div style={{ display:'flex',gap:6,alignItems:'baseline' }}>
                  <label className="em-label">Proveedor</label>
                  <span className="em-opt">opcional</span>
                </div>
                <input className="em-input" value={form.proveedor}
                  onChange={(e) => setField('proveedor', e.target.value)}
                  placeholder={item?.proveedorHabitual ?? 'Nombre del proveedor'} />
              </div>

              {/* Ref factura + Notas — 2 col */}
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
                <div style={{ display:'flex',flexDirection:'column',gap:5 }}>
                  <div style={{ display:'flex',gap:6,alignItems:'baseline' }}>
                    <label className="em-label">Ref. factura</label>
                    <span className="em-opt">opcional</span>
                  </div>
                  <input className="em-input" value={form.facturaRef}
                    onChange={(e) => setField('facturaRef', e.target.value)} placeholder="FAC-001" />
                </div>
                <div style={{ display:'flex',flexDirection:'column',gap:5 }}>
                  <div style={{ display:'flex',gap:6,alignItems:'baseline' }}>
                    <label className="em-label">Notas</label>
                    <span className="em-opt">opcional</span>
                  </div>
                  <input className="em-input" value={form.notas}
                    onChange={(e) => setField('notas', e.target.value)} placeholder="Compra semanal…" />
                </div>
              </div>

              {/* Buttons */}
              <div style={{ display:'flex',gap:10,marginTop:2 }}>
                <button onClick={handleClose}
                  style={{ flex:1,height:40,borderRadius:10,border:'1px solid #e5e7eb',background:'white',color:'#6b7280',fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:'inherit' }}>
                  Cancelar
                </button>
                <button onClick={handleSubmit} disabled={busy}
                  style={{ flex:2,height:40,borderRadius:10,border:'none',background:busy?'#e5e7eb':'#16a34a',color:busy?'#9ca3af':'white',fontSize:13,fontWeight:700,cursor:busy?'not-allowed':'pointer',fontFamily:"'Syne',sans-serif",display:'flex',alignItems:'center',justifyContent:'center',gap:6 }}>
                  {busy && <Loader2 size={13} className="animate-spin" />}
                  {busy ? 'Registrando…' : 'Registrar entrada'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
