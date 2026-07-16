import { useState, useEffect } from 'react';
import { Package, Loader2, X } from 'lucide-react';
import { useCreateInventoryItem, useUpdateInventoryItem } from '../../hooks/useInventory';

const UNITS = [
  { value: 'litro',      label: 'Litro' },
  { value: 'mililitro',  label: 'Mililitro' },
  { value: 'kilogramo',  label: 'Kilogramo' },
  { value: 'gramo',      label: 'Gramo' },
  { value: 'libra',      label: 'Libra' },
  { value: 'onza',       label: 'Onza' },
  { value: 'unidad',     label: 'Unidad' },
  { value: 'porcion',    label: 'Porción' },
  { value: 'caja',       label: 'Caja' },
  { value: 'paquete',    label: 'Paquete' },
];

const EMPTY = { nombre: '', unidadMedida: '', stockMinimo: '', proveedorHabitual: '', descripcion: '' };

export default function InventoryFormModal({ open, onClose, item }) {
  const isEdit = !!item;
  const create = useCreateInventoryItem();
  const update = useUpdateInventoryItem();

  const [form,    setForm]    = useState(EMPTY);
  const [errors,  setErrors]  = useState({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (open) setMounted(true);
    else { const t = setTimeout(() => setMounted(false), 300); return () => clearTimeout(t); }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (isEdit && item) {
      setForm({
        nombre:             item.nombre             ?? '',
        unidadMedida:       item.unidadMedida       ?? '',
        stockMinimo:        item.stockMinimo != null ? String(item.stockMinimo) : '',
        proveedorHabitual:  item.proveedorHabitual  ?? '',
        descripcion:        item.descripcion        ?? '',
      });
    } else {
      setForm(EMPTY);
    }
  }, [open, isEdit, item]);

  const setField = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.nombre.trim()) e.nombre = 'El nombre es obligatorio';
    else if (form.nombre.trim().length < 2) e.nombre = 'El nombre debe tener al menos 2 caracteres';
    if (!form.unidadMedida) e.unidadMedida = 'Selecciona una unidad de medida';
    if (form.stockMinimo !== '' && (isNaN(Number(form.stockMinimo)) || Number(form.stockMinimo) < 0))
      e.stockMinimo = 'El stock mínimo debe ser un número mayor o igual a 0';
    return e;
  };

  const buildPayload = () => {
    const p = {
      nombre:       form.nombre.trim(),
      unidadMedida: form.unidadMedida,
    };
    if (form.stockMinimo !== '')     p.stockMinimo        = Number(form.stockMinimo);
    if (form.proveedorHabitual.trim()) p.proveedorHabitual = form.proveedorHabitual.trim();
    if (form.descripcion.trim())     p.descripcion        = form.descripcion.trim();
    return p;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    try {
      if (isEdit) await update.mutateAsync({ id: item.id, ...buildPayload() });
      else        await create.mutateAsync(buildPayload());
      onClose();
    } catch (err) {
      const code = err?.code;
      const responseData = err?.original?.response?.data;
      if (code === 'CONFLICT' || code === 'DUPLICATE_ENTRY') {
        setErrors((p) => ({ ...p, nombre: err.message ?? 'Ya existe un ítem con ese nombre' }));
      } else if (code === 'VALIDATION_ERROR' && Array.isArray(responseData?.errors)) {
        const mapped = {};
        responseData.errors.forEach(({ campo, mensaje }) => { mapped[campo] = mensaje; });
        setErrors((p) => ({ ...p, ...mapped }));
      } else {
        setErrors((p) => ({ ...p, nombre: err.message ?? 'Error al guardar el ítem' }));
      }
    }
  };

  if (!mounted) return null;
  const busy = create.isPending || update.isPending;

  return (
    <>
      <style>{`
        @keyframes ifSlideIn  { from{transform:translateX(100%)} to{transform:translateX(0)} }
        @keyframes ifSlideOut { from{transform:translateX(0)}   to{transform:translateX(100%)} }
        @keyframes ifFadeIn   { from{opacity:0} to{opacity:1} }
        @keyframes ifFadeOut  { from{opacity:1} to{opacity:0} }
        .if-ov-in  { animation: ifFadeIn  280ms ease forwards; }
        .if-ov-out { animation: ifFadeOut 280ms ease forwards; }
        .if-pan-in { animation: ifSlideIn  300ms cubic-bezier(0.32,0.72,0,1) forwards; }
        .if-pan-out{ animation: ifSlideOut 280ms cubic-bezier(0.32,0.72,0,1) forwards; }
        .if-input,.if-select {
          width:100%; height:40px; border-radius:10px;
          background:#f9fafb; border:1px solid #e5e7eb;
          color:#1f2937; font-size:13px; padding:0 12px;
          outline:none; box-sizing:border-box; font-family:inherit;
          transition:border-color 150ms,box-shadow 150ms,background 150ms;
          appearance:none; -webkit-appearance:none;
        }
        .if-input:focus,.if-select:focus{border-color:#8c916c;box-shadow:0 0 0 3px rgba(140,145,108,0.12);background:#fff;}
        .if-input.err,.if-select.err{border-color:rgba(239,68,68,0.5);}
        .if-input.err:focus,.if-select.err:focus{box-shadow:0 0 0 3px rgba(239,68,68,0.10);}
        .if-textarea {
          width:100%; min-height:72px; border-radius:10px; resize:vertical;
          background:#f9fafb; border:1px solid #e5e7eb;
          color:#1f2937; font-size:13px; padding:10px 12px;
          outline:none; box-sizing:border-box; font-family:inherit; line-height:1.5;
          transition:border-color 150ms,box-shadow 150ms,background 150ms;
        }
        .if-textarea:focus{border-color:#8c916c;box-shadow:0 0 0 3px rgba(140,145,108,0.12);background:#fff;}
        .if-close{width:30px;height:30px;border-radius:8px;background:transparent;border:1px solid #e5e7eb;cursor:pointer;color:#9ca3af;display:flex;align-items:center;justify-content:center;transition:background 150ms;}
        .if-close:hover{background:#f3f4f6;color:#374151;}
        .if-btn-cancel{flex:1;height:40px;border-radius:10px;border:1px solid #e5e7eb;background:white;color:#6b7280;font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;transition:background 150ms;}
        .if-btn-cancel:hover{background:#f9fafb;}
        .if-btn-submit{flex:2;height:40px;border-radius:10px;border:none;background:#55624a;color:white;font-size:13px;font-weight:700;cursor:pointer;font-family:'Syne',sans-serif;transition:opacity 150ms;display:flex;align-items:center;justify-content:center;gap:6px;}
        .if-btn-submit:hover:not(:disabled){opacity:0.88;}
        .if-btn-submit:disabled{background:#e5e7eb;color:#9ca3af;cursor:not-allowed;}
        .if-label{color:#6b7280;font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;}
        .if-opt{color:#9ca3af;font-size:11px;}
      `}</style>

      <div className={open ? 'if-ov-in' : 'if-ov-out'} onClick={onClose}
        style={{ position:'fixed',inset:0,zIndex:1000,background:'rgba(0,0,0,0.18)',backdropFilter:'blur(2px)' }} />

      <div className={open ? 'if-pan-in' : 'if-pan-out'}
        style={{ position:'fixed',top:0,right:0,bottom:0,zIndex:1001,width:520,background:'#ffffff',borderLeft:'1px solid #e5e7eb',boxShadow:'-12px 0 40px rgba(0,0,0,0.08)',display:'flex',flexDirection:'column',overflow:'hidden' }}>

        {/* Header */}
        <div style={{ display:'flex',alignItems:'center',gap:10,padding:'20px 20px 18px',borderBottom:'1px solid #f3f4f6',flexShrink:0 }}>
          <div style={{ width:34,height:34,borderRadius:10,background:'rgba(85,98,74,0.10)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
            <Package size={16} color="#55624a" />
          </div>
          <div style={{ flex:1 }}>
            <h3 style={{ color:'#111827',fontSize:15,fontWeight:700,margin:0,fontFamily:"'Syne',sans-serif" }}>
              {isEdit ? 'Editar ítem' : 'Nuevo ítem de inventario'}
            </h3>
            <p style={{ color:'#9ca3af',fontSize:12,margin:0 }}>
              {isEdit ? `Editando: ${item.nombre}` : 'Registra un insumo o materia prima'}
            </p>
          </div>
          <button className="if-close" onClick={onClose}><X size={15} /></button>
        </div>

        {/* Body */}
        <div style={{ flex:1,overflowY:'auto',padding:'20px',display:'flex',flexDirection:'column',gap:16 }}>

          {/* Nombre */}
          <div style={{ display:'flex',flexDirection:'column',gap:5 }}>
            <label className="if-label">Nombre <span style={{ color:'#ef4444' }}>*</span></label>
            <input className={`if-input${errors.nombre ? ' err' : ''}`} value={form.nombre}
              onChange={(e) => setField('nombre', e.target.value)} placeholder="Ej: Leche Entera" autoFocus={!isEdit} />
            {errors.nombre && <span style={{ color:'#ef4444',fontSize:12 }}>{errors.nombre}</span>}
          </div>

          {/* Unidad de medida */}
          <div style={{ display:'flex',flexDirection:'column',gap:5 }}>
            <label className="if-label">Unidad de medida <span style={{ color:'#ef4444' }}>*</span></label>
            <div style={{ position:'relative' }}>
              <select className={`if-select${errors.unidadMedida ? ' err' : ''}`}
                value={form.unidadMedida} onChange={(e) => setField('unidadMedida', e.target.value)}
                style={{ paddingRight:32 }}>
                <option value="">Seleccionar unidad…</option>
                {UNITS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <span style={{ position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',pointerEvents:'none',color:'#9ca3af',fontSize:10 }}>▼</span>
            </div>
            {errors.unidadMedida && <span style={{ color:'#ef4444',fontSize:12 }}>{errors.unidadMedida}</span>}
          </div>

          {/* Stock mínimo */}
          <div style={{ display:'flex',flexDirection:'column',gap:5 }}>
            <div style={{ display:'flex',gap:6,alignItems:'baseline' }}>
              <label className="if-label">Stock mínimo</label>
              <span className="if-opt">opcional</span>
            </div>
            <input type="number" min="0" step="0.01" className={`if-input${errors.stockMinimo ? ' err' : ''}`}
              value={form.stockMinimo} onChange={(e) => setField('stockMinimo', e.target.value)}
              placeholder="5" />
            {errors.stockMinimo
              ? <span style={{ color:'#ef4444',fontSize:12 }}>{errors.stockMinimo}</span>
              : <span style={{ color:'#9ca3af',fontSize:11 }}>Se activará alerta cuando el stock llegue a este valor</span>
            }
          </div>

          {/* Proveedor habitual */}
          <div style={{ display:'flex',flexDirection:'column',gap:5 }}>
            <div style={{ display:'flex',gap:6,alignItems:'baseline' }}>
              <label className="if-label">Proveedor habitual</label>
              <span className="if-opt">opcional</span>
            </div>
            <input className="if-input" value={form.proveedorHabitual}
              onChange={(e) => setField('proveedorHabitual', e.target.value)}
              placeholder="Ej: Lácteos del Norte" />
          </div>

          {/* Descripción */}
          <div style={{ display:'flex',flexDirection:'column',gap:5 }}>
            <div style={{ display:'flex',gap:6,alignItems:'baseline' }}>
              <label className="if-label">Descripción</label>
              <span className="if-opt">opcional</span>
            </div>
            <textarea className="if-textarea" value={form.descripcion}
              onChange={(e) => setField('descripcion', e.target.value)}
              placeholder="Uso del ítem, características u observaciones" />
          </div>

          {!isEdit && (
            <div style={{ padding:'12px 14px',borderRadius:10,background:'rgba(85,98,74,0.06)',border:'1px solid rgba(85,98,74,0.14)' }}>
              <p style={{ color:'#55624a',fontSize:12,margin:0,lineHeight:1.5 }}>
                <strong>Stock inicial:</strong> El ítem se crea con stock 0 y costo promedio 0. Para aumentar el stock usa "Registrar entrada" después de crear el ítem.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ flexShrink:0,padding:'14px 20px 20px',borderTop:'1px solid #f3f4f6',display:'flex',gap:10,background:'#ffffff' }}>
          <button type="button" className="if-btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="if-btn-submit" disabled={busy} onClick={handleSubmit}>
            {busy && <Loader2 size={13} className="animate-spin" />}
            {busy ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear ítem'}
          </button>
        </div>
      </div>
    </>
  );
}
