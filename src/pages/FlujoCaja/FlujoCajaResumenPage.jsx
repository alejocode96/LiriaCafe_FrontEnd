import { useState, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingBag,
  ArrowUpRight, ArrowDownRight, Banknote, Smartphone,
  Loader2, AlertCircle, BarChart3,
} from 'lucide-react';
import { useCashFlowSummary } from '../../hooks/useCashFlow';

const GLASS = {
  background: 'rgba(204,204,204,0.22)',
  backdropFilter: 'blur(28px) saturate(1.8)',
  WebkitBackdropFilter: 'blur(28px) saturate(1.8)',
};

function formatCOP(n) {
  if (n == null || isNaN(n)) return '$0';
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n);
}

// ── BigCard ───────────────────────────────────────────────────────────────────
function BigCard({ Icon, label, amount, count, color, bg, border, isLoading, size = 'normal' }) {
  const amtSize = size === 'large' ? 26 : 20;
  return (
    <div style={{ flex: 1, minWidth: 0, padding: '18px 20px', borderRadius: 16, background: bg, border: `1.5px solid ${border ?? color + '22'}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 44, height: 44, borderRadius: 13, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={20} color={color} />
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</p>
          {count != null && !isLoading && (
            <p style={{ margin: 0, fontSize: 10, color: '#9ca3af' }}>{count} movimiento{count !== 1 ? 's' : ''}</p>
          )}
        </div>
      </div>
      {isLoading ? (
        <div style={{ width: '60%', height: 28, background: 'rgba(0,0,0,0.07)', borderRadius: 8 }} />
      ) : (
        <p style={{ margin: 0, fontSize: amtSize, fontWeight: 800, color, fontFamily: "'Syne',sans-serif", letterSpacing: '-0.01em' }}>
          {formatCOP(amount ?? 0)}
        </p>
      )}
    </div>
  );
}

// ── CategoryRow ───────────────────────────────────────────────────────────────
const TIPO_COLOR = {
  INGRESO:           { color: '#15803d', bg: '#f0fdf4', sign: '+' },
  EGRESO:            { color: '#dc2626', bg: '#fff5f5', sign: '−' },
  COMPRA_INVENTARIO: { color: '#1d4ed8', bg: '#eff6ff', sign: '−' },
};

function CategoryRow({ item, maxTotal }) {
  const cfg = TIPO_COLOR[item.tipo] ?? { color: '#6b7280', bg: '#f9fafb', sign: '' };
  const pct = maxTotal > 0 ? Math.round((Math.abs(item.total) / maxTotal) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.categoriaNombre ?? 'Sin categoría'}
          </span>
          <span style={{ flexShrink: 0, height: 16, padding: '0 6px', borderRadius: 4, fontSize: 9, fontWeight: 700, background: cfg.bg, color: cfg.color }}>
            {item.tipo === 'COMPRA_INVENTARIO' ? 'COMPRA' : item.tipo}
          </span>
        </div>
        <div style={{ height: 5, borderRadius: 99, background: '#f3f4f6', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: cfg.color, transition: 'width 500ms ease' }} />
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: cfg.color, fontFamily: "'Syne',sans-serif" }}>
          {cfg.sign}{formatCOP(Math.abs(item.total))}
        </p>
        <p style={{ margin: 0, fontSize: 10, color: '#9ca3af' }}>{item.cantidad} mov.</p>
      </div>
    </div>
  );
}

// ── MedioRow ──────────────────────────────────────────────────────────────────
const MEDIO_CFG = {
  EFECTIVO:      { Icon: Banknote,   label: 'Efectivo',       color: '#15803d', bg: '#f0fdf4' },
  TRANSFERENCIA: { Icon: Smartphone, label: 'Transferencia',  color: '#1d4ed8', bg: '#eff6ff' },
};

function MedioSection({ rows }) {
  if (!rows || rows.length === 0) return (
    <p style={{ color: '#9ca3af', fontSize: 12, textAlign: 'center', padding: '12px 0' }}>Sin datos</p>
  );

  const grouped = {};
  rows.forEach((r) => {
    if (!grouped[r.medioPago]) grouped[r.medioPago] = { ingresos: 0, egresos: 0, compras: 0, total: 0, cantidad: 0 };
    const g = grouped[r.medioPago];
    g.cantidad += r.cantidad;
    if (r.tipo === 'INGRESO') g.ingresos += r.total;
    else { g.egresos += r.total; }
    if (r.tipo === 'COMPRA_INVENTARIO') g.compras += r.total;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {Object.entries(grouped).map(([medio, data]) => {
        const cfg = MEDIO_CFG[medio] ?? { Icon: Banknote, label: medio, color: '#6b7280', bg: '#f9fafb' };
        return (
          <div key={medio} style={{ padding: '12px 14px', borderRadius: 12, background: cfg.bg, border: `1.5px solid ${cfg.color}22`, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: `${cfg.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <cfg.Icon size={17} color={cfg.color} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 700, color: '#374151' }}>{cfg.label}</p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {data.ingresos > 0 && (
                  <span style={{ fontSize: 10, color: '#15803d', fontWeight: 600 }}>
                    +{formatCOP(data.ingresos)} ingreso{data.ingresos !== 1 ? 's' : ''}
                  </span>
                )}
                {data.egresos > 0 && (
                  <span style={{ fontSize: 10, color: '#dc2626', fontWeight: 600 }}>
                    −{formatCOP(data.egresos)} egreso{data.egresos !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
            <p style={{ margin: 0, fontSize: 10, color: '#9ca3af', flexShrink: 0 }}>{data.cantidad} mov.</p>
          </div>
        );
      })}
    </div>
  );
}

// ── SectionLabel ──────────────────────────────────────────────────────────────
function SectionLabel({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
      <span style={{ fontSize: 10, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.07)' }} />
    </div>
  );
}

// ── FlujoCajaResumenPage ──────────────────────────────────────────────────────
export default function FlujoCajaResumenPage() {
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');

  const params = useMemo(() => {
    const p = {};
    if (desde) p.desde = desde + 'T00:00:00.000Z';
    if (hasta) p.hasta = hasta + 'T23:59:59.999Z';
    return p;
  }, [desde, hasta]);

  const { data: raw, isLoading, isError, error } = useCashFlowSummary(params);
  const summary = raw?.data ?? raw ?? {};

  const balance       = summary.balance ?? 0;
  const porCategoria  = summary.porCategoria  ?? [];
  const porMedioPago  = summary.porMedioPago  ?? [];

  const maxCatTotal = porCategoria.reduce((acc, c) => Math.max(acc, Math.abs(c.total)), 0);

  const hasFilters = desde || hasta;

  const inputDate = (val, setter) => ({
    value: val,
    onChange: (e) => setter(e.target.value),
    type: 'date',
    style: {
      height: 30, padding: '0 8px', borderRadius: 8,
      border: `1.5px solid ${val ? '#55624a' : '#e5e7eb'}`,
      fontSize: 11, outline: 'none',
      color: val ? '#374151' : '#9ca3af',
      background: '#f9fafb', boxSizing: 'border-box',
      transition: 'border-color 150ms',
    },
  });

  return (
    <div className="w-full h-full overflow-hidden flex flex-col">

      {/* Chrome tab */}
      <div className="flex items-end shrink-0">
        <div className="relative flex items-center gap-2 px-4 h-10 border border-b-0 border-white/40 shrink-0"
          style={{ width: 'min(50%, 420px)', ...GLASS, borderRadius: '10px 10px 0 0' }}>
          <BarChart3 size={13} style={{ color: '#55624a', flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#374151', fontFamily: "'Syne',sans-serif" }}>Resumen Financiero</span>
          {isLoading && <Loader2 size={11} className="animate-spin" style={{ color: '#8c916c' }} />}
          <span style={{ position: 'absolute', bottom: 0, right: -28, width: 28, height: 48, overflow: 'hidden', pointerEvents: 'none' }}>
            <span style={{ position: 'absolute', left: 0, bottom: 0, width: 56, height: 56, borderRadius: '50%', boxShadow: '-28px 28px 0 0 rgba(204,204,204,0.22)' }} />
          </span>
        </div>
      </div>

      {/* Glass body */}
      <div className="flex-1 overflow-hidden rounded-b-2xl rounded-tr-2xl" style={{ ...GLASS, display: 'flex', flexDirection: 'column' }}>

        {/* Filter bar */}
        <div style={{ margin: '8px 4px 0', background: 'white', borderRadius: '14px 14px 0 0', padding: '10px 16px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Período</span>
          <input {...inputDate(desde, setDesde)} placeholder="Desde" />
          <span style={{ fontSize: 11, color: '#d1d5db' }}>—</span>
          <input {...inputDate(hasta, setHasta)} placeholder="Hasta" />
          {hasFilters && (
            <button
              onClick={() => { setDesde(''); setHasta(''); }}
              style={{ height: 30, padding: '0 10px', borderRadius: 8, border: '1.5px solid #fca5a5', background: '#fff5f5', color: '#dc2626', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
            >
              Limpiar
            </button>
          )}
          {!hasFilters && (
            <span style={{ fontSize: 11, color: '#9ca3af' }}>Mostrando caja activa (sin filtro de fechas)</span>
          )}
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'thin', margin: '0 4px', background: 'white' }}>

          {isError ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', gap: 10 }}>
              <AlertCircle size={28} color="#fca5a5" />
              <p style={{ margin: 0, fontSize: 13, color: '#9ca3af' }}>{error?.message ?? 'Error al cargar el resumen'}</p>
            </div>
          ) : (
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Cards principales */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <BigCard
                  Icon={ArrowUpRight} label="Total Ingresos"
                  amount={summary.totalIngresos} count={summary.cantidadIngresos}
                  color="#15803d" bg="#f0fdf4" isLoading={isLoading}
                />
                <BigCard
                  Icon={ArrowDownRight} label="Total Egresos"
                  amount={summary.totalEgresos} count={summary.cantidadEgresos}
                  color="#dc2626" bg="#fff5f5" isLoading={isLoading}
                />
                <BigCard
                  Icon={ShoppingBag} label="Compras Inventario"
                  amount={summary.totalComprasInventario} count={summary.cantidadCompras}
                  color="#1d4ed8" bg="#eff6ff" isLoading={isLoading}
                />
              </div>

              {/* Balance destacado */}
              <div style={{
                padding: '20px 24px',
                borderRadius: 16,
                background: balance > 0 ? '#f0fdf4' : balance < 0 ? '#fff5f5' : '#f9fafb',
                border: `2px solid ${balance > 0 ? '#86efac' : balance < 0 ? '#fca5a5' : '#e5e7eb'}`,
                display: 'flex', alignItems: 'center', gap: 16,
              }}>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: balance > 0 ? '#15803d18' : balance < 0 ? '#dc262618' : '#6b728018', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <DollarSign size={24} color={balance > 0 ? '#15803d' : balance < 0 ? '#dc2626' : '#9ca3af'} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Balance total</p>
                  {isLoading ? (
                    <div style={{ width: 140, height: 32, background: 'rgba(0,0,0,0.07)', borderRadius: 8, marginTop: 6 }} />
                  ) : (
                    <p style={{ margin: '4px 0 0', fontSize: 32, fontWeight: 900, fontFamily: "'Syne',sans-serif", letterSpacing: '-0.02em', color: balance > 0 ? '#15803d' : balance < 0 ? '#dc2626' : '#9ca3af' }}>
                      {balance >= 0 ? '' : '−'}{formatCOP(Math.abs(balance))}
                    </p>
                  )}
                  {!isLoading && (
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: '#9ca3af' }}>
                      {summary.totalMovimientos ?? 0} movimientos en total
                    </p>
                  )}
                </div>
                {!isLoading && balance !== 0 && (
                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 10, background: balance > 0 ? '#dcfce7' : '#fee2e2' }}>
                    {balance > 0 ? <TrendingUp size={16} color="#15803d" /> : <TrendingDown size={16} color="#dc2626" />}
                    <span style={{ fontSize: 12, fontWeight: 700, color: balance > 0 ? '#15803d' : '#dc2626' }}>
                      {balance > 0 ? 'Positivo' : 'Negativo'}
                    </span>
                  </div>
                )}
              </div>

              {/* Por categoría */}
              {!isLoading && porCategoria.length > 0 && (
                <div>
                  <SectionLabel label="Desglose por categoría" />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {porCategoria.map((item, i) => (
                      <CategoryRow key={`${item.categoriaId}-${i}`} item={item} maxTotal={maxCatTotal} />
                    ))}
                  </div>
                </div>
              )}

              {/* Por medio de pago */}
              {!isLoading && porMedioPago.length > 0 && (
                <div>
                  <SectionLabel label="Desglose por medio de pago" />
                  <MedioSection rows={porMedioPago} />
                </div>
              )}

              {/* Estado vacío */}
              {!isLoading && summary.totalMovimientos === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px', gap: 10 }}>
                  <BarChart3 size={36} style={{ color: '#e5e7eb' }} />
                  <p style={{ margin: 0, fontSize: 13, color: '#9ca3af' }}>Sin movimientos en el período seleccionado</p>
                </div>
              )}

            </div>
          )}
        </div>

        {/* Bottom bar */}
        <div style={{ margin: '0 4px 4px', background: 'white', borderRadius: '0 0 14px 14px', padding: '8px 20px', flexShrink: 0, borderTop: '1px solid rgba(0,0,0,0.05)' }}>
          <p style={{ margin: 0, fontSize: 10, color: '#9ca3af' }}>
            {hasFilters
              ? `Período: ${desde || '—'} → ${hasta || '—'}`
              : 'Mostrando datos de la caja activa actual'}
          </p>
        </div>
      </div>
    </div>
  );
}
