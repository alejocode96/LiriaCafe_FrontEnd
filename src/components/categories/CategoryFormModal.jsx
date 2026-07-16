import { useState, useEffect } from 'react';
import { Tag, Loader2, X, Hash } from 'lucide-react';
import { useCreateCategory, useUpdateCategory } from '../../hooks/useCategories';

export default function CategoryFormModal({ open, onClose, category }) {
  const isEdit = !!category;
  const create = useCreateCategory();
  const update = useUpdateCategory();

  const [form,   setForm]   = useState({ nombre: '', descripcion: '', orden: '' });
  const [errors, setErrors] = useState({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (open) setMounted(true);
    else {
      const t = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (isEdit && category) {
      setForm({
        nombre:      category.nombre      ?? '',
        descripcion: category.descripcion ?? '',
        orden:       category.orden != null ? String(category.orden) : '',
      });
    } else {
      setForm({ nombre: '', descripcion: '', orden: '' });
    }
  }, [open, isEdit, category]);

  const setField = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.nombre.trim())
      e.nombre = 'El nombre es obligatorio';
    else if (form.nombre.trim().length < 2)
      e.nombre = 'El nombre debe tener al menos 2 caracteres';
    if (form.orden !== '' && (isNaN(Number(form.orden)) || Number(form.orden) < 1))
      e.orden = 'El orden debe ser un número mayor a 0';
    return e;
  };

  const buildPayload = () => {
    const payload = {
      nombre:      form.nombre.trim(),
      descripcion: form.descripcion.trim() || undefined,
    };
    if (form.orden !== '') payload.orden = Number(form.orden);
    return payload;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    try {
      if (isEdit) {
        await update.mutateAsync({ id: category.id, ...buildPayload() });
      } else {
        await create.mutateAsync(buildPayload());
      }
      onClose();
    } catch (err) {
      const code = err?.code;
      const responseData = err?.original?.response?.data;

      if (code === 'DUPLICATE_ENTRY') {
        setErrors((p) => ({ ...p, nombre: err.message ?? 'Ya existe una categoría con ese nombre' }));
      } else if (code === 'VALIDATION_ERROR' && Array.isArray(responseData?.errors)) {
        const mapped = {};
        responseData.errors.forEach(({ campo, mensaje }) => { mapped[campo] = mensaje; });
        setErrors((p) => ({ ...p, ...mapped }));
      } else {
        setErrors((p) => ({ ...p, nombre: err.message ?? 'Error al guardar la categoría' }));
      }
    }
  };

  if (!mounted) return null;

  const busy = create.isPending || update.isPending;

  return (
    <>
      <style>{`
        @keyframes cfSlideIn  { from{transform:translateX(100%)} to{transform:translateX(0)} }
        @keyframes cfSlideOut { from{transform:translateX(0)}   to{transform:translateX(100%)} }
        @keyframes cfFadeIn   { from{opacity:0} to{opacity:1} }
        @keyframes cfFadeOut  { from{opacity:1} to{opacity:0} }
        .cf-ov-in  { animation: cfFadeIn  280ms ease forwards; }
        .cf-ov-out { animation: cfFadeOut 280ms ease forwards; }
        .cf-pan-in { animation: cfSlideIn  300ms cubic-bezier(0.32,0.72,0,1) forwards; }
        .cf-pan-out{ animation: cfSlideOut 280ms cubic-bezier(0.32,0.72,0,1) forwards; }

        .cf-input {
          width:100%; height:40px; border-radius:10px;
          background:#f9fafb; border:1px solid #e5e7eb;
          color:#1f2937; font-size:13px; padding:0 12px;
          outline:none; box-sizing:border-box; font-family:inherit;
          transition:border-color 150ms,box-shadow 150ms,background 150ms;
        }
        .cf-input:focus{border-color:#8c916c;box-shadow:0 0 0 3px rgba(140,145,108,0.12);background:#fff;}
        .cf-input.err{border-color:rgba(239,68,68,0.5);}
        .cf-input.err:focus{box-shadow:0 0 0 3px rgba(239,68,68,0.10);}

        .cf-textarea {
          width:100%; min-height:80px; border-radius:10px; resize:vertical;
          background:#f9fafb; border:1px solid #e5e7eb;
          color:#1f2937; font-size:13px; padding:10px 12px;
          outline:none; box-sizing:border-box; font-family:inherit; line-height:1.5;
          transition:border-color 150ms,box-shadow 150ms,background 150ms;
        }
        .cf-textarea:focus{border-color:#8c916c;box-shadow:0 0 0 3px rgba(140,145,108,0.12);background:#fff;}

        .cf-close{width:30px;height:30px;border-radius:8px;background:transparent;border:1px solid #e5e7eb;cursor:pointer;color:#9ca3af;display:flex;align-items:center;justify-content:center;transition:background 150ms,color 150ms;}
        .cf-close:hover{background:#f3f4f6;color:#374151;}

        .cf-btn-cancel{flex:1;height:40px;border-radius:10px;border:1px solid #e5e7eb;background:white;color:#6b7280;font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;transition:background 150ms;}
        .cf-btn-cancel:hover{background:#f9fafb;}
        .cf-btn-submit{flex:2;height:40px;border-radius:10px;border:none;background:#55624a;color:white;font-size:13px;font-weight:700;cursor:pointer;font-family:'Syne',sans-serif;transition:opacity 150ms;display:flex;align-items:center;justify-content:center;gap:6px;}
        .cf-btn-submit:hover:not(:disabled){opacity:0.88;}
        .cf-btn-submit:disabled{background:#e5e7eb;color:#9ca3af;cursor:not-allowed;}
      `}</style>

      {/* Overlay */}
      <div
        className={open ? 'cf-ov-in' : 'cf-ov-out'}
        onClick={onClose}
        style={{ position:'fixed',inset:0,zIndex:1000,background:'rgba(0,0,0,0.18)',backdropFilter:'blur(2px)' }}
      />

      {/* Panel */}
      <div
        className={open ? 'cf-pan-in' : 'cf-pan-out'}
        style={{
          position:'fixed',top:0,right:0,bottom:0,zIndex:1001,
          width:480,background:'#ffffff',
          borderLeft:'1px solid #e5e7eb',
          boxShadow:'-12px 0 40px rgba(0,0,0,0.08)',
          display:'flex',flexDirection:'column',overflow:'hidden',
        }}
      >
        {/* Header */}
        <div style={{ display:'flex',alignItems:'center',gap:10,padding:'20px 20px 18px',borderBottom:'1px solid #f3f4f6',flexShrink:0 }}>
          <div style={{ width:34,height:34,borderRadius:10,background:'rgba(85,98,74,0.10)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
            <Tag size={16} color="#55624a" />
          </div>
          <div style={{ flex:1 }}>
            <h3 style={{ color:'#111827',fontSize:15,fontWeight:700,margin:0,fontFamily:"'Syne',sans-serif" }}>
              {isEdit ? 'Editar categoría' : 'Nueva categoría'}
            </h3>
            <p style={{ color:'#9ca3af',fontSize:12,margin:0 }}>
              {isEdit ? 'Modifica los datos de la categoría' : 'Define el nombre y orden de la nueva categoría'}
            </p>
          </div>
          <button className="cf-close" onClick={onClose}><X size={15} /></button>
        </div>

        {/* Body */}
        <div style={{ flex:1,overflowY:'auto',padding:'24px 20px',display:'flex',flexDirection:'column',gap:20 }}>

          {/* Nombre */}
          <div style={{ display:'flex',flexDirection:'column',gap:5 }}>
            <label style={{ color:'#6b7280',fontSize:11,fontWeight:600,letterSpacing:'0.06em',textTransform:'uppercase' }}>
              Nombre <span style={{ color:'#ef4444' }}>*</span>
            </label>
            <input
              className={`cf-input${errors.nombre ? ' err' : ''}`}
              value={form.nombre}
              onChange={(e) => setField('nombre', e.target.value)}
              placeholder="Ej: Bebidas Frías"
              autoFocus={!isEdit}
            />
            {errors.nombre && <span style={{ color:'#ef4444',fontSize:12 }}>{errors.nombre}</span>}
          </div>

          {/* Descripción */}
          <div style={{ display:'flex',flexDirection:'column',gap:5 }}>
            <div style={{ display:'flex',gap:6,alignItems:'baseline' }}>
              <label style={{ color:'#6b7280',fontSize:11,fontWeight:600,letterSpacing:'0.06em',textTransform:'uppercase' }}>
                Descripción
              </label>
              <span style={{ color:'#b0b5b0',fontSize:11 }}>opcional</span>
            </div>
            <textarea
              className="cf-textarea"
              value={form.descripcion}
              onChange={(e) => setField('descripcion', e.target.value)}
              placeholder="Breve descripción de los productos en esta categoría"
            />
          </div>

          {/* Orden */}
          <div style={{ display:'flex',flexDirection:'column',gap:5 }}>
            <div style={{ display:'flex',gap:6,alignItems:'baseline' }}>
              <label style={{ color:'#6b7280',fontSize:11,fontWeight:600,letterSpacing:'0.06em',textTransform:'uppercase' }}>
                Orden de aparición
              </label>
              <span style={{ color:'#b0b5b0',fontSize:11 }}>opcional</span>
            </div>
            <div style={{ position:'relative' }}>
              <span style={{ position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',pointerEvents:'none' }}>
                <Hash size={14} color="#9ca3af" />
              </span>
              <input
                type="number"
                min="1"
                step="1"
                className={`cf-input${errors.orden ? ' err' : ''}`}
                style={{ paddingLeft:30 }}
                value={form.orden}
                onChange={(e) => setField('orden', e.target.value)}
                placeholder="1"
              />
            </div>
            {errors.orden
              ? <span style={{ color:'#ef4444',fontSize:12 }}>{errors.orden}</span>
              : <span style={{ color:'#9ca3af',fontSize:11 }}>Define el orden de aparición en el punto de venta</span>
            }
          </div>
        </div>

        {/* Footer */}
        <div style={{ flexShrink:0,padding:'14px 20px 20px',borderTop:'1px solid #f3f4f6',display:'flex',gap:10,background:'#ffffff' }}>
          <button type="button" className="cf-btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="cf-btn-submit" disabled={busy} onClick={handleSubmit}>
            {busy && <Loader2 size={13} className="animate-spin" />}
            {busy ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear categoría'}
          </button>
        </div>
      </div>
    </>
  );
}
