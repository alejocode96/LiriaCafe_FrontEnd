import { useState, useEffect } from 'react';
import { X, Users, Loader2 } from 'lucide-react';
import { useCreateUser, useUpdateUser, useRoles } from '../../hooks/useUsers';

const EMPTY = {
  nombreCompleto: '',
  username: '',
  correo: '',
  contrasena: '',
  rolId: '',
};

function Field({ label, hint, error, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <div style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
        <label
          style={{
            color: '#6b7280', fontSize: 11, fontWeight: 600,
            letterSpacing: '0.06em', textTransform: 'uppercase',
          }}
        >
          {label}
        </label>
        {hint && <span style={{ color: '#b0b5b0', fontSize: 11 }}>{hint}</span>}
      </div>
      {children}
      {error && <span style={{ color: '#ef4444', fontSize: 12 }}>{error}</span>}
    </div>
  );
}

export default function UserFormModal({ open, onClose, user }) {
  const isEdit = !!user;
  const create = useCreateUser();
  const update = useUpdateUser();
  const { data: rolesData, isLoading: rolesLoading } = useRoles();

  // Handle both { data: [...] } and [...] API response shapes
  const roles = Array.isArray(rolesData)
    ? rolesData
    : Array.isArray(rolesData?.data)
    ? rolesData.data
    : [];

  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [mounted, setMounted] = useState(false);

  // Mount / unmount with animation
  useEffect(() => {
    if (open) {
      setMounted(true);
    } else {
      const t = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Reset and populate form when opening
  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (user) {
      setForm({
        nombreCompleto: user.nombreCompleto ?? user.nombre ?? '',
        username:       user.nombreUsuario ?? user.username ?? '',
        correo:         user.correo ?? user.email ?? '',
        contrasena:     '',
        rolId:          user.rol?.id ?? user.rolId ?? '',
      });
    } else {
      setForm(EMPTY);
    }
  }, [open, user]);

  const set = (field, value) => {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => ({ ...p, [field]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.nombreCompleto.trim())
      e.nombreCompleto = 'El nombre completo es obligatorio';
    if (!form.username.trim())
      e.username = 'El nombre de usuario es obligatorio';
    if (!form.correo.trim()) {
      e.correo = 'El correo es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo)) {
      e.correo = 'Correo inválido';
    }
    if (!isEdit) {
      if (!form.contrasena)
        e.contrasena = 'La contraseña temporal es obligatoria';
      else if (form.contrasena.length < 6)
        e.contrasena = 'Mínimo 6 caracteres';
      else if (!/[!@#$%^&*(),.?":{}|<>]/.test(form.contrasena))
        e.contrasena = 'Debe contener al menos un carácter especial (!@#$%^&*...)';
    }
    if (!form.rolId) e.rolId = 'Debes asignar un rol';
    return e;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const payload = {
      nombreCompleto: form.nombreCompleto.trim(),
      nombreUsuario:  form.username.trim(),
      correo:         form.correo.trim(),
      rolId:          form.rolId,
      ...(!isEdit ? { contrasena: form.contrasena } : {}),
    };

    try {
      if (isEdit) await update.mutateAsync({ id: user.id, ...payload });
      else        await create.mutateAsync(payload);
      onClose();
    } catch (err) {
      const responseData = err?.original?.response?.data;
      const code = err?.code;

      if (code === 'VALIDATION_ERROR' && Array.isArray(responseData?.errors)) {
        // { campo, mensaje } → map nombreUsuario → username (key interno del form)
        const FIELD_MAP = {
          nombreCompleto: 'nombreCompleto',
          nombreUsuario:  'username',
          correo:         'correo',
          contrasena:     'contrasena',
          rolId:          'rolId',
        };
        const mapped = {};
        responseData.errors.forEach(({ campo, mensaje }) => {
          const key = FIELD_MAP[campo] ?? campo;
          mapped[key] = mensaje;
        });
        if (Object.keys(mapped).length) setErrors((p) => ({ ...p, ...mapped }));
      } else if (code === 'CONFLICT') {
        const msg = err?.message ?? '';
        const lmsg = msg.toLowerCase();
        if (lmsg.includes('correo') || lmsg.includes('email')) {
          setErrors((p) => ({ ...p, correo: msg }));
        } else {
          setErrors((p) => ({ ...p, username: msg }));
        }
      }
    }
  };

  if (!mounted) return null;

  const busy = create.isPending || update.isPending;

  return (
    <>
      <style>{`
        @keyframes ufSlideIn  { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes ufSlideOut { from { transform: translateX(0); }   to { transform: translateX(100%); } }
        @keyframes ufFadeIn   { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ufFadeOut  { from { opacity: 1; } to { opacity: 0; } }
        .uf-overlay-in  { animation: ufFadeIn  280ms ease forwards; }
        .uf-overlay-out { animation: ufFadeOut 280ms ease forwards; }
        .uf-panel-in    { animation: ufSlideIn  300ms cubic-bezier(0.32,0.72,0,1) forwards; }
        .uf-panel-out   { animation: ufSlideOut 280ms cubic-bezier(0.32,0.72,0,1) forwards; }

        .uf-input {
          width: 100%; height: 40px; border-radius: 10px;
          background: #f9fafb; border: 1px solid #e5e7eb;
          color: #1f2937; font-size: 13px; padding: 0 12px;
          outline: none; box-sizing: border-box; font-family: inherit;
          transition: border-color 150ms, box-shadow 150ms, background 150ms;
        }
        .uf-input:focus {
          border-color: #8c916c;
          box-shadow: 0 0 0 3px rgba(140,145,108,0.12);
          background: #fff;
        }
        .uf-input.err { border-color: rgba(239,68,68,0.5); }
        .uf-input.err:focus { box-shadow: 0 0 0 3px rgba(239,68,68,0.10); }

        .uf-select {
          width: 100%; height: 40px; border-radius: 10px;
          background: #f9fafb; border: 1px solid #e5e7eb;
          color: #1f2937; font-size: 13px; padding: 0 28px 0 12px;
          outline: none; box-sizing: border-box; cursor: pointer;
          font-family: inherit; transition: border-color 150ms;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 10px center;
        }
        .uf-select:focus {
          border-color: #8c916c;
          box-shadow: 0 0 0 3px rgba(140,145,108,0.12);
          background-color: #fff;
        }
        .uf-select.err { border-color: rgba(239,68,68,0.5); }
        .uf-select:disabled { opacity: 0.6; cursor: not-allowed; }

        .uf-close-btn {
          width: 30px; height: 30px; border-radius: 8px;
          background: transparent; border: 1px solid #e5e7eb;
          cursor: pointer; color: #9ca3af; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          transition: background 150ms, color 150ms;
        }
        .uf-close-btn:hover { background: #f3f4f6; color: #374151; }

        .uf-btn-cancel {
          flex: 1; height: 40px; border-radius: 10px;
          border: 1px solid #e5e7eb; background: white;
          color: #6b7280; font-size: 13px; font-weight: 500;
          cursor: pointer; font-family: inherit; transition: background 150ms;
        }
        .uf-btn-cancel:hover { background: #f9fafb; }

        .uf-btn-submit {
          flex: 2; height: 40px; border-radius: 10px; border: none;
          background: #55624a; color: white;
          font-size: 13px; font-weight: 700; cursor: pointer;
          font-family: 'Syne', sans-serif; transition: opacity 150ms;
          display: flex; align-items: center; justify-content: center; gap: 6px;
        }
        .uf-btn-submit:hover:not(:disabled) { opacity: 0.88; }
        .uf-btn-submit:disabled { background: #e5e7eb; color: #9ca3af; cursor: not-allowed; }
      `}</style>

      {/* Overlay */}
      <div
        className={open ? 'uf-overlay-in' : 'uf-overlay-out'}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.18)', backdropFilter: 'blur(2px)' }}
      />

      {/* Sliding panel */}
      <div
        className={open ? 'uf-panel-in' : 'uf-panel-out'}
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 1001,
          width: 420, background: '#ffffff',
          borderLeft: '1px solid #e5e7eb',
          boxShadow: '-12px 0 40px rgba(0,0,0,0.08)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '20px 20px 18px', borderBottom: '1px solid #f3f4f6', flexShrink: 0 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(85,98,74,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Users size={16} color="#55624a" />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ color: '#111827', fontSize: 15, fontWeight: 700, margin: 0, fontFamily: "'Syne', sans-serif" }}>
              {isEdit ? 'Editar usuario' : 'Nuevo usuario'}
            </h3>
            <p style={{ color: '#9ca3af', fontSize: 12, margin: 0 }}>
              {isEdit ? 'Modifica los datos del colaborador' : 'Registra un nuevo colaborador'}
            </p>
          </div>
          <button className="uf-close-btn" onClick={onClose}><X size={15} /></button>
        </div>

        {/* Fields */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Nombre completo */}
          <Field label="Nombre completo" error={errors.nombreCompleto}>
            <input
              className={`uf-input${errors.nombreCompleto ? ' err' : ''}`}
              value={form.nombreCompleto}
              onChange={(e) => set('nombreCompleto', e.target.value)}
              placeholder="Ej: Juan Pérez García"
            />
          </Field>

          {/* Nombre de usuario — fila completa */}
          <Field label="Nombre de usuario" error={errors.username}>
            <input
              className={`uf-input${errors.username ? ' err' : ''}`}
              value={form.username}
              onChange={(e) => set('username', e.target.value.toLowerCase().replace(/\s/g, ''))}
              placeholder="juanperez"
              autoComplete="off"
            />
          </Field>

          {/* Correo electrónico — fila completa */}
          <Field label="Correo electrónico" error={errors.correo}>
            <input
              className={`uf-input${errors.correo ? ' err' : ''}`}
              value={form.correo}
              onChange={(e) => set('correo', e.target.value)}
              placeholder="juan@cafeteria.com"
              type="email"
              autoComplete="off"
            />
          </Field>

          {/* Contraseña temporal — solo en creación */}
          {!isEdit && (
            <Field
              label="Contraseña temporal"
              hint="El usuario deberá cambiarla al ingresar"
              error={errors.contrasena}
            >
              <input
                className={`uf-input${errors.contrasena ? ' err' : ''}`}
                type="password"
                value={form.contrasena}
                onChange={(e) => set('contrasena', e.target.value)}
                placeholder="Mín. 6 chars + un especial (!@#...)"
                autoComplete="new-password"
              />
            </Field>
          )}

          {/* Rol */}
          <Field label="Rol" error={errors.rolId}>
            <div style={{ position: 'relative' }}>
              <select
                className={`uf-select${errors.rolId ? ' err' : ''}`}
                value={form.rolId}
                onChange={(e) => set('rolId', e.target.value)}
                disabled={rolesLoading}
              >
                <option value="">
                  {rolesLoading ? 'Cargando roles…' : roles.length === 0 ? 'Sin roles disponibles' : 'Seleccionar rol…'}
                </option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>{r.nombre}</option>
                ))}
              </select>
              {rolesLoading && (
                <Loader2
                  size={13}
                  className="animate-spin"
                  style={{ position: 'absolute', right: 28, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }}
                />
              )}
            </div>
          </Field>

          {/* Nota en modo edición */}
          {isEdit && (
            <div style={{ padding: '10px 12px', borderRadius: 10, background: '#f9fafb', border: '1px solid #e5e7eb', fontSize: 12, color: '#9ca3af', lineHeight: 1.5 }}>
              Para cambiar la contraseña usa la acción "Forzar cambio de clave" en los botones de acción de la tabla.
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ flexShrink: 0, padding: '14px 20px 20px', borderTop: '1px solid #f3f4f6', display: 'flex', gap: 10, background: '#ffffff' }}>
          <button type="button" className="uf-btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="uf-btn-submit" disabled={busy} onClick={handleSubmit}>
            {busy && <Loader2 size={13} className="animate-spin" />}
            {busy ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear usuario'}
          </button>
        </div>
      </div>
    </>
  );
}
