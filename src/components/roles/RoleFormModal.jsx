import { useState, useEffect } from 'react';
import { Shield, Loader2, X } from 'lucide-react';
import { useCreateRole, useUpdateRole, useRoleById } from '../../hooks/useRolesAdmin';

const MODULES = [
  { key: 'USUARIOS',      label: 'Usuarios' },
  { key: 'ROLES',         label: 'Roles' },
  { key: 'CATEGORIAS',    label: 'Categorías' },
  { key: 'INVENTARIO',    label: 'Inventario' },
  { key: 'PRODUCTOS',     label: 'Productos' },
  { key: 'CAJA',          label: 'Caja' },
  { key: 'VENTAS',        label: 'Ventas' },
  { key: 'FLUJO_CAJA',    label: 'Flujo de Caja' },
  { key: 'REPORTES',      label: 'Reportes' },
  { key: 'ADMINISTRACION', label: 'Administración' },
];

const ACTIONS = [
  { key: 'CREAR',      label: 'Crear' },
  { key: 'VER',        label: 'Ver' },
  { key: 'EDITAR',     label: 'Editar' },
  { key: 'DESACTIVAR', label: 'Desact.' },
  { key: 'REPORTES',   label: 'Report.' },
];

const buildEmptyMatrix = () => {
  const m = {};
  MODULES.forEach(({ key }) => {
    m[key] = {};
    ACTIONS.forEach(({ key: ak }) => { m[key][ak] = false; });
  });
  return m;
};

const buildMatrix = (permisos = []) => {
  const m = buildEmptyMatrix();
  permisos.forEach(({ modulo, accion, permitido }) => {
    if (m[modulo] && m[modulo][accion] !== undefined) {
      m[modulo][accion] = permitido !== false;
    }
  });
  return m;
};

export default function RoleFormModal({ open, onClose, roleId }) {
  const isEdit = !!roleId;
  const create = useCreateRole();
  const update = useUpdateRole();
  const { data: rawRole, isLoading: roleLoading } = useRoleById(roleId);

  const [form,   setForm]   = useState({ nombre: '', descripcion: '' });
  const [matrix, setMatrix] = useState(buildEmptyMatrix);
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
    if (!isEdit) {
      setForm({ nombre: '', descripcion: '' });
      setMatrix(buildEmptyMatrix());
    }
  }, [open, isEdit]);

  useEffect(() => {
    if (!isEdit || !rawRole) return;
    const role = rawRole?.data ?? rawRole;
    setForm({
      nombre:      role?.nombre      ?? '',
      descripcion: role?.descripcion ?? '',
    });
    setMatrix(buildMatrix(role?.permisos ?? []));
  }, [rawRole, isEdit]);

  const setField = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: '' }));
  };

  const togglePerm = (mod, act) =>
    setMatrix((p) => ({ ...p, [mod]: { ...p[mod], [act]: !p[mod][act] } }));

  const toggleRow = (mod) => {
    const allOn = ACTIONS.every(({ key }) => matrix[mod][key]);
    setMatrix((p) => ({
      ...p,
      [mod]: Object.fromEntries(ACTIONS.map(({ key }) => [key, !allOn])),
    }));
  };

  const toggleCol = (act) => {
    const allOn = MODULES.every(({ key }) => matrix[key][act]);
    setMatrix((p) => {
      const next = { ...p };
      MODULES.forEach(({ key }) => { next[key] = { ...next[key], [act]: !allOn }; });
      return next;
    });
  };

  const validate = () => {
    const e = {};
    if (!form.nombre.trim())
      e.nombre = 'El nombre del rol es obligatorio';
    else if (form.nombre.trim().length < 3)
      e.nombre = 'El nombre debe tener al menos 3 caracteres';
    return e;
  };

  // CREAR: solo los habilitados (o sin clave permisos si ninguno marcado).
  // EDITAR: los 50 explícitos con su valor real — el backend necesita
  //         recibir { permitido: false } para quitar un permiso que ya existía.
  const buildPermisos = (soloHabilitados) => {
    const permisos = [];
    MODULES.forEach(({ key: modulo }) => {
      ACTIONS.forEach(({ key: accion }) => {
        const enabled = matrix[modulo][accion];
        if (!soloHabilitados || enabled) {
          permisos.push({ modulo, accion, permitido: enabled });
        }
      });
    });
    return permisos;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    let permisosPayload;
    if (isEdit) {
      // Editar: manda todos para que el backend pueda quitar los desmarcados
      permisosPayload = buildPermisos(false);
    } else {
      // Crear: solo los habilitados; si ninguno, omite la clave
      const habilitados = buildPermisos(true);
      permisosPayload = habilitados.length > 0 ? habilitados : undefined;
    }

    const payload = {
      nombre:      form.nombre.trim().toUpperCase(),
      descripcion: form.descripcion.trim(),
      ...(permisosPayload !== undefined ? { permisos: permisosPayload } : {}),
    };

    try {
      if (isEdit) await update.mutateAsync({ id: roleId, ...payload });
      else        await create.mutateAsync(payload);
      onClose();
    } catch (err) {
      const responseData = err?.original?.response?.data;
      const code = err?.code;
      if (code === 'CONFLICT') {
        setErrors((p) => ({ ...p, nombre: err.message ?? 'Este nombre ya está en uso' }));
      } else if (code === 'VALIDATION_ERROR' && Array.isArray(responseData?.errors)) {
        const mapped = {};
        responseData.errors.forEach(({ campo, mensaje }) => { mapped[campo] = mensaje; });
        setErrors((p) => ({ ...p, ...mapped }));
      }
    }
  };

  if (!mounted) return null;

  const busy    = create.isPending || update.isPending;
  const loading = isEdit && roleLoading;

  return (
    <>
      <style>{`
        @keyframes rfSlideIn  { from{transform:translateX(100%)} to{transform:translateX(0)} }
        @keyframes rfSlideOut { from{transform:translateX(0)}   to{transform:translateX(100%)} }
        @keyframes rfFadeIn   { from{opacity:0} to{opacity:1} }
        @keyframes rfFadeOut  { from{opacity:1} to{opacity:0} }
        .rf-ov-in  { animation: rfFadeIn  280ms ease forwards; }
        .rf-ov-out { animation: rfFadeOut 280ms ease forwards; }
        .rf-pan-in { animation: rfSlideIn  300ms cubic-bezier(0.32,0.72,0,1) forwards; }
        .rf-pan-out{ animation: rfSlideOut 280ms cubic-bezier(0.32,0.72,0,1) forwards; }

        .rf-input {
          width:100%; height:40px; border-radius:10px;
          background:#f9fafb; border:1px solid #e5e7eb;
          color:#1f2937; font-size:13px; padding:0 12px;
          outline:none; box-sizing:border-box; font-family:inherit;
          transition:border-color 150ms,box-shadow 150ms,background 150ms;
        }
        .rf-input:focus{border-color:#8c916c;box-shadow:0 0 0 3px rgba(140,145,108,0.12);background:#fff;}
        .rf-input.err{border-color:rgba(239,68,68,0.5);}
        .rf-input.err:focus{box-shadow:0 0 0 3px rgba(239,68,68,0.10);}

        .rf-close{width:30px;height:30px;border-radius:8px;background:transparent;border:1px solid #e5e7eb;cursor:pointer;color:#9ca3af;display:flex;align-items:center;justify-content:center;transition:background 150ms,color 150ms;}
        .rf-close:hover{background:#f3f4f6;color:#374151;}

        .rf-cb { width:15px;height:15px;cursor:pointer;accent-color:#55624a; }

        .rf-th {
          font-size:11px;font-weight:700;color:#6b7280;
          letter-spacing:0.06em;text-transform:uppercase;
          text-align:center;padding:7px 4px;cursor:pointer;user-select:none;
          transition:color 120ms;
        }
        .rf-th:hover{color:#374151;}

        .rf-tr:hover td{background:#fafaf9;}
        .rf-td-lbl{
          font-size:12.5px;font-weight:500;color:#374151;
          padding:7px 8px 7px 12px;cursor:pointer;user-select:none;
          white-space:nowrap;transition:color 120ms;
        }
        .rf-tr:hover .rf-td-lbl{color:#111827;}
        .rf-td-cb{text-align:center;padding:6px 4px;}

        .rf-btn-cancel{flex:1;height:40px;border-radius:10px;border:1px solid #e5e7eb;background:white;color:#6b7280;font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;transition:background 150ms;}
        .rf-btn-cancel:hover{background:#f9fafb;}
        .rf-btn-submit{flex:2;height:40px;border-radius:10px;border:none;background:#55624a;color:white;font-size:13px;font-weight:700;cursor:pointer;font-family:'Syne',sans-serif;transition:opacity 150ms;display:flex;align-items:center;justify-content:center;gap:6px;}
        .rf-btn-submit:hover:not(:disabled){opacity:0.88;}
        .rf-btn-submit:disabled{background:#e5e7eb;color:#9ca3af;cursor:not-allowed;}
      `}</style>

      {/* Overlay */}
      <div
        className={open ? 'rf-ov-in' : 'rf-ov-out'}
        onClick={onClose}
        style={{ position:'fixed',inset:0,zIndex:1000,background:'rgba(0,0,0,0.18)',backdropFilter:'blur(2px)' }}
      />

      {/* Panel */}
      <div
        className={open ? 'rf-pan-in' : 'rf-pan-out'}
        style={{
          position:'fixed',top:0,right:0,bottom:0,zIndex:1001,
          width:580,background:'#ffffff',
          borderLeft:'1px solid #e5e7eb',
          boxShadow:'-12px 0 40px rgba(0,0,0,0.08)',
          display:'flex',flexDirection:'column',overflow:'hidden',
        }}
      >
        {/* Header */}
        <div style={{ display:'flex',alignItems:'center',gap:10,padding:'20px 20px 18px',borderBottom:'1px solid #f3f4f6',flexShrink:0 }}>
          <div style={{ width:34,height:34,borderRadius:10,background:'rgba(85,98,74,0.10)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
            <Shield size={16} color="#55624a" />
          </div>
          <div style={{ flex:1 }}>
            <h3 style={{ color:'#111827',fontSize:15,fontWeight:700,margin:0,fontFamily:"'Syne',sans-serif" }}>
              {isEdit ? 'Editar rol' : 'Nuevo rol'}
            </h3>
            <p style={{ color:'#9ca3af',fontSize:12,margin:0 }}>
              {isEdit ? 'Nombre, descripción y permisos' : 'Define el nombre y los permisos del rol'}
            </p>
          </div>
          <button className="rf-close" onClick={onClose}><X size={15} /></button>
        </div>

        {/* Body */}
        {loading ? (
          <div style={{ flex:1,display:'flex',alignItems:'center',justifyContent:'center' }}>
            <Loader2 size={24} className="animate-spin" style={{ color:'#9ca3af' }} />
          </div>
        ) : (
          <div style={{ flex:1,overflowY:'auto',padding:'20px',display:'flex',flexDirection:'column',gap:18 }}>

            {/* Nombre */}
            <div style={{ display:'flex',flexDirection:'column',gap:5 }}>
              <label style={{ color:'#6b7280',fontSize:11,fontWeight:600,letterSpacing:'0.06em',textTransform:'uppercase' }}>
                Nombre del rol
              </label>
              <input
                className={`rf-input${errors.nombre ? ' err' : ''}`}
                value={form.nombre}
                onChange={(e) => setField('nombre', e.target.value)}
                placeholder="Ej: CAJERO"
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
              <input
                className="rf-input"
                value={form.descripcion}
                onChange={(e) => setField('descripcion', e.target.value)}
                placeholder="Describe brevemente las responsabilidades de este rol"
              />
            </div>

            {/* Permissions matrix */}
            <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                <label style={{ color:'#6b7280',fontSize:11,fontWeight:600,letterSpacing:'0.06em',textTransform:'uppercase' }}>
                  Matriz de permisos
                </label>
                <span style={{ color:'#b0b5b0',fontSize:11 }}>
                  Clic en módulo o columna para marcar todos
                </span>
              </div>

              <div style={{ border:'1px solid #e5e7eb',borderRadius:12,overflow:'hidden' }}>
                <table style={{ width:'100%',borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ background:'#f9fafb',borderBottom:'2px solid #e5e7eb' }}>
                      <th style={{ textAlign:'left',padding:'8px 8px 8px 12px',fontSize:11,fontWeight:700,color:'#374151',letterSpacing:'0.06em',textTransform:'uppercase' }}>
                        Módulo
                      </th>
                      {ACTIONS.map(({ key, label }) => (
                        <th
                          key={key}
                          className="rf-th"
                          onClick={() => toggleCol(key)}
                          title={`Marcar/desmarcar todos en "${label}"`}
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MODULES.map(({ key: mod, label }, idx) => (
                      <tr
                        key={mod}
                        className="rf-tr"
                        style={{ borderTop: idx > 0 ? '1px solid #f3f4f6' : 'none' }}
                      >
                        <td
                          className="rf-td-lbl"
                          onClick={() => toggleRow(mod)}
                          title="Marcar/desmarcar fila completa"
                        >
                          {label}
                        </td>
                        {ACTIONS.map(({ key: act }) => (
                          <td key={act} className="rf-td-cb">
                            <input
                              type="checkbox"
                              className="rf-cb"
                              checked={matrix[mod][act]}
                              onChange={() => togglePerm(mod, act)}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ flexShrink:0,padding:'14px 20px 20px',borderTop:'1px solid #f3f4f6',display:'flex',gap:10,background:'#ffffff' }}>
          <button type="button" className="rf-btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="rf-btn-submit" disabled={busy || loading} onClick={handleSubmit}>
            {busy && <Loader2 size={13} className="animate-spin" />}
            {busy ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear rol'}
          </button>
        </div>
      </div>
    </>
  );
}
