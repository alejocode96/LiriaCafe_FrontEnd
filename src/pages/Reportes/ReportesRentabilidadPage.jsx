import { useState, useMemo, useCallback } from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Cell, ReferenceLine, PieChart, Pie,
} from 'recharts';
import {
  TrendingUp, TrendingDown, DollarSign, Package, Percent, AlertTriangle,
  ChevronDown, ChevronRight, Printer, FileText, Filter, Search,
  Info, Loader2, AlertCircle, CheckCircle, Layers, Trophy, RefreshCw,
} from 'lucide-react';
import { useProfitabilityReport } from '../../hooks/useReports';

// ── Diseño ────────────────────────────────────────────────────────────────────
const OLIVE   = '#55624a';
const GREEN   = '#15803d';
const RED     = '#dc2626';
const BLUE    = '#1d4ed8';
const AMBER   = '#d97706';
const PURPLE  = '#7c3aed';
const TEAL    = '#0d9488';
const EMERALD = '#059669';

const GLASS = { background: 'rgba(204,204,204,0.22)', backdropFilter: 'blur(28px) saturate(1.8)', WebkitBackdropFilter: 'blur(28px) saturate(1.8)' };
const CARD  = { background: 'white', borderRadius: 16, border: '1.5px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: '18px 20px' };
const CHEVRON = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`;

// ── Formatters ────────────────────────────────────────────────────────────────
const COP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });
const formatCOP = (n) => (n != null ? COP.format(n) : '$0');
const fmtShort  = (n) => {
  if (!n && n !== 0) return '$0';
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000)     return `$${(n / 1_000).toFixed(0)}k`;
  return formatCOP(n);
};
const fmtPct = (n) => (n != null ? `${Number(n).toFixed(1)}%` : '—');
const p2 = (x) => String(x).padStart(2, '0');
const fmtD = (d) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
const todayRange     = () => { const s = fmtD(new Date()); return { desde: s, hasta: s }; };
const thisMonthRange = () => { const d = new Date(); return { desde: `${d.getFullYear()}-${p2(d.getMonth()+1)}-01`, hasta: fmtD(d) }; };
const lastMonthRange = () => {
  const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1);
  return { desde: fmtD(d), hasta: fmtD(new Date(d.getFullYear(), d.getMonth() + 1, 0)) };
};

const margColor = (v) => {
  if (v >= 30)  return EMERALD;
  if (v >= 15)  return OLIVE;
  if (v >= 0)   return AMBER;
  return RED;
};

// ── Input styles ──────────────────────────────────────────────────────────────
const INPUT  = { height: 32, padding: '0 10px', borderRadius: 9, border: '1.5px solid #e5e7eb', fontSize: 12, outline: 'none', color: '#374151', background: '#f9fafb', boxSizing: 'border-box', transition: 'border-color 150ms, background 150ms' };
const SELECT = { ...INPUT, appearance: 'none', backgroundImage: CHEVRON, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', paddingRight: 28, cursor: 'pointer' };
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

function KpiCard({ Icon, label, value, sub, color, alert }) {
  return (
    <div style={{ flex: 1, minWidth: 140, padding: 16, borderRadius: 16, background: `${color}0d`, border: `1.5px solid ${color}30`, display: 'flex', flexDirection: 'column', gap: 9 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} color={color} />
        </div>
        {alert && (
          <div style={{ padding: '2px 7px', borderRadius: 6, background: '#fee2e2', display: 'flex', alignItems: 'center', gap: 4 }}>
            <AlertTriangle size={9} color={RED} />
            <span style={{ fontSize: 9, fontWeight: 800, color: RED }}>Pérdida</span>
          </div>
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

function MargBar({ pct, color }) {
  const clamped = Math.max(-100, Math.min(100, pct ?? 0));
  return (
    <div style={{ width: 80, height: 5, borderRadius: 99, background: 'rgba(0,0,0,0.06)', marginTop: 3, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, height: '100%', borderRadius: 99, background: color, width: `${Math.abs(clamped)}%`, [clamped < 0 ? 'right' : 'left']: 0, transition: 'width 700ms ease' }} />
    </div>
  );
}

function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: '10px 14px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', minWidth: 170 }}>
      {label && <p style={{ margin: '0 0 7px', fontSize: 10, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase' }}>{label}</p>}
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: i < payload.length - 1 ? 4 : 0 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: p.fill ?? p.color }} />
          <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>{p.name}:</span>
          <span style={{ fontSize: 11, color: p.fill ?? p.color, fontWeight: 800, fontFamily: "'Syne',sans-serif" }}>
            {p.name === 'Margen %' ? fmtPct(p.value) : (p.name === 'Unidades' ? p.value : fmtShort(p.value))}
          </span>
        </div>
      ))}
    </div>
  );
}

function Skel({ h = 200 }) {
  return <div style={{ height: h, borderRadius: 12, background: 'rgba(0,0,0,0.05)' }} />;
}

// ── Print ─────────────────────────────────────────────────────────────────────
function doPrint(data, filters) {
  const r  = data.resumen     ?? {};
  const pp = data.porProducto ?? [];
  const pv = data.porVariante ?? [];
  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"/><title>Reporte de Rentabilidad</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,sans-serif;font-size:12px;padding:16mm}
h1{font-size:20px;font-weight:800;margin-bottom:4px}h2{font-size:12px;font-weight:700;margin:14px 0 6px;border-bottom:1px solid #e5e7eb;padding-bottom:3px}
.meta{font-size:10px;color:#6b7280;margin-bottom:12px}.kpis{display:flex;gap:10px;margin-bottom:14px}
.kpi{flex:1;padding:10px 12px;border-radius:8px;border:1px solid #e5e7eb}.kv{font-size:17px;font-weight:800}.kl{font-size:9px;color:#9ca3af;text-transform:uppercase;letter-spacing:.06em}
table{width:100%;border-collapse:collapse;font-size:11px;margin-bottom:12px}
th{padding:5px 8px;text-align:left;font-size:9px;font-weight:700;color:#9ca3af;text-transform:uppercase;border-bottom:1px solid #e5e7eb;background:#f9fafb}
td{padding:6px 8px;border-bottom:1px solid #f3f4f6}.r{text-align:right;font-weight:700}.neg{color:#dc2626}
.info{margin:12px 0;padding:10px 12px;border-radius:8px;background:#eff6ff;border:1px solid #bfdbfe;font-size:11px;color:#1d4ed8}
.foot{margin-top:16px;font-size:10px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:7px}</style></head><body>
<h1>Reporte de Rentabilidad</h1>
<p class="meta">Período: ${filters.desde} – ${filters.hasta} · ${new Date().toLocaleString('es-CO')}</p>
<div class="kpis">
  <div class="kpi"><div class="kv">${formatCOP(r.totalIngreso)}</div><div class="kl">Ingreso total</div></div>
  <div class="kpi"><div class="kv">${formatCOP(r.totalCosto)}</div><div class="kl">Costo total</div></div>
  <div class="kpi"><div class="kv">${formatCOP(r.totalUtilidad)}</div><div class="kl">Utilidad bruta</div></div>
  <div class="kpi"><div class="kv">${fmtPct(r.margenGlobal)}</div><div class="kl">Margen global</div></div>
</div>
<p class="info">ℹ️ El costo se calcula usando el precio del insumo al momento de la venta, no el precio actual.</p>
${pp.length ? `<h2>Por Producto</h2><table><thead><tr><th>Producto</th><th>Categoría</th><th class="r">Uds.</th><th class="r">Ingreso</th><th class="r">Costo</th><th class="r">Utilidad</th><th class="r">Margen %</th></tr></thead><tbody>${pp.map(p=>`<tr><td>${p.nombre}${!p.esRentable?' ⚠️':''}</td><td>${p.categoria??'—'}</td><td class="r">${p.unidadesVendidas}</td><td class="r">${formatCOP(p.ingresoTotal)}</td><td class="r">${formatCOP(p.costoTotal)}</td><td class="r ${!p.esRentable?'neg':''}">${formatCOP(p.utilidadBruta)}</td><td class="r ${!p.esRentable?'neg':''}">${fmtPct(p.margenPorcentaje)}</td></tr>`).join('')}</tbody></table>` : ''}
${pv.length ? `<h2>Por Variante</h2><table><thead><tr><th>Producto</th><th>Variante</th><th class="r">Uds.</th><th class="r">Ingreso</th><th class="r">Utilidad</th><th class="r">Margen %</th></tr></thead><tbody>${pv.map(v=>`<tr><td>${v.productoNombre}</td><td>${v.varianteNombre}</td><td class="r">${v.unidades}</td><td class="r">${formatCOP(v.ingreso)}</td><td class="r ${v.utilidad<0?'neg':''}">${formatCOP(v.utilidad)}</td><td class="r ${v.margen<0?'neg':''}">${fmtPct(v.margen)}</td></tr>`).join('')}</tbody></table>` : ''}
<div class="foot">Liria Café · Sistema POS</div></body></html>`;
  const win = window.open('', '_blank', 'width=900,height=700');
  if (win) { win.document.write(html); win.document.close(); win.onload = () => { win.focus(); win.print(); }; }
}

// ─────────────────────────────────────────────────────────────────────────────
export default function ReportesRentabilidadPage() {
  const [filters, setFilters] = useState({ ...thisMonthRange(), categoriaId: '', productoId: '', limite: '20' });
  const [hasGenerated, setHasGenerated] = useState(false);
  const [showVariantes, setShowVariantes] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [sortProd, setSortProd] = useState('utilidad');

  const queryParams = useMemo(() => {
    const p = {};
    if (filters.desde) p.desde = filters.desde + 'T00:00:00.000Z';
    if (filters.hasta) p.hasta = filters.hasta + 'T23:59:59.999Z';
    if (filters.categoriaId) p.categoriaId = filters.categoriaId;
    if (filters.productoId)  p.productoId  = filters.productoId;
    p.limite = parseInt(filters.limite);
    return p;
  }, [filters]);

  const { data: raw, isLoading, isFetching, isError, error, refetch } = useProfitabilityReport(queryParams);
  const handleGenerate = useCallback(async () => { setHasGenerated(true); await refetch(); }, [refetch]);

  // ── Datos según spec exacto ──
  // resumen: {totalIngreso, totalCosto, totalUtilidad, margenGlobal, productosConPerdida}
  const data    = raw?.data ?? raw ?? {};
  const resumen = data.resumen    ?? {};
  // porProducto[]: {productoId, nombre, categoria, unidadesVendidas, ingresoTotal, costoTotal, utilidadBruta, margenPorcentaje, esRentable}
  const prods   = data.porProducto ?? [];
  // porVariante[]: {productoNombre, varianteNombre, unidades, ingreso, costo, utilidad, margen}
  const variantes = data.porVariante ?? [];
  // alertas[]: {productoId, nombre, utilidad, mensaje}
  const alertas = data.alertas ?? [];

  const perdida = prods.filter((p) => !p.esRentable);

  // ── Chart data ──
  const prodSorted = useMemo(() => {
    return [...prods].sort((a, b) => {
      if (sortProd === 'utilidad') return b.utilidadBruta - a.utilidadBruta;
      if (sortProd === 'margen')   return b.margenPorcentaje - a.margenPorcentaje;
      return b.ingresoTotal - a.ingresoTotal;
    }).slice(0, parseInt(filters.limite));
  }, [prods, sortProd, filters.limite]);

  const composedData = useMemo(() => prodSorted.map((p) => ({
    name: p.nombre.length > 18 ? p.nombre.slice(0, 16) + '…' : p.nombre,
    Costo: p.costoTotal,
    Utilidad: p.utilidadBruta,
    'Margen %': p.margenPorcentaje,
    esRentable: p.esRentable,
  })), [prodSorted]);

  // Distribución de productos por nivel de margen — para PieChart
  const pieMargData = useMemo(() => {
    const grupos = [
      { name: 'Alto (>30%)',    color: EMERALD, count: prods.filter((p) => (p.margenPorcentaje ?? 0) >= 30).length },
      { name: 'Medio (15-30%)', color: OLIVE,   count: prods.filter((p) => (p.margenPorcentaje ?? 0) >= 15 && (p.margenPorcentaje ?? 0) < 30).length },
      { name: 'Bajo (0-15%)',   color: AMBER,   count: prods.filter((p) => (p.margenPorcentaje ?? 0) >= 0  && (p.margenPorcentaje ?? 0) < 15).length },
      { name: 'Negativo',       color: RED,     count: prods.filter((p) => (p.margenPorcentaje ?? 0) < 0).length },
    ].filter((g) => g.count > 0);
    return grupos.map((g) => ({ name: g.name, value: g.count, color: g.color }));
  }, [prods]);

  // Tabla variantes ordenada por margen desc
  const variantesSorted = useMemo(() =>
    [...variantes].sort((a, b) => (b.margen ?? 0) - (a.margen ?? 0)), [variantes]);

  const busy     = isLoading || isFetching;
  const hasData  = hasGenerated && !busy && !isError && resumen.totalIngreso !== undefined;
  const hayProds = prods.length > 0;

  return (
    <div className="w-full h-full overflow-hidden flex flex-col">
      {/* Tab */}
      <div className="flex items-end shrink-0">
        <div className="relative flex items-center gap-2 px-4 h-10 border border-b-0 border-white/40"
          style={{ width: 'min(55%, 450px)', ...GLASS, borderRadius: '10px 10px 0 0' }}>
          <TrendingUp size={13} color={OLIVE} />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#374151', fontFamily: "'Syne',sans-serif" }}>Reporte de Rentabilidad</span>
          {busy && <Loader2 size={11} className="animate-spin" color="#8c916c" />}
          <span style={{ position: 'absolute', bottom: 0, right: -28, width: 28, height: 48, overflow: 'hidden', pointerEvents: 'none' }}>
            <span style={{ position: 'absolute', left: 0, bottom: 0, width: 56, height: 56, borderRadius: '50%', boxShadow: '-28px 28px 0 0 rgba(204,204,204,0.22)' }} />
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-hidden rounded-b-2xl rounded-tr-2xl" style={{ ...GLASS, display: 'flex', flexDirection: 'column' }}>

        {/* Filtros */}
        <div style={{ margin: '8px 4px 0', background: 'white', borderRadius: '14px 14px 0 0', padding: '12px 16px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Filter size={13} color="#9ca3af" />
            <span style={{ fontSize: 10, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Filtros</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.06)' }} />
            {[['Hoy', todayRange], ['Este mes', thisMonthRange], ['Mes ant.', lastMonthRange]].map(([l, fn]) => (
              <button key={l} onClick={() => setFilters((f) => ({ ...f, ...fn() }))}
                style={{ height: 24, padding: '0 10px', borderRadius: 6, border: '1.5px solid #e5e7eb', background: 'white', color: '#6b7280', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = OLIVE; e.currentTarget.style.color = OLIVE; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#6b7280'; }}>
                {l}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            {[['Desde', 'desde'], ['Hasta', 'hasta']].map(([lbl, k]) => (
              <div key={k}>
                <label style={{ fontSize: 9, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 4 }}>{lbl}</label>
                <input type="date" value={filters[k]} style={INPUT} onFocus={onFocus} onBlur={onBlur}
                  onChange={(e) => setFilters((f) => ({ ...f, [k]: e.target.value }))} />
              </div>
            ))}
            <div>
              <label style={{ fontSize: 9, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 4 }}>Límite</label>
              <select value={filters.limite} style={{ ...SELECT, width: 80 }} onFocus={onFocus} onBlur={onBlur}
                onChange={(e) => setFilters((f) => ({ ...f, limite: e.target.value }))}>
                <option value="10">Top 10</option>
                <option value="20">Top 20</option>
                <option value="50">Top 50</option>
              </select>
            </div>
            {/* Botón info educativo */}
            <div style={{ position: 'relative', alignSelf: 'flex-end' }}>
              <button onClick={() => setShowInfo((v) => !v)}
                style={{ width: 32, height: 32, borderRadius: 9, border: `1.5px solid ${showInfo ? BLUE : '#e5e7eb'}`, background: showInfo ? '#eff6ff' : 'white', color: showInfo ? BLUE : '#9ca3af', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 140ms' }}>
                <Info size={14} />
              </button>
              {showInfo && (
                <div style={{ position: 'absolute', top: 36, left: 0, width: 290, background: 'white', border: `1.5px solid #bfdbfe`, borderRadius: 12, padding: '12px 14px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', zIndex: 100 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}>
                    <Info size={12} color={BLUE} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: BLUE }}>¿Cómo se calcula el costo?</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 11, color: '#374151', lineHeight: 1.6 }}>
                    El costo se calcula usando el <b>precio del insumo al momento de la venta</b>, no el precio actual de compra.
                    Esto garantiza que el margen refleje la rentabilidad real del período analizado.
                  </p>
                </div>
              )}
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignSelf: 'flex-end' }}>
              {hasData && hayProds && (
                <button onClick={() => doPrint(data, filters)}
                  style={{ height: 36, padding: '0 14px', borderRadius: 10, border: `1.5px solid ${OLIVE}44`, background: 'transparent', color: OLIVE, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Printer size={14} />Exportar
                </button>
              )}
              <button onClick={handleGenerate} disabled={busy}
                style={{ height: 36, padding: '0 18px', borderRadius: 10, border: 'none', background: busy ? '#e5e7eb' : OLIVE, color: busy ? '#9ca3af' : 'white', fontSize: 13, fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 7, fontFamily: "'Syne',sans-serif" }}>
                {busy ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                Generar
              </button>
            </div>
          </div>
        </div>

        {/* Área scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'thin', margin: '0 4px', background: 'white' }}>

          {!hasGenerated && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 340, gap: 14 }}>
              <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(85,98,74,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={28} color={OLIVE} />
              </div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#374151' }}>Analiza la rentabilidad de tus productos</p>
              <p style={{ margin: 0, fontSize: 12, color: '#9ca3af' }}>Configura el período y genera el reporte de márgenes</p>
              <button onClick={handleGenerate}
                style={{ height: 40, padding: '0 24px', borderRadius: 12, border: 'none', background: OLIVE, color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
                <Search size={15} />Generar reporte
              </button>
            </div>
          )}

          {hasGenerated && busy && (
            <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', gap: 12 }}>{[1,2,3,4].map((i) => <div key={i} style={{ flex: 1, height: 110, borderRadius: 16, background: 'rgba(0,0,0,0.05)' }} />)}</div>
              <div style={{ display: 'flex', gap: 14 }}><Skel h={300} /><Skel h={300} /></div>
              <Skel h={220} />
            </div>
          )}

          {hasGenerated && !busy && isError && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 60, gap: 14 }}>
              <AlertCircle size={36} color="#fca5a5" />
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: '#374151' }}>Error al generar el reporte</p>
                <p style={{ margin: 0, fontSize: 11, color: '#9ca3af', maxWidth: 380 }}>{error?.message ?? 'No se pudo conectar con el servidor.'}</p>
              </div>
              <button onClick={handleGenerate}
                style={{ height: 34, padding: '0 16px', borderRadius: 9, border: 'none', background: OLIVE, color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <RefreshCw size={13} />Reintentar
              </button>
            </div>
          )}

          {hasData && !hayProds && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', gap: 10 }}>
              <Package size={36} color="#e5e7eb" />
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#9ca3af' }}>Sin productos con datos de costo en el período</p>
            </div>
          )}

          {/* ═══ REPORTE ═══ */}
          {hasData && hayProds && (
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Panel alertas — productos con pérdida */}
              {alertas.length > 0 && (
                <div style={{ padding: '12px 16px', borderRadius: 14, background: '#fff5f5', border: '1.5px solid #fca5a5', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertTriangle size={15} color={RED} />
                    <span style={{ fontSize: 11, fontWeight: 800, color: RED }}>
                      {alertas.length} producto{alertas.length !== 1 ? 's' : ''} vendido{alertas.length !== 1 ? 's' : ''} por debajo del costo
                    </span>
                  </div>
                  {alertas.map((a) => (
                    <div key={a.productoId} style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 23 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: RED, flexShrink: 0 }} />
                      <p style={{ margin: 0, fontSize: 11, color: '#374151', flex: 1 }}>{a.mensaje}</p>
                      <span style={{ fontSize: 12, fontWeight: 900, color: RED, fontFamily: "'Syne',sans-serif", flexShrink: 0 }}>{formatCOP(a.utilidad)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* KPIs */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <KpiCard Icon={DollarSign} label="Ingreso total" color={OLIVE}
                  value={fmtShort(resumen.totalIngreso ?? 0)} sub={`${prods.length} producto${prods.length !== 1 ? 's' : ''}`} />
                <KpiCard Icon={Package} label="Costo total" color={BLUE}
                  value={fmtShort(resumen.totalCosto ?? 0)} sub="Precio al momento de venta" />
                <KpiCard Icon={TrendingUp} label="Utilidad bruta" color={(resumen.totalUtilidad ?? 0) >= 0 ? EMERALD : RED}
                  value={fmtShort(resumen.totalUtilidad ?? 0)} sub="Ingreso menos costo"
                  alert={(resumen.totalUtilidad ?? 0) < 0} />
                <KpiCard Icon={Percent} label="Margen global" color={margColor(resumen.margenGlobal ?? 0)}
                  value={fmtPct(resumen.margenGlobal ?? 0)}
                  sub={(resumen.productosConPerdida ?? 0) > 0 ? `${resumen.productosConPerdida} con pérdida` : 'Todos rentables'}
                  alert={(resumen.productosConPerdida ?? 0) > 0} />
              </div>

              {/* ComposedChart + PieChart distribución */}
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'stretch' }}>

                {/* ComposedChart: costo apilado + utilidad + línea de margen */}
                <div style={{ ...CARD, flex: 2, minWidth: 300 }}>
                  <SecTitle label="Ingreso vs costo por producto" icon={Layers}
                    sub="Barras apiladas: Costo (base) + Utilidad = Ingreso · Línea roja = margen %"
                  />
                  <ResponsiveContainer width="100%" height={Math.max(220, composedData.length * 28 + 80)}>
                    <ComposedChart data={composedData} margin={{ top: 10, right: 44, left: -10, bottom: composedData.length > 6 ? 60 : 30 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                      <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#9ca3af', angle: composedData.length > 5 ? -40 : 0, textAnchor: composedData.length > 5 ? 'end' : 'middle' }} axisLine={false} tickLine={false} interval={0} />
                      <YAxis yAxisId="money" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={fmtShort} />
                      <YAxis yAxisId="pct" orientation="right" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                      <Tooltip content={<ChartTip />} />
                      <ReferenceLine yAxisId="pct" y={0} stroke={RED} strokeDasharray="4 2" strokeWidth={1.5} />
                      <Bar yAxisId="money" dataKey="Costo" stackId="a" fill={BLUE} fillOpacity={0.7} animationDuration={800} />
                      <Bar yAxisId="money" dataKey="Utilidad" stackId="a" radius={[5,5,0,0]} animationDuration={900}>
                        {composedData.map((e, i) => <Cell key={i} fill={e.esRentable === false ? RED : EMERALD} fillOpacity={0.85} />)}
                      </Bar>
                      <Line yAxisId="pct" type="monotone" dataKey="Margen %" stroke={AMBER} strokeWidth={2.5}
                        dot={{ fill: AMBER, r: 4, strokeWidth: 2, stroke: 'white' }} animationDuration={1200} />
                    </ComposedChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', gap: 14, marginTop: 8, flexWrap: 'wrap' }}>
                    {[['Costo', BLUE], ['Utilidad', EMERALD], ['Pérdida', RED], ['Margen %', AMBER]].map(([n, c]) => (
                      <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
                        <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>{n}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* PieChart distribución por nivel de margen */}
                {pieMargData.length > 0 && (
                  <div style={{ ...CARD, flex: 1, minWidth: 200 }}>
                    <SecTitle label="Distribución de margen" icon={Percent} />
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie data={pieMargData} cx="50%" cy="50%" innerRadius={42} outerRadius={64}
                          dataKey="value" stroke="white" strokeWidth={2} animationDuration={900}
                          label={({ name, value }) => `${value}`} labelLine={false}>
                          {pieMargData.map((e, i) => <Cell key={i} fill={e.color} />)}
                        </Pie>
                        <Tooltip formatter={(v, n) => [`${v} prod.`, n]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 4 }}>
                      {pieMargData.map((e) => (
                        <div key={e.name} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <div style={{ width: 8, height: 8, borderRadius: 2, background: e.color, flexShrink: 0 }} />
                          <span style={{ flex: 1, fontSize: 11, color: '#6b7280' }}>{e.name}</span>
                          <span style={{ fontSize: 12, fontWeight: 900, color: e.color, fontFamily: "'Syne',sans-serif" }}>{e.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Top / Bottom rentables */}
              {prods.length >= 4 && (
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'stretch' }}>
                  {[
                    { title: 'Más rentables', icon: Trophy, color: EMERALD, items: [...prods].sort((a,b) => (b.margenPorcentaje??-Infinity)-(a.margenPorcentaje??-Infinity)).slice(0,5) },
                    { title: 'Menos rentables', icon: AlertTriangle, color: RED, items: [...prods].sort((a,b) => (a.margenPorcentaje??Infinity)-(b.margenPorcentaje??Infinity)).slice(0,5) },
                  ].map(({ title, icon: Icon, color, items }) => (
                    <div key={title} style={{ ...CARD, flex: 1, minWidth: 220 }}>
                      <SecTitle label={title} icon={Icon} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                        {items.map((p, i) => {
                          const mc = margColor(p.margenPorcentaje ?? 0);
                          return (
                            <div key={p.productoId} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                              <span style={{ width: 20, height: 20, borderRadius: 6, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color, flexShrink: 0 }}>{i + 1}</span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nombre}</p>
                                <MargBar pct={p.margenPorcentaje} color={mc} />
                              </div>
                              <span style={{ fontSize: 12, fontWeight: 900, color: mc, fontFamily: "'Syne',sans-serif", flexShrink: 0 }}>{fmtPct(p.margenPorcentaje)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tabla detalle por producto */}
              <div style={CARD}>
                <SecTitle label="Detalle por producto" icon={Package}
                  right={
                    <div style={{ display: 'flex', gap: 5 }}>
                      {[['utilidad', 'Utilidad'], ['margen', 'Margen %'], ['ingreso', 'Ingreso']].map(([v, l]) => (
                        <button key={v} onClick={() => setSortProd(v)}
                          style={{ height: 22, padding: '0 9px', borderRadius: 6, border: `1.5px solid ${sortProd === v ? OLIVE : '#e5e7eb'}`, background: sortProd === v ? OLIVE : 'white', color: sortProd === v ? 'white' : '#6b7280', fontSize: 10, fontWeight: 700, cursor: 'pointer', transition: 'all 120ms' }}>
                          {l}
                        </button>
                      ))}
                    </div>
                  }
                />
                {perdida.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, padding: '7px 12px', borderRadius: 8, background: '#fff5f5' }}>
                    <CheckCircle size={11} color={RED} />
                    <span style={{ fontSize: 11, color: RED }}>Las filas en rojo indican productos vendidos por debajo de su costo de producción</span>
                  </div>
                )}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 560 }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid rgba(0,0,0,0.07)' }}>
                        {['', 'Producto', 'Categoría', 'Uds.', 'Ingreso', 'Costo', 'Utilidad', 'Margen %'].map((h) => (
                          <th key={h} style={{ padding: '8px 8px', textAlign: ['Uds.','Ingreso','Costo','Utilidad','Margen %'].includes(h) ? 'right' : 'left', fontSize: 9, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {prodSorted.map((p, idx) => {
                        const mc  = margColor(p.margenPorcentaje ?? 0);
                        const loss = !p.esRentable;
                        const bg  = loss ? 'rgba(220,38,38,0.04)' : idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.013)';
                        return (
                          <tr key={p.productoId} style={{ background: bg, borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                            <td style={{ padding: '8px 8px', width: 20 }}>
                              {loss ? <AlertTriangle size={12} color={RED} /> : <CheckCircle size={12} color={EMERALD} />}
                            </td>
                            <td style={{ padding: '8px 8px' }}>
                              <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: loss ? RED : '#374151' }}>{p.nombre}</p>
                            </td>
                            <td style={{ padding: '8px 8px', fontSize: 11, color: '#9ca3af' }}>{p.categoria ?? '—'}</td>
                            <td style={{ padding: '8px 8px', textAlign: 'right', fontSize: 11, color: '#6b7280' }}>{p.unidadesVendidas}</td>
                            <td style={{ padding: '8px 8px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: OLIVE, fontFamily: "'Syne',sans-serif" }}>{fmtShort(p.ingresoTotal)}</td>
                            <td style={{ padding: '8px 8px', textAlign: 'right', fontSize: 11, color: '#6b7280' }}>{fmtShort(p.costoTotal)}</td>
                            <td style={{ padding: '8px 8px', textAlign: 'right', fontSize: 12, fontWeight: 800, color: loss ? RED : EMERALD, fontFamily: "'Syne',sans-serif" }}>{fmtShort(p.utilidadBruta)}</td>
                            <td style={{ padding: '8px 8px', textAlign: 'right' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                                <span style={{ fontSize: 12, fontWeight: 900, color: mc, fontFamily: "'Syne',sans-serif" }}>{fmtPct(p.margenPorcentaje)}</span>
                                <MargBar pct={p.margenPorcentaje} color={mc} />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tabla por variante (colapsable) */}
              {variantesSorted.length > 0 && (
                <div style={{ ...CARD, padding: '14px 20px' }}>
                  <button onClick={() => setShowVariantes((v) => !v)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: showVariantes ? 12 : 0 }}>
                    <Layers size={13} color="#9ca3af" />
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      Por variante ({variantesSorted.length})
                    </span>
                    <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.06)' }} />
                    {showVariantes ? <ChevronDown size={14} color="#9ca3af" /> : <ChevronRight size={14} color="#9ca3af" />}
                  </button>
                  {showVariantes && (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 500 }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid rgba(0,0,0,0.07)' }}>
                          {['Producto', 'Variante', 'Uds.', 'Ingreso', 'Costo', 'Utilidad', 'Margen %'].map((h) => (
                            <th key={h} style={{ padding: '7px 8px', textAlign: ['Uds.','Ingreso','Costo','Utilidad','Margen %'].includes(h) ? 'right' : 'left', fontSize: 9, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {variantesSorted.map((v, i) => {
                          const mc   = margColor(v.margen ?? 0);
                          const loss = (v.utilidad ?? 0) < 0;
                          return (
                            <tr key={i} style={{ background: loss ? 'rgba(220,38,38,0.03)' : i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.013)', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                              <td style={{ padding: '7px 8px', fontSize: 11, color: '#374151', fontWeight: 600 }}>{v.productoNombre}</td>
                              <td style={{ padding: '7px 8px', fontSize: 11, color: '#6b7280', fontStyle: 'italic' }}>{v.varianteNombre}</td>
                              <td style={{ padding: '7px 8px', textAlign: 'right', fontSize: 11, color: '#6b7280' }}>{v.unidades}</td>
                              <td style={{ padding: '7px 8px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: OLIVE, fontFamily: "'Syne',sans-serif" }}>{fmtShort(v.ingreso)}</td>
                              <td style={{ padding: '7px 8px', textAlign: 'right', fontSize: 11, color: '#9ca3af' }}>{fmtShort(v.costo)}</td>
                              <td style={{ padding: '7px 8px', textAlign: 'right', fontSize: 11, fontWeight: 800, color: loss ? RED : EMERALD, fontFamily: "'Syne',sans-serif" }}>{fmtShort(v.utilidad)}</td>
                              <td style={{ padding: '7px 8px', textAlign: 'right' }}>
                                <span style={{ fontSize: 12, fontWeight: 900, color: mc, fontFamily: "'Syne',sans-serif" }}>{fmtPct(v.margen)}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              <p style={{ fontSize: 10, color: '#d1d5db', textAlign: 'right', margin: 0 }}>
                {filters.desde} → {filters.hasta}{data.generadoEn ? ` · ${new Date(data.generadoEn).toLocaleString('es-CO')}` : ''}
              </p>
            </div>
          )}
        </div>

        {/* Barra inferior */}
        <div style={{ margin: '0 4px 4px', background: 'white', borderRadius: '0 0 14px 14px', padding: '8px 20px', flexShrink: 0, borderTop: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 10, color: '#9ca3af' }}>
            {hasData && hayProds
              ? `${prods.length} productos · Margen global ${fmtPct(resumen.margenGlobal)} · ${filters.desde} → ${filters.hasta}`
              : 'Configura los filtros y genera el reporte de rentabilidad'}
          </span>
          {hasData && hayProds && (
            <button onClick={() => doPrint(data, filters)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, height: 26, padding: '0 10px', borderRadius: 7, border: `1.5px solid ${OLIVE}44`, background: 'transparent', color: OLIVE, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
              <Printer size={11} />Imprimir
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
