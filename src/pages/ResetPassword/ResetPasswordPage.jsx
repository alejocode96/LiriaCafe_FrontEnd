import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, Loader2, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { resetPasswordRequest } from '../../api/auth.service';

const SPECIAL_RE = /[!@#$%^&*(),.?":{}|<>]/;

function PasswordField({ label, id, value, onChange, error, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label htmlFor={id} style={{ color: '#6b7280', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(85,98,74,0.5)', display: 'flex', pointerEvents: 'none' }}>
          <Lock size={16} />
        </span>
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="new-password"
          style={{
            width: '100%', height: 50, borderRadius: 14,
            border: `1.5px solid ${error ? '#ef4444' : 'rgba(140,145,108,0.25)'}`,
            background: '#f4f4f2', paddingLeft: 44, paddingRight: 44,
            fontSize: 15, color: '#003a30', fontFamily: 'inherit',
            outline: 'none', boxSizing: 'border-box',
            transition: 'border-color 150ms, box-shadow 150ms',
          }}
          className="rp-input"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', padding: 0 }}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && <span style={{ color: '#ef4444', fontSize: 13, paddingLeft: 2 }}>{error}</span>}
    </div>
  );
}

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';

  const [form, setForm] = useState({ nuevaContrasena: '', confirmarContrasena: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const setField = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: '' }));
  };

  const validate = () => {
    const e = {};
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
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setBusy(true);
    try {
      await resetPasswordRequest({
        token,
        nuevaContrasena:     form.nuevaContrasena,
        confirmarContrasena: form.confirmarContrasena,
      });
      setDone(true);
      setTimeout(() => navigate('/login', { replace: true }), 3000);
    } catch (err) {
      const code = err?.code;
      const responseData = err?.original?.response?.data;
      if (code === 'VALIDATION_ERROR' && Array.isArray(responseData?.errors)) {
        const mapped = {};
        responseData.errors.forEach(({ campo, mensaje }) => { mapped[campo] = mensaje; });
        setErrors((p) => ({ ...p, ...mapped }));
      } else {
        setErrors((p) => ({ ...p, nuevaContrasena: err.message ?? 'Error al restablecer la contraseña' }));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; }
        .rp-input:focus { border-color: #55624a !important; box-shadow: 0 0 0 4px rgba(85,98,74,0.10); }
        .rp-input::placeholder { color: rgba(85,98,74,0.45); }
        @keyframes rpIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
        @keyframes rpCheck { 0%{transform:scale(0)} 60%{transform:scale(1.2)} 100%{transform:scale(1)} }
      `}</style>

      <div style={{
        width: '100vw', height: '100dvh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(145deg, #001a12 0%, #1a3022 50%, #003a30 100%)',
        fontFamily: 'system-ui, sans-serif', padding: 20,
      }}>
        {/* Decoración */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(85,98,74,0.2) 0%, transparent 70%)', top: -120, right: -120 }} />
          <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(140,145,108,0.12) 0%, transparent 70%)', bottom: -100, left: -80 }} />
        </div>

        <div style={{
          position: 'relative', width: '100%', maxWidth: 460,
          background: 'rgba(255,255,255,0.97)', borderRadius: 24,
          boxShadow: '0 32px 80px rgba(0,0,0,0.35)',
          overflow: 'hidden', animation: 'rpIn 350ms cubic-bezier(0.34,1.1,0.64,1)',
        }}>
          <div style={{ height: 5, background: 'linear-gradient(90deg, #003a30, #55624a, #8c916c)' }} />

          <div style={{ padding: '36px 36px 40px' }}>
            {/* Logo */}
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <img src="/Logo.png" style={{ width: 56, marginBottom: 12 }} alt="Logo" onError={(e) => { e.target.style.display = 'none'; }} />
              <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8c916c', margin: 0 }}>
                Liria Café · POS
              </h1>
            </div>

            {/* Sin token */}
            {!token ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <AlertCircle size={26} color="#ef4444" />
                </div>
                <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 800, color: '#003a30', margin: '0 0 10px' }}>
                  Enlace inválido
                </h2>
                <p style={{ color: 'rgba(85,98,74,0.7)', fontSize: 14, lineHeight: 1.6, margin: '0 0 24px' }}>
                  Este enlace no contiene un token de recuperación válido. Solicita un nuevo enlace desde la página de recuperación.
                </p>
                <button
                  onClick={() => navigate('/forgot-password')}
                  style={{ width: '100%', height: 48, borderRadius: 14, border: 'none', background: '#003a30', color: 'white', fontSize: 14, fontWeight: 700, fontFamily: "'Syne',sans-serif", cursor: 'pointer' }}
                >
                  Solicitar nuevo enlace
                </button>
              </div>
            ) : done ? (
              /* Éxito */
              <div style={{ textAlign: 'center', animation: 'rpIn 300ms ease' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(85,98,74,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', animation: 'rpCheck 400ms cubic-bezier(0.34,1.4,0.64,1) forwards' }}>
                  <CheckCircle size={30} color="#55624a" />
                </div>
                <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800, color: '#003a30', margin: '0 0 10px' }}>
                  ¡Contraseña restablecida!
                </h2>
                <p style={{ color: 'rgba(85,98,74,0.7)', fontSize: 14, lineHeight: 1.6, margin: '0 0 8px' }}>
                  Tu contraseña ha sido actualizada exitosamente.
                </p>
                <p style={{ color: '#9ca3af', fontSize: 13, margin: '0 0 24px' }}>
                  Redirigiendo al inicio de sesión…
                </p>
                <button
                  onClick={() => navigate('/login', { replace: true })}
                  style={{ width: '100%', height: 48, borderRadius: 14, border: 'none', background: '#003a30', color: 'white', fontSize: 14, fontWeight: 700, fontFamily: "'Syne',sans-serif", cursor: 'pointer' }}
                >
                  Ir al inicio de sesión
                </button>
              </div>
            ) : (
              /* Formulario */
              <>
                <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, color: '#003a30', margin: '0 0 8px' }}>
                  Nueva contraseña
                </h2>
                <p style={{ color: 'rgba(85,98,74,0.7)', fontSize: 14, lineHeight: 1.5, margin: '0 0 28px' }}>
                  Elige una contraseña segura. Recuerda: mínimo 8 caracteres, una mayúscula, un número y un símbolo.
                </p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <PasswordField
                    id="rp-nueva"
                    label="Nueva contraseña"
                    value={form.nuevaContrasena}
                    onChange={(v) => setField('nuevaContrasena', v)}
                    error={errors.nuevaContrasena}
                    placeholder="Ej: MiClaveSegura123!"
                  />
                  <PasswordField
                    id="rp-confirmar"
                    label="Confirmar contraseña"
                    value={form.confirmarContrasena}
                    onChange={(v) => setField('confirmarContrasena', v)}
                    error={errors.confirmarContrasena}
                    placeholder="Repite la nueva contraseña"
                  />

                  <button
                    type="submit"
                    disabled={busy}
                    style={{
                      marginTop: 4, height: 50, borderRadius: 14, border: 'none',
                      background: busy ? 'rgba(0,58,48,0.6)' : '#003a30',
                      color: 'white', fontSize: 15, fontWeight: 700,
                      fontFamily: "'Syne',sans-serif",
                      cursor: busy ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      transition: 'background 150ms',
                    }}
                  >
                    {busy && <Loader2 size={16} className="animate-spin" />}
                    {busy ? 'Restableciendo…' : 'Restablecer contraseña'}
                  </button>
                </form>

                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  style={{ marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', background: 'none', border: 'none', color: '#55624a', fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: '8px 0' }}
                >
                  <ArrowLeft size={15} />
                  Volver al inicio de sesión
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
