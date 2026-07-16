import { useState, useEffect, useMemo } from 'react';
import {
  History, ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  Loader2, TrendingUp, AlertTriangle, CheckCircle,
  DollarSign, Banknote, CreditCard, ShoppingCart, Clock, X,
} from 'lucide-react';
import { useCashHistory, useCashRegisterById } from '../../hooks/useCashRegister';

// ── Constants ────────────────────────────────────────────────────────────────

const GLASS = {
  background: 'rgba(204,204,204,0.22)',
  backdropFilter: 'blur(28px) saturate(1.8)',
  WebkitBackdropFilter: 'blur(28px) saturate(1.8)',
};

const COLS = [
  { key: 'fechaApertura', label: 'Apertura',     flex: '1.5fr', sortable: true  },
  { key: 'abiertaPor',    label: 'Abierta por',  flex: '1.2fr', sortable: false },
  { key: 'fechaCierre',   label: 'Cierre',       flex: '1.5fr', sortable: true  },
  { key: 'cerradaPor',    label: 'Cerrada por',  flex: '1.2fr', sortable: false },
  { key: 'ventas',        label: 'Ventas',       flex: '0.65fr', sortable: true  },
  { key: 'diferencia',    label: 'Diferencia',   flex: '1.1fr', sortable: true  },
  { key: 'estado',        label: 'Estado',       flex: '0.9fr', sortable: false },
];
const GRID = COLS.map((c) => c.flex).join(' ');
const LIMIT = 20;

const ESTADO_CFG = {
  all:      { label: 'Todas',    dot: '#9ca3af', bg: 'rgba(0,0,0,0.04)',        border: 'rgba(0,0,0,0.10)',       color: '#6b7280', next: 'CERRADA' },
  CERRADA:  { label: 'Cerradas', dot: '#9ca3af', bg: 'rgba(156,163,175,0.12)', border: 'rgba(107,114,128,0.22)', color: '#6b7280', next: 'ABIERTA' },
  ABIERTA:  { label: 'Abiertas', dot: '#22c55e', bg: 'rgba(21,128,61,0.08)',    border: 'rgba(21,128,61,0.28)',   color: '#15803d', next: 'all'     },
};

const ESTADO_ROW_CFG = {
  ABIERTA: { label: 'Abierta', dot: '#22c55e', bg: '#ecfdf3', color: '#15803d', border: '#bbf7d0' },
  CERRADA: { label: 'Cerrada', dot: '#9ca3af', bg: '#f3f4f6', color: '#6b7280', border: '#e5e7eb' },
};

const formatCOP = (v) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v ?? 0);

const formatDT = (iso) => {
  if (!iso) return null;
  return new Date(iso).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

// ── Sub-components ────────────────────────────────────────────────────────────

function SortableHeader({ col, sortKey, sortDir, onSort }) {
  const active = sortKey === col.key;
  if (!col.sortable) {
    return (
      <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af' }}>
        {col.label}
      </span>
    );
  }
  return (
    <button onClick={() => onSort(col.key)}
      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: active ? '#55624a' : '#9ca3af', transition: 'color 100ms' }}>
        {col.label}
      </span>
      <span style={{ display: 'flex', flexDirection: 'column', gap: 1, marginTop: 1 }}>
        <ChevronUp   size={9} style={{ color: active && sortDir === 'asc'  ? '#55624a' : '#d1d5db' }} />
        <ChevronDown size={9} style={{ color: active && sortDir === 'desc' ? '#55624a' : '#d1d5db', marginTop: -3 }} />
      </span>
    </button>
  );
}

function sortRows(rows, key, dir) {
  if (!key || !rows?.length) return rows ?? [];
  return [...rows].sort((a, b) => {
    let va, vb;
    if (key === 'fechaApertura' || key === 'fechaCierre') {
      va = a[key] ? new Date(a[key]).getTime() : 0;
      vb = b[key] ? new Date(b[key]).getTime() : 0;
    } else if (key === 'diferencia') {
      va = a.diferencia ?? -Infinity;
      vb = b.diferencia ?? -Infinity;
    } else if (key === 'ventas') {
      va = a._count?.ventas ?? 0;
      vb = b._count?.ventas ?? 0;
    } else {
      return 0;
    }
    return dir === 'asc' ? va - vb : vb - va;
  });
}

// ── Detail panel ──────────────────────────────────────────────────────────────

function InfoPair({ label, value }) {
  return (
    <div style={{ background: '#f9fafb', borderRadius: 10, padding: '10px 12px', border: '1px solid rgba(0,0,0,0.05)' }}>
      <p style={{ margin: '0 0 2px', fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#374151' }}>{value || '—'}</p>
    </div>
  );
}

function SmallMetric({ icon: Icon, iconColor, iconBg, label, value }) {
  return (
    <div style={{ background: '#f9fafb', borderRadius: 10, padding: '10px 12px', border: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={13} color={iconColor} />
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#374151' }}>{value}</p>
      </div>
    </div>
  );
}

function DifBlock({ resumen: r }) {
  const DIF_CFG = {
    CUADRE_PERFECTO: { icon: CheckCircle, color: '#15803d', bg: '#ecfdf3', border: '#bbf7d0', label: 'Cuadre perfecto' },
    SOBRANTE:        { icon: TrendingUp,  color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe', label: 'Sobrante' },
    FALTANTE:        { icon: AlertTriangle, color: '#dc2626', bg: '#fef2f2', border: '#fecaca', label: 'Diferencia' },
  };
  const cfg = DIF_CFG[r.tipoDiferencia] ?? DIF_CFG.CUADRE_PERFECTO;
  const Icon = cfg.icon;
  return (
    <div style={{ background: cfg.bg, borderRadius: 10, padding: '12px 14px', border: `1px solid ${cfg.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <Icon size={13} color={cfg.color} />
        <span style={{ fontSize: 12, fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
        <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 700, color: cfg.color }}>
          {(r.diferenciaTotal ?? 0) > 0 ? '+' : ''}{formatCOP(r.diferenciaTotal)}
        </span>
      </div>
      <div style={{ fontSize: 12, color: '#374151', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#6b7280' }}>Efectivo</span>
          <span style={{ fontWeight: 600, color: (r.diferenciaEfectivo ?? 0) >= 0 ? '#15803d' : '#dc2626' }}>
            {(r.diferenciaEfectivo ?? 0) >= 0 ? '+' : ''}{formatCOP(r.diferenciaEfectivo)}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#6b7280' }}>Transferencias</span>
          <span style={{ fontWeight: 600, color: (r.diferenciaTransferencias ?? 0) >= 0 ? '#15803d' : '#dc2626' }}>
            {(r.diferenciaTransferencias ?? 0) >= 0 ? '+' : ''}{formatCOP(r.diferenciaTransferencias)}
          </span>
        </div>
      </div>
    </div>
  );
}

function CajaDetailPanel({ id, onClose }) {
  const [visible, setVisible] = useState(false);
  const { data: detail, isLoading } = useCashRegisterById(id);

  useEffect(() => {
    const af = requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    return () => cancelAnimationFrame(af);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 280);
  };

  const caja    = detail?.caja    ?? {};
  const resumen = detail?.resumen ?? {};
  const estadoCfg = ESTADO_ROW_CFG[caja.estado] ?? ESTADO_ROW_CFG.CERRADA;

  return (
    <>
      <div onClick={handleClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.28)', zIndex: 1050, backdropFilter: 'blur(3px)', transition: 'opacity 280ms', opacity: visible ? 1 : 0 }} />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 440, zIndex: 1051,
        background: 'white', boxShadow: '-8px 0 40px rgba(0,0,0,0.14)',
        display: 'flex', flexDirection: 'column',
        transform: visible ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 280ms cubic-bezier(0.16,1,0.3,1)',
      }}>
        {/* header */}
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111827', fontFamily: "'Syne',sans-serif" }}>Detalle de caja</h2>
            {caja.fechaApertura && (
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#9ca3af' }}>
                {new Date(caja.fechaApertura).toLocaleString('es-CO', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
          <button onClick={handleClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '4px', borderRadius: 8, display: 'flex', marginTop: -2 }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f3f4f6'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}>
            <X size={17} />
          </button>
        </div>

        {/* body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', scrollbarWidth: 'thin' }}>
          {isLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
              <Loader2 size={24} className="animate-spin" style={{ color: '#d1d5db' }} />
            </div>
          ) : (
            <>
              {/* estado badge */}
              <div style={{ marginBottom: 16 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: estadoCfg.bg, color: estadoCfg.color, border: `1px solid ${estadoCfg.border}` }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: estadoCfg.dot }} />
                  {estadoCfg.label}
                </span>
              </div>

              {/* apertura/cierre info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                <InfoPair label="Abierta por" value={caja.abiertaPor?.nombreCompleto} />
                <InfoPair label="Apertura" value={formatDT(caja.fechaApertura)} />
                <InfoPair label="Cerrada por" value={caja.cerradaPor?.nombreCompleto} />
                <InfoPair label="Cierre" value={formatDT(caja.fechaCierre)} />
                <InfoPair label="Monto inicial" value={formatCOP(caja.montoInicial)} />
                <InfoPair label="# Ventas" value={resumen.cantidadVentas ?? '—'} />
              </div>

              {/* resumen ventas */}
              <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Resumen de ventas</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                <SmallMetric icon={ShoppingCart} iconColor="#2563eb" iconBg="rgba(37,99,235,0.1)" label="Total ventas" value={formatCOP(resumen.totalVentas)} />
                <SmallMetric icon={Banknote}     iconColor="#7c3aed" iconBg="rgba(124,58,237,0.1)" label="Efectivo" value={formatCOP(resumen.totalEfectivo)} />
                <SmallMetric icon={CreditCard}   iconColor="#0891b2" iconBg="rgba(8,145,178,0.1)" label="Transferencias" value={formatCOP(resumen.totalTransferencias)} />
                <SmallMetric icon={DollarSign}   iconColor="#d97706" iconBg="rgba(217,119,6,0.1)"  label="Saldo esperado" value={formatCOP(resumen.saldoProyectadoEfectivo ?? ((caja.montoInicial ?? 0) + (resumen.totalEfectivo ?? 0)))} />
              </div>

              {/* diferencia (si cerrada y hay resumen de cierre) */}
              {caja.estado === 'CERRADA' && resumen.tipoDiferencia && (
                <>
                  <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Cuadre de cierre</p>
                  <DifBlock resumen={resumen} />
                </>
              )}

              {/* notas */}
              {caja.notas && (
                <div style={{ marginTop: 12, padding: '10px 12px', background: '#f9fafb', borderRadius: 10, border: '1px solid rgba(0,0,0,0.05)' }}>
                  <p style={{ margin: '0 0 3px', fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Notas de apertura</p>
                  <p style={{ margin: 0, fontSize: 13, color: '#374151' }}>{caja.notas}</p>
                </div>
              )}
              {caja.notasCierre && (
                <div style={{ marginTop: 8, padding: '10px 12px', background: '#f9fafb', borderRadius: 10, border: '1px solid rgba(0,0,0,0.05)' }}>
                  <p style={{ margin: '0 0 3px', fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Notas de cierre</p>
                  <p style={{ margin: 0, fontSize: 13, color: '#374151' }}>{caja.notasCierre}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CajaHistorialPage() {
  const [estado,     setEstado]     = useState('all');
  const [page,       setPage]       = useState(1);
  const [sortKey,    setSortKey]    = useState('fechaApertura');
  const [sortDir,    setSortDir]    = useState('desc');
  const [selectedId, setSelectedId] = useState(null);

  const params = useMemo(() => {
    const p = { page, limit: LIMIT };
    if (estado !== 'all') p.estado = estado;
    return p;
  }, [page, estado]);

  const { data: rawData, isLoading, isFetching } = useCashHistory(params);

  const rows       = rawData?.data ?? [];
  const meta       = rawData?.meta ?? {};
  const totalPages = meta.totalPages ?? 1;

  const sorted = useMemo(() => sortRows(rows, sortKey, sortDir), [rows, sortKey, sortDir]);

  const selected = rows.find((r) => r.id === selectedId) ?? null;

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  };

  const ec = ESTADO_CFG[estado] ?? ESTADO_CFG.all;

  return (
    <div className="w-full h-full overflow-hidden flex flex-col">

      {/* ── Top row ────────────────────────────────────────────────────────── */}
      <div className="flex items-end shrink-0 h-10">

        {/* Chrome tab */}
        <div className="relative flex items-center gap-2 px-4 h-10 border border-b-0 border-white/40 shrink-0"
          style={{ width: 'min(65%, 640px)', ...GLASS, borderRadius: '10px 10px 0 0' }}>
          <History size={13} style={{ color: '#55624a', flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#374151', fontFamily: "'Syne',sans-serif", flexShrink: 0 }}>
            Historial de Cajas
          </span>
          {isFetching && !isLoading && (
            <Loader2 size={11} className="animate-spin" style={{ color: '#8c916c', flexShrink: 0 }} />
          )}

          <div style={{ width: 1, height: 16, background: 'rgba(156,163,175,0.5)', margin: '0 4px', flexShrink: 0 }} />

          {/* Estado chip (cyclic) */}
          <button
            onClick={() => { setEstado(ec.next); setPage(1); setSelectedId(null); }}
            style={{ display: 'flex', alignItems: 'center', gap: 4, height: 24, padding: '0 10px', borderRadius: 8, fontSize: 11, fontWeight: 500, border: `1px solid ${ec.border}`, background: ec.bg, color: ec.color, cursor: 'pointer', flexShrink: 0, transition: 'all 150ms' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: ec.dot, display: 'inline-block' }} />
            {ec.label}
          </button>

          {/* Chrome ear */}
          <span style={{ position: 'absolute', bottom: 0, right: -28, width: 28, height: 48, overflow: 'hidden', pointerEvents: 'none' }}>
            <span style={{ position: 'absolute', left: 0, bottom: 0, width: 56, height: 56, borderRadius: '50%', boxShadow: '-28px 28px 0 0 rgba(204,204,204,0.22)' }} />
          </span>
        </div>

      </div>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden rounded-b-2xl rounded-tr-2xl" style={GLASS}>

        {/* Column headers */}
        <div style={{ display: 'grid', gridTemplateColumns: GRID, padding: '12px 20px', borderBottom: '1px solid rgba(0,0,0,0.06)', margin: '8px 4px 0', background: 'white', borderRadius: '14px 14px 0 0', flexShrink: 0 }}>
          {COLS.map((col) => (
            <SortableHeader key={col.key} col={col} sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
          ))}
        </div>

        {/* Rows */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', background: 'white', margin: '0 4px', scrollbarWidth: 'thin' }}>
          {isLoading ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Loader2 size={20} className="animate-spin" style={{ color: '#d1d5db' }} />
            </div>
          ) : sorted.length === 0 ? (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <History size={28} style={{ color: '#d1d5db' }} />
              <p style={{ color: '#9ca3af', fontSize: 13, margin: 0 }}>No hay cajas registradas</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', paddingTop: 4, paddingBottom: 4 }}>
              {sorted.map((row, idx) => {
                const isSel   = selectedId === row.id;
                const eCfg    = ESTADO_ROW_CFG[row.estado] ?? ESTADO_ROW_CFG.CERRADA;
                const dif     = row.diferencia;
                const ventas  = row._count?.ventas ?? row.cantidadVentas ?? null;

                return (
                  <div key={row.id}
                    onClick={() => setSelectedId(isSel ? null : row.id)}
                    style={{ display: 'grid', gridTemplateColumns: GRID, alignItems: 'center', padding: '11px 20px', margin: `0 4px ${idx < sorted.length - 1 ? 2 : 0}px`, borderRadius: 14, cursor: 'pointer', background: isSel ? '#a1a682' : 'transparent', transition: 'background 150ms' }}
                    onMouseEnter={(e) => { if (!isSel) e.currentTarget.style.background = 'rgba(161,166,130,0.16)'; }}
                    onMouseLeave={(e) => { if (!isSel) e.currentTarget.style.background = 'transparent'; }}
                  >
                    {/* Apertura */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Clock size={11} style={{ color: isSel ? 'rgba(255,255,255,0.5)' : '#9ca3af', flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: isSel ? 'rgba(255,255,255,0.9)' : '#374151' }}>
                        {formatDT(row.fechaApertura) ?? '—'}
                      </span>
                    </div>

                    {/* Abierta por */}
                    <span style={{ fontSize: 12, color: isSel ? 'rgba(255,255,255,0.82)' : '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 8 }}>
                      {row.abiertaPor?.nombreCompleto ?? '—'}
                    </span>

                    {/* Cierre */}
                    <span style={{ fontSize: 12, color: row.fechaCierre ? (isSel ? 'rgba(255,255,255,0.9)' : '#374151') : (isSel ? 'rgba(255,255,255,0.3)' : '#d1d5db') }}>
                      {formatDT(row.fechaCierre) ?? '—'}
                    </span>

                    {/* Cerrada por */}
                    <span style={{ fontSize: 12, color: isSel ? 'rgba(255,255,255,0.82)' : '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 8 }}>
                      {row.cerradaPor?.nombreCompleto ?? <span style={{ color: isSel ? 'rgba(255,255,255,0.3)' : '#d1d5db' }}>—</span>}
                    </span>

                    {/* Ventas */}
                    <div>
                      {ventas !== null ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 22, height: 20, padding: '0 7px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: isSel ? 'rgba(255,255,255,0.18)' : '#f3f4f6', color: isSel ? 'white' : '#374151' }}>
                          {ventas}
                        </span>
                      ) : (
                        <span style={{ color: isSel ? 'rgba(255,255,255,0.3)' : '#d1d5db', fontSize: 11 }}>—</span>
                      )}
                    </div>

                    {/* Diferencia */}
                    <div>
                      {dif === null || dif === undefined ? (
                        <span style={{ fontSize: 12, color: isSel ? 'rgba(255,255,255,0.3)' : '#d1d5db' }}>—</span>
                      ) : dif === 0 ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: isSel ? 'rgba(21,128,61,0.45)' : '#ecfdf3', color: isSel ? '#d1fae5' : '#15803d', border: isSel ? '1px solid rgba(21,128,61,0.6)' : '1px solid #bbf7d0' }}>
                          Cuadre ✓
                        </span>
                      ) : dif > 0 ? (
                        <span style={{ fontSize: 12, fontWeight: 600, color: isSel ? '#bfdbfe' : '#1d4ed8' }}>+{formatCOP(dif)}</span>
                      ) : (
                        <span style={{ fontSize: 12, fontWeight: 600, color: isSel ? '#fca5a5' : '#dc2626' }}>{formatCOP(dif)}</span>
                      )}
                    </div>

                    {/* Estado */}
                    <div>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: isSel ? 'rgba(255,255,255,0.15)' : eCfg.bg, color: isSel ? 'rgba(255,255,255,0.85)' : eCfg.color, border: `1px solid ${isSel ? 'rgba(255,255,255,0.2)' : eCfg.border}` }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: isSel ? 'rgba(255,255,255,0.5)' : eCfg.dot }} />
                        {eCfg.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ flexShrink: 0, padding: '8px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', margin: '0 4px 4px', borderRadius: '0 0 14px 14px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
          <span style={{ fontSize: 11, color: '#9ca3af' }}>
            {meta.total != null ? `${rows.length} de ${meta.total} registros` : `${rows.length} registros`}
            {selected && <span style={{ color: '#8c916c', fontWeight: 500 }}> · Sel: {new Date(selected.fechaApertura).toLocaleDateString('es-CO')}</span>}
          </span>

          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: '#9ca3af' }}>Pág. {page}/{totalPages}</span>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                style={{ width: 26, height: 26, borderRadius: 7, border: '1px solid #e5e7eb', background: 'white', cursor: page === 1 ? 'not-allowed' : 'pointer', color: page === 1 ? '#d1d5db' : '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ChevronLeft size={13} />
              </button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                style={{ width: 26, height: 26, borderRadius: 7, border: '1px solid #e5e7eb', background: 'white', cursor: page === totalPages ? 'not-allowed' : 'pointer', color: page === totalPages ? '#d1d5db' : '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ChevronRight size={13} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Detail panel */}
      {selectedId && (
        <CajaDetailPanel id={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}
