import { useState } from 'react';
import { Lock, Eye, EyeOff, Loader2, ShieldAlert } from 'lucide-react';
import { changePasswordRequest } from '../../api/auth.service';
import { useAuthStore } from '../../store/auth.store';

const SPECIAL_RE = /[!@#$%^&*(),.?":{}|<>]/;

function PasswordField({ label, value, onChange, error, placeholder, id }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label htmlFor={id} style={{ color: '#6b7280', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'rgba(85,98,74,0.5)', display: 'flex', pointerEvents: 'none' }}>
          <Lock size={15} />
        </span>
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="new-password"
          style={{
            width: '100%', height: 42, borderRadius: 10,
            border: `1px solid ${error ? 'rgba(239,68,68,0.5)' : '#e5e7eb'}`,
            background: '#f9fafb', color: '#1f2937', fontSize: 13,
            paddingLeft: 36, paddingRight: 40,
            outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
            transition: 'border-color 150ms, box-shadow 150ms',
          }}
          className={`fpc-input${error ? ' fpc-err' : ''}`}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', padding: 0 }}
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
      {error && <span style={{ color: '#ef4444', fontSize: 12 }}>{error}</span>}
    </div>
  );
}

export default function ForcePasswordChangeModal() {
  const { usuario, clearRequiereCambioClave } = useAuthStore();
  const [form, setForm] = useState({ contrasenaActual: '', nuevaContrasena: '', confirmarContrasena: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);

  const setField = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.contrasenaActual) e.contrasenaActual = 'Ingresa tu contraseña actual';
    if (!form.nuevaContrasena) {
      e.nuevaContrasena = 'Ingresa la nueva contraseña';
    } else if (form.nuevaContrasena.length < 8) {
      e.nuevaContrasena = 'Mínimo 8 caracteres';
    } else if (!/[A-Z]/.test(form.nuevaContrasena)) {
      e.nuevaContrasena = 'Debe contener al menos una mayúscula';
    } else if (!/[0-9]/.test(form.nuevaContrasena)) {
      e.nuevaContrasena = 'Debe contener al menos un número';
    } else if (!SPECIAL_RE.test(form.nuevaContrasena)) {
      e.nuevaContrasena = 'Debe contener al menos un carácter especial (!@#$%^&*...)';
    }
    if (!form.confirmarContrasena) {
      e.confirmarContrasena = 'Confirma la nueva contraseña';
    } else if (form.nuevaContrasena && form.confirmarContrasena !== form.nuevaContrasena) {
      e.confirmarContrasena = 'Las contraseñas no coinciden';
    }
    return e;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setBusy(true);
    try {
      await changePasswordRequest({
        contrasenaActual:    form.contrasenaActual,
        nuevaContrasena:     form.nuevaContrasena,
        confirmarContrasena: form.confirmarContrasena,
      });
      setSuccess(true);
      setTimeout(() => clearRequiereCambioClave(), 1800);
    } catch (err) {
      const code = err?.code;
      const responseData = err?.original?.response?.data;
      if (code === 'VALIDATION_ERROR' && Array.isArray(responseData?.errors)) {
        const mapped = {};
        responseData.errors.forEach(({ campo, mensaje }) => { mapped[campo] = mensaje; });
        setErrors((p) => ({ ...p, ...mapped }));
      } else if (code === 'AUTHENTICATION_ERROR') {
        setErrors((p) => ({ ...p, contrasenaActual: err.message ?? 'Contraseña actual incorrecta' }));
      } else {
        setErrors((p) => ({ ...p, contrasenaActual: err.message ?? 'Error al cambiar la contraseña' }));
      }
    } finally {
      setBusy(false);
    }
  };

  const nombre = usuario?.nombreCompleto ?? usuario?.nombreUsuario ?? 'usuario';

  return (
    <>
      <style>{`
        .fpc-input:focus { border-color: #8c916c !important; box-shadow: 0 0 0 3px rgba(140,145,108,0.12); background: #fff; }
        .fpc-input.fpc-err:focus { box-shadow: 0 0 0 3px rgba(239,68,68,0.10); }
        @keyframes fpcIn { from{opacity:0;transform:scale(0.95) translateY(8px)} to{opacity:1;transform:none} }
        @keyframes fpcCheck { 0%{transform:scale(0)} 60%{transform:scale(1.2)} 100%{transform:scale(1)} }
      `}</style>

      {/* Overlay difuminado — cubre todo el layout */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(8px) brightness(0.7)',
        WebkitBackdropFilter: 'blur(8px) brightness(0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}>
        {/* Card */}
        <div style={{
          width: '100%', maxWidth: 460,
          background: '#ffffff', borderRadius: 20,
          boxShadow: '0 24px 80px rgba(0,0,0,0.30)',
          overflow: 'hidden',
          animation: 'fpcIn 300ms cubic-bezier(0.34,1.1,0.64,1) forwards',
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #003a30 0%, #55624a 100%)',
            padding: '24px 28px 20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ShieldAlert size={20} color="rgba(255,255,255,0.9)" />
              </div>
              <div>
                <h2 style={{ color: '#ffffff', fontSize: 16, fontWeight: 700, margin: 0, fontFamily: "'Syne',sans-serif" }}>
                  Cambio de contraseña obligatorio
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, margin: 0 }}>
                  Hola, {nombre} — debes establecer una nueva contraseña
                </p>
              </div>
            </div>
            <p style={{
              color: 'rgba(255,255,255,0.75)', fontSize: 12.5, margin: 0,
              lineHeight: 1.55, padding: '10px 12px', borderRadius: 10,
              background: 'rgba(255,255,255,0.08)',
            }}>
              Por seguridad, tu cuenta requiere un cambio de contraseña antes de continuar. Elige una contraseña segura con al menos 8 caracteres, una mayúscula, un número y un símbolo.
            </p>
          </div>

          {/* Body */}
          {success ? (
            <div style={{ padding: '36px 28px', textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(85,98,74,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', animation: 'fpcCheck 400ms cubic-bezier(0.34,1.4,0.64,1) forwards' }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#55624a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p style={{ color: '#111827', fontWeight: 700, fontSize: 15, margin: '0 0 6px', fontFamily: "'Syne',sans-serif" }}>Contraseña actualizada</p>
              <p style={{ color: '#9ca3af', fontSize: 13, margin: 0 }}>Redirigiendo al sistema…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ padding: '24px 28px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <PasswordField
                id="fpc-actual"
                label="Contraseña actual"
                value={form.contrasenaActual}
                onChange={(v) => setField('contrasenaActual', v)}
                error={errors.contrasenaActual}
                placeholder="Tu contraseña actual"
              />
              <PasswordField
                id="fpc-nueva"
                label="Nueva contraseña"
                value={form.nuevaContrasena}
                onChange={(v) => setField('nuevaContrasena', v)}
                error={errors.nuevaContrasena}
                placeholder="Mínimo 8 caracteres, mayúscula, número y símbolo"
              />
              <PasswordField
                id="fpc-confirmar"
                label="Confirmar nueva contraseña"
                value={form.confirmarContrasena}
                onChange={(v) => setField('confirmarContrasena', v)}
                error={errors.confirmarContrasena}
                placeholder="Repite la nueva contraseña"
              />

              <button
                type="submit"
                disabled={busy}
                style={{
                  marginTop: 4, height: 44, borderRadius: 11, border: 'none',
                  background: busy ? 'rgba(85,98,74,0.5)' : '#55624a',
                  color: 'white', fontSize: 14, fontWeight: 700,
                  fontFamily: "'Syne',sans-serif", cursor: busy ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'opacity 150ms',
                }}
              >
                {busy && <Loader2 size={15} className="animate-spin" />}
                {busy ? 'Guardando…' : 'Establecer nueva contraseña'}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
