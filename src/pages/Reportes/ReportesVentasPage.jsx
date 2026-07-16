import { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ComposedChart, Line, ScatterChart, Scatter, ZAxis,
} from 'recharts';
import {
  BarChart3, ShoppingCart, DollarSign, Tag, Users, AlertTriangle,
  ChevronDown, ChevronRight, Printer, FileText, Filter, Search,
  TrendingDown, Banknote, Smartphone, Shuffle, Trophy, Package,
  X, Loader2, AlertCircle, Zap, RefreshCw,
} from 'lucide-react';
import { useSalesReport } from '../../hooks/useReports';
import { useUsers } from '../../hooks/useUsers';

// ── Diseño ────────────────────────────────────────────────────────────────────
const OLIVE   = '#55624a';
const GREEN   = '#15803d';
const RED     = '#dc2626';
const BLUE    = '#1d4ed8';
const AMBER   = '#d97706';
const PURPLE  = '#7c3aed';
const TEAL    = '#0d9488';

const GLASS = { background: 'rgba(204,204,204,0.22)', backdropFilter: 'blur(28px) saturate(1.8)', WebkitBackdropFilter: 'blur(28px) saturate(1.8)' };
const CARD  = { background: 'white', borderRadius: 16, border: '1.5px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: '18px 20px' };
const CHEVRON = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`;
const PALETTE = [OLIVE, TEAL, BLUE, PURPLE, AMBER, GREEN, RED];

const METODO = {
  EFECTIVO:      { color: GREEN,  label: 'Efectivo',      Icon: Banknote },
  TRANSFERENCIA: { color: BLUE,   label: 'Transferencia', Icon: Smartphone },
  COMBINADO:     { color: PURPLE, label: 'Combinado',     Icon: Shuffle },
};

// ── Formatters ────────────────────────────────────────────────────────────────
const COP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });
const formatCOP = (n) => (n != null ? COP.format(n) : '$0');
const fmtShort  = (n) => {
  if (!n && n !== 0) return '$0';
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000)     return `$${(n / 1_000).toFixed(0)}k`;
  return formatCOP(n);
};
const p2 = (x) => String(x).padStart(2, '0');
const fmtD = (d) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
const todayRange    = () => { const s = fmtD(new Date()); return { desde: s, hasta: s }; };
const thisMonthRange = () => { const d = new Date(); return { desde: `${d.getFullYear()}-${p2(d.getMonth()+1)}-01`, hasta: fmtD(d) }; };
const lastMonthRange = () => {
  const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1);
  return { desde: fmtD(d), hasta: fmtD(new Date(d.getFullYear(), d.getMonth() + 1, 0)) };
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

function KpiCard({ Icon, label, value, sub, color, badge }) {
  return (
    <div style={{ flex: 1, minWidth: 140, padding: 16, borderRadius: 16, background: `${color}0d`, border: `1.5px solid ${color}30`, display: 'flex', flexDirection: 'column', gap: 9 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} color={color} />
        </div>
        {badge != null && badge > 0 && (
          <span style={{ padding: '2px 8px', borderRadius: 6, background: '#fee2e2', color: RED, fontSize: 10, fontWeight: 800 }}>{badge}</span>
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

function MiniBar({ value, max, color }) {
  const w = max > 0 ? `${Math.round((value / max) * 100)}%` : '0%';
  return <div style={{ height: 4, borderRadius: 99, background: `${color}20`, overflow: 'hidden', marginTop: 3 }}><div style={{ height: '100%', width: w, background: color, borderRadius: 99, transition: 'width 700ms ease' }} /></div>;
}

function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: '10px 14px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', minWidth: 150 }}>
      {label && <p style={{ margin: '0 0 7px', fontSize: 10, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase' }}>{label}</p>}
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: i < payload.length - 1 ? 4 : 0 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: p.fill ?? p.color }} />
          <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>{p.name}:</span>
          <span style={{ fontSize: 11, color: p.fill ?? p.color, fontWeight: 800, fontFamily: "'Syne',sans-serif" }}>
            {p.name === 'Unidades' ? p.value : fmtShort(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

function PieTip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: '10px 14px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}>
      <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 700, color: '#374151' }}>{d.name}</p>
      <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 900, color: d.payload.color, fontFamily: "'Syne',sans-serif" }}>{formatCOP(d.value)}</p>
      <p style={{ margin: 0, fontSize: 10, color: '#9ca3af' }}>{d.payload.cantidad} vta{d.payload.cantidad !== 1 ? 's' : ''} · {d.payload.pct}%</p>
    </div>
  );
}

function ScatterTip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: '10px 14px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}>
      <p style={{ margin: '0 0 5px', fontSize: 12, fontWeight: 700, color: '#374151' }}>{d.nombre}</p>
      <p style={{ margin: '0 0 2px', fontSize: 11, color: '#6b7280' }}>Ingreso: <b style={{ color: OLIVE }}>{fmtShort(d.ingresoGenerado)}</b></p>
      <p style={{ margin: '0 0 2px', fontSize: 11, color: '#6b7280' }}>Unidades: <b style={{ color: TEAL }}>{d.unidadesVendidas}</b></p>
      {d.categoria && <p style={{ margin: 0, fontSize: 10, color: '#9ca3af' }}>{d.categoria}</p>}
    </div>
  );
}

function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  if (percent < 0.08) return null;
  const R = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  return (
    <text x={cx + r * Math.cos(-midAngle * R)} y={cy + r * Math.sin(-midAngle * R)}
      fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={800}>
      {(percent * 100).toFixed(0)}%
    </text>
  );
}

function Skel({ h = 200 }) {
  return <div style={{ height: h, borderRadius: 12, background: 'rgba(0,0,0,0.05)' }} />;
}

// ── Print ─────────────────────────────────────────────────────────────────────
function doPrint(data, filters, cajeroLabel) {
  const r  = data.resumen      ?? {};
  const tp = data.topProductos ?? [];
  const pc = data.porCajero    ?? [];
  const pcat = data.porCategoria ?? [];
  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"/><title>Reporte de Ventas</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,sans-serif;font-size:12px;padding:16mm}
h1{font-size:20px;font-weight:800;margin-bottom:4px}h2{font-size:12px;font-weight:700;margin:14px 0 6px;border-bottom:1px solid #e5e7eb;padding-bottom:3px}
.meta{font-size:10px;color:#6b7280;margin-bottom:12px}.kpis{display:flex;gap:10px;margin-bottom:14px}
.kpi{flex:1;padding:10px 12px;border-radius:8px;border:1px solid #e5e7eb}.kv{font-size:17px;font-weight:800}.kl{font-size:9px;color:#9ca3af;text-transform:uppercase;letter-spacing:.06em}
table{width:100%;border-collapse:collapse;font-size:11px;margin-bottom:12px}
th{padding:5px 8px;text-align:left;font-size:9px;font-weight:700;color:#9ca3af;text-transform:uppercase;border-bottom:1px solid #e5e7eb;background:#f9fafb}
td{padding:6px 8px;border-bottom:1px solid #f3f4f6}.r{text-align:right;font-weight:700}
.foot{margin-top:16px;font-size:10px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:7px}</style></head><body>
<h1>Reporte de Ventas</h1>
<p class="meta">Período: ${filters.desde} – ${filters.hasta}${cajeroLabel ? ' · Cajero: ' + cajeroLabel : ''}${filters.metodoPago ? ' · Método: ' + filters.metodoPago : ''} · ${new Date().toLocaleString('es-CO')}</p>
<div class="kpis">
  <div class="kpi"><div class="kv">${formatCOP(r.totalVentas)}</div><div class="kl">Total ventas</div></div>
  <div class="kpi"><div class="kv">${r.cantidadVentas ?? 0}</div><div class="kl">Transacciones</div></div>
  <div class="kpi"><div class="kv">${formatCOP(r.totalDescuentos)}</div><div class="kl">Descuentos</div></div>
  <div class="kpi"><div class="kv">${r.cantidadAnuladas ?? 0}</div><div class="kl">Anuladas</div></div>
</div>
${tp.length ? `<h2>Top Productos</h2><table><thead><tr><th>#</th><th>Producto</th><th>Categoría</th><th class="r">Uds.</th><th class="r">Ingreso</th></tr></thead><tbody>${tp.map(p=>`<tr><td><b>${p.posicion}</b></td><td>${p.nombre}</td><td>${p.categoria??'—'}</td><td class="r">${p.unidadesVendidas}</td><td class="r">${formatCOP(p.ingresoGenerado)}</td></tr>`).join('')}</tbody></table>` : ''}
${pc.length  ? `<h2>Por Cajero</h2><table><thead><tr><th>Cajero</th><th>Usuario</th><th class="r">Total</th><th class="r">Trans.</th></tr></thead><tbody>${pc.map(c=>`<tr><td>${c.nombreCompleto}</td><td>@${c.nombreUsuario}</td><td class="r">${formatCOP(c.totalVentas)}</td><td class="r">${c.cantidadVentas}</td></tr>`).join('')}</tbody></table>` : ''}
${pcat.length ? `<h2>Por Categoría</h2><table><thead><tr><th>Categoría</th><th class="r">Total</th><th class="r">Uds.</th></tr></thead><tbody>${pcat.map(c=>`<tr><td>${c.categoriaNombre}</td><td class="r">${formatCOP(c.totalVentas)}</td><td class="r">${c.unidadesVendidas}</td></tr>`).join('')}</tbody></table>` : ''}
<div class="foot">Liria Café · Sistema POS</div></body></html>`;
  const win = window.open('', '_blank', 'width=900,height=700');
  if (win) { win.document.write(html); win.document.close(); win.onload = () => { win.focus(); win.print(); }; }
}

// ─────────────────────────────────────────────────────────────────────────────
export default function ReportesVentasPage() {
  const [filters, setFilters] = useState({ ...thisMonthRange(), cajeroId: '', metodoPago: '', topProductos: '10', incluirAnuladas: false });
  const [hasGenerated, setHasGenerated] = useState(false);
  const [showAnuladas, setShowAnuladas] = useState(false);
  const [sortBy, setSortBy] = useState('ingreso');

  const { data: usersRaw } = useUsers({ estado: 'ACTIVO', limit: 100 });
  const cajeros = useMemo(() => { const a = usersRaw?.data ?? usersRaw ?? []; return Array.isArray(a) ? a : []; }, [usersRaw]);

  const queryParams = useMemo(() => {
    const p = {};
    if (filters.desde) p.desde = filters.desde + 'T00:00:00.000Z';
    if (filters.hasta) p.hasta = filters.hasta + 'T23:59:59.999Z';
    if (filters.cajeroId)   p.cajeroId   = filters.cajeroId;
    if (filters.metodoPago) p.metodoPago = filters.metodoPago;
    p.topProductos    = parseInt(filters.topProductos);
    p.incluirAnuladas = filters.incluirAnuladas;
    return p;
  }, [filters]);

  const { data: raw, isLoading, isFetching, isError, error, refetch } = useSalesReport(queryParams);
  const handleGenerate = useCallback(async () => { setHasGenerated(true); await refetch(); }, [refetch]);

  // ── Datos según spec exacto ──
  const data     = raw?.data ?? raw ?? {};
  const resumen  = data.resumen ?? {};
  const topProd  = data.topProductos  ?? [];
  const porCajero  = data.porCajero   ?? [];
  const porCat     = data.porCategoria ?? [];
  const anuladas   = data.ventasAnuladas ?? [];
  // resumen.porMetodoPago[] = [{metodoPago, total, cantidad}]
  const porMetodo   = resumen.porMetodoPago ?? [];
  const totalMetodo = porMetodo.reduce((s, m) => s + (m.total ?? 0), 0);
  const ticketProm  = (resumen.cantidadVentas ?? 0) > 0 ? Math.round((resumen.totalVentas ?? 0) / resumen.cantidadVentas) : 0;
  const cajeroLabel = filters.cajeroId ? (cajeros.find((u) => u.id === filters.cajeroId)?.nombreCompleto ?? '') : '';

  // ── Chart data ──
  const pieData = useMemo(() =>
    porMetodo.map((m) => ({
      name: METODO[m.metodoPago]?.label ?? m.metodoPago,
      value: m.total, cantidad: m.cantidad,
      color: METODO[m.metodoPago]?.color ?? OLIVE,
      pct: totalMetodo > 0 ? Math.round((m.total / totalMetodo) * 100) : 0,
    })), [porMetodo, totalMetodo]);

  // topProductos[].{posicion, productoId, nombre, categoria, unidadesVendidas, ingresoGenerado}
  const prodSorted = useMemo(() =>
    [...topProd].sort((a, b) => sortBy === 'ingreso' ? b.ingresoGenerado - a.ingresoGenerado : b.unidadesVendidas - a.unidadesVendidas)
      .slice(0, parseInt(filters.topProductos)), [topProd, sortBy, filters.topProductos]);

  const prodBarData = useMemo(() => prodSorted.map((p) => ({
    name: p.nombre.length > 22 ? p.nombre.slice(0, 20) + '…' : p.nombre,
    Ingreso: p.ingresoGenerado, Unidades: p.unidadesVendidas,
  })), [prodSorted]);

  // porCajero[].{cajeroId, nombreCompleto, nombreUsuario, totalVentas, cantidadVentas}
  const cajeroData = useMemo(() =>
    [...porCajero].sort((a, b) => b.totalVentas - a.totalVentas).map((c) => ({
      name: c.nombreCompleto.split(' ').slice(0, 2).join(' '),
      Ventas: c.totalVentas, qty: c.cantidadVentas,
    })), [porCajero]);

  // porCategoria[].{categoriaId, categoriaNombre, totalVentas, unidadesVendidas}
  const catData = useMemo(() =>
    [...porCat].sort((a, b) => b.totalVentas - a.totalVentas).slice(0, 8).map((c) => ({
      name: c.categoriaNombre.length > 14 ? c.categoriaNombre.slice(0, 12) + '…' : c.categoriaNombre,
      Ventas: c.totalVentas, Unidades: c.unidadesVendidas,
    })), [porCat]);

  const scatterData = useMemo(() => topProd.map((p) => ({
    unidadesVendidas: p.unidadesVendidas, ingresoGenerado: p.ingresoGenerado,
    nombre: p.nombre, categoria: p.categoria,
    z: Math.max(60, Math.min(500, Math.round(p.ingresoGenerado / Math.max(p.unidadesVendidas, 1) / 50))),
  })), [topProd]);

  const maxProd   = Math.max(...prodBarData.map((d) => sortBy === 'ingreso' ? d.Ingreso : d.Unidades), 1);
  const maxCajero = Math.max(...cajeroData.map((d) => d.Ventas), 1);

  const busy     = isLoading || isFetching;
  const hasData  = hasGenerated && !busy && !isError && resumen.cantidadVentas !== undefined;
  const hayVentas = (resumen.cantidadVentas ?? 0) > 0;

  return (
    <div className="w-full h-full overflow-hidden flex flex-col">
      {/* Tab */}
      <div className="flex items-end shrink-0">
        <div className="relative flex items-center gap-2 px-4 h-10 border border-b-0 border-white/40"
          style={{ width: 'min(55%, 420px)', ...GLASS, borderRadius: '10px 10px 0 0' }}>
          <BarChart3 size={13} color={OLIVE} />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#374151', fontFamily: "'Syne',sans-serif" }}>Reporte de Ventas</span>
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
              <label style={{ fontSize: 9, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 4 }}>Cajero</label>
              <select value={filters.cajeroId} style={{ ...SELECT, minWidth: 130 }} onFocus={onFocus} onBlur={onBlur}
                onChange={(e) => setFilters((f) => ({ ...f, cajeroId: e.target.value }))}>
                <option value="">Todos</option>
                {cajeros.map((u) => <option key={u.id} value={u.id}>{u.nombreCompleto ?? u.nombreUsuario}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 9, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 4 }}>Método</label>
              <select value={filters.metodoPago} style={{ ...SELECT, minWidth: 120 }} onFocus={onFocus} onBlur={onBlur}
                onChange={(e) => setFilters((f) => ({ ...f, metodoPago: e.target.value }))}>
                <option value="">Todos</option>
                <option value="EFECTIVO">Efectivo</option>
                <option value="TRANSFERENCIA">Transferencia</option>
                <option value="COMBINADO">Combinado</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 9, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 4 }}>Top</label>
              <select value={filters.topProductos} style={{ ...SELECT, width: 80 }} onFocus={onFocus} onBlur={onBlur}
                onChange={(e) => setFilters((f) => ({ ...f, topProductos: e.target.value }))}>
                <option value="5">Top 5</option>
                <option value="10">Top 10</option>
                <option value="20">Top 20</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 9, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Anuladas</label>
              <button onClick={() => setFilters((f) => ({ ...f, incluirAnuladas: !f.incluirAnuladas }))}
                style={{ width: 44, height: 24, borderRadius: 12, background: filters.incluirAnuladas ? RED : '#d1d5db', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 180ms' }}>
                <div style={{ position: 'absolute', top: 4, left: filters.incluirAnuladas ? 22 : 4, width: 16, height: 16, borderRadius: '50%', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.25)', transition: 'left 180ms' }} />
              </button>
            </div>
            {(filters.cajeroId || filters.metodoPago) && (
              <button onClick={() => setFilters((f) => ({ ...f, cajeroId: '', metodoPago: '' }))}
                style={{ height: 32, padding: '0 10px', borderRadius: 9, border: '1.5px solid #fca5a5', background: '#fff5f5', color: RED, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, alignSelf: 'flex-end' }}>
                <X size={11} />Limpiar
              </button>
            )}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignSelf: 'flex-end' }}>
              {hasData && hayVentas && (
                <button onClick={() => doPrint(data, filters, cajeroLabel)}
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

          {/* Estado inicial */}
          {!hasGenerated && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 340, gap: 14 }}>
              <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(85,98,74,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={28} color={OLIVE} />
              </div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#374151' }}>Configura los filtros y genera el reporte</p>
              <p style={{ margin: 0, fontSize: 12, color: '#9ca3af' }}>Selecciona período, cajero y método de pago</p>
              <button onClick={handleGenerate}
                style={{ height: 40, padding: '0 24px', borderRadius: 12, border: 'none', background: OLIVE, color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
                <Search size={15} />Generar reporte
              </button>
            </div>
          )}

          {/* Cargando */}
          {hasGenerated && busy && (
            <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', gap: 12 }}>{[1,2,3,4].map((i) => <div key={i} style={{ flex: 1, height: 110, borderRadius: 16, background: 'rgba(0,0,0,0.05)' }} />)}</div>
              <div style={{ display: 'flex', gap: 14 }}><Skel h={260} /><Skel h={260} /></div>
              <Skel h={220} /><Skel h={200} />
            </div>
          )}

          {/* Error */}
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

          {/* Sin ventas */}
          {hasData && !hayVentas && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', gap: 10 }}>
              <ShoppingCart size={36} color="#e5e7eb" />
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#9ca3af' }}>Sin ventas en el período seleccionado</p>
            </div>
          )}

          {/* ═══ REPORTE ═══ */}
          {hasData && hayVentas && (
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* KPIs */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <KpiCard Icon={DollarSign} label="Total ventas" color={OLIVE}
                  value={fmtShort(resumen.totalVentas ?? 0)} sub={`${resumen.cantidadVentas ?? 0} transacciones`} />
                <KpiCard Icon={ShoppingCart} label="Ticket promedio" color={BLUE}
                  value={fmtShort(ticketProm)} sub="Por transacción" />
                <KpiCard Icon={Tag} label="Descuentos" color={AMBER}
                  value={fmtShort(resumen.totalDescuentos ?? 0)} sub="Total acumulado" />
                <KpiCard Icon={TrendingDown} label="Ventas anuladas"
                  color={(resumen.cantidadAnuladas ?? 0) > 0 ? RED : GREEN}
                  value={String(resumen.cantidadAnuladas ?? 0)}
                  sub={(resumen.cantidadAnuladas ?? 0) > 0 ? 'Requieren revisión' : 'Sin anulaciones'}
                  badge={(resumen.cantidadAnuladas ?? 0) > 0 ? resumen.cantidadAnuladas : undefined} />
              </div>

              {/* Método de pago + Scatter */}
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'stretch' }}>

                {/* Donut */}
                {pieData.length > 0 && (
                  <div style={{ ...CARD, flex: 1, minWidth: 220 }}>
                    <SecTitle label="Método de pago" icon={Banknote} />
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={46} outerRadius={68}
                          dataKey="value" labelLine={false} label={PieLabel}
                          stroke="white" strokeWidth={2} animationDuration={900} animationBegin={0}>
                          {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                        </Pie>
                        <Tooltip content={<PieTip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 4 }}>
                      {pieData.map((e) => (
                        <div key={e.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 8, height: 8, borderRadius: 2, background: e.color, flexShrink: 0 }} />
                          <span style={{ flex: 1, fontSize: 11, color: '#6b7280', fontWeight: 600 }}>{e.name}</span>
                          <span style={{ fontSize: 10, color: '#9ca3af' }}>{e.cantidad} vtas.</span>
                          <span style={{ fontSize: 12, color: e.color, fontWeight: 900, fontFamily: "'Syne',sans-serif" }}>{e.pct}%</span>
                        </div>
                      ))}
                      <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 7, display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>Recaudado</span>
                        <span style={{ fontSize: 13, color: OLIVE, fontWeight: 900, fontFamily: "'Syne',sans-serif" }}>{fmtShort(totalMetodo)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Scatter */}
                {scatterData.length > 0 && (
                  <div style={{ ...CARD, flex: 2, minWidth: 280 }}>
                    <SecTitle label="Mapa de productos" icon={Zap}
                      sub="Eje X = unidades · Eje Y = ingreso · tamaño = precio promedio" />
                    <ResponsiveContainer width="100%" height={210}>
                      <ScatterChart margin={{ top: 10, right: 10, left: -15, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                        <XAxis dataKey="unidadesVendidas" type="number" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                          label={{ value: 'Unidades', position: 'insideBottom', offset: -3, fontSize: 9, fill: '#9ca3af' }} />
                        <YAxis dataKey="ingresoGenerado" type="number" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={fmtShort} />
                        <ZAxis dataKey="z" range={[50, 450]} />
                        <Tooltip content={<ScatterTip />} />
                        <Scatter data={scatterData} fill={OLIVE} fillOpacity={0.7} animationDuration={900} />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Top productos */}
              <div style={CARD}>
                <SecTitle label={`Top ${filters.topProductos} productos`} icon={Trophy}
                  right={
                    <div style={{ display: 'flex', gap: 5 }}>
                      {[['ingreso', 'Por ingreso'], ['unidades', 'Por unidades']].map(([v, l]) => (
                        <button key={v} onClick={() => setSortBy(v)}
                          style={{ height: 22, padding: '0 9px', borderRadius: 6, border: `1.5px solid ${sortBy === v ? OLIVE : '#e5e7eb'}`, background: sortBy === v ? OLIVE : 'white', color: sortBy === v ? 'white' : '#6b7280', fontSize: 10, fontWeight: 700, cursor: 'pointer', transition: 'all 120ms' }}>
                          {l}
                        </button>
                      ))}
                    </div>
                  }
                />
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  <div style={{ flex: 2, minWidth: 260 }}>
                    <ResponsiveContainer width="100%" height={Math.max(180, prodBarData.length * 36 + 30)}>
                      <BarChart data={prodBarData} layout="vertical" margin={{ top: 0, right: 65, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                          tickFormatter={sortBy === 'ingreso' ? fmtShort : (v) => v} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} width={120} />
                        <Tooltip content={<ChartTip />} />
                        <Bar dataKey={sortBy === 'ingreso' ? 'Ingreso' : 'Unidades'} radius={[0, 6, 6, 0]} maxBarSize={18} animationDuration={800}
                          label={{ position: 'right', fontSize: 10, fill: '#9ca3af', formatter: sortBy === 'ingreso' ? fmtShort : (v) => v }}>
                          {prodBarData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} fillOpacity={0.85} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Tabla ranking */}
                  <div style={{ flex: 1, minWidth: 180, overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr>
                          {['#', 'Producto', 'Cat.', 'Uds.', 'Ingreso'].map((h) => (
                            <th key={h} style={{ padding: '5px 6px', textAlign: ['Uds.','Ingreso'].includes(h) ? 'right' : 'left', fontSize: 9, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {prodSorted.map((p) => (
                          <tr key={p.productoId} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                            <td style={{ padding: '6px 6px' }}>
                              <span style={{ fontSize: p.posicion <= 3 ? 14 : 10, fontWeight: 800, color: p.posicion <= 3 ? AMBER : '#9ca3af' }}>
                                {p.posicion <= 3 ? ['🥇','🥈','🥉'][p.posicion - 1] : p.posicion}
                              </span>
                            </td>
                            <td style={{ padding: '6px 6px' }}>
                              <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: '#374151', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nombre}</p>
                              <MiniBar value={sortBy === 'ingreso' ? p.ingresoGenerado : p.unidadesVendidas} max={maxProd} color={PALETTE[(p.posicion - 1) % PALETTE.length]} />
                            </td>
                            <td style={{ padding: '6px 6px', fontSize: 10, color: '#9ca3af', maxWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.categoria ?? '—'}</td>
                            <td style={{ padding: '6px 6px', textAlign: 'right', fontSize: 11, color: '#6b7280' }}>{p.unidadesVendidas}</td>
                            <td style={{ padding: '6px 6px', textAlign: 'right', fontSize: 11, fontWeight: 800, color: OLIVE, fontFamily: "'Syne',sans-serif" }}>{fmtShort(p.ingresoGenerado)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Por cajero + por categoría */}
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'stretch' }}>

                {cajeroData.length > 0 && (
                  <div style={{ ...CARD, flex: 1, minWidth: 240 }}>
                    <SecTitle label="Por cajero" icon={Users}
                      right={<span style={{ fontSize: 10, color: '#9ca3af' }}>{porCajero.length} cajero{porCajero.length !== 1 ? 's' : ''}</span>} />
                    <ResponsiveContainer width="100%" height={Math.max(140, cajeroData.length * 40 + 24)}>
                      <BarChart data={cajeroData} layout="vertical" margin={{ top: 0, right: 60, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={fmtShort} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} width={80} />
                        <Tooltip content={<ChartTip />} />
                        <Bar dataKey="Ventas" fill={TEAL} fillOpacity={0.85} radius={[0, 6, 6, 0]} maxBarSize={18} animationDuration={800}
                          label={{ position: 'right', fontSize: 10, fill: '#9ca3af', formatter: fmtShort }} />
                      </BarChart>
                    </ResponsiveContainer>
                    <div style={{ marginTop: 10, borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {[...porCajero].sort((a, b) => b.totalVentas - a.totalVentas).map((c) => (
                        <div key={c.cajeroId} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                          <div style={{ width: 28, height: 28, borderRadius: 8, background: `${TEAL}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Users size={12} color={TEAL} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.nombreCompleto}</p>
                            <p style={{ margin: '1px 0 2px', fontSize: 9, color: '#9ca3af' }}>@{c.nombreUsuario} · {c.cantidadVentas} trans.</p>
                            <MiniBar value={c.totalVentas} max={maxCajero} color={TEAL} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 900, color: TEAL, fontFamily: "'Syne',sans-serif", flexShrink: 0 }}>{fmtShort(c.totalVentas)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {catData.length > 0 && (
                  <div style={{ ...CARD, flex: 1.5, minWidth: 280 }}>
                    <SecTitle label="Por categoría" icon={Package}
                      sub="Barras = ventas ($) · Línea = unidades" />
                    <ResponsiveContainer width="100%" height={Math.max(180, catData.length * 28 + 70)}>
                      <ComposedChart data={catData} margin={{ top: 5, right: 30, left: -10, bottom: catData.length > 5 ? 50 : 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                        <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#9ca3af', angle: catData.length > 4 ? -35 : 0, textAnchor: catData.length > 4 ? 'end' : 'middle' }} axisLine={false} tickLine={false} interval={0} />
                        <YAxis yAxisId="v" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={fmtShort} />
                        <YAxis yAxisId="u" orientation="right" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                        <Tooltip content={<ChartTip />} />
                        <Bar yAxisId="v" dataKey="Ventas" fill={PURPLE} fillOpacity={0.82} radius={[5,5,0,0]} maxBarSize={28} animationDuration={800}
                          label={{ position: 'top', fontSize: 9, fill: '#9ca3af', formatter: fmtShort }} />
                        <Line yAxisId="u" type="monotone" dataKey="Unidades" stroke={AMBER} strokeWidth={2.5}
                          dot={{ fill: AMBER, r: 4, strokeWidth: 2, stroke: 'white' }} animationDuration={1100} />
                      </ComposedChart>
                    </ResponsiveContainer>
                    <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: 10, marginTop: 6 }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                          <tr>{['Categoría', 'Ventas', 'Uds.'].map((h) => (
                            <th key={h} style={{ padding: '4px 6px', textAlign: h !== 'Categoría' ? 'right' : 'left', fontSize: 9, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>{h}</th>
                          ))}</tr>
                        </thead>
                        <tbody>
                          {[...porCat].sort((a, b) => b.totalVentas - a.totalVentas).map((c, i) => (
                            <tr key={c.categoriaId ?? c.categoriaNombre} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.015)', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                              <td style={{ padding: '5px 6px', fontSize: 11, color: '#374151', fontWeight: 600 }}>{c.categoriaNombre}</td>
                              <td style={{ padding: '5px 6px', textAlign: 'right', fontSize: 11, fontWeight: 800, color: PURPLE, fontFamily: "'Syne',sans-serif" }}>{fmtShort(c.totalVentas)}</td>
                              <td style={{ padding: '5px 6px', textAlign: 'right', fontSize: 11, color: '#6b7280' }}>{c.unidadesVendidas}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Ventas anuladas colapsable */}
              {filters.incluirAnuladas && anuladas.length > 0 && (
                <div style={{ ...CARD, border: '1.5px solid #fca5a5', padding: '14px 20px' }}>
                  <button onClick={() => setShowAnuladas((v) => !v)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: showAnuladas ? 12 : 0 }}>
                    <AlertTriangle size={13} color={RED} />
                    <span style={{ fontSize: 10, fontWeight: 800, color: RED, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      Ventas anuladas ({anuladas.length})
                    </span>
                    <div style={{ flex: 1, height: 1, background: '#fca5a5' }} />
                    {showAnuladas ? <ChevronDown size={14} color={RED} /> : <ChevronRight size={14} color={RED} />}
                  </button>
                  {showAnuladas && (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr>{['# Factura', 'Motivo', 'Cajero', 'Monto'].map((h) => (
                          <th key={h} style={{ padding: '6px 8px', textAlign: h === 'Monto' ? 'right' : 'left', fontSize: 9, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', borderBottom: '1.5px solid rgba(0,0,0,0.07)' }}>{h}</th>
                        ))}</tr>
                      </thead>
                      <tbody>
                        {anuladas.map((v, i) => (
                          <tr key={i} style={{ background: i % 2 === 0 ? '#fff5f5' : 'white', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                            <td style={{ padding: '7px 8px', fontWeight: 700, color: RED, fontFamily: "'Syne',sans-serif" }}>#{v.numero ?? '—'}</td>
                            <td style={{ padding: '7px 8px', color: '#374151', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.motivoAnulacion ?? '—'}</td>
                            <td style={{ padding: '7px 8px', color: '#6b7280' }}>{v.cajero?.nombreCompleto ?? '—'}</td>
                            <td style={{ padding: '7px 8px', textAlign: 'right', fontWeight: 800, color: RED, fontFamily: "'Syne',sans-serif" }}>
                              <span style={{ textDecoration: 'line-through' }}>{formatCOP(v.total)}</span>
                            </td>
                          </tr>
                        ))}
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
            {hasData && hayVentas ? `${resumen.cantidadVentas} ventas · ${fmtShort(resumen.totalVentas)} · ${filters.desde} → ${filters.hasta}` : 'Configura los filtros y genera el reporte'}
          </span>
          {hasData && hayVentas && (
            <button onClick={() => doPrint(data, filters, cajeroLabel)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, height: 26, padding: '0 10px', borderRadius: 7, border: `1.5px solid ${OLIVE}44`, background: 'transparent', color: OLIVE, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
              <Printer size={11} />Imprimir
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
