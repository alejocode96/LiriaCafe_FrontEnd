import { useState, useEffect } from 'react';
import {
  DollarSign, Clock, CheckCircle, TrendingUp, AlertTriangle,
  Loader2, Banknote, CreditCard, ShoppingCart, ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useCashCurrent, useOpenCashRegister, useCloseCashRegister } from '../../hooks/useCashRegister';
import { useMobile } from '../../hooks/useMobile';

// ── Constants ────────────────────────────────────────────────────────────────

const GLASS = {
  background: 'rgba(204,204,204,0.22)',
  backdropFilter: 'blur(28px) saturate(1.8)',
  WebkitBackdropFilter: 'blur(28px) saturate(1.8)',
};

const formatCOP = (v) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v ?? 0);

const DIF_BADGE = {
  CUADRE_PERFECTO: { bg: 'rgba(21,128,61,0.08)',  border: 'rgba(21,128,61,0.28)',   color: '#15803d', label: 'Cuadre perfecto' },
  SOBRANTE:        { bg: 'rgba(37,99,235,0.08)',   border: 'rgba(37,99,235,0.25)',   color: '#1d4ed8', label: 'Sobrante'        },
  FALTANTE:        { bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.25)',   color: '#dc2626', label: 'Faltante'        },
};

const IST = {
  width: '100%', padding: '8px 12px', borderRadius: 10, fontSize: 13,
  boxSizing: 'border-box', border: '1.5px solid #e5e7eb', outline: 'none',
  color: '#374151', background: 'white', transition: 'border-color 150ms',
};

// ── Sub-components ────────────────────────────────────────────────────────────

function Field({ label, required, error, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>
        {label}{required && <span style={{ color: '#ef4444', marginLeft: 3 }}>*</span>}
      </label>
      {children}
      {error && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#ef4444' }}>{error}</p>}
    </div>
  );
}

function MetricCard({ icon: Icon, iconColor, iconBg, label, value, sub }) {
  return (
    <div style={{ background: '#f9fafb', borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={13} color={iconColor} />
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      </div>
      <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#374151', fontFamily: "'Syne',sans-serif" }}>{value}</p>
      {sub && <p style={{ margin: '2px 0 0', fontSize: 11, color: '#9ca3af' }}>{sub}</p>}
    </div>
  );
}

// ── Close result modal (ActionConfirm style) ──────────────────────────────────

function CloseResultModal({ result, onClose }) {
  if (!result) return null;

  const r = result.resumen ?? {};
  const DIF_CFG = {
    CUADRE_PERFECTO: { icon: CheckCircle, iconBg: '#dcfce7', iconColor: '#16a34a', title: '¡Cuadre perfecto!',  desc: 'El efectivo contado coincide exactamente con lo esperado.' },
    SOBRANTE:        { icon: TrendingUp,  iconBg: '#dbeafe', iconColor: '#2563eb', title: 'Sobrante detectado', desc: `Hay ${formatCOP(r.diferenciaTotal)} más de lo esperado.` },
    FALTANTE:        { icon: AlertTriangle, iconBg: '#fee2e2', iconColor: '#dc2626', title: 'Diferencia detectada', desc: `Faltan ${formatCOP(Math.abs(r.diferenciaTotal ?? 0))} respecto a lo esperado.` },
  };
  const cfg  = DIF_CFG[r.tipoDiferencia] ?? DIF_CFG.CUADRE_PERFECTO;
  const Icon = cfg.icon;
  const transEsperadas = (r.saldoEsperadoTotal ?? 0) - (r.saldoEsperadoEfectivo ?? 0);

  const BRow = ({ label, esperado, contado, dif }) => {
    const color = dif > 0 ? '#1d4ed8' : dif < 0 ? '#dc2626' : '#15803d';
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, marginBottom: 4 }}>
        <span style={{ color: '#6b7280', minWidth: 110 }}>{label}</span>
        <span style={{ color: '#9ca3af' }}>{formatCOP(esperado)}</span>
        <span style={{ color: '#374151' }}>→ {formatCOP(contado)}</span>
        <span style={{ fontWeight: 700, color, minWidth: 72, textAlign: 'right' }}>
          {dif >= 0 ? '+' : ''}{formatCOP(dif)}
        </span>
      </div>
    );
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.30)', backdropFilter: 'blur(4px)' }}>
      <div style={{ width: '100%', maxWidth: 500, background: 'white', borderRadius: 20, border: '1px solid #e5e7eb', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', padding: 24 }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: cfg.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={17} style={{ color: cfg.iconColor }} />
          </div>
          <div>
            <h3 style={{ color: '#111827', fontSize: 14, fontWeight: 700, margin: '0 0 4px', fontFamily: "'Syne',sans-serif" }}>Caja cerrada exitosamente</h3>
            <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>{cfg.title} — {cfg.desc}</p>
          </div>
        </div>

        {/* breakdown */}
        <div style={{ background: '#f9fafb', borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(0,0,0,0.05)', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            <span style={{ minWidth: 110 }}>Concepto</span>
            <span>Esperado</span>
            <span>Contado</span>
            <span style={{ minWidth: 72, textAlign: 'right' }}>Diferencia</span>
          </div>
          <BRow
            label="Efectivo"
            esperado={r.saldoEsperadoEfectivo ?? 0}
            contado={(r.saldoEsperadoEfectivo ?? 0) + (r.diferenciaEfectivo ?? 0)}
            dif={r.diferenciaEfectivo ?? 0}
          />
          <BRow
            label="Transferencias"
            esperado={transEsperadas}
            contado={transEsperadas + (r.diferenciaTransferencias ?? 0)}
            dif={r.diferenciaTransferencias ?? 0}
          />
          <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', marginTop: 6, paddingTop: 6 }}>
            <BRow
              label="TOTAL"
              esperado={r.saldoEsperadoTotal ?? 0}
              contado={(r.saldoEsperadoTotal ?? 0) + (r.diferenciaTotal ?? 0)}
              dif={r.diferenciaTotal ?? 0}
            />
          </div>
        </div>

        <button onClick={onClose}
          style={{ width: '100%', height: 40, borderRadius: 10, border: 'none', background: '#374151', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Syne',sans-serif" }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}>
          Aceptar
        </button>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CajaPage() {
  const isMobile = useMobile();
  const { data: cajaData, isLoading, isFetching } = useCashCurrent();
  const openCaja  = useOpenCashRegister();
  const closeCaja = useCloseCashRegister();

  const [openForm,    setOpenForm]    = useState({ montoInicial: '', notas: '' });
  const [openErrors,  setOpenErrors]  = useState({});
  const [closeForm,   setCloseForm]   = useState({ conteoFisicoEfectivo: '', conteoTransferencias: '', notasCierre: '' });
  const [closeErrors, setCloseErrors] = useState({});
  const [closeResult, setCloseResult] = useState(null);
  const [elapsed,     setElapsed]     = useState('');

  // Elapsed timer
  useEffect(() => {
    const iso = cajaData?.caja?.fechaApertura;
    if (!iso) { setElapsed(''); return; }
    const tick = () => {
      const ms = Date.now() - new Date(iso).getTime();
      const h  = Math.floor(ms / 3600000);
      const m  = Math.floor((ms % 3600000) / 60000);
      setElapsed(h > 0 ? `${h}h ${m}m` : `${m}m`);
    };
    tick();
    const t = setInterval(tick, 30_000);
    return () => clearInterval(t);
  }, [cajaData?.caja?.fechaApertura]);

  // Preview calculations
  const resumen            = cajaData?.resumen ?? {};
  const montoInicial       = cajaData?.caja?.montoInicial ?? 0;
  const saldoEspEfectivo   = montoInicial + (resumen.totalEfectivo ?? 0);
  const saldoEspTransf     = resumen.totalTransferencias ?? 0;

  const cE   = parseFloat(closeForm.conteoFisicoEfectivo);
  const cT   = parseFloat(closeForm.conteoTransferencias);
  const hasE = closeForm.conteoFisicoEfectivo  !== '' && !isNaN(cE);
  const hasT = closeForm.conteoTransferencias !== '' && !isNaN(cT);
  const difE = hasE ? cE - saldoEspEfectivo : null;
  const difT = hasT ? cT - saldoEspTransf   : null;
  const difTotal = hasE && hasT ? difE + difT : null;
  const tipoDif  = difTotal === null ? null : difTotal === 0 ? 'CUADRE_PERFECTO' : difTotal > 0 ? 'SOBRANTE' : 'FALTANTE';

  // Handlers
  function handleOpen(e) {
    e.preventDefault();
    const errs  = {};
    const monto = parseFloat(openForm.montoInicial);
    if (!openForm.montoInicial || isNaN(monto) || monto < 0) errs.montoInicial = 'Ingresa un monto inicial válido';
    if (Object.keys(errs).length) { setOpenErrors(errs); return; }
    setOpenErrors({});
    openCaja.mutate(
      { montoInicial: monto, notas: openForm.notas || undefined },
      {
        onSuccess: () => { toast.success('Caja abierta exitosamente'); setOpenForm({ montoInicial: '', notas: '' }); },
        onError: (err) => {
          const fieldErrors = err?.original?.response?.data?.errors;
          if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
            const map = {};
            fieldErrors.forEach(e => { map[e.campo] = e.mensaje; });
            setOpenErrors(map);
          } else {
            toast.error(err?.message ?? 'Error al abrir la caja');
          }
        },
      }
    );
  }

  function handleClose(e) {
    e.preventDefault();
    const errs = {};
    if (!hasE) errs.conteoFisicoEfectivo = 'Ingresa el conteo de efectivo';
    if (!hasT) errs.conteoTransferencias = 'Ingresa el conteo de transferencias';
    if (Object.keys(errs).length) { setCloseErrors(errs); return; }
    setCloseErrors({});
    closeCaja.mutate(
      { conteoFisicoEfectivo: cE, conteoTransferencias: cT, notasCierre: closeForm.notasCierre || undefined },
      {
        onSuccess: (res) => {
          setCloseResult(res.data?.data ?? res.data ?? {});
          setCloseForm({ conteoFisicoEfectivo: '', conteoTransferencias: '', notasCierre: '' });
        },
        onError: (err) => {
          const fieldErrors = err?.original?.response?.data?.errors;
          if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
            const map = {};
            fieldErrors.forEach(e => { map[e.campo] = e.mensaje; });
            setCloseErrors(map);
          } else {
            toast.error(err?.message ?? 'Error al cerrar la caja');
          }
        },
      }
    );
  }

  return (
    <div className="w-full h-full overflow-hidden flex flex-col">

      {/* ── Top row ────────────────────────────────────────────────────────── */}
      <div className="flex items-end shrink-0 h-10">

        {/* Chrome tab */}
        <div className="relative flex items-center gap-2 px-4 h-10 border border-b-0 border-white/40 shrink-0"
          style={{ width: 'min(52%, 500px)', ...GLASS, borderRadius: '10px 10px 0 0' }}>
          <DollarSign size={13} style={{ color: '#55624a', flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#374151', fontFamily: "'Syne',sans-serif", flexShrink: 0 }}>
            Caja
          </span>
          {isFetching && !isLoading && (
            <Loader2 size={11} className="animate-spin" style={{ color: '#8c916c', flexShrink: 0 }} />
          )}

          {!isLoading && (
            <>
              <div style={{ width: 1, height: 16, background: 'rgba(156,163,175,0.5)', margin: '0 4px', flexShrink: 0 }} />
              {cajaData ? (
                <>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, height: 24, padding: '0 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, border: '1px solid rgba(21,128,61,0.28)', background: 'rgba(21,128,61,0.08)', color: '#15803d', flexShrink: 0 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                    Abierta
                  </span>
                  {elapsed && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#6b7280', flexShrink: 0 }}>
                      <Clock size={10} /> {elapsed}
                    </span>
                  )}
                </>
              ) : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, height: 24, padding: '0 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', flexShrink: 0 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f87171', display: 'inline-block' }} />
                  Sin caja activa
                </span>
              )}
            </>
          )}

          {/* Chrome ear */}
          <span style={{ position: 'absolute', bottom: 0, right: -28, width: 28, height: 48, overflow: 'hidden', pointerEvents: 'none' }}>
            <span style={{ position: 'absolute', left: 0, bottom: 0, width: 56, height: 56, borderRadius: '50%', boxShadow: '-28px 28px 0 0 rgba(204,204,204,0.22)' }} />
          </span>
        </div>

      </div>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden rounded-b-2xl rounded-tr-2xl" style={GLASS}>

        {/* Loading */}
        {isLoading && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 size={20} className="animate-spin" style={{ color: '#d1d5db' }} />
          </div>
        )}

        {/* ── Sin caja activa: formulario de apertura ── */}
        {!isLoading && !cajaData && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <div style={{ width: '100%', maxWidth: 420, background: 'white', borderRadius: 20, border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: 32 }}>
              {/* icon */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(21,128,61,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(21,128,61,0.2)' }}>
                  <DollarSign size={24} color="#15803d" />
                </div>
              </div>
              <h2 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 700, color: '#111827', textAlign: 'center', fontFamily: "'Syne',sans-serif" }}>
                Abrir caja
              </h2>
              <p style={{ margin: '0 0 24px', fontSize: 13, color: '#6b7280', textAlign: 'center', lineHeight: 1.6 }}>
                No hay un turno activo. Ingresa el efectivo disponible para comenzar.
              </p>

              <form onSubmit={handleOpen}>
                <Field label="Monto inicial en efectivo" required error={openErrors.montoInicial}>
                  <input type="number" min="0" step="100" placeholder="Ej: 50000" value={openForm.montoInicial}
                    onChange={e => setOpenForm(f => ({ ...f, montoInicial: e.target.value }))}
                    style={{ ...IST, borderColor: openErrors.montoInicial ? '#ef4444' : '#e5e7eb' }}
                    onFocus={e => { e.target.style.borderColor = '#55624a'; }}
                    onBlur={e => { e.target.style.borderColor = openErrors.montoInicial ? '#ef4444' : '#e5e7eb'; }}
                  />
                </Field>

                <Field label="Notas de apertura" error={openErrors.notas}>
                  <textarea rows={2} placeholder="Observaciones opcionales…" value={openForm.notas}
                    onChange={e => setOpenForm(f => ({ ...f, notas: e.target.value }))}
                    style={{ ...IST, resize: 'vertical', fontFamily: 'inherit' }}
                    onFocus={e => { e.target.style.borderColor = '#55624a'; }}
                    onBlur={e => { e.target.style.borderColor = '#e5e7eb'; }}
                  />
                </Field>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="submit" disabled={openCaja.isPending}
                    style={{ flex: 2, height: 40, borderRadius: 10, border: 'none', background: openCaja.isPending ? '#e5e7eb' : '#55624a', color: openCaja.isPending ? '#9ca3af' : 'white', fontSize: 13, fontWeight: 700, cursor: openCaja.isPending ? 'not-allowed' : 'pointer', fontFamily: "'Syne',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    {openCaja.isPending
                      ? <><Loader2 size={14} className="animate-spin" /> Abriendo…</>
                      : <><ArrowRight size={14} /> Abrir caja</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Caja activa: resumen + cierre ── */}
        {!isLoading && cajaData && (
          <div style={{
            flex: 1, display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            overflowX: 'hidden',
            overflowY: isMobile ? 'auto' : 'hidden',
          }}>

            {/* LEFT: resumen */}
            <div style={{ flex: 1, minWidth: 0, margin: isMobile ? '8px 4px 0' : '8px 2px 4px 4px', borderRadius: 14, background: 'white', overflowY: isMobile ? 'visible' : 'auto', padding: '16px 20px', scrollbarWidth: 'thin' }}>

              {/* Turno header */}
              <div style={{ background: 'rgba(21,128,61,0.06)', borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(21,128,61,0.15)', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: '0 0 0 2px rgba(34,197,94,0.25)' }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#15803d', fontFamily: "'Syne',sans-serif" }}>Turno activo</span>
                  {elapsed && (
                    <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6b7280' }}>
                      <Clock size={11} /> {elapsed}
                    </span>
                  )}
                </div>
                <p style={{ margin: 0, fontSize: 12, color: '#374151' }}>
                  Abierta por <strong>{cajaData.caja?.abiertaPor?.nombreCompleto ?? '—'}</strong>
                  {cajaData.caja?.fechaApertura && (
                    <> · {new Date(cajaData.caja.fechaApertura).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</>
                  )}
                </p>
              </div>

              {/* Metrics grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <MetricCard icon={DollarSign}   iconColor="#15803d" iconBg="rgba(21,128,61,0.08)"   label="Monto inicial"    value={formatCOP(montoInicial)} />
                <MetricCard icon={ShoppingCart} iconColor="#2563eb" iconBg="rgba(37,99,235,0.08)"   label="Total ventas"    value={formatCOP(resumen.totalVentas)} sub={`${resumen.cantidadVentas ?? 0} venta(s)`} />
                <MetricCard icon={Banknote}     iconColor="#7c3aed" iconBg="rgba(124,58,237,0.08)"  label="Efectivo ventas" value={formatCOP(resumen.totalEfectivo)} />
                <MetricCard icon={CreditCard}   iconColor="#0891b2" iconBg="rgba(8,145,178,0.08)"   label="Transferencias"  value={formatCOP(resumen.totalTransferencias)} />
                <MetricCard icon={DollarSign}   iconColor="#d97706" iconBg="rgba(217,119,6,0.08)"   label="Saldo esperado"  value={formatCOP(saldoEspEfectivo)} sub="efectivo total (caja + ventas)" />
                <MetricCard icon={AlertTriangle} iconColor="#dc2626" iconBg="rgba(239,68,68,0.08)"  label="Ventas anuladas" value={resumen.cantidadVentasAnuladas ?? 0} />
              </div>
            </div>

            {/* RIGHT: formulario de cierre */}
            <div style={{ width: isMobile ? 'auto' : 320, flexShrink: isMobile ? undefined : 0, margin: isMobile ? '8px 4px 8px' : '8px 4px 4px 2px', borderRadius: 14, background: 'white', overflowY: isMobile ? 'visible' : 'auto', padding: '16px 20px', scrollbarWidth: 'thin' }}>

              <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: '#111827', fontFamily: "'Syne',sans-serif" }}>
                Cerrar caja
              </h3>

              <form onSubmit={handleClose}>
                <Field label="Conteo físico de efectivo" required error={closeErrors.conteoFisicoEfectivo}>
                  <input type="number" min="0" step="100" placeholder="Ej: 143500" value={closeForm.conteoFisicoEfectivo}
                    onChange={e => setCloseForm(f => ({ ...f, conteoFisicoEfectivo: e.target.value }))}
                    style={{ ...IST, borderColor: closeErrors.conteoFisicoEfectivo ? '#ef4444' : '#e5e7eb' }}
                    onFocus={e => { e.target.style.borderColor = '#55624a'; }}
                    onBlur={e => { e.target.style.borderColor = closeErrors.conteoFisicoEfectivo ? '#ef4444' : '#e5e7eb'; }}
                  />
                </Field>

                <Field label="Conteo de transferencias" required error={closeErrors.conteoTransferencias}>
                  <input type="number" min="0" step="100" placeholder="Ej: 50000" value={closeForm.conteoTransferencias}
                    onChange={e => setCloseForm(f => ({ ...f, conteoTransferencias: e.target.value }))}
                    style={{ ...IST, borderColor: closeErrors.conteoTransferencias ? '#ef4444' : '#e5e7eb' }}
                    onFocus={e => { e.target.style.borderColor = '#55624a'; }}
                    onBlur={e => { e.target.style.borderColor = closeErrors.conteoTransferencias ? '#ef4444' : '#e5e7eb'; }}
                  />
                </Field>

                {/* Preview */}
                {(hasE || hasT) && (
                  <div style={{ background: '#f9fafb', borderRadius: 10, padding: '10px 12px', border: '1px solid rgba(0,0,0,0.05)', marginBottom: 14 }}>
                    <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Vista previa
                    </p>
                    {hasE && (
                      <PreviewRow label="Efectivo" esperado={saldoEspEfectivo} contado={cE} dif={difE} />
                    )}
                    {hasT && (
                      <PreviewRow label="Transferencias" esperado={saldoEspTransf} contado={cT} dif={difT} />
                    )}
                    {hasE && hasT && tipoDif && (
                      <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', marginTop: 6, paddingTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>
                          Total: {difTotal >= 0 ? '+' : ''}{formatCOP(difTotal)}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: DIF_BADGE[tipoDif].bg, border: `1px solid ${DIF_BADGE[tipoDif].border}`, color: DIF_BADGE[tipoDif].color }}>
                          {DIF_BADGE[tipoDif].label}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <Field label="Notas de cierre" error={closeErrors.notasCierre}>
                  <textarea rows={2} placeholder="Observaciones opcionales…" value={closeForm.notasCierre}
                    onChange={e => setCloseForm(f => ({ ...f, notasCierre: e.target.value }))}
                    style={{ ...IST, resize: 'vertical', fontFamily: 'inherit' }}
                    onFocus={e => { e.target.style.borderColor = '#55624a'; }}
                    onBlur={e => { e.target.style.borderColor = '#e5e7eb'; }}
                  />
                </Field>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="submit" disabled={closeCaja.isPending}
                    style={{ flex: 2, height: 40, borderRadius: 10, border: 'none', background: closeCaja.isPending ? '#e5e7eb' : '#ef4444', color: closeCaja.isPending ? '#9ca3af' : 'white', fontSize: 13, fontWeight: 700, cursor: closeCaja.isPending ? 'not-allowed' : 'pointer', fontFamily: "'Syne',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    {closeCaja.isPending
                      ? <><Loader2 size={14} className="animate-spin" /> Cerrando…</>
                      : 'Confirmar cierre'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      <CloseResultModal result={closeResult} onClose={() => setCloseResult(null)} />
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function PreviewRow({ label, esperado, contado, dif }) {
  const color = dif > 0 ? '#1d4ed8' : dif < 0 ? '#dc2626' : '#15803d';
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
      <span style={{ color: '#6b7280', minWidth: 90 }}>{label}</span>
      <span style={{ color: '#9ca3af', fontSize: 11 }}>{formatCOP(esperado)}</span>
      <span style={{ color: '#374151' }}>→ {formatCOP(contado)}</span>
      <span style={{ fontWeight: 700, color }}>{dif >= 0 ? '+' : ''}{formatCOP(dif)}</span>
    </div>
  );
}
