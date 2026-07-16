import { useState, useEffect } from 'react';
import { GitBranch, Loader2, X, Plus, Trash2 } from 'lucide-react';
import { useCreateVariant, useUpdateVariant } from '../../hooks/useProducts';
import { useInventoryItems } from '../../hooks/useInventory';
import toast from 'react-hot-toast';

const formatCOP = (v) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v || 0);

const INV_PARAMS = { estado: 'ACTIVO', limit: 100 };

let _uid = 0;
const mkRow = (itemInventarioId = '', cantidad = '') => ({ _id: `vr${++_uid}`, itemInventarioId, cantidad });

const EMPTY_FORM = { nombre: '', precioDiferencial: '0' };

// ── FormulaBuilder ────────────────────────────────────────────────────────────

function FormulaBuilder({ rows, onChange, inventoryItems }) {
  const usedIds = rows.map((r) => r.itemInventarioId).filter(Boolean);
  const dupSet  = new Set(usedIds.filter((id, i) => usedIds.indexOf(id) !== i));

  const add    = () => onChange([...rows, mkRow()]);
  const remove = (_id) => onChange(rows.filter((r) => r._id !== _id));
  const update = (_id, field, value) => onChange(rows.map((r) => (r._id === _id ? { ...r, [field]: value } : r)));

  return (
    <div>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8 }}>
        <div style={{ display:'flex',gap:6,alignItems:'baseline' }}>
          <span className="vf-label">Insumos adicionales</span>
          <span className="vf-opt">opcional</span>
        </div>
        <button type="button" onClick={add}
          style={{ display:'flex',alignItems:'center',gap:4,height:26,padding:'0 10px',borderRadius:8,border:'1px solid rgba(85,98,74,0.3)',background:'rgba(85,98,74,0.06)',color:'#55624a',fontSize:11,fontWeight:600,cursor:'pointer' }}>
          <Plus size={11} /> Agregar insumo
        </button>
      </div>

      {rows.length === 0 ? (
        <div style={{ textAlign:'center',padding:'16px 0',color:'#9ca3af',fontSize:12,background:'rgba(0,0,0,0.02)',borderRadius:10,border:'1px dashed #e5e7eb' }}>
          Sin insumos adicionales (hereda solo los de la fórmula base)
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
                    <select className={`vf-select${isDup ? ' err' : ''}`}
                      value={row.itemInventarioId}
                      onChange={(e) => update(row._id, 'itemInventarioId', e.target.value)}
                      style={{ paddingRight:24 }}>
                      <option value="">Seleccionar insumo…</option>
                      {(inventoryItems ?? []).map((i) => (
                        <option key={i.id} value={i.id}>{i.nombre} ({i.unidadMedida})</option>
                      ))}
                    </select>
                    <span style={{ position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',pointerEvents:'none',color:'#9ca3af',fontSize:9 }}>▼</span>
                  </div>
                  <input type="number" min="0.001" step="0.001" className="vf-input"
                    value={row.cantidad}
                    onChange={(e) => update(row._id, 'cantidad', e.target.value)}
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

export default function VariantFormModal({ open, onClose, productId, precioBase, variant }) {
  const isEdit = !!variant;
  const create = useCreateVariant();
  const update = useUpdateVariant();

  const { data: invRaw } = useInventoryItems(open ? INV_PARAMS : null);
  const inventoryItems   = invRaw?.data ?? [];

  const [form,        setForm]        = useState(EMPTY_FORM);
  const [formulaRows, setFormulaRows] = useState([]);
  const [errors,      setErrors]      = useState({});
  const [mounted,     setMounted]     = useState(false);

  useEffect(() => {
    if (open) setMounted(true);
    else { const t = setTimeout(() => setMounted(false), 300); return () => clearTimeout(t); }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (isEdit && variant) {
      setForm({
        nombre:            variant.nombre ?? '',
        precioDiferencial: variant.precioDiferencial != null ? String(variant.precioDiferencial) : '0',
      });
      setFormulaRows(
        (variant.insumosAdicionales ?? []).map((inv) =>
          mkRow(inv.itemInventario.id, String(inv.cantidad))
        )
      );
    } else {
      setForm(EMPTY_FORM);
      setFormulaRows([]);
    }
  }, [open, isEdit, variant]);

  const setField = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: '' }));
  };

  const precioDif  = parseFloat(form.precioDiferencial);
  const precioFinal = !isNaN(precioDif) ? precioBase + precioDif : precioBase;

  const validate = () => {
    const e = {};
    if (!form.nombre.trim()) e.nombre = 'El nombre es obligatorio';
    else if (form.nombre.trim().length < 2) e.nombre = 'Mínimo 2 caracteres';
    if (form.precioDiferencial === '' || isNaN(parseFloat(form.precioDiferencial)))
      e.precioDiferencial = 'Ingresa un valor numérico (puede ser 0 o negativo)';

    const filledRows = formulaRows.filter((r) => r.itemInventarioId || r.cantidad);
    filledRows.forEach((r) => {
      if (!r.itemInventarioId) e._formula = 'Selecciona el ítem para todos los insumos';
      if (!r.cantidad || parseFloat(r.cantidad) <= 0) e._formula = 'Ingresa cantidad válida para todos los insumos';
    });
    const ids = filledRows.map((r) => r.itemInventarioId).filter(Boolean);
    if (new Set(ids).size !== ids.length) e._formula = 'No puedes repetir el mismo insumo';
    return e;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const payload = {
      productId,
      nombre:            form.nombre.trim(),
      precioDiferencial: parseFloat(form.precioDiferencial),
    };

    const validRows = formulaRows.filter((r) => r.itemInventarioId && r.cantidad && parseFloat(r.cantidad) > 0);
    if (validRows.length > 0 || isEdit) {
      payload.insumosAdicionales = validRows.map((r) => ({
        itemInventarioId: r.itemInventarioId,
        cantidad: parseFloat(r.cantidad),
      }));
    }

    try {
      if (isEdit) await update.mutateAsync({ ...payload, variantId: variant.id });
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
        setErrors((p) => ({ ...p, nombre: err.message ?? 'Ya existe una variante con ese nombre' }));
      } else {
        toast.error(err?.message ?? 'Error al guardar la variante');
      }
    }
  };

  if (!mounted) return null;
  const busy = create.isPending || update.isPending;

  return (
    <>
      <style>{`
        @keyframes vfSlideIn  { from{transform:translateX(100%)} to{transform:translateX(0)} }
        @keyframes vfSlideOut { from{transform:translateX(0)}   to{transform:translateX(100%)} }
        @keyframes vfFadeIn   { from{opacity:0} to{opacity:1} }
        @keyframes vfFadeOut  { from{opacity:1} to{opacity:0} }
        .vf-ov-in  { animation: vfFadeIn  280ms ease forwards; }
        .vf-ov-out { animation: vfFadeOut 280ms ease forwards; }
        .vf-pan-in { animation: vfSlideIn  300ms cubic-bezier(0.32,0.72,0,1) forwards; }
        .vf-pan-out{ animation: vfSlideOut 280ms cubic-bezier(0.32,0.72,0,1) forwards; }
        .vf-input,.vf-select {
          width:100%; height:40px; border-radius:10px;
          background:#f9fafb; border:1px solid #e5e7eb;
          color:#1f2937; font-size:13px; padding:0 12px;
          outline:none; box-sizing:border-box; font-family:inherit;
          transition:border-color 150ms,box-shadow 150ms,background 150ms;
          appearance:none; -webkit-appearance:none;
        }
        .vf-input:focus,.vf-select:focus{border-color:#8c916c;box-shadow:0 0 0 3px rgba(140,145,108,0.12);background:#fff;}
        .vf-input.err,.vf-select.err{border-color:rgba(239,68,68,0.5);}
        .vf-label{color:#6b7280;font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;}
        .vf-opt{color:#9ca3af;font-size:11px;}
        .vf-close{width:30px;height:30px;border-radius:8px;background:transparent;border:1px solid #e5e7eb;cursor:pointer;color:#9ca3af;display:flex;align-items:center;justify-content:center;}
        .vf-close:hover{background:#f3f4f6;color:#374151;}
        .vf-btn-cancel{flex:1;height:40px;border-radius:10px;border:1px solid #e5e7eb;background:white;color:#6b7280;font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;}
        .vf-btn-cancel:hover{background:#f9fafb;}
        .vf-btn-submit{flex:2;height:40px;border-radius:10px;border:none;background:#55624a;color:white;font-size:13px;font-weight:700;cursor:pointer;font-family:'Syne',sans-serif;display:flex;align-items:center;justify-content:center;gap:6px;transition:opacity 150ms;}
        .vf-btn-submit:hover:not(:disabled){opacity:0.88;}
        .vf-btn-submit:disabled{background:#e5e7eb;color:#9ca3af;cursor:not-allowed;}
      `}</style>

      <div className={open ? 'vf-ov-in' : 'vf-ov-out'} onClick={onClose}
        style={{ position:'fixed',inset:0,zIndex:1000,background:'rgba(0,0,0,0.18)',backdropFilter:'blur(2px)' }} />

      <div className={open ? 'vf-pan-in' : 'vf-pan-out'}
        style={{ position:'fixed',top:0,right:0,bottom:0,zIndex:1001,width:480,background:'#ffffff',borderLeft:'1px solid #e5e7eb',boxShadow:'-12px 0 40px rgba(0,0,0,0.08)',display:'flex',flexDirection:'column',overflow:'hidden' }}>

        {/* Header */}
        <div style={{ display:'flex',alignItems:'center',gap:10,padding:'20px 20px 18px',borderBottom:'1px solid #f3f4f6',flexShrink:0 }}>
          <div style={{ width:34,height:34,borderRadius:10,background:'rgba(85,98,74,0.10)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
            <GitBranch size={16} color="#55624a" />
          </div>
          <div style={{ flex:1 }}>
            <h3 style={{ color:'#111827',fontSize:15,fontWeight:700,margin:0,fontFamily:"'Syne',sans-serif" }}>
              {isEdit ? 'Editar variante' : 'Nueva variante'}
            </h3>
            <p style={{ color:'#9ca3af',fontSize:12,margin:0 }}>
              {isEdit ? `Editando: ${variant.nombre}` : 'Agrega una variante al producto'}
            </p>
          </div>
          <button className="vf-close" onClick={onClose}><X size={15} /></button>
        </div>

        {/* Body */}
        <div style={{ flex:1,overflowY:'auto',padding:'20px',display:'flex',flexDirection:'column',gap:16 }}>

          {/* Nota sobre herencia */}
          <div style={{ padding:'10px 14px',borderRadius:10,background:'rgba(37,99,235,0.05)',border:'1px solid rgba(37,99,235,0.15)' }}>
            <p style={{ color:'#1d4ed8',fontSize:12,margin:0,lineHeight:1.5 }}>
              Esta variante <strong>hereda los insumos base</strong> del producto. Solo agrega los insumos específicos de esta variante.
            </p>
          </div>

          {/* Nombre */}
          <div style={{ display:'flex',flexDirection:'column',gap:5 }}>
            <label className="vf-label">Nombre de la variante <span style={{ color:'#ef4444' }}>*</span></label>
            <input className={`vf-input${errors.nombre ? ' err' : ''}`} value={form.nombre}
              onChange={(e) => setField('nombre', e.target.value)}
              placeholder="Ej: Mora, Tamaño Grande, Sin azúcar…" autoFocus={!isEdit} />
            {errors.nombre && <span style={{ color:'#ef4444',fontSize:12 }}>{errors.nombre}</span>}
          </div>

          {/* Precio diferencial */}
          <div style={{ display:'flex',flexDirection:'column',gap:5 }}>
            <label className="vf-label">Precio diferencial <span style={{ color:'#ef4444' }}>*</span></label>
            <input type="number" step="100" className={`vf-input${errors.precioDiferencial ? ' err' : ''}`}
              value={form.precioDiferencial}
              onChange={(e) => setField('precioDiferencial', e.target.value)}
              placeholder="0" />
            {errors.precioDiferencial
              ? <span style={{ color:'#ef4444',fontSize:12 }}>{errors.precioDiferencial}</span>
              : <span style={{ color:'#9ca3af',fontSize:11 }}>0 = mismo precio base · negativo = variante más económica</span>
            }
          </div>

          {/* Preview precio final */}
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 14px',borderRadius:10,background:'rgba(85,98,74,0.05)',border:'1px solid rgba(85,98,74,0.15)' }}>
            <div>
              <p style={{ color:'#6b7280',fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.06em',margin:'0 0 2px' }}>Precio final</p>
              <p style={{ color:'#9ca3af',fontSize:11,margin:0 }}>
                {formatCOP(precioBase)}
                {!isNaN(precioDif) && precioDif !== 0 && (
                  <span style={{ color: precioDif > 0 ? '#16a34a' : '#ef4444', marginLeft:4, fontWeight:600 }}>
                    {precioDif > 0 ? '+' : '−'}{formatCOP(Math.abs(precioDif))}
                  </span>
                )}
              </p>
            </div>
            <span style={{ fontSize:18,fontWeight:700,color:'#111827',fontFamily:"'Syne',sans-serif" }}>
              {formatCOP(precioFinal)}
            </span>
          </div>

          {/* Formula adicional */}
          <FormulaBuilder
            rows={formulaRows}
            onChange={setFormulaRows}
            inventoryItems={inventoryItems}
          />
          {errors._formula && <p style={{ color:'#ef4444',fontSize:12,margin:0 }}>{errors._formula}</p>}

        </div>

        {/* Footer */}
        <div style={{ flexShrink:0,padding:'14px 20px 20px',borderTop:'1px solid #f3f4f6',display:'flex',gap:10,background:'#ffffff' }}>
          <button type="button" className="vf-btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="vf-btn-submit" disabled={busy} onClick={handleSubmit}>
            {busy && <Loader2 size={13} className="animate-spin" />}
            {busy ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear variante'}
          </button>
        </div>
      </div>
    </>
  );
}
