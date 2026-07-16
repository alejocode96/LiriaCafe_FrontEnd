import { useState, useEffect } from 'react';
import { ShoppingBag, Loader2, X, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { useCreateProduct, useUpdateProduct, useProductById } from '../../hooks/useProducts';
import { useCategories } from '../../hooks/useCategories';
import { useInventoryItems } from '../../hooks/useInventory';
import toast from 'react-hot-toast';

const CAT_PARAMS = { estado: 'ACTIVO', limit: 100 };
const INV_PARAMS = { estado: 'ACTIVO', limit: 100 };

let _uid = 0;
const mkRow = (itemInventarioId = '', cantidad = '') => ({ _id: `pr${++_uid}`, itemInventarioId, cantidad });

const EMPTY_FORM = {
  nombre: '', descripcion: '', categoriaId: '',
  precioBase: '', imagenUrl: '', tieneVariantes: false,
};

// ── FormulaBuilder ────────────────────────────────────────────────────────────

function FormulaBuilder({ rows, onChange, inventoryItems }) {
  const usedIds = rows.map((r) => r.itemInventarioId).filter(Boolean);
  const dupSet  = new Set(usedIds.filter((id, i) => usedIds.indexOf(id) !== i));

  const add    = () => onChange([...rows, mkRow()]);
  const remove = (_id) => onChange(rows.filter((r) => r._id !== _id));
  const upd    = (_id, field, val) => onChange(rows.map((r) => (r._id === _id ? { ...r, [field]: val } : r)));

  return (
    <div>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8 }}>
        <div style={{ display:'flex',gap:6,alignItems:'baseline' }}>
          <span className="pf-label">Fórmula de insumos base</span>
          <span className="pf-opt">opcional</span>
        </div>
        <button type="button" onClick={add}
          style={{ display:'flex',alignItems:'center',gap:4,height:26,padding:'0 10px',borderRadius:8,border:'1px solid rgba(85,98,74,0.3)',background:'rgba(85,98,74,0.06)',color:'#55624a',fontSize:11,fontWeight:600,cursor:'pointer' }}>
          <Plus size={11} /> Agregar insumo
        </button>
      </div>

      {rows.length === 0 ? (
        <div style={{ textAlign:'center',padding:'16px 0',color:'#9ca3af',fontSize:12,background:'rgba(0,0,0,0.02)',borderRadius:10,border:'1px dashed #e5e7eb' }}>
          Sin insumos — el producto se creará sin fórmula de descuento de inventario
        </div>
      ) : (
        <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
          {rows.map((row) => {
            const invItem = inventoryItems?.find((i) => i.id === row.itemInventarioId);
            const isDup   = dupSet.has(row.itemInventarioId) && !!row.itemInventarioId;
            return (
              <div key={row._id}>
                <div style={{ display:'grid',gridTemplateColumns:'1fr 0.42fr auto',gap:6,alignItems:'center' }}>
                  <div style={{ position:'relative' }}>
                    <select className={`pf-select${isDup ? ' err' : ''}`}
                      value={row.itemInventarioId}
                      onChange={(e) => upd(row._id, 'itemInventarioId', e.target.value)}
                      style={{ paddingRight:24 }}>
                      <option value="">Seleccionar insumo…</option>
                      {(inventoryItems ?? []).map((i) => (
                        <option key={i.id} value={i.id}>{i.nombre} ({i.unidadMedida})</option>
                      ))}
                    </select>
                    <span style={{ position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',pointerEvents:'none',color:'#9ca3af',fontSize:9 }}>▼</span>
                  </div>
                  <input type="number" min="0.001" step="0.001" className="pf-input"
                    value={row.cantidad}
                    onChange={(e) => upd(row._id, 'cantidad', e.target.value)}
                    placeholder={invItem ? `0 ${invItem.unidadMedida}` : '0'} />
                  <button type="button" onClick={() => remove(row._id)}
                    style={{ width:36,height:40,borderRadius:8,border:'1px solid #fecaca',background:'#fff5f5',color:'#ef4444',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                    <Trash2 size={13} />
                  </button>
                </div>
                {isDup && <p style={{ color:'#ef4444',fontSize:11,margin:'3px 0 0' }}>Este insumo ya está en la fórmula</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────

export default function ProductFormModal({ open, onClose, product }) {
  const isEdit = !!product;

  // Fetch full product detail when editing from list (product only has _count, no insumosBase)
  const needsFetch = isEdit && !product?.insumosBase;
  const { data: fetchedProduct, isLoading: loadingDetail } = useProductById(
    open && needsFetch ? product?.id : null
  );
  const fullProduct = needsFetch ? fetchedProduct : product;

  const { data: categoriesRaw } = useCategories(open ? CAT_PARAMS : null);
  const { data: invRaw }        = useInventoryItems(open ? INV_PARAMS : null);
  const categoriesList           = categoriesRaw?.data ?? [];
  const inventoryItems           = invRaw?.data ?? [];

  const create = useCreateProduct();
  const update = useUpdateProduct();

  const [form,        setForm]        = useState(EMPTY_FORM);
  const [formulaRows, setFormulaRows] = useState([]);
  const [errors,      setErrors]      = useState({});
  const [formulaErr,  setFormulaErr]  = useState('');
  const [mounted,     setMounted]     = useState(false);

  useEffect(() => {
    if (open) setMounted(true);
    else { const t = setTimeout(() => setMounted(false), 300); return () => clearTimeout(t); }
  }, [open]);

  // Initialize form when data is ready
  useEffect(() => {
    if (!open) return;
    setErrors({});
    setFormulaErr('');

    if (isEdit && fullProduct) {
      setForm({
        nombre:         fullProduct.nombre           ?? '',
        descripcion:    fullProduct.descripcion      ?? '',
        categoriaId:    fullProduct.categoria?.id    ?? '',
        precioBase:     fullProduct.precioBase != null ? String(fullProduct.precioBase) : '',
        imagenUrl:      fullProduct.imagenUrl        ?? '',
        tieneVariantes: fullProduct.tieneVariantes   ?? false,
      });
      setFormulaRows(
        (fullProduct.insumosBase ?? []).map((inv) =>
          mkRow(inv.itemInventario.id, String(inv.cantidad))
        )
      );
    } else if (!isEdit) {
      setForm(EMPTY_FORM);
      setFormulaRows([]);
    }
  }, [open, isEdit, fullProduct]);

  const setField = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: '' }));
  };

  const validate = () => {
    const e = {};
    let fErr = '';
    if (!form.nombre.trim()) e.nombre = 'El nombre es obligatorio';
    else if (form.nombre.trim().length < 2) e.nombre = 'Mínimo 2 caracteres';
    if (!form.categoriaId) e.categoriaId = 'Selecciona una categoría';
    if (!form.precioBase || isNaN(parseFloat(form.precioBase)) || parseFloat(form.precioBase) <= 0)
      e.precioBase = 'El precio debe ser mayor a cero';

    const filledRows = formulaRows.filter((r) => r.itemInventarioId || r.cantidad);
    filledRows.forEach((r) => {
      if (!r.itemInventarioId) fErr = 'Selecciona el ítem para todos los insumos';
      if (!r.cantidad || parseFloat(r.cantidad) <= 0) fErr = 'Ingresa cantidades válidas para todos los insumos';
    });
    const ids = filledRows.map((r) => r.itemInventarioId).filter(Boolean);
    if (new Set(ids).size !== ids.length) fErr = 'No puedes repetir el mismo insumo en la fórmula';
    if (fErr) setFormulaErr(fErr);

    return e;
  };

  const buildPayload = () => {
    const p = {
      nombre:         form.nombre.trim(),
      categoriaId:    form.categoriaId,
      precioBase:     parseFloat(form.precioBase),
      tieneVariantes: form.tieneVariantes,
    };
    if (form.descripcion.trim()) p.descripcion = form.descripcion.trim();
    if (form.imagenUrl.trim())   p.imagenUrl   = form.imagenUrl.trim();

    const validRows = formulaRows.filter((r) => r.itemInventarioId && r.cantidad && parseFloat(r.cantidad) > 0);
    p.insumosBase = validRows.map((r) => ({
      itemInventarioId: r.itemInventarioId,
      cantidad: parseFloat(r.cantidad),
    }));
    return p;
  };

  const handleSubmit = async () => {
    setFormulaErr('');
    const errs = validate();
    if (Object.keys(errs).length || formulaErr) { setErrors(errs); return; }

    try {
      const payload = buildPayload();
      if (isEdit) await update.mutateAsync({ id: fullProduct.id, ...payload });
      else        await create.mutateAsync(payload);
      onClose();
    } catch (err) {
      const code = err?.code;
      const responseData = err?.original?.response?.data;
      if (code === 'VALIDATION_ERROR' && Array.isArray(responseData?.errors)) {
        const mapped = {};
        responseData.errors.forEach(({ campo, mensaje }) => { mapped[campo] = mensaje; });
        setErrors((p) => ({ ...p, ...mapped }));
      } else if (code === 'CONFLICT' || code === 'DUPLICATE_ENTRY') {
        setErrors((p) => ({ ...p, nombre: err.message ?? 'Ya existe un producto con ese nombre en esta categoría' }));
      } else if (err?.status === 404) {
        toast.error(err.message ?? 'Recurso no encontrado');
      } else {
        toast.error(err?.message ?? 'Error al guardar el producto');
      }
    }
  };

  if (!mounted) return null;
  const busy = create.isPending || update.isPending;
  const hasVariants = isEdit && (fullProduct?._count?.variantes ?? 0) > 0;

  return (
    <>
      <style>{`
        @keyframes pfSlideIn  { from{transform:translateX(100%)} to{transform:translateX(0)} }
        @keyframes pfSlideOut { from{transform:translateX(0)}   to{transform:translateX(100%)} }
        @keyframes pfFadeIn   { from{opacity:0} to{opacity:1} }
        @keyframes pfFadeOut  { from{opacity:1} to{opacity:0} }
        .pf-ov-in  { animation: pfFadeIn  280ms ease forwards; }
        .pf-ov-out { animation: pfFadeOut 280ms ease forwards; }
        .pf-pan-in { animation: pfSlideIn  300ms cubic-bezier(0.32,0.72,0,1) forwards; }
        .pf-pan-out{ animation: pfSlideOut 280ms cubic-bezier(0.32,0.72,0,1) forwards; }
        .pf-input,.pf-select {
          width:100%; height:40px; border-radius:10px;
          background:#f9fafb; border:1px solid #e5e7eb;
          color:#1f2937; font-size:13px; padding:0 12px;
          outline:none; box-sizing:border-box; font-family:inherit;
          transition:border-color 150ms,box-shadow 150ms,background 150ms;
          appearance:none; -webkit-appearance:none;
        }
        .pf-input:focus,.pf-select:focus{border-color:#8c916c;box-shadow:0 0 0 3px rgba(140,145,108,0.12);background:#fff;}
        .pf-input.err,.pf-select.err{border-color:rgba(239,68,68,0.5);}
        .pf-input.err:focus,.pf-select.err:focus{box-shadow:0 0 0 3px rgba(239,68,68,0.10);}
        .pf-textarea {
          width:100%; min-height:68px; border-radius:10px; resize:vertical;
          background:#f9fafb; border:1px solid #e5e7eb; color:#1f2937;
          font-size:13px; padding:10px 12px; outline:none; box-sizing:border-box;
          font-family:inherit; line-height:1.5;
          transition:border-color 150ms,box-shadow 150ms,background 150ms;
        }
        .pf-textarea:focus{border-color:#8c916c;box-shadow:0 0 0 3px rgba(140,145,108,0.12);background:#fff;}
        .pf-label{color:#6b7280;font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;}
        .pf-opt{color:#9ca3af;font-size:11px;}
        .pf-close{width:30px;height:30px;border-radius:8px;background:transparent;border:1px solid #e5e7eb;cursor:pointer;color:#9ca3af;display:flex;align-items:center;justify-content:center;}
        .pf-close:hover{background:#f3f4f6;color:#374151;}
        .pf-btn-cancel{flex:1;height:40px;border-radius:10px;border:1px solid #e5e7eb;background:white;color:#6b7280;font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;}
        .pf-btn-cancel:hover{background:#f9fafb;}
        .pf-btn-submit{flex:2;height:40px;border-radius:10px;border:none;background:#55624a;color:white;font-size:13px;font-weight:700;cursor:pointer;font-family:'Syne',sans-serif;display:flex;align-items:center;justify-content:center;gap:6px;transition:opacity 150ms;}
        .pf-btn-submit:hover:not(:disabled){opacity:0.88;}
        .pf-btn-submit:disabled{background:#e5e7eb;color:#9ca3af;cursor:not-allowed;}
        .pf-divider{height:1px;background:#f3f4f6;margin:4px 0;}
      `}</style>

      <div className={open ? 'pf-ov-in' : 'pf-ov-out'} onClick={onClose}
        style={{ position:'fixed',inset:0,zIndex:1000,background:'rgba(0,0,0,0.18)',backdropFilter:'blur(2px)' }} />

      <div className={open ? 'pf-pan-in' : 'pf-pan-out'}
        style={{ position:'fixed',top:0,right:0,bottom:0,zIndex:1001,width:600,background:'#ffffff',borderLeft:'1px solid #e5e7eb',boxShadow:'-12px 0 40px rgba(0,0,0,0.08)',display:'flex',flexDirection:'column',overflow:'hidden' }}>

        {/* Header */}
        <div style={{ display:'flex',alignItems:'center',gap:10,padding:'20px 20px 18px',borderBottom:'1px solid #f3f4f6',flexShrink:0 }}>
          <div style={{ width:34,height:34,borderRadius:10,background:'rgba(85,98,74,0.10)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
            <ShoppingBag size={16} color="#55624a" />
          </div>
          <div style={{ flex:1 }}>
            <h3 style={{ color:'#111827',fontSize:15,fontWeight:700,margin:0,fontFamily:"'Syne',sans-serif" }}>
              {isEdit ? 'Editar producto' : 'Nuevo producto'}
            </h3>
            <p style={{ color:'#9ca3af',fontSize:12,margin:0 }}>
              {isEdit ? `Editando: ${product?.nombre}` : 'Registra un producto en el catálogo'}
            </p>
          </div>
          <button className="pf-close" onClick={onClose}><X size={15} /></button>
        </div>

        {/* Body */}
        {loadingDetail ? (
          <div style={{ flex:1,display:'flex',alignItems:'center',justifyContent:'center' }}>
            <Loader2 size={20} className="animate-spin" style={{ color:'#d1d5db' }} />
          </div>
        ) : (
          <div style={{ flex:1,overflowY:'auto',padding:'20px',display:'flex',flexDirection:'column',gap:16 }}>

            {/* ── Sección 1: Datos básicos ── */}
            <p style={{ color:'#374151',fontSize:12,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',margin:0 }}>
              Datos básicos
            </p>

            {/* Nombre */}
            <div style={{ display:'flex',flexDirection:'column',gap:5 }}>
              <label className="pf-label">Nombre <span style={{ color:'#ef4444' }}>*</span></label>
              <input className={`pf-input${errors.nombre ? ' err' : ''}`} value={form.nombre}
                onChange={(e) => setField('nombre', e.target.value)}
                placeholder="Ej: Cappuccino" autoFocus={!isEdit} />
              {errors.nombre && <span style={{ color:'#ef4444',fontSize:12 }}>{errors.nombre}</span>}
            </div>

            {/* Descripción */}
            <div style={{ display:'flex',flexDirection:'column',gap:5 }}>
              <div style={{ display:'flex',gap:6,alignItems:'baseline' }}>
                <label className="pf-label">Descripción</label>
                <span className="pf-opt">opcional</span>
              </div>
              <textarea className="pf-textarea" value={form.descripcion}
                onChange={(e) => setField('descripcion', e.target.value)}
                placeholder="Describe el producto brevemente…" />
            </div>

            {/* Categoría + Precio base — 2 col */}
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
              {/* Categoría */}
              <div style={{ display:'flex',flexDirection:'column',gap:5 }}>
                <label className="pf-label">Categoría <span style={{ color:'#ef4444' }}>*</span></label>
                <div style={{ position:'relative' }}>
                  <select className={`pf-select${errors.categoriaId ? ' err' : ''}`}
                    value={form.categoriaId}
                    onChange={(e) => setField('categoriaId', e.target.value)}
                    style={{ paddingRight:32 }}>
                    <option value="">Seleccionar…</option>
                    {categoriesList.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                    ))}
                  </select>
                  <span style={{ position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',pointerEvents:'none',color:'#9ca3af',fontSize:10 }}>▼</span>
                </div>
                {errors.categoriaId && <span style={{ color:'#ef4444',fontSize:12 }}>{errors.categoriaId}</span>}
              </div>

              {/* Precio base */}
              <div style={{ display:'flex',flexDirection:'column',gap:5 }}>
                <label className="pf-label">Precio base <span style={{ color:'#ef4444' }}>*</span></label>
                <input type="number" min="1" step="100" className={`pf-input${errors.precioBase ? ' err' : ''}`}
                  value={form.precioBase}
                  onChange={(e) => setField('precioBase', e.target.value)}
                  placeholder="7000" />
                {errors.precioBase && <span style={{ color:'#ef4444',fontSize:12 }}>{errors.precioBase}</span>}
              </div>
            </div>

            {/* URL imagen */}
            <div style={{ display:'flex',flexDirection:'column',gap:5 }}>
              <div style={{ display:'flex',gap:6,alignItems:'baseline' }}>
                <label className="pf-label">URL de imagen</label>
                <span className="pf-opt">opcional</span>
              </div>
              <input className="pf-input" value={form.imagenUrl}
                onChange={(e) => setField('imagenUrl', e.target.value)}
                placeholder="https://…" />
            </div>

            {/* Toggle variantes */}
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 14px',borderRadius:10,background:'#f9fafb',border:'1px solid #f3f4f6' }}>
              <div>
                <p style={{ color:'#374151',fontSize:13,fontWeight:600,margin:'0 0 2px',fontFamily:"'Syne',sans-serif" }}>¿Tiene variantes?</p>
                <p style={{ color:'#9ca3af',fontSize:11,margin:0 }}>
                  {form.tieneVariantes
                    ? 'Las variantes se agregan desde la vista de detalle del producto'
                    : 'El producto no tiene variantes (sabores, tamaños, etc.)'
                  }
                </p>
              </div>
              <button type="button"
                onClick={() => !hasVariants && setField('tieneVariantes', !form.tieneVariantes)}
                disabled={hasVariants}
                title={hasVariants ? 'No puedes desactivar variantes si el producto ya tiene variantes creadas' : ''}
                style={{ background:'none',border:'none',cursor:hasVariants?'not-allowed':'pointer',padding:0,opacity:hasVariants?0.5:1,flexShrink:0 }}>
                {form.tieneVariantes
                  ? <ToggleRight size={34} style={{ color:'#55624a' }} />
                  : <ToggleLeft  size={34} style={{ color:'#d1d5db' }} />
                }
              </button>
            </div>

            <div className="pf-divider" />

            {/* ── Sección 2: Fórmula base ── */}
            <p style={{ color:'#374151',fontSize:12,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',margin:0 }}>
              Fórmula de insumos
            </p>

            <FormulaBuilder
              rows={formulaRows}
              onChange={(rows) => { setFormulaRows(rows); setFormulaErr(''); }}
              inventoryItems={inventoryItems}
            />
            {formulaErr && <p style={{ color:'#ef4444',fontSize:12,margin:0 }}>{formulaErr}</p>}

            {isEdit && (
              <div style={{ padding:'10px 14px',borderRadius:10,background:'rgba(217,119,6,0.05)',border:'1px solid rgba(217,119,6,0.20)' }}>
                <p style={{ color:'#b45309',fontSize:12,margin:0,lineHeight:1.5 }}>
                  Al guardar, la fórmula actual será <strong>reemplazada completamente</strong> por los insumos que configures aquí.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{ flexShrink:0,padding:'14px 20px 20px',borderTop:'1px solid #f3f4f6',display:'flex',gap:10,background:'#ffffff' }}>
          <button type="button" className="pf-btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="pf-btn-submit" disabled={busy || loadingDetail} onClick={handleSubmit}>
            {busy && <Loader2 size={13} className="animate-spin" />}
            {busy ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear producto'}
          </button>
        </div>
      </div>
    </>
  );
}
