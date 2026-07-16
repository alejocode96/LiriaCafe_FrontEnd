import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { forgotPasswordRequest } from '../../api/auth.service';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [correo, setCorreo] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const validate = () => {
    if (!correo.trim()) return 'El correo electrónico es obligatorio';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim()))
      return 'Ingresa un correo electrónico válido';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setBusy(true);
    try {
      await forgotPasswordRequest(correo.trim());
      setSent(true);
    } catch {
      // El backend devuelve success:true incluso si no existe el correo (privacidad).
      // Si hay un error real (red, 5xx) lo mostramos igual.
      setSent(true);
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
        .fp-input {
          width: 100%; height: 50px; border-radius: 14px;
          border: 1.5px solid rgba(140,145,108,0.25);
          background: #f4f4f2; padding: 0 16px 0 44px;
          font-size: 15px; color: #003a30; font-family: inherit;
          outline: none; transition: border-color 150ms, box-shadow 150ms;
        }
        .fp-input:focus { border-color: #55624a; box-shadow: 0 0 0 4px rgba(85,98,74,0.10); }
        .fp-input.err { border-color: #ef4444; }
        .fp-input::placeholder { color: rgba(85,98,74,0.45); }
        @keyframes fpIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
        @keyframes fpCheck { 0%{transform:scale(0)} 60%{transform:scale(1.2)} 100%{transform:scale(1)} }
      `}</style>

      <div style={{
        width: '100vw', height: '100dvh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(145deg, #001a12 0%, #1a3022 50%, #003a30 100%)',
        fontFamily: 'system-ui, sans-serif', padding: 20,
      }}>
        {/* Decoración de fondo */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(85,98,74,0.2) 0%, transparent 70%)', top: -120, right: -120 }} />
          <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(140,145,108,0.12) 0%, transparent 70%)', bottom: -100, left: -80 }} />
        </div>

        <div style={{
          position: 'relative', width: '100%', maxWidth: 440,
          background: 'rgba(255,255,255,0.97)', borderRadius: 24,
          boxShadow: '0 32px 80px rgba(0,0,0,0.35)',
          overflow: 'hidden', animation: 'fpIn 350ms cubic-bezier(0.34,1.1,0.64,1)',
        }}>
          {/* Barra de color superior */}
          <div style={{ height: 5, background: 'linear-gradient(90deg, #003a30, #55624a, #8c916c)' }} />

          <div style={{ padding: '36px 36px 40px' }}>
            {/* Logo / marca */}
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <img src="/Logo.png" style={{ width: 56, marginBottom: 12 }} alt="Logo" onError={(e) => { e.target.style.display = 'none'; }} />
              <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8c916c', margin: 0 }}>
                Liria Café · POS
              </h1>
            </div>

            {sent ? (
              /* Estado: enviado */
              <div style={{ textAlign: 'center', animation: 'fpIn 300ms ease' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(85,98,74,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', animation: 'fpCheck 400ms cubic-bezier(0.34,1.4,0.64,1) forwards' }}>
                  <CheckCircle size={30} color="#55624a" />
                </div>
                <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800, color: '#003a30', margin: '0 0 10px' }}>
                  Revisa tu correo
                </h2>
                <p style={{ color: 'rgba(85,98,74,0.7)', fontSize: 14, lineHeight: 1.6, margin: '0 0 28px' }}>
                  Si <strong>{correo}</strong> está registrado en el sistema, recibirás un enlace para restablecer tu contraseña en los próximos minutos.
                </p>
                <p style={{ color: '#9ca3af', fontSize: 12.5, lineHeight: 1.5, margin: '0 0 28px', padding: '12px 16px', background: '#f9fafb', borderRadius: 10 }}>
                  Revisa también tu carpeta de spam o correo no deseado.
                </p>
                <button
                  onClick={() => navigate('/login')}
                  style={{ width: '100%', height: 48, borderRadius: 14, border: 'none', background: '#003a30', color: 'white', fontSize: 14, fontWeight: 700, fontFamily: "'Syne',sans-serif", cursor: 'pointer' }}
                >
                  Volver al inicio de sesión
                </button>
              </div>
            ) : (
              /* Formulario */
              <>
                <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, color: '#003a30', margin: '0 0 8px' }}>
                  Recuperar acceso
                </h2>
                <p style={{ color: 'rgba(85,98,74,0.7)', fontSize: 14, lineHeight: 1.5, margin: '0 0 28px' }}>
                  Ingresa tu correo y te enviaremos las instrucciones para restablecer tu contraseña.
                </p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(85,98,74,0.5)', display: 'flex', pointerEvents: 'none' }}>
                        <Mail size={17} />
                      </span>
                      <input
                        className={`fp-input${error ? ' err' : ''}`}
                        type="email"
                        value={correo}
                        onChange={(e) => { setCorreo(e.target.value); setError(''); }}
                        placeholder="Correo electrónico"
                        autoComplete="email"
                        autoFocus
                      />
                    </div>
                    {error && <p style={{ marginTop: 5, fontSize: 13, color: '#ef4444', paddingLeft: 4 }}>{error}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={busy}
                    style={{
                      height: 50, borderRadius: 14, border: 'none',
                      background: busy ? 'rgba(0,58,48,0.6)' : '#003a30',
                      color: 'white', fontSize: 15, fontWeight: 700,
                      fontFamily: "'Syne',sans-serif",
                      cursor: busy ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      transition: 'background 150ms',
                    }}
                  >
                    {busy && <Loader2 size={16} className="animate-spin" />}
                    {busy ? 'Enviando…' : 'Enviar instrucciones'}
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
