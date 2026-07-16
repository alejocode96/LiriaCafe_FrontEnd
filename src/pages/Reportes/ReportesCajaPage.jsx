import { useState, useMemo } from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import {
  Wallet, TrendingUp, TrendingDown, DollarSign,
  ArrowUpCircle, ArrowDownCircle, Scale, CheckCircle,
  Printer, RefreshCw, Loader2, AlertCircle, Clock, BarChart2,
} from 'lucide-react';
import { useCashReport } from '../../hooks/useReports';

// ── Diseño ────────────────────────────────────────────────────────────────────
const OLIVE   = '#55624a';
const GREEN   = '#15803d';
const RED     = '#dc2626';
const BLUE    = '#1d4ed8';
const AMBER   = '#d97706';
const TEAL    = '#0d9488';
const EMERALD = '#059669';

const GLASS = { background: 'rgba(204,204,204,0.22)', backdropFilter: 'blur(28px) saturate(1.8)', WebkitBackdropFilter: 'blur(28px) saturate(1.8)' };
const CARD  = { background: 'white', borderRadius: 16, border: '1.5px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: '18px 20px' };

// ── Formatters ────────────────────────────────────────────────────────────────
const COP       = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });
const formatCOP = (n) => (n != null ? COP.format(n) : '$0');
const fmtShort  = (n) => {
  if (!n && n !== 0) return '$0';
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000)     return `$${(n / 1_000).toFixed(0)}k`;
  return formatCOP(n);
};
const p2  = (x) => String(x).padStart(2, '0');
const fmtD  = (d) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
const fmtDT = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${p2(d.getDate())}/${p2(d.getMonth() + 1)}/${d.getFullYear()} ${p2(d.getHours())}:${p2(d.getMinutes())}`;
};

// Presets devuelven YYYY-MM-DD para el date picker
const todayRange     = () => { const s = fmtD(new Date()); return { desde: s, hasta: s }; };
const thisMonthRange = () => { const d = new Date(); return { desde: `${d.getFullYear()}-${p2(d.getMonth() + 1)}-01`, hasta: fmtD(d) }; };
const lastMonthRange = () => {
  const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1);
  return { desde: fmtD(d), hasta: fmtD(new Date(d.getFullYear(), d.getMonth() + 1, 0)) };
};

// Convierte YYYY-MM-DD a ISO 8601 con hora local
const toISOStart = (dateStr) => {
  if (!dateStr) return undefined;
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0).toISOString();
};
const toISOEnd = (dateStr) => {
  if (!dateStr) return undefined;
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d, 23, 59, 59, 999).toISOString();
};

// ── Input styles ──────────────────────────────────────────────────────────────
const INPUT = { height: 32, padding: '0 10px', borderRadius: 9, border: '1.5px solid #e5e7eb', fontSize: 12, outline: 'none', color: '#374151', background: '#f9fafb', boxSizing: 'border-box', transition: 'border-color 150ms, background 150ms' };
const onFocus = (e) => { e.target.style.borderColor = OLIVE; e.target.style.background = 'white'; };
const onBlur  = (e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#f9fafb'; };

// ── Componentes ───────────────────────────────────────────────────────────────
function SecTitle({ label, icon: Icon, right, sub }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {Icon && <Icon size={13} color="#9ca3af" />}
        <span style={{ fontSize: 10, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</span>
        <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.06)' }} />
        {right}
      </div>
      {sub && <p style={{ margin: '4px 0 0 21px', fontSize: 11, color: '#9ca3af' }}>{sub}</p>}
    </div>
  );
}

function KpiCard({ Icon, label, value, sub, color, badge }) {
  return (
    <div style={{ flex: 1, minWidth: 140, padding: 16, borderRadius: 16, background: `${color}0d`, border: `1.5px solid ${color}30`, display: 'flex', flexDirection: 'column', gap: 9 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} color={color} />
        </div>
        {badge && (
          <span style={{ padding: '2px 8px', borderRadius: 6, background: `${color}18`, color, fontSize: 10, fontWeight: 800 }}>{badge}</span>
        )}
      </div>
      <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color, fontFamily: "'Syne',sans-serif", letterSpacing: '-0.01em', lineHeight: 1.1 }}>{value}</p>
      <div>
        <p style={{ margin: '0 0 2px', fontSize: 9, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</p>
        {sub && <p style={{ margin: 0, fontSize: 11, color: '#6b7280' }}>{sub}</p>}
      </div>
    </div>
  );
}

function DifChip({ value }) {
  if (value === 0) return <span style={{ color: GREEN, fontWeight: 700, fontSize: 12 }}>Cuadre exacto ✓</span>;
  if (value > 0)   return <span style={{ color: BLUE,  fontWeight: 700, fontSize: 12 }}>+{formatCOP(value)} sobrante</span>;
  return               <span style={{ color: RED,   fontWeight: 700, fontSize: 12 }}>{formatCOP(Math.abs(value))} faltante ⚠️</span>;
}

const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'white', border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '10px 14px', fontSize: 11, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <p style={{ fontWeight: 700, marginBottom: 6, color: '#374151', margin: '0 0 6px' }}>{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 3 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: p.fill ?? p.color, display: 'inline-block', flexShrink: 0 }} />
          <span style={{ color: '#6b7280' }}>{p.name}:</span>
          <span style={{ fontWeight: 700, color: p.fill ?? p.color }}>
            {p.dataKey === 'diferencia' ? formatCOP(p.value) : fmtShort(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

// ── Reporte de Caja y Flujo ───────────────────────────────────────────────────
export default function ReportesCajaPage() {
  const [filtros, setFiltros] = useState(() => thisMonthRange());
  const [hasGenerated, setHasGenerated] = useState(false);

  // Convierte las fechas del picker (YYYY-MM-DD) a ISO 8601 con hora local
  const queryParams = useMemo(() => ({
    desde: toISOStart(filtros.desde),
    hasta: toISOEnd(filtros.hasta),
  }), [filtros]);

  const { data, isFetching, isError, error, refetch } = useCashReport(queryParams);

  const doGenerate = () => { setHasGenerated(true); refetch(); };

  const setPreset = (fn) => () => { setFiltros(fn()); setHasGenerated(false); };

  const resumen  = data?.data?.resumenPeriodo      ?? {};
  const analisis = data?.data?.analisisDiferencias ?? {};
  const cierres  = data?.data?.cierres             ?? [];

  const balPos = (resumen.balanceOperativo  ?? 0) >= 0;
  const difPos = (analisis.diferenciaAcumulada ?? 0) >= 0;

  const chartData = useMemo(() => cierres.map((c, i) => ({
    label: fmtDT(c.fechaApertura).slice(0, 10),
    efectivo:       c.conteoFisicoEfectivo  ?? 0,
    transferencias: c.conteoTransferencias  ?? 0,
    diferencia:     c.diferencia            ?? 0,
  })), [cierres]);

  // ── Print ──────────────────────────────────────────────────────────────────
  const doPrint = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    const rows = cierres.map((c) => {
      const dif = c.diferencia ?? 0;
      const difText = dif === 0 ? 'Cuadre exacto ✓' : dif > 0 ? `+${formatCOP(dif)} sobrante` : `${formatCOP(Math.abs(dif))} faltante`;
      const difColor = dif === 0 ? '#15803d' : dif > 0 ? '#1d4ed8' : '#dc2626';
      return `<tr>
        <td>${fmtDT(c.fechaApertura)}</td>
        <td>${c.abiertaPor?.nombreCompleto ?? '—'}</td>
        <td>${c.cerradaPor?.nombreCompleto ?? '—'}</td>
        <td style="text-align:center">${c._count?.ventas ?? 0}</td>
        <td>${formatCOP(c.conteoFisicoEfectivo ?? 0)}</td>
        <td>${formatCOP(c.conteoTransferencias ?? 0)}</td>
        <td>${formatCOP(c.saldoEsperado ?? 0)}</td>
        <td style="color:${difColor};font-weight:700">${difText}</td>
      </tr>`;
    }).join('');
    w.document.write(`<!DOCTYPE html><html><head><title>Reporte Caja — Liria Café</title>
      <style>body{font-family:sans-serif;padding:28px;color:#111}h1{font-size:18px;margin:0 0 4px}
      .sub{color:#6b7280;font-size:12px;margin:0 0 24px}
      table{width:100%;border-collapse:collapse}th,td{border:1px solid #e5e7eb;padding:8px 10px;font-size:11px;text-align:left}
      th{background:#f9fafb;font-weight:700;font-size:10px;text-transform:uppercase;letter-spacing:.06em}
      tfoot td{background:#f9fafb;font-weight:700}</style>
    </head><body>
      <h1>Reporte de Caja y Flujo — Liria Café</h1>
      <p class="sub">Período: ${filtros.desde} al ${filtros.hasta} · Balance: ${formatCOP(resumen.balanceOperativo ?? 0)}</p>
      <table><thead><tr><th>Apertura</th><th>Abrió</th><th>Cerró</th><th>Ventas</th><th>Efectivo</th><th>Transferencias</th><th>Esperado</th><th>Diferencia</th></tr></thead>
      <tbody>${rows}</tbody></table>
    </body></html>`);
    w.document.close(); w.print();
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="w-full h-full overflow-hidden flex flex-col">

      {/* Tab */}
      <div className="flex items-end shrink-0">
        <div className="relative flex items-center gap-2 px-4 h-10 border border-b-0 border-white/40"
          style={{ width: 'min(55%, 440px)', ...GLASS, borderRadius: '10px 10px 0 0' }}>
          <Wallet size={13} color={OLIVE} />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#374151', fontFamily: "'Syne',sans-serif" }}>Reporte de Caja y Flujo</span>
          {isFetching && <Loader2 size={11} className="animate-spin" color="#8c916c" />}
          <span style={{ position: 'absolute', bottom: 0, right: -28, width: 28, height: 48, overflow: 'hidden', pointerEvents: 'none' }}>
            <span style={{ position: 'absolute', left: 0, bottom: 0, width: 56, height: 56, borderRadius: '50%', boxShadow: '-28px 28px 0 0 rgba(204,204,204,0.22)' }} />
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-hidden rounded-b-2xl rounded-tr-2xl" style={{ ...GLASS, display: 'flex', flexDirection: 'column' }}>

        {/* ── Filtros ─────────────────────────────────────────────────────── */}
        <div style={{ margin: '8px 4px 0', background: 'white', borderRadius: '14px 14px 0 0', padding: '12px 16px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <label style={{ fontSize: 9, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Desde</label>
              <input type="date" value={filtros.desde}
                onChange={(e) => { setFiltros(f => ({ ...f, desde: e.target.value })); setHasGenerated(false); }}
                style={{ ...INPUT, width: 136 }} onFocus={onFocus} onBlur={onBlur} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <label style={{ fontSize: 9, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Hasta</label>
              <input type="date" value={filtros.hasta}
                onChange={(e) => { setFiltros(f => ({ ...f, hasta: e.target.value })); setHasGenerated(false); }}
                style={{ ...INPUT, width: 136 }} onFocus={onFocus} onBlur={onBlur} />
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {[['Hoy', todayRange], ['Este mes', thisMonthRange], ['Mes ant.', lastMonthRange]].map(([lbl, fn]) => (
                <button key={lbl} onClick={setPreset(fn)}
                  style={{ height: 24, padding: '0 10px', borderRadius: 6, border: '1.5px solid #e5e7eb', background: 'white', color: '#6b7280', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = OLIVE; e.currentTarget.style.color = OLIVE; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#6b7280'; }}>
                  {lbl}
                </button>
              ))}
            </div>
            <div style={{ flex: 1 }} />
            {hasGenerated && !isError && data && (
              <button onClick={doPrint}
                style={{ height: 32, padding: '0 14px', borderRadius: 9, border: '1.5px solid #e5e7eb', background: 'white', fontSize: 12, color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Printer size={13} /> Imprimir
              </button>
            )}
            <button onClick={doGenerate} disabled={isFetching || !filtros.desde || !filtros.hasta}
              style={{ height: 32, padding: '0 18px', borderRadius: 9, border: 'none', background: OLIVE, color: 'white', fontSize: 12, fontWeight: 700, cursor: isFetching ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: isFetching ? 0.7 : 1, fontFamily: "'Syne',sans-serif" }}>
              {isFetching ? <Loader2 size={13} className="animate-spin" /> : <BarChart2 size={13} />}
              {isFetching ? 'Generando…' : 'Generar reporte'}
            </button>
          </div>
        </div>

        {/* ── Contenido ───────────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: 'rgba(85,98,74,0.15) transparent', margin: '0 4px', background: 'white', padding: '16px 16px 24px' }}>

          {/* Estado vacío */}
          {!hasGenerated && (
            <div style={{ textAlign: 'center', padding: '80px 0', color: '#9ca3af' }}>
              <Wallet size={40} style={{ margin: '0 auto 14px', opacity: 0.35, display: 'block' }} />
              <p style={{ fontSize: 14, fontWeight: 700, margin: '0 0 4px', color: '#6b7280' }}>Selecciona el período y genera el reporte</p>
              <p style={{ fontSize: 12, margin: 0 }}>Balance operativo, diferencias de caja y detalle de cierres del período seleccionado</p>
            </div>
          )}

          {/* Loader */}
          {hasGenerated && isFetching && (
            <div style={{ textAlign: 'center', padding: '80px 0', color: '#9ca3af' }}>
              <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px', display: 'block', color: OLIVE }} />
              <p style={{ fontSize: 13, margin: 0, fontWeight: 600 }}>Generando reporte…</p>
            </div>
          )}

          {/* Error */}
          {hasGenerated && !isFetching && isError && (
            <div style={{ ...CARD, display: 'flex', alignItems: 'center', gap: 14, background: '#fef2f2', border: '1.5px solid #fecaca' }}>
              <AlertCircle size={20} color={RED} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 700, color: RED, fontSize: 13 }}>Error al generar el reporte</p>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: '#6b7280' }}>
                  {error?.response?.data?.message ?? error?.message ?? 'Error de conexión. Verifica tu red.'}
                </p>
              </div>
              <button onClick={doGenerate}
                style={{ padding: '7px 16px', borderRadius: 9, border: '1.5px solid #fecaca', background: 'white', color: RED, fontSize: 12, cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <RefreshCw size={13} /> Reintentar
              </button>
            </div>
          )}

          {/* Resultados */}
          {hasGenerated && !isFetching && !isError && data && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* KPI cards */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <KpiCard Icon={DollarSign}      color={OLIVE}                label="Total ventas"      value={fmtShort(resumen.totalVentas)}        sub={`${resumen.cantidadVentas ?? 0} transacciones`} />
                <KpiCard Icon={ArrowUpCircle}   color={EMERALD}              label="Ingresos flujo"    value={fmtShort(resumen.totalIngresosFlujo)} sub="Entradas de efectivo" />
                <KpiCard Icon={ArrowDownCircle} color={AMBER}                label="Egresos flujo"     value={fmtShort(resumen.totalEgresosFlujo)}  sub="Salidas de efectivo" />
                <KpiCard Icon={Scale}           color={balPos ? GREEN : RED} label="Balance operativo" value={fmtShort(resumen.balanceOperativo)}
                  badge={balPos ? 'Positivo' : 'Negativo'} sub={`${resumen.cantidadCajas ?? 0} caja(s) en el período`} />
              </div>

              {/* Fórmula */}
              <div style={{ ...CARD }}>
                <SecTitle label="Verificación del balance" icon={Scale} sub="Ventas + Ingresos − Egresos = Balance operativo" />
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0 }}>
                  {[
                    { lbl: 'Ventas',   val: resumen.totalVentas,        color: OLIVE,                op: null },
                    { lbl: 'Ingresos', val: resumen.totalIngresosFlujo, color: EMERALD,              op: '+' },
                    { lbl: 'Egresos',  val: resumen.totalEgresosFlujo,  color: AMBER,                op: '−' },
                    { lbl: 'Balance',  val: resumen.balanceOperativo,   color: balPos ? GREEN : RED, op: '=' },
                  ].map(({ lbl, val, color, op }) => (
                    <div key={lbl} style={{ display: 'flex', alignItems: 'center' }}>
                      {op && <span style={{ fontSize: 22, fontWeight: 700, color: '#d1d5db', margin: '0 12px' }}>{op}</span>}
                      <div style={{ textAlign: 'center', background: `${color}0c`, border: `1.5px solid ${color}28`, borderRadius: 12, padding: '10px 20px', minWidth: 100 }}>
                        <div style={{ fontSize: 15, fontWeight: 900, color, fontFamily: "'Syne',sans-serif" }}>{formatCOP(val ?? 0)}</div>
                        <div style={{ fontSize: 9, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 3 }}>{lbl}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Análisis de diferencias */}
              <div style={{ ...CARD }}>
                <SecTitle label="Análisis de diferencias" icon={Scale}
                  sub="Diferencia entre el efectivo contado y el saldo esperado en cada cierre" />
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 200px', padding: '16px 20px', borderRadius: 12, background: difPos ? '#f0fdf4' : '#fef2f2', border: `1.5px solid ${difPos ? '#86efac' : '#fecaca'}` }}>
                    <p style={{ margin: '0 0 8px', fontSize: 9, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Diferencia acumulada</p>
                    <div style={{ fontSize: 28, fontWeight: 900, color: difPos ? GREEN : RED, fontFamily: "'Syne',sans-serif", lineHeight: 1 }}>{formatCOP(analisis.diferenciaAcumulada ?? 0)}</div>
                    <p style={{ margin: '6px 0 0', fontSize: 11, color: '#6b7280' }}>{difPos ? 'Sobrante total del período' : 'Faltante total del período'}</p>
                  </div>
                  {[
                    { lbl: 'Con faltante', val: analisis.cajasConFaltante ?? 0, color: RED,     Icon: TrendingDown, bg: '#fef2f2' },
                    { lbl: 'Con sobrante', val: analisis.cajasConSobrante ?? 0, color: BLUE,    Icon: TrendingUp,   bg: '#eff6ff' },
                    { lbl: 'Cuadradas',    val: analisis.cajasCuadradas   ?? 0, color: EMERALD, Icon: CheckCircle,  bg: '#f0fdf4' },
                  ].map(({ lbl, val, color, Icon, bg }) => (
                    <div key={lbl} style={{ flex: '1 1 90px', padding: '14px 10px', borderRadius: 12, background: bg, border: `1.5px solid ${color}30`, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      <Icon size={18} color={color} />
                      <div style={{ fontSize: 26, fontWeight: 900, color, fontFamily: "'Syne',sans-serif", lineHeight: 1 }}>{val}</div>
                      <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{lbl}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gráfico */}
              {chartData.length > 0 && (
                <div style={{ ...CARD }}>
                  <SecTitle label="Efectivo vs transferencias por cierre" icon={BarChart2}
                    sub="Barras: montos contados · Línea naranja: diferencia respecto al saldo esperado" />
                  <ResponsiveContainer width="100%" height={250}>
                    <ComposedChart data={chartData} margin={{ top: 4, right: 24, bottom: 4, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="l" tickFormatter={fmtShort} tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={55} />
                      <YAxis yAxisId="r" orientation="right" tickFormatter={formatCOP} tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={80} />
                      <Tooltip content={<ChartTip />} />
                      <ReferenceLine yAxisId="r" y={0} stroke={RED} strokeDasharray="4 4" strokeOpacity={0.5} />
                      <Bar yAxisId="l" dataKey="efectivo"       name="Efectivo contado" fill={OLIVE} radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="l" dataKey="transferencias" name="Transferencias"   fill={TEAL}  radius={[4, 4, 0, 0]} />
                      <Line yAxisId="r" dataKey="diferencia" name="Diferencia" stroke={AMBER} strokeWidth={2} dot={{ r: 4, fill: AMBER, strokeWidth: 0 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Tabla de cierres */}
              <div style={{ ...CARD }}>
                <SecTitle label="Detalle de cierres de caja" icon={Clock}
                  right={<span style={{ fontSize: 11, color: '#9ca3af' }}>{cierres.length} cierre(s)</span>} />
                {cierres.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '36px 0', color: '#9ca3af', fontSize: 13 }}>
                    No hay cierres registrados en este período
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ borderBottom: '1.5px solid #f3f4f6' }}>
                          {['Apertura', 'Abrió', 'Cerró', 'Ventas', 'Efectivo contado', 'Transferencias', 'Saldo esperado', 'Diferencia'].map((h) => (
                            <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 800, color: '#9ca3af', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {cierres.map((c, i) => {
                          const dif   = c.diferencia ?? 0;
                          const rowBg = i % 2 === 0 ? 'white' : '#fafafa';
                          const hlBg  = dif < 0 ? '#fff7f7' : dif > 1000 ? '#f0f9ff' : rowBg;
                          return (
                            <tr key={c.id} style={{ background: hlBg, transition: 'background 120ms' }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f5ef')}
                              onMouseLeave={(e) => (e.currentTarget.style.background = hlBg)}>
                              <td style={{ padding: '10px 12px', color: '#374151', whiteSpace: 'nowrap' }}>{fmtDT(c.fechaApertura)}</td>
                              <td style={{ padding: '10px 12px', color: '#374151' }}>{c.abiertaPor?.nombreCompleto ?? '—'}</td>
                              <td style={{ padding: '10px 12px', color: '#374151' }}>{c.cerradaPor?.nombreCompleto ?? '—'}</td>
                              <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                <span style={{ background: '#f3f4f6', borderRadius: 6, padding: '2px 8px', fontWeight: 700, color: '#374151', fontSize: 11 }}>{c._count?.ventas ?? 0}</span>
                              </td>
                              <td style={{ padding: '10px 12px', color: '#374151', fontWeight: 600 }}>{formatCOP(c.conteoFisicoEfectivo ?? 0)}</td>
                              <td style={{ padding: '10px 12px', color: '#374151', fontWeight: 600 }}>{formatCOP(c.conteoTransferencias ?? 0)}</td>
                              <td style={{ padding: '10px 12px', color: '#374151', fontWeight: 600 }}>{formatCOP(c.saldoEsperado ?? 0)}</td>
                              <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}><DifChip value={dif} /></td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr style={{ borderTop: '2px solid #f3f4f6' }}>
                          <td colSpan={4} style={{ padding: '10px 12px', fontWeight: 800, color: '#6b7280', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Totales del período</td>
                          <td style={{ padding: '10px 12px', fontWeight: 800, color: OLIVE }}>{formatCOP(cierres.reduce((s, c) => s + (c.conteoFisicoEfectivo ?? 0), 0))}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 800, color: TEAL  }}>{formatCOP(cierres.reduce((s, c) => s + (c.conteoTransferencias ?? 0), 0))}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 800, color: '#374151' }}>{formatCOP(cierres.reduce((s, c) => s + (c.saldoEsperado ?? 0), 0))}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 800 }}><DifChip value={analisis.diferenciaAcumulada ?? 0} /></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
