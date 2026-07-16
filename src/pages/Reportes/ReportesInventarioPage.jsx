import { useState, useMemo, useCallback } from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  Package, AlertTriangle, DollarSign, Search, Filter, X, Loader2,
  AlertCircle, RefreshCw, History, RotateCcw, ChevronLeft, ChevronRight,
  Archive, TrendingDown, BarChart3, Box, Zap,
} from 'lucide-react';
import { useInventoryReport, useKardex } from '../../hooks/useReports';

// ── Diseño ────────────────────────────────────────────────────────────────────
const OLIVE   = '#55624a';
const GREEN   = '#15803d';
const RED     = '#dc2626';
const BLUE    = '#1d4ed8';
const AMBER   = '#d97706';
const ORANGE  = '#f97316';
const PURPLE  = '#7c3aed';
const TEAL    = '#0d9488';

const GLASS = { background: 'rgba(204,204,204,0.22)', backdropFilter: 'blur(28px) saturate(1.8)', WebkitBackdropFilter: 'blur(28px) saturate(1.8)' };
const CARD  = { background: 'white', borderRadius: 16, border: '1.5px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: '18px 20px' };

const TIPO_CFG = {
  ENTRADA:    { color: GREEN,  bg: '#f0fdf4', label: 'Entrada' },
  CONSUMO:    { color: ORANGE, bg: '#fff7ed', label: 'Consumo' },
  DEVOLUCION: { color: BLUE,   bg: '#eff6ff', label: 'Devolución' },
  COMPRA:     { color: GREEN,  bg: '#f0fdf4', label: 'Compra' },
  AJUSTE:     { color: PURPLE, bg: '#f5f3ff', label: 'Ajuste' },
};
const PALETTE = [OLIVE, TEAL, BLUE, PURPLE, AMBER, GREEN, ORANGE, RED];

// ── Formatters ────────────────────────────────────────────────────────────────
const COP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });
const formatCOP = (n) => (n != null ? COP.format(n) : '$0');
const fmtShort  = (n) => {
  if (!n && n !== 0) return '$0';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}k`;
  return formatCOP(n);
};
const fmtNum  = (n, decimals = 1) => (n != null ? Number(n).toFixed(decimals) : '0');
const fmtDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

// ── Stock helpers ─────────────────────────────────────────────────────────────
function stockStatus(item) {
  if ((item.stockActual ?? 0) === 0)                                    return { label: 'Sin stock',   color: RED,   bg: '#fee2e2' };
  if (item.stockCritico)                                                 return { label: 'Crítico',     color: RED,   bg: '#fee2e2' };
  if (item.alertaStockMinimo || item.stockActual <= item.stockMinimo)   return { label: 'Stock bajo',  color: AMBER, bg: '#fef3c7' };
  return null;
}

function stockPct(item) {
  if (!item.stockMinimo || item.stockMinimo === 0) return 100;
  return Math.min(100, Math.round((item.stockActual / item.stockMinimo) * 100));
}

// ── Micro-componentes ─────────────────────────────────────────────────────────
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

function Toggle({ label, checked, onChange, color = OLIVE }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }} onClick={onChange}>
      <div style={{ width: 34, height: 18, borderRadius: 9, background: checked ? color : '#d1d5db', position: 'relative', transition: 'background 180ms', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: 3, left: checked ? 17 : 3, width: 12, height: 12, borderRadius: '50%', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.25)', transition: 'left 180ms' }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color: checked ? color : '#9ca3af', userSelect: 'none' }}>{label}</span>
    </div>
  );
}

function ConsumoTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: '10px 14px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}>
      <p style={{ margin: '0 0 5px', fontSize: 12, fontWeight: 700, color: '#374151' }}>{label}</p>
      <p style={{ margin: '0 0 2px', fontSize: 11, color: '#6b7280' }}>Costo: <b style={{ color: OLIVE }}>{fmtShort(d?.Costo)}</b></p>
      <p style={{ margin: 0, fontSize: 11, color: '#6b7280' }}>Cantidad: <b style={{ color: TEAL }}>{fmtNum(d?.cantidadConsumida)} {d?.unidadMedida}</b></p>
    </div>
  );
}

function Skel({ h = 200 }) {
  return <div style={{ height: h, borderRadius: 12, background: 'rgba(0,0,0,0.05)' }} />;
}

// ─────────────────────────────────────────────────────────────────────────────
export default function ReportesInventarioPage() {
  const [soloAlertas, setSoloAlertas] = useState(false);
  const [verInactivos, setVerInactivos] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [kardexPage, setKardexPage] = useState(1);

  const params = useMemo(() => {
    const p = {};
    if (soloAlertas)   p.soloAlertas = true;
    if (!verInactivos) p.estado = 'ACTIVO';
    return p;
  }, [soloAlertas, verInactivos]);

  const { data: raw, isLoading, isError, error, refetch } = useInventoryReport(params);

  const { data: kardexRaw, isLoading: kardexLoading } = useKardex(
    selectedItem?.id,
    { page: kardexPage, limit: 20 },
  );

  // ── Extracción de datos según spec ──
  const data      = raw?.data ?? raw ?? {};
  const resumen   = data.resumen   ?? {};
  const items     = data.items     ?? [];
  const consumo   = data.consumoInsumos ?? [];

  const kardexData  = kardexRaw?.data ?? kardexRaw ?? {};
  const movimientos = kardexData.movimientos ?? kardexData.items ?? [];
  const kardexTotalPages = kardexData.totalPages ?? 1;
  const kardexTotal      = kardexData.total ?? movimientos.length;

  const filteredItems = useMemo(() => {
    if (!busqueda) return items;
    const q = busqueda.toLowerCase();
    return items.filter((i) => i.nombre.toLowerCase().includes(q));
  }, [items, busqueda]);

  const consumoChartData = useMemo(() =>
    [...consumo].sort((a, b) => b.costoConsumo - a.costoConsumo).slice(0, 10)
      .map((c) => ({
        name: c.nombre.length > 18 ? c.nombre.slice(0, 16) + '…' : c.nombre,
        Costo: c.costoConsumo,
        cantidadConsumida: c.cantidadConsumida,
        unidadMedida: c.unidadMedida,
      })), [consumo]);

  const handleSelectItem = useCallback((item) => {
    setSelectedItem(item);
    setKardexPage(1);
  }, []);

  const hayAlertas = (resumen.itemsBajoMinimo ?? 0) > 0 || (resumen.itemsSinStock ?? 0) > 0;

  return (
    <div className="w-full h-full overflow-hidden flex flex-col" style={{ position: 'relative' }}>

      {/* Tab */}
      <div className="flex items-end shrink-0">
        <div className="relative flex items-center gap-2 px-4 h-10 border border-b-0 border-white/40"
          style={{ width: 'min(55%, 440px)', ...GLASS, borderRadius: '10px 10px 0 0' }}>
          <Package size={13} color={OLIVE} />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#374151', fontFamily: "'Syne',sans-serif" }}>Reporte de Inventario</span>
          {isLoading && <Loader2 size={11} className="animate-spin" color="#8c916c" />}
          <span style={{ position: 'absolute', bottom: 0, right: -28, width: 28, height: 48, overflow: 'hidden', pointerEvents: 'none' }}>
            <span style={{ position: 'absolute', left: 0, bottom: 0, width: 56, height: 56, borderRadius: '50%', boxShadow: '-28px 28px 0 0 rgba(204,204,204,0.22)' }} />
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-hidden rounded-b-2xl rounded-tr-2xl" style={{ ...GLASS, display: 'flex', flexDirection: 'column' }}>

        {/* Filtros */}
        <div style={{ margin: '8px 4px 0', background: 'white', borderRadius: '14px 14px 0 0', padding: '10px 16px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Filter size={12} color="#9ca3af" />
              <span style={{ fontSize: 10, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Filtros</span>
            </div>
            <Toggle label="Solo alertas" checked={soloAlertas} onChange={() => setSoloAlertas((v) => !v)} color={RED} />
            <Toggle label="Ver inactivos" checked={verInactivos} onChange={() => setVerInactivos((v) => !v)} color={PURPLE} />
            <div style={{ flex: 1, position: 'relative', minWidth: 180 }}>
              <Search size={12} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
              <input type="text" placeholder="Buscar insumo…" value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                style={{ width: '100%', height: 30, paddingLeft: 28, paddingRight: busqueda ? 28 : 10, borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 12, outline: 'none', color: '#374151', background: '#f9fafb', boxSizing: 'border-box', transition: 'border-color 140ms, background 140ms' }}
                onFocus={(e) => { e.target.style.borderColor = OLIVE; e.target.style.background = 'white'; }}
                onBlur={(e)  => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#f9fafb'; }} />
              {busqueda && (
                <button onClick={() => setBusqueda('')}
                  style={{ position: 'absolute', right: 7, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0 }}>
                  <X size={11} />
                </button>
              )}
            </div>
            <button onClick={() => refetch()}
              style={{ height: 30, padding: '0 12px', borderRadius: 8, border: `1.5px solid ${OLIVE}44`, background: 'transparent', color: OLIVE, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
              <RefreshCw size={12} />Actualizar
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'thin', margin: '0 4px', background: 'white' }}>

          {/* Loading */}
          {isLoading && (
            <div style={{ padding: '20px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', gap: 12 }}>{[1,2,3,4,5].map((i) => <div key={i} style={{ flex: 1, height: 100, borderRadius: 14, background: 'rgba(0,0,0,0.05)' }} />)}</div>
              <Skel h={280} /><Skel h={200} />
            </div>
          )}

          {/* Error */}
          {!isLoading && isError && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 60, gap: 12 }}>
              <AlertCircle size={36} color="#fca5a5" />
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: '#374151' }}>Error al cargar el inventario</p>
                <p style={{ margin: 0, fontSize: 11, color: '#9ca3af', maxWidth: 340 }}>{error?.message ?? 'Error de conexión'}</p>
              </div>
              <button onClick={() => refetch()}
                style={{ height: 34, padding: '0 16px', borderRadius: 9, border: 'none', background: OLIVE, color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <RefreshCw size={13} />Reintentar
              </button>
            </div>
          )}

          {/* Datos */}
          {!isLoading && !isError && (
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Alerta global */}
              {hayAlertas && (
                <div style={{ padding: '11px 16px', borderRadius: 12, background: '#fff5f5', border: '1.5px solid #fca5a5', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <AlertTriangle size={16} color={RED} />
                  <span style={{ fontSize: 12, color: RED, fontWeight: 600 }}>
                    {resumen.itemsSinStock > 0 && `${resumen.itemsSinStock} insumo${resumen.itemsSinStock !== 1 ? 's' : ''} sin stock`}
                    {resumen.itemsSinStock > 0 && resumen.itemsBajoMinimo > 0 && ' · '}
                    {resumen.itemsBajoMinimo > 0 && `${resumen.itemsBajoMinimo} bajo el mínimo`}
                  </span>
                </div>
              )}

              {/* KPIs */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <KpiCard Icon={Box} label="Total ítems" color={OLIVE}
                  value={String(resumen.totalItems ?? 0)} sub="En el sistema" />
                <KpiCard Icon={Package} label="Ítems activos" color={GREEN}
                  value={String(resumen.itemsActivos ?? 0)} sub="Estado ACTIVO" />
                <KpiCard Icon={AlertTriangle} label="Bajo mínimo" color={AMBER}
                  value={String(resumen.itemsBajoMinimo ?? 0)}
                  sub={(resumen.itemsBajoMinimo ?? 0) > 0 ? 'Requieren reposición' : 'Todo en rango'}
                  badge={(resumen.itemsBajoMinimo ?? 0) > 0 ? resumen.itemsBajoMinimo : undefined} />
                <KpiCard Icon={Archive} label="Sin stock" color={RED}
                  value={String(resumen.itemsSinStock ?? 0)}
                  sub={(resumen.itemsSinStock ?? 0) > 0 ? 'Urgente reponer' : 'Sin agotados'}
                  badge={(resumen.itemsSinStock ?? 0) > 0 ? resumen.itemsSinStock : undefined} />
                <KpiCard Icon={DollarSign} label="Valor total inventario" color={TEAL}
                  value={fmtShort(resumen.valorTotalInventario ?? 0)} sub="A costo promedio" />
              </div>

              {/* Tabla de ítems */}
              <div style={CARD}>
                <SecTitle label="Ítems de inventario" icon={Package}
                  right={
                    <span style={{ fontSize: 10, color: '#9ca3af' }}>
                      {filteredItems.length} ítem{filteredItems.length !== 1 ? 's' : ''}
                      {busqueda && ` · "${busqueda}"`}
                    </span>
                  }
                  sub="Haz clic en una fila para ver el kardex del ítem"
                />
                {filteredItems.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 0', gap: 8 }}>
                    <Package size={28} color="#e5e7eb" />
                    <p style={{ margin: 0, fontSize: 12, color: '#9ca3af' }}>{busqueda ? 'Sin resultados para la búsqueda' : 'Sin ítems con los filtros actuales'}</p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 680 }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid rgba(0,0,0,0.07)' }}>
                          {['Nombre', 'Unidad', 'Stock actual', 'Stock mín.', 'Costo prom.', 'Valor inventario', 'Estado', 'Alerta'].map((h) => (
                            <th key={h} style={{ padding: '7px 10px', textAlign: ['Stock actual','Stock mín.','Costo prom.','Valor inventario'].includes(h) ? 'right' : 'left', fontSize: 9, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredItems.map((item, idx) => {
                          const st  = stockStatus(item);
                          const pct = stockPct(item);
                          const stockColor = st ? (st.color === RED ? RED : AMBER) : GREEN;
                          return (
                            <tr key={item.id}
                              onClick={() => handleSelectItem(item)}
                              style={{ background: idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.013)', borderBottom: '1px solid rgba(0,0,0,0.05)', cursor: 'pointer', transition: 'background 120ms' }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(85,98,74,0.06)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.013)'; }}>
                              <td style={{ padding: '8px 10px', fontWeight: 600, color: '#374151' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: item.estado === 'ACTIVO' ? GREEN : '#d1d5db', flexShrink: 0 }} />
                                  {item.nombre}
                                </div>
                              </td>
                              <td style={{ padding: '8px 10px', color: '#9ca3af', fontSize: 11 }}>{item.unidadMedida}</td>
                              <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                                  <span style={{ fontSize: 12, fontWeight: 800, color: stockColor, fontFamily: "'Syne',sans-serif" }}>
                                    {fmtNum(item.stockActual, 2)}
                                  </span>
                                  <div style={{ width: 60, height: 4, borderRadius: 99, background: 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${Math.min(100, pct)}%`, background: stockColor, borderRadius: 99, transition: 'width 700ms ease' }} />
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: '8px 10px', textAlign: 'right', fontSize: 11, color: '#9ca3af' }}>{fmtNum(item.stockMinimo, 2)}</td>
                              <td style={{ padding: '8px 10px', textAlign: 'right', fontSize: 11, color: '#6b7280' }}>{formatCOP(item.costoPromedio)}</td>
                              <td style={{ padding: '8px 10px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: TEAL, fontFamily: "'Syne',sans-serif" }}>{fmtShort(item.valorInventario)}</td>
                              <td style={{ padding: '8px 10px' }}>
                                <span style={{ padding: '3px 8px', borderRadius: 6, background: item.estado === 'ACTIVO' ? '#f0fdf4' : '#f9fafb', color: item.estado === 'ACTIVO' ? GREEN : '#9ca3af', fontSize: 10, fontWeight: 700 }}>
                                  {item.estado === 'ACTIVO' ? 'Activo' : 'Inactivo'}
                                </span>
                              </td>
                              <td style={{ padding: '8px 10px' }}>
                                {st && (
                                  <span style={{ padding: '3px 8px', borderRadius: 6, background: st.bg, color: st.color, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, width: 'fit-content' }}>
                                    <AlertTriangle size={9} />
                                    {st.label}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Consumo de insumos */}
              {consumo.length > 0 && (
                <div style={CARD}>
                  <SecTitle label="Top insumos más consumidos" icon={Zap}
                    sub="Ordenado por costo de consumo en el período" />
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                    <div style={{ flex: 2, minWidth: 280 }}>
                      <ResponsiveContainer width="100%" height={Math.max(180, consumoChartData.length * 36 + 30)}>
                        <BarChart data={consumoChartData} layout="vertical" margin={{ top: 0, right: 65, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" horizontal={false} />
                          <XAxis type="number" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={fmtShort} />
                          <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} width={110} />
                          <Tooltip content={<ConsumoTip />} />
                          <Bar dataKey="Costo" radius={[0, 6, 6, 0]} maxBarSize={18} animationDuration={800}
                            label={{ position: 'right', fontSize: 10, fill: '#9ca3af', formatter: fmtShort }}>
                            {consumoChartData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} fillOpacity={0.85} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{ flex: 1, minWidth: 200, overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                          <tr>
                            {['Insumo', 'Consumido', 'Costo'].map((h) => (
                              <th key={h} style={{ padding: '5px 6px', textAlign: h !== 'Insumo' ? 'right' : 'left', fontSize: 9, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {[...consumo].sort((a, b) => b.costoConsumo - a.costoConsumo).map((c, i) => (
                            <tr key={c.itemId ?? c.nombre} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)', background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.013)' }}>
                              <td style={{ padding: '6px 6px', fontSize: 11, fontWeight: 600, color: '#374151' }}>{c.nombre}</td>
                              <td style={{ padding: '6px 6px', textAlign: 'right', fontSize: 11, color: '#6b7280' }}>{fmtNum(c.cantidadConsumida)} {c.unidadMedida}</td>
                              <td style={{ padding: '6px 6px', textAlign: 'right', fontSize: 12, fontWeight: 800, color: OLIVE, fontFamily: "'Syne',sans-serif" }}>{fmtShort(c.costoConsumo)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              <p style={{ fontSize: 10, color: '#d1d5db', textAlign: 'right', margin: 0 }}>
                {data.generadoEn ? `Generado: ${new Date(data.generadoEn).toLocaleString('es-CO')}` : ''}
              </p>
            </div>
          )}
        </div>

        {/* Barra inferior */}
        <div style={{ margin: '0 4px 4px', background: 'white', borderRadius: '0 0 14px 14px', padding: '8px 20px', flexShrink: 0, borderTop: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 10, color: '#9ca3af' }}>
            {!isLoading && !isError ? `${resumen.itemsActivos ?? 0} activos · Valor: ${fmtShort(resumen.valorTotalInventario ?? 0)}` : 'Cargando inventario…'}
          </span>
          {(resumen.itemsBajoMinimo ?? 0) > 0 && (
            <span style={{ fontSize: 10, fontWeight: 700, color: AMBER, display: 'flex', alignItems: 'center', gap: 4 }}>
              <AlertTriangle size={11} />{resumen.itemsBajoMinimo} bajo mínimo
            </span>
          )}
        </div>
      </div>

      {/* ── Panel Kardex (slide-in) ── */}
      {selectedItem && (
        <>
          <div onClick={() => setSelectedItem(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.28)', zIndex: 40, backdropFilter: 'blur(2px)' }} />
          <div style={{ position: 'fixed', top: 0, right: 0, height: '100vh', width: 'min(440px, 100vw)', background: 'white', boxShadow: '-4px 0 32px rgba(0,0,0,0.15)', zIndex: 50, display: 'flex', flexDirection: 'column', overflowY: 'auto', boxSizing: 'border-box' }}>

            {/* Cabecera del panel */}
            <div style={{ padding: '16px 20px', borderBottom: '1.5px solid rgba(0,0,0,0.07)', display: 'flex', alignItems: 'flex-start', gap: 12, flexShrink: 0 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: `${OLIVE}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <History size={18} color={OLIVE} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: '0 0 3px', fontSize: 14, fontWeight: 700, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedItem.nombre}</p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, color: '#6b7280' }}>Stock: <b style={{ color: selectedItem.stockActual <= selectedItem.stockMinimo ? RED : OLIVE }}>{fmtNum(selectedItem.stockActual, 2)} {selectedItem.unidadMedida}</b></span>
                  <span style={{ fontSize: 11, color: '#6b7280' }}>Mínimo: <b>{fmtNum(selectedItem.stockMinimo, 2)}</b></span>
                  <span style={{ fontSize: 11, color: '#6b7280' }}>Costo prom.: <b>{formatCOP(selectedItem.costoPromedio)}</b></span>
                </div>
                {(() => { const st = stockStatus(selectedItem); return st ? <span style={{ display: 'inline-block', marginTop: 4, padding: '2px 8px', borderRadius: 6, background: st.bg, color: st.color, fontSize: 10, fontWeight: 700 }}>{st.label}</span> : null; })()}
              </div>
              <button onClick={() => setSelectedItem(null)}
                style={{ width: 28, height: 28, borderRadius: 8, border: '1.5px solid #e5e7eb', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <X size={14} color="#9ca3af" />
              </button>
            </div>

            {/* Movimientos */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Kardex · Movimientos</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.06)' }} />
                {kardexLoading && <Loader2 size={11} className="animate-spin" color="#9ca3af" />}
                {!kardexLoading && <span style={{ fontSize: 10, color: '#9ca3af' }}>{kardexTotal} mov.</span>}
              </div>

              {/* Leyenda de colores */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                {[['ENTRADA', GREEN], ['CONSUMO', ORANGE], ['DEVOLUCION', BLUE]].map(([t, c]) => (
                  <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 7, height: 7, borderRadius: 2, background: c }} />
                    <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>{TIPO_CFG[t]?.label ?? t}</span>
                  </div>
                ))}
              </div>

              {kardexLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[1,2,3,4,5].map((i) => <div key={i} style={{ height: 44, borderRadius: 8, background: 'rgba(0,0,0,0.05)' }} />)}
                </div>
              ) : movimientos.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 0', gap: 8 }}>
                  <History size={28} color="#e5e7eb" />
                  <p style={{ margin: 0, fontSize: 12, color: '#9ca3af' }}>Sin movimientos registrados</p>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid rgba(0,0,0,0.07)' }}>
                      {['Tipo', 'Cantidad', 'Antes', 'Después', 'Motivo', 'Fecha'].map((h) => (
                        <th key={h} style={{ padding: '5px 6px', textAlign: ['Cantidad','Antes','Después'].includes(h) ? 'right' : 'left', fontSize: 9, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {movimientos.map((mov, i) => {
                      const cfg = TIPO_CFG[mov.tipo] ?? { color: '#9ca3af', bg: '#f9fafb', label: mov.tipo };
                      return (
                        <tr key={mov.id ?? i} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                          <td style={{ padding: '6px 6px' }}>
                            <span style={{ padding: '2px 7px', borderRadius: 5, background: cfg.bg, color: cfg.color, fontSize: 9, fontWeight: 800, whiteSpace: 'nowrap' }}>{cfg.label}</span>
                          </td>
                          <td style={{ padding: '6px 6px', textAlign: 'right', fontWeight: 700, color: cfg.color, fontFamily: "'Syne',sans-serif" }}>
                            {(mov.tipo === 'CONSUMO') ? '-' : '+'}{fmtNum(mov.cantidad, 2)}
                          </td>
                          <td style={{ padding: '6px 6px', textAlign: 'right', fontSize: 11, color: '#9ca3af' }}>{fmtNum(mov.stockAntes ?? mov.cantidadAntes, 2)}</td>
                          <td style={{ padding: '6px 6px', textAlign: 'right', fontSize: 11, color: '#374151', fontWeight: 600 }}>{fmtNum(mov.stockDespues ?? mov.cantidadDespues, 2)}</td>
                          <td style={{ padding: '6px 6px', fontSize: 10, color: '#6b7280', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mov.motivo ?? mov.descripcion ?? '—'}</td>
                          <td style={{ padding: '6px 6px', fontSize: 10, color: '#9ca3af', whiteSpace: 'nowrap' }}>{fmtDate(mov.fecha ?? mov.createdAt)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Paginación kardex */}
            {kardexTotalPages > 1 && (
              <div style={{ padding: '10px 20px', borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <button onClick={() => setKardexPage((p) => Math.max(1, p - 1))} disabled={kardexPage <= 1}
                  style={{ height: 28, padding: '0 10px', borderRadius: 7, border: '1.5px solid #e5e7eb', background: 'white', color: kardexPage <= 1 ? '#d1d5db' : '#374151', fontSize: 11, fontWeight: 600, cursor: kardexPage <= 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <ChevronLeft size={12} />Anterior
                </button>
                <span style={{ fontSize: 11, color: '#9ca3af' }}>Pág. {kardexPage} / {kardexTotalPages}</span>
                <button onClick={() => setKardexPage((p) => Math.min(kardexTotalPages, p + 1))} disabled={kardexPage >= kardexTotalPages}
                  style={{ height: 28, padding: '0 10px', borderRadius: 7, border: '1.5px solid #e5e7eb', background: 'white', color: kardexPage >= kardexTotalPages ? '#d1d5db' : '#374151', fontSize: 11, fontWeight: 600, cursor: kardexPage >= kardexTotalPages ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                  Siguiente<ChevronRight size={12} />
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
