import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  ShoppingCart, DollarSign, Package, Warehouse, TrendingUp,
  TrendingDown, AlertTriangle, Trophy, CircleDot, Circle,
  ArrowUpRight, ArrowDownRight, Banknote, Smartphone,
  RefreshCw, ShoppingBag, Calendar, Zap, BarChart3,
  Layers, Activity,
} from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { canAccess } from '../../utils/permissions';
import { useDashboard } from '../../hooks/useReports';
import { useCashStatus } from '../../hooks/useCashRegister';
import { useMovements, useCashFlowSummary } from '../../hooks/useCashFlow';

// ── Paleta ────────────────────────────────────────────────────────────────────
const C = {
  olive:  '#55624a',
  green:  '#15803d',
  red:    '#dc2626',
  blue:   '#1d4ed8',
  amber:  '#d97706',
  purple: '#7c3aed',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatCOP(n) {
  if (!n || isNaN(n)) return '$0';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0,
  }).format(n);
}
function fmtTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}
function fmtDatetime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit' })
    + ' ' + d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

const pad = (n) => String(n).padStart(2, '0');
const fmtDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function getPeriodDates(period) {
  const now = new Date();
  if (period === 'today') {
    const s = fmtDate(now);
    return { desde: `${s}T00:00:00.000Z`, hasta: `${s}T23:59:59.999Z` };
  }
  if (period === 'week') {
    const day = now.getDay();
    const mon = new Date(now); mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    return { desde: `${fmtDate(mon)}T00:00:00.000Z`, hasta: `${fmtDate(now)}T23:59:59.999Z` };
  }
  if (period === 'month') {
    const s = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
    return { desde: `${s}T00:00:00.000Z`, hasta: `${fmtDate(now)}T23:59:59.999Z` };
  }
  return {};
}

// ── Custom Tooltip ────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'white', border: '1px solid #e5e7eb', borderRadius: 10,
      padding: '10px 14px', boxShadow: '0 8px 30px rgba(0,0,0,0.10)', minWidth: 150,
    }}>
      <p style={{ margin: '0 0 8px', fontSize: 10, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
      {payload.map((p) => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: p.color, flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>{p.name}:</span>
          <span style={{ fontSize: 11, color: p.color, fontWeight: 800, fontFamily: "'Syne',sans-serif" }}>
            {formatCOP(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

function BarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 14px', boxShadow: '0 8px 30px rgba(0,0,0,0.10)' }}>
      <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#374151' }}>{label}</p>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: payload[0]?.fill ?? '#6b7280', fontFamily: "'Syne',sans-serif" }}>
        {formatCOP(payload[0]?.value)}
      </p>
    </div>
  );
}

// ── PieLabel ──────────────────────────────────────────────────────────────────
function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  if (percent < 0.06) return null;
  const R = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * R);
  const y = cy + r * Math.sin(-midAngle * R);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
      fontSize={11} fontWeight={800}>
      {(percent * 100).toFixed(0)}%
    </text>
  );
}

// ── KpiCard ───────────────────────────────────────────────────────────────────
function KpiCard({ Icon, label, value, sub, color, bg, border, isLoading, badge, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        flex: 1, minWidth: 148,
        padding: '16px', borderRadius: 16,
        background: bg, border: `1.5px solid ${border ?? color + '22'}`,
        display: 'flex', flexDirection: 'column', gap: 10,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 150ms, box-shadow 150ms',
        transform: hov && onClick ? 'translateY(-2px)' : 'none',
        boxShadow: hov && onClick ? `0 8px 28px ${color}20` : '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ width: 38, height: 38, borderRadius: 11, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={17} color={color} />
        </div>
        {badge != null && (
          <span style={{ height: 20, padding: '0 8px', borderRadius: 6, background: '#fee2e2', color: C.red, fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 3 }}>
            <AlertTriangle size={9} /> {badge}
          </span>
        )}
      </div>
      {isLoading ? (
        <div style={{ width: '65%', height: 24, background: 'rgba(0,0,0,0.07)', borderRadius: 7 }} />
      ) : (
        <p style={{ margin: 0, fontSize: 21, fontWeight: 900, color, fontFamily: "'Syne',sans-serif", letterSpacing: '-0.01em', lineHeight: 1 }}>
          {value}
        </p>
      )}
      <div>
        <p style={{ margin: '0 0 2px', fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</p>
        {sub && !isLoading && <p style={{ margin: 0, fontSize: 11, color: '#6b7280' }}>{sub}</p>}
      </div>
    </div>
  );
}

// ── CajaCard ──────────────────────────────────────────────────────────────────
function CajaCard({ cashStatus, isLoading, navigate }) {
  const isOpen = cashStatus?.hayTCajaAbierta ?? false;
  const color  = isOpen ? C.green : C.amber;
  return (
    <div style={{
      flex: 1, minWidth: 148,
      padding: '16px', borderRadius: 16,
      background: isOpen ? '#f0fdf4' : '#fffbeb',
      border: `1.5px solid ${isOpen ? '#86efac' : '#fde68a'}`,
      display: 'flex', flexDirection: 'column', gap: 10,
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ width: 38, height: 38, borderRadius: 11, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <DollarSign size={17} color={color} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {isOpen ? <CircleDot size={12} color={C.green} /> : <Circle size={12} color={C.amber} />}
          <span style={{ fontSize: 10, fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            {isOpen ? 'Abierta' : 'Cerrada'}
          </span>
        </div>
      </div>
      {isLoading ? (
        <div style={{ width: '65%', height: 24, background: 'rgba(0,0,0,0.07)', borderRadius: 7 }} />
      ) : (
        <p style={{ margin: 0, fontSize: 21, fontWeight: 900, color, fontFamily: "'Syne',sans-serif", letterSpacing: '-0.01em', lineHeight: 1 }}>
          {isOpen && cashStatus?.fechaApertura ? fmtTime(cashStatus.fechaApertura) : isOpen ? 'Abierta' : 'Cerrada'}
        </p>
      )}
      <div>
        <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Estado de Caja</p>
        <button
          onClick={() => navigate('/caja')}
          style={{ height: 26, padding: '0 10px', borderRadius: 7, border: `1.5px solid ${color}44`, background: 'transparent', color, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
          {isOpen ? 'Ver caja →' : 'Abrir caja →'}
        </button>
      </div>
    </div>
  );
}

// ── MovimientoRow ─────────────────────────────────────────────────────────────
const TIPO_CFG = {
  INGRESO:           { Icon: ArrowUpRight,  color: C.green,  sign: '+', bg: '#f0fdf4' },
  EGRESO:            { Icon: ArrowDownRight, color: C.red,   sign: '−', bg: '#fff5f5' },
  COMPRA_INVENTARIO: { Icon: ShoppingBag,   color: C.blue,  sign: '−', bg: '#eff6ff' },
};

function MovimientoRow({ m }) {
  const cfg  = TIPO_CFG[m.tipo] ?? TIPO_CFG.EGRESO;
  const MedioIcon = m.medioPago === 'TRANSFERENCIA' ? Smartphone : Banknote;
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid rgba(0,0,0,0.04)', background: hov ? '#fafafa' : 'transparent', borderRadius: 8, transition: 'background 120ms', paddingLeft: hov ? 4 : 0, paddingRight: hov ? 4 : 0 }}>
      <div style={{ width: 32, height: 32, borderRadius: 9, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <cfg.Icon size={14} color={cfg.color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.concepto}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <MedioIcon size={9} color="#9ca3af" />
          <p style={{ margin: 0, fontSize: 10, color: '#9ca3af' }}>{fmtDatetime(m.createdAt)}</p>
        </div>
      </div>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: cfg.color, fontFamily: "'Syne',sans-serif", flexShrink: 0 }}>
        {cfg.sign}{formatCOP(m.monto)}
      </p>
    </div>
  );
}

// ── SectionTitle ──────────────────────────────────────────────────────────────
function SectionTitle({ label, icon: Icon, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      {Icon && <Icon size={13} color="#9ca3af" />}
      <span style={{ fontSize: 10, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.06)' }} />
      {action}
    </div>
  );
}

// ── Card wrapper ──────────────────────────────────────────────────────────────
const CARD = {
  background: 'white',
  borderRadius: 16,
  border: '1.5px solid rgba(0,0,0,0.07)',
  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  padding: '18px 20px',
};

// ── Empty state ───────────────────────────────────────────────────────────────
function Empty({ icon: Icon, text }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '32px 0' }}>
      <Icon size={30} color="#e5e7eb" />
      <p style={{ margin: 0, fontSize: 12, color: '#9ca3af' }}>{text}</p>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skel({ h }) {
  return <div style={{ height: h, borderRadius: 12, background: 'rgba(0,0,0,0.05)' }} />;
}

// ── PeriodButton ──────────────────────────────────────────────────────────────
function PeriodBtn({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      height: 30, padding: '0 14px', borderRadius: 8,
      border: `1.5px solid ${active ? C.olive : '#e5e7eb'}`,
      background: active ? C.olive : 'white',
      color: active ? 'white' : '#6b7280',
      fontSize: 11, fontWeight: 700, cursor: 'pointer',
      transition: 'all 140ms',
    }}>
      {label}
    </button>
  );
}

// ── BalanceRow ────────────────────────────────────────────────────────────────
function BalanceRow({ label, value, color, bg }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 12px', borderRadius: 10, background: bg }}>
      <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 800, color, fontFamily: "'Syne',sans-serif" }}>{formatCOP(value)}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function WelcomePage() {
  const { usuario } = useAuthStore();
  const navigate    = useNavigate();
  const [period, setPeriod] = useState('month');
  const [custom, setCustom] = useState({ desde: '', hasta: '' });
  const [showCustom, setShowCustom] = useState(false);

  const esAdmin = usuario?.rol?.esAdmin ?? false;
  const permisos = usuario?.rol?.permisos ?? [];
  const nombre = (usuario?.nombreCompleto ?? usuario?.nombreUsuario ?? 'usuario').split(' ')[0];

  // ── Date params ──
  const params = useMemo(() => {
    if (period === 'custom') {
      const p = {};
      if (custom.desde) p.desde = custom.desde + 'T00:00:00.000Z';
      if (custom.hasta) p.hasta = custom.hasta + 'T23:59:59.999Z';
      return p;
    }
    return getPeriodDates(period);
  }, [period, custom]);

  // ── Data ──
  const { data: dashRaw, isLoading: dashLoading, refetch, isFetching } = useDashboard(params);
  const { data: cashRaw, isLoading: cashLoading } = useCashStatus();
  const { data: movRaw,  isLoading: movLoading  } = useMovements({ ...params, limit: 60 });
  const { data: sumRaw,  isLoading: sumLoading  } = useCashFlowSummary(params);

  // ── Extract ──
  const dash      = dashRaw?.data ?? dashRaw ?? {};
  const ventas    = dash.ventas      ?? {};
  const topProd   = dash.topProducto ?? null;
  const alertas   = dash.alertas     ?? {};
  const dashMovs  = dash.ultimosMovimientosFlujo ?? [];
  const cashStatus = cashRaw ?? {};
  const stockAlert = alertas.itemsSinStock ?? 0;
  const movements  = movRaw?.data ?? [];
  const summary    = sumRaw?.data ?? sumRaw ?? {};
  const balance    = summary.balance ?? 0;

  // ── Area chart: group movements by day ──
  const areaData = useMemo(() => {
    if (!movements.length) return [];
    const grouped = {};
    [...movements].reverse().forEach((m) => {
      const d = new Date(m.createdAt);
      const key = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
      if (!grouped[key]) grouped[key] = { fecha: key, Ingresos: 0, Egresos: 0, Compras: 0 };
      if (m.tipo === 'INGRESO') grouped[key].Ingresos += m.monto;
      else if (m.tipo === 'EGRESO') grouped[key].Egresos += m.monto;
      else if (m.tipo === 'COMPRA_INVENTARIO') grouped[key].Compras += m.monto;
    });
    return Object.values(grouped);
  }, [movements]);

  // ── Pie chart: distribución por tipo ──
  const pieData = useMemo(() => {
    const out = [];
    if ((summary.totalIngresos ?? 0) > 0)
      out.push({ name: 'Ingresos', value: summary.totalIngresos, color: C.green });
    const pureEgresos = (summary.totalEgresos ?? 0) - (summary.totalComprasInventario ?? 0);
    if (pureEgresos > 0)
      out.push({ name: 'Egresos', value: pureEgresos, color: C.red });
    if ((summary.totalComprasInventario ?? 0) > 0)
      out.push({ name: 'Compras', value: summary.totalComprasInventario, color: C.blue });
    return out;
  }, [summary]);

  // ── Category bar (horizontal) ──
  const catData = useMemo(() =>
    (summary.porCategoria ?? [])
      .slice(0, 7)
      .map((c) => ({
        nombre: (c.categoriaNombre ?? 'Sin cat.').length > 18
          ? (c.categoriaNombre ?? '').slice(0, 16) + '…'
          : (c.categoriaNombre ?? 'Sin cat.'),
        monto: c.total,
        tipo: c.tipo,
      }))
      .sort((a, b) => b.monto - a.monto),
  [summary]);

  // ── Ticket promedio ──
  const ticketPromedio = (ventas.cantidadTransacciones ?? 0) > 0
    ? Math.round((ventas.totalMonto ?? 0) / ventas.cantidadTransacciones)
    : 0;

  // ── Greeting ──
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
  const fechaStr = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // ── Quick access ──
  const QUICK = [
    { key: 'pos',        Icon: ShoppingCart, label: 'Nueva venta',     to: '/ventas/nueva', color: C.olive  },
    { key: 'caja',       Icon: DollarSign,   label: 'Ver caja',        to: '/caja',          color: C.green  },
    { key: 'inventario', Icon: Warehouse,    label: 'Inventario',      to: '/inventario',    color: C.blue   },
    { key: 'flujo_caja', Icon: TrendingUp,   label: 'Flujo de caja',   to: '/flujo-caja',    color: C.amber  },
  ].filter(({ key }) => canAccess(key, esAdmin, permisos));

  return (
    <div style={{ maxWidth: 1100, display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ════════════════ HEADER ════════════════ */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p style={{ margin: '0 0 3px', fontSize: 11, color: '#8c916c', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {fechaStr}
          </p>
          <h1 style={{ margin: 0, fontSize: 'clamp(18px,2.5vw,26px)', fontWeight: 800, color: '#1f2937', fontFamily: "'Syne',sans-serif", letterSpacing: '-0.02em' }}>
            {greeting}, {nombre}
          </h1>
        </div>

        {/* Period selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
          {[
            { key: 'today', label: 'Hoy' },
            { key: 'week',  label: 'Semana' },
            { key: 'month', label: 'Mes' },
          ].map((p) => (
            <PeriodBtn key={p.key} label={p.label} active={period === p.key} onClick={() => { setPeriod(p.key); setShowCustom(false); }} />
          ))}
          <button
            onClick={() => { setPeriod('custom'); setShowCustom(true); }}
            style={{ height: 30, padding: '0 12px', borderRadius: 8, border: `1.5px solid ${period === 'custom' ? C.olive : '#e5e7eb'}`, background: period === 'custom' ? C.olive : 'white', color: period === 'custom' ? 'white' : '#6b7280', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, transition: 'all 140ms' }}>
            <Calendar size={11} />Rango
          </button>
          <button
            onClick={() => refetch()}
            style={{ width: 30, height: 30, borderRadius: 8, border: '1.5px solid #e5e7eb', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <RefreshCw size={13} color={isFetching ? C.olive : '#9ca3af'} className={isFetching ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Custom date range */}
      {showCustom && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>Desde</span>
          <input type="date" value={custom.desde} onChange={(e) => setCustom((p) => ({ ...p, desde: e.target.value }))}
            style={{ height: 30, padding: '0 8px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 11, outline: 'none', background: '#f9fafb' }} />
          <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>Hasta</span>
          <input type="date" value={custom.hasta} onChange={(e) => setCustom((p) => ({ ...p, hasta: e.target.value }))}
            style={{ height: 30, padding: '0 8px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 11, outline: 'none', background: '#f9fafb' }} />
        </div>
      )}

      {/* ════════════════ KPI STRIP ════════════════ */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <KpiCard
          Icon={ShoppingCart} label="Ventas del período"
          value={formatCOP(ventas.totalMonto ?? 0)}
          sub={`${ventas.cantidadTransacciones ?? 0} transacciones`}
          color={C.olive} bg="rgba(85,98,74,0.06)" border="rgba(85,98,74,0.20)"
          isLoading={dashLoading}
        />
        <KpiCard
          Icon={Activity} label="Ticket promedio"
          value={formatCOP(ticketPromedio)}
          sub="Por transacción"
          color={C.purple} bg="rgba(124,58,237,0.06)" border="rgba(124,58,237,0.20)"
          isLoading={dashLoading}
        />
        <KpiCard
          Icon={Trophy} label="Top producto"
          value={topProd?.nombre ?? '—'}
          sub={topProd ? `${topProd.unidades} unidades vendidas` : 'Sin ventas'}
          color={C.amber} bg="rgba(217,119,6,0.06)" border="rgba(217,119,6,0.20)"
          isLoading={dashLoading}
        />
        <KpiCard
          Icon={Package} label="Alertas de stock"
          value={stockAlert > 0 ? `${stockAlert} ítem${stockAlert !== 1 ? 's' : ''}` : 'Sin alertas'}
          sub={stockAlert > 0 ? 'Bajo mínimo — acción requerida' : 'Inventario en orden'}
          color={stockAlert > 0 ? C.red : C.green}
          bg={stockAlert > 0 ? 'rgba(220,38,38,0.06)' : 'rgba(21,128,61,0.06)'}
          border={stockAlert > 0 ? 'rgba(220,38,38,0.20)' : 'rgba(21,128,61,0.18)'}
          isLoading={dashLoading}
          badge={stockAlert > 0 ? stockAlert : undefined}
          onClick={stockAlert > 0 ? () => navigate('/inventario') : undefined}
        />
        <CajaCard cashStatus={cashStatus} isLoading={cashLoading} navigate={navigate} />
      </div>

      {/* ════════════════ CHARTS ROW ════════════════ */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'stretch' }}>

        {/* Area chart — Flujo por día */}
        <div style={{ ...CARD, flex: 3, minWidth: 320 }}>
          <SectionTitle
            label="Flujo de caja por día"
            icon={BarChart3}
            action={<span style={{ fontSize: 10, color: '#9ca3af' }}>{areaData.length} día{areaData.length !== 1 ? 's' : ''}</span>}
          />
          {movLoading ? <Skel h={220} /> : areaData.length === 0 ? (
            <Empty icon={BarChart3} text="Sin movimientos en el período" />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={areaData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                  <defs>
                    {[['gI', C.green], ['gE', C.red], ['gC', C.blue]].map(([id, color]) => (
                      <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={color} stopOpacity={0.22} />
                        <stop offset="95%" stopColor={color} stopOpacity={0.01} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="fecha" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                    tickFormatter={(v) => `$${v >= 1000000 ? (v / 1000000).toFixed(1) + 'M' : (v / 1000).toFixed(0) + 'k'}`}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="Ingresos" stroke={C.green} strokeWidth={2.5} fill="url(#gI)" dot={false} activeDot={{ r: 5, fill: C.green, strokeWidth: 2, stroke: 'white' }} />
                  <Area type="monotone" dataKey="Egresos"  stroke={C.red}   strokeWidth={2.5} fill="url(#gE)" dot={false} activeDot={{ r: 5, fill: C.red,   strokeWidth: 2, stroke: 'white' }} />
                  <Area type="monotone" dataKey="Compras"  stroke={C.blue}  strokeWidth={2.5} fill="url(#gC)" dot={false} activeDot={{ r: 5, fill: C.blue,  strokeWidth: 2, stroke: 'white' }} />
                </AreaChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 10 }}>
                {[['Ingresos', C.green], ['Egresos', C.red], ['Compras Inv.', C.blue]].map(([l, c]) => (
                  <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 20, height: 3, borderRadius: 2, background: c }} />
                    <span style={{ fontSize: 10, color: '#6b7280', fontWeight: 600 }}>{l}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Donut — distribución */}
        <div style={{ ...CARD, flex: 1, minWidth: 220, display: 'flex', flexDirection: 'column' }}>
          <SectionTitle label="Distribución" icon={Layers} />
          {sumLoading ? <Skel h={180} /> : pieData.length === 0 ? (
            <Empty icon={Layers} text="Sin datos" />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={170}>
                <PieChart>
                  <Pie
                    data={pieData} cx="50%" cy="50%"
                    innerRadius={48} outerRadius={72}
                    dataKey="value" labelLine={false} label={PieLabel}
                    stroke="white" strokeWidth={2}
                  >
                    {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => formatCOP(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 4 }}>
                {pieData.map((e) => {
                  const total = pieData.reduce((s, x) => s + x.value, 0);
                  const pct   = total > 0 ? Math.round((e.value / total) * 100) : 0;
                  return (
                    <div key={e.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: e.color, flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 11, color: '#6b7280', fontWeight: 600 }}>{e.name}</span>
                      <span style={{ fontSize: 10, color: '#9ca3af' }}>{pct}%</span>
                      <span style={{ fontSize: 11, color: e.color, fontWeight: 800, fontFamily: "'Syne',sans-serif" }}>{formatCOP(e.value)}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ════════════════ BOTTOM ROW ════════════════ */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>

        {/* Últimos movimientos */}
        <div style={{ ...CARD, flex: 2, minWidth: 280 }}>
          <SectionTitle
            label="Últimos movimientos"
            icon={TrendingUp}
            action={
              <button onClick={() => navigate('/flujo-caja')}
                style={{ fontSize: 10, color: C.olive, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
                Ver todos →
              </button>
            }
          />
          {dashLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[1,2,3,4,5].map((i) => <div key={i} style={{ height: 44, background: 'rgba(0,0,0,0.05)', borderRadius: 9 }} />)}
            </div>
          ) : dashMovs.length === 0 ? (
            <Empty icon={TrendingUp} text="Sin movimientos recientes" />
          ) : (
            dashMovs.slice(0, 5).map((m, i) => <MovimientoRow key={i} m={m} />)
          )}
        </div>

        {/* Panel derecho */}
        <div style={{ flex: 1, minWidth: 220, display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Balance resumido */}
          <div style={CARD}>
            <SectionTitle label="Balance del período" icon={Activity} />
            {sumLoading ? <Skel h={110} /> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <BalanceRow label="Ingresos"  value={summary.totalIngresos ?? 0}           color={C.green} bg="#f0fdf4" />
                <BalanceRow label="Egresos"   value={summary.totalEgresosConCompras ?? 0}  color={C.red}   bg="#fff5f5" />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: 10, background: balance >= 0 ? '#f0fdf4' : '#fff5f5', border: `1.5px solid ${balance >= 0 ? '#86efac' : '#fca5a5'}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {balance >= 0 ? <TrendingUp size={13} color={C.green} /> : <TrendingDown size={13} color={C.red} />}
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Balance</span>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 900, color: balance >= 0 ? C.green : C.red, fontFamily: "'Syne',sans-serif" }}>
                    {balance >= 0 ? '' : '−'}{formatCOP(Math.abs(balance))}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Accesos rápidos */}
          {QUICK.length > 0 && (
            <div style={CARD}>
              <SectionTitle label="Acceso rápido" icon={Zap} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {QUICK.map(({ key, Icon, label, to, color }) => (
                  <button key={key} onClick={() => navigate(to)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, height: 34, padding: '0 12px', borderRadius: 9, border: `1.5px solid ${color}22`, background: `${color}08`, color, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'background 130ms', textAlign: 'left' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = `${color}16`; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = `${color}08`; }}>
                    <Icon size={13} />{label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Alert stock */}
          {stockAlert > 0 && (
            <div style={{ padding: '12px 14px', borderRadius: 14, background: '#fff5f5', border: '1.5px solid #fca5a5', display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertTriangle size={16} color={C.red} style={{ flexShrink: 0 }} />
              <div>
                <p style={{ margin: '0 0 3px', fontSize: 12, fontWeight: 700, color: C.red }}>
                  {stockAlert} ítem{stockAlert !== 1 ? 's' : ''} bajo mínimo
                </p>
                <button onClick={() => navigate('/inventario')}
                  style={{ fontSize: 11, color: C.red, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline', fontWeight: 600 }}>
                  Ver inventario →
                </button>
              </div>
            </div>
          )}

          {/* Sin ventas */}
          {!dashLoading && (ventas.totalMonto ?? 0) === 0 && (
            <div style={{ padding: '12px 14px', borderRadius: 14, background: 'rgba(85,98,74,0.05)', border: '1.5px dashed rgba(85,98,74,0.22)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShoppingCart size={14} color="#8c916c" />
              <p style={{ margin: 0, fontSize: 12, color: '#8c916c', lineHeight: 1.5 }}>Sin ventas en el período seleccionado</p>
            </div>
          )}
        </div>
      </div>

      {/* ════════════════ CATEGORY BAR ════════════════ */}
      {catData.length > 0 && (
        <div style={CARD}>
          <SectionTitle label="Movimientos por categoría" icon={BarChart3}
            action={<span style={{ fontSize: 10, color: '#9ca3af' }}>Top {catData.length}</span>}
          />
          <ResponsiveContainer width="100%" height={Math.max(160, catData.length * 36)}>
            <BarChart data={catData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `$${v >= 1000000 ? (v / 1000000).toFixed(1) + 'M' : (v / 1000).toFixed(0) + 'k'}`}
              />
              <YAxis type="category" dataKey="nombre" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} width={100} />
              <Tooltip content={<BarTooltip />} />
              <Bar dataKey="monto" radius={[0, 6, 6, 0]} maxBarSize={20}>
                {catData.map((e, i) => (
                  <Cell key={i}
                    fill={e.tipo === 'INGRESO' ? C.green : e.tipo === 'COMPRA_INVENTARIO' ? C.blue : C.red}
                    fillOpacity={0.82}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 16, marginTop: 10, justifyContent: 'center' }}>
            {[['Ingresos', C.green], ['Egresos', C.red], ['Compras', C.blue]].map(([l, c]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: c, opacity: 0.82 }} />
                <span style={{ fontSize: 10, color: '#6b7280', fontWeight: 600 }}>{l}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
