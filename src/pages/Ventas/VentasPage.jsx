import { useState, useEffect, useMemo } from 'react';
import {
  Receipt, Search, Eye, XCircle, X, Loader2,
  ChevronLeft, ChevronRight, Banknote, Smartphone, Shuffle,
  AlertTriangle, Package, User,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useSales, useSaleById, useCancelSale } from '../../hooks/useSales';
import { useCashStatus } from '../../hooks/useCashRegister';

const GLASS = {
  background: 'rgba(204,204,204,0.22)',
  backdropFilter: 'blur(28px) saturate(1.8)',
  WebkitBackdropFilter: 'blur(28px) saturate(1.8)',
};

const LIMIT = 20;

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatCOP(n) {
  if (n == null || isNaN(n)) return '$0';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0,
  }).format(n);
}

function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return (
    d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    ' ' +
    d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
  );
}

const CHEVRON_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`;

// ── EstadoBadge ───────────────────────────────────────────────────────────────
function EstadoBadge({ estado }) {
  const ok = estado === 'COMPLETADA';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      height: 20, padding: '0 8px', borderRadius: 6,
      fontSize: 9, fontWeight: 700, letterSpacing: '0.05em',
      background: ok ? '#dcfce7' : '#fee2e2',
      color: ok ? '#15803d' : '#dc2626',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: ok ? '#16a34a' : '#ef4444', display: 'inline-block' }} />
      {estado}
    </span>
  );
}

// ── MetodoBadge ───────────────────────────────────────────────────────────────
function MetodoBadge({ metodo }) {
  const map = {
    EFECTIVO:      { Icon: Banknote,   bg: '#f0fdf4', color: '#15803d', label: 'Efectivo' },
    TRANSFERENCIA: { Icon: Smartphone, bg: '#eff6ff', color: '#1d4ed8', label: 'Transferencia' },
    COMBINADO:     { Icon: Shuffle,    bg: '#faf5ff', color: '#7c3aed', label: 'Combinado' },
  };
  const cfg = map[metodo] ?? { Icon: Banknote, bg: '#f9fafb', color: '#6b7280', label: metodo ?? '—' };
  const { Icon } = cfg;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      height: 22, padding: '0 9px', borderRadius: 7,
      fontSize: 10, fontWeight: 600, background: cfg.bg, color: cfg.color,
    }}>
      <Icon size={11} />
      {cfg.label}
    </span>
  );
}

// ── SectionLabel ──────────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 8px' }}>
      <span style={{ fontSize: 9, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        {children}
      </span>
      <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.06)' }} />
    </div>
  );
}

// ── CancelModal ───────────────────────────────────────────────────────────────
function CancelModal({ sale, onClose, onCancelled }) {
  const [motivo, setMotivo] = useState('');
  const cancel = useCancelSale();
  const MIN = 10;
  const trimmed = motivo.trim();
  const ok = trimmed.length >= MIN;

  const handleConfirm = () => {
    if (!ok || cancel.isPending) return;
    cancel.mutate({ id: sale.id, motivo: trimmed }, {
      onSuccess: () => {
        toast.success(`Venta #${sale.numero} anulada exitosamente`);
        onCancelled();
      },
      onError: (err) => toast.error(err?.message ?? 'Error al anular la venta'),
    });
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1300, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: '100%', maxWidth: 420, background: 'white', borderRadius: 20, border: '1px solid #e5e7eb', boxShadow: '0 20px 60px rgba(0,0,0,0.18)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '16px 20px 14px', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <XCircle size={18} color="#dc2626" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#111827', fontFamily: "'Syne',sans-serif" }}>
                Anular Venta #{sale.numero}
              </h3>
              <p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>Total: {formatCOP(sale.total)}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: '#f3f4f6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={13} color="#6b7280" />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', gap: 10, padding: '10px 12px', borderRadius: 12, background: '#fffbeb', border: '1px solid #fde68a', marginBottom: 16 }}>
            <AlertTriangle size={15} color="#d97706" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ margin: 0, fontSize: 12, color: '#92400e', lineHeight: 1.55 }}>
              Esta acción revertirá automáticamente el inventario descontado y <strong>no se puede deshacer</strong>.
            </p>
          </div>

          <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
            Motivo de anulación <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Describe el motivo de la anulación..."
            rows={3}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 10,
              border: `1.5px solid ${trimmed.length > 0 && !ok ? '#fca5a5' : '#e5e7eb'}`,
              fontSize: 13, outline: 'none', resize: 'vertical', color: '#374151',
              fontFamily: 'system-ui, sans-serif', boxSizing: 'border-box', lineHeight: 1.5,
              transition: 'border-color 150ms',
            }}
            onFocus={(e) => { e.target.style.borderColor = ok ? '#55624a' : '#fca5a5'; }}
            onBlur={(e) => { e.target.style.borderColor = trimmed.length > 0 && !ok ? '#fca5a5' : '#e5e7eb'; }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
            <span style={{ fontSize: 11, color: trimmed.length > 0 && !ok ? '#dc2626' : '#9ca3af' }}>
              {trimmed.length > 0 && !ok ? `Mínimo ${MIN} caracteres` : ''}
            </span>
            <span style={{ fontSize: 11, color: ok ? '#15803d' : '#9ca3af', fontWeight: ok ? 600 : 400 }}>
              {trimmed.length} / {MIN}+
            </span>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '0 20px 16px', display: 'flex', gap: 8 }}>
          <button
            onClick={onClose}
            style={{ flex: 1, height: 40, borderRadius: 10, border: '1.5px solid #e5e7eb', background: 'white', color: '#6b7280', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Syne',sans-serif" }}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!ok || cancel.isPending}
            style={{
              flex: 2, height: 40, borderRadius: 10, border: 'none',
              background: ok && !cancel.isPending ? '#dc2626' : '#e5e7eb',
              color: ok && !cancel.isPending ? 'white' : '#9ca3af',
              fontSize: 13, fontWeight: 700, cursor: ok && !cancel.isPending ? 'pointer' : 'not-allowed',
              fontFamily: "'Syne',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'background 150ms',
            }}
          >
            {cancel.isPending ? <Loader2 size={15} className="animate-spin" /> : 'Confirmar anulación'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── SaleDetailModal ───────────────────────────────────────────────────────────
function SaleDetailModal({ saleId, cashActive, onClose }) {
  const { data: raw, isLoading } = useSaleById(saleId);
  const [showCancel, setShowCancel] = useState(false);
  const sale = raw?.data ?? raw ?? null;

  return (
    <>
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(0,0,0,0.30)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div style={{ width: '100%', maxWidth: 580, background: 'white', borderRadius: 20, border: '1px solid #e5e7eb', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Modal header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 13, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Receipt size={19} color="#15803d" />
              </div>
              {isLoading ? (
                <div style={{ paddingTop: 4 }}>
                  <div style={{ width: 180, height: 16, background: '#f3f4f6', borderRadius: 6, marginBottom: 8 }} />
                  <div style={{ width: 120, height: 12, background: '#f3f4f6', borderRadius: 5 }} />
                </div>
              ) : sale ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111827', fontFamily: "'Syne',sans-serif" }}>
                      Factura #{sale.numero}
                    </h3>
                    <EstadoBadge estado={sale.estado} />
                  </div>
                  <p style={{ margin: '3px 0 0', fontSize: 12, color: '#9ca3af' }}>
                    {formatDateTime(sale.fechaVenta)}
                  </p>
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: 13, color: '#9ca3af' }}>Venta no encontrada</p>
              )}
            </div>
            <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 9, border: 'none', background: '#f3f4f6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <X size={14} color="#6b7280" />
            </button>
          </div>

          {/* Modal body */}
          <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'thin', padding: '16px 20px' }}>
            {isLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
                <Loader2 size={24} className="animate-spin" style={{ color: '#d1d5db' }} />
              </div>
            ) : !sale ? (
              <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, padding: 48 }}>No se pudo cargar la venta</p>
            ) : (
              <>
                {/* Items */}
                <SectionLabel>Productos</SectionLabel>
                <div style={{ borderRadius: 12, border: '1px solid rgba(0,0,0,0.07)', overflow: 'hidden', marginBottom: 16 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: '#f9fafb', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                        {[['Producto', 'left'], ['Cant', 'right'], ['Precio', 'right'], ['Desc', 'right'], ['Subtotal', 'right']].map(([h, align]) => (
                          <th key={h} style={{ padding: '8px 10px', textAlign: align, fontSize: 9, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(sale.items ?? []).map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: idx < (sale.items.length - 1) ? '1px solid rgba(0,0,0,0.04)' : 'none' }}>
                          <td style={{ padding: '9px 10px' }}>
                            <p style={{ margin: 0, fontWeight: 600, color: '#374151' }}>{item.producto?.nombre ?? '—'}</p>
                            {item.variante && <p style={{ margin: '1px 0 0', fontSize: 10, color: '#9ca3af' }}>{item.variante.nombre}</p>}
                          </td>
                          <td style={{ padding: '9px 10px', textAlign: 'right', color: '#374151' }}>{item.cantidad}</td>
                          <td style={{ padding: '9px 10px', textAlign: 'right', color: '#374151' }}>{formatCOP(item.precioUnitario)}</td>
                          <td style={{ padding: '9px 10px', textAlign: 'right', color: item.descuento > 0 ? '#dc2626' : '#d1d5db' }}>
                            {item.descuento > 0 ? `−${formatCOP(item.descuento)}` : '—'}
                          </td>
                          <td style={{ padding: '9px 10px', textAlign: 'right', fontWeight: 700, color: '#374151', fontFamily: "'Syne',sans-serif" }}>
                            {formatCOP(item.subtotal ?? (item.precioUnitario * item.cantidad - (item.descuento ?? 0)))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Resumen */}
                <SectionLabel>Resumen</SectionLabel>
                <div style={{ background: '#f9fafb', borderRadius: 12, padding: '12px 14px', marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12 }}>
                    <span style={{ color: '#6b7280' }}>Subtotal</span>
                    <span style={{ color: '#374151' }}>{formatCOP(sale.subtotal)}</span>
                  </div>
                  {(sale.descuentoTotal ?? 0) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12 }}>
                      <span style={{ color: '#6b7280' }}>Descuento</span>
                      <span style={{ color: '#dc2626' }}>−{formatCOP(sale.descuentoTotal)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1.5px solid rgba(0,0,0,0.08)' }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#374151', fontFamily: "'Syne',sans-serif" }}>TOTAL</span>
                    <span style={{ fontSize: 16, fontWeight: 800, color: '#55624a', fontFamily: "'Syne',sans-serif" }}>{formatCOP(sale.total)}</span>
                  </div>
                </div>

                {/* Pago */}
                <SectionLabel>Información de Pago</SectionLabel>
                <div style={{ borderRadius: 12, border: '1px solid rgba(0,0,0,0.07)', padding: '10px 14px', marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 7 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: '#9ca3af' }}>Método</span>
                    <MetodoBadge metodo={sale.metodoPago} />
                  </div>
                  {sale.montoEfectivo != null && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: '#9ca3af' }}>Monto en efectivo</span>
                      <span style={{ fontWeight: 600, color: '#374151' }}>{formatCOP(sale.montoEfectivo)}</span>
                    </div>
                  )}
                  {sale.montoTransferencia != null && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: '#9ca3af' }}>Transferencia</span>
                      <span style={{ fontWeight: 600, color: '#374151' }}>{formatCOP(sale.montoTransferencia)}</span>
                    </div>
                  )}
                  {(sale.cambio ?? 0) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: '#9ca3af' }}>Cambio devuelto</span>
                      <span style={{ fontWeight: 700, color: '#15803d' }}>{formatCOP(sale.cambio)}</span>
                    </div>
                  )}
                </div>

                {/* Cliente & Cajero */}
                {(sale.clienteNombre || sale.cajero) && (
                  <>
                    <SectionLabel>Datos Adicionales</SectionLabel>
                    <div style={{ borderRadius: 12, border: '1px solid rgba(0,0,0,0.07)', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                      {sale.clienteNombre && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                          <span style={{ color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 5 }}>
                            <User size={11} /> Cliente
                          </span>
                          <span style={{ fontWeight: 600, color: '#374151' }}>
                            {sale.clienteNombre}{sale.clienteNit ? ` · ${sale.clienteNit}` : ''}
                          </span>
                        </div>
                      )}
                      {sale.cajero && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                          <span style={{ color: '#9ca3af' }}>Cajero</span>
                          <span style={{ fontWeight: 600, color: '#374151' }}>
                            {sale.cajero.nombreCompleto ?? sale.cajero.nombreUsuario ?? '—'}
                          </span>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Motivo anulación */}
                {sale.estado === 'ANULADA' && sale.motivoAnulacion && (
                  <div style={{ borderRadius: 12, background: '#fff5f5', border: '1px solid #fecaca', padding: '10px 14px' }}>
                    <p style={{ margin: '0 0 4px', fontSize: 9, fontWeight: 700, color: '#dc2626', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      Motivo de anulación
                    </p>
                    <p style={{ margin: 0, fontSize: 12, color: '#7f1d1d', lineHeight: 1.55 }}>{sale.motivoAnulacion}</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Modal footer */}
          <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <button
              onClick={onClose}
              style={{ height: 38, padding: '0 20px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: 'white', color: '#6b7280', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Syne',sans-serif" }}
            >
              Cerrar
            </button>
            {sale?.estado === 'COMPLETADA' && cashActive && (
              <button
                onClick={() => setShowCancel(true)}
                style={{ height: 38, padding: '0 18px', borderRadius: 10, border: 'none', background: '#fee2e2', color: '#dc2626', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Syne',sans-serif", display: 'flex', alignItems: 'center', gap: 6, transition: 'background 150ms' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#fecaca'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#fee2e2'; }}
              >
                <XCircle size={14} />
                Anular venta
              </button>
            )}
          </div>
        </div>
      </div>

      {showCancel && sale && (
        <CancelModal
          sale={sale}
          onClose={() => setShowCancel(false)}
          onCancelled={() => setShowCancel(false)}
        />
      )}
    </>
  );
}

// ── VentasPage ────────────────────────────────────────────────────────────────
export default function VentasPage() {
  const [filters, setFilters]   = useState({ estado: '', metodoPago: '', desde: '', hasta: '' });
  const [numInput, setNumInput] = useState('');
  const [numero, setNumero]     = useState('');
  const [page, setPage]         = useState(1);
  const [detailId, setDetailId] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => { setNumero(numInput.trim()); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [numInput]);

  const queryParams = useMemo(() => {
    const p = { page, limit: LIMIT };
    if (filters.estado)     p.estado     = filters.estado;
    if (filters.metodoPago) p.metodoPago = filters.metodoPago;
    if (filters.desde)      p.desde      = filters.desde + 'T00:00:00.000Z';
    if (filters.hasta)      p.hasta      = filters.hasta + 'T23:59:59.999Z';
    if (numero)             p.numero     = numero;
    return p;
  }, [filters, page, numero]);

  const { data, isLoading, isFetching } = useSales(queryParams);
  const { data: cashStatus } = useCashStatus();

  const sales      = data?.data ?? [];
  const meta       = data?.meta ?? {};
  const totalCount = meta.total ?? 0;
  const totalPages = meta.totalPages ?? 1;
  const cashActive = cashStatus?.hayTCajaAbierta ?? false;
  const hasFilters = filters.estado || filters.metodoPago || filters.desde || filters.hasta || numInput;

  const clearFilters = () => {
    setFilters({ estado: '', metodoPago: '', desde: '', hasta: '' });
    setNumInput(''); setNumero(''); setPage(1);
  };

  const setFilter = (key, val) => {
    setFilters((f) => ({ ...f, [key]: val }));
    setPage(1);
  };

  const thStyle = {
    padding: '10px 14px', textAlign: 'left',
    fontSize: 10, fontWeight: 700, color: '#9ca3af',
    letterSpacing: '0.07em', textTransform: 'uppercase',
    borderBottom: '1.5px solid rgba(0,0,0,0.07)',
    whiteSpace: 'nowrap', background: 'white',
    position: 'sticky', top: 0, zIndex: 10,
  };
  const tdStyle = { padding: '10px 14px', verticalAlign: 'middle' };

  const selectStyle = (active) => ({
    height: 32, padding: '0 28px 0 10px', borderRadius: 9,
    border: `1.5px solid ${active ? '#55624a' : '#e5e7eb'}`,
    fontSize: 12, outline: 'none',
    color: active ? '#374151' : '#9ca3af',
    background: '#f9fafb',
    boxSizing: 'border-box', flex: '0 0 130px',
    cursor: 'pointer', appearance: 'none',
    backgroundImage: CHEVRON_SVG,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 8px center',
    transition: 'border-color 150ms',
  });

  return (
    <div className="w-full h-full overflow-hidden flex flex-col">

      {/* ── Chrome tab ── */}
      <div className="flex items-end shrink-0">
        <div
          className="relative flex items-center gap-2 px-4 h-10 border border-b-0 border-white/40 shrink-0"
          style={{ width: 'min(50%, 400px)', ...GLASS, borderRadius: '10px 10px 0 0' }}
        >
          <Receipt size={13} style={{ color: '#55624a', flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#374151', fontFamily: "'Syne',sans-serif" }}>
            Historial de Ventas
          </span>
          {isFetching && !isLoading && (
            <Loader2 size={11} className="animate-spin" style={{ color: '#8c916c' }} />
          )}
          <span style={{ position: 'absolute', bottom: 0, right: -28, width: 28, height: 48, overflow: 'hidden', pointerEvents: 'none' }}>
            <span style={{ position: 'absolute', left: 0, bottom: 0, width: 56, height: 56, borderRadius: '50%', boxShadow: '-28px 28px 0 0 rgba(204,204,204,0.22)' }} />
          </span>
        </div>
      </div>

      {/* ── Glass body ── */}
      <div className="flex-1 overflow-hidden rounded-b-2xl rounded-tr-2xl" style={{ ...GLASS, display: 'flex', flexDirection: 'column' }}>

        {/* Filter bar */}
        <div style={{ margin: '8px 4px 0', background: 'white', borderRadius: '14px 14px 0 0', padding: '10px 16px', flexShrink: 0, borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>

            {/* Número */}
            <div style={{ position: 'relative', flex: '0 0 140px' }}>
              <Search size={11} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
              <input
                value={numInput}
                onChange={(e) => setNumInput(e.target.value)}
                placeholder="# Factura"
                type="number"
                min="1"
                style={{ width: '100%', height: 32, padding: '0 8px 0 26px', borderRadius: 9, border: '1.5px solid #e5e7eb', fontSize: 12, outline: 'none', background: '#f9fafb', color: '#374151', boxSizing: 'border-box', transition: 'border-color 150ms, background 150ms' }}
                onFocus={(e) => { e.target.style.borderColor = '#55624a'; e.target.style.background = 'white'; }}
                onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#f9fafb'; }}
              />
            </div>

            {/* Desde */}
            <input
              type="date"
              value={filters.desde}
              onChange={(e) => setFilter('desde', e.target.value)}
              title="Desde"
              style={{ height: 32, padding: '0 8px', borderRadius: 9, border: `1.5px solid ${filters.desde ? '#55624a' : '#e5e7eb'}`, fontSize: 12, outline: 'none', color: filters.desde ? '#374151' : '#9ca3af', background: '#f9fafb', boxSizing: 'border-box', flex: '0 0 130px', transition: 'border-color 150ms' }}
              onFocus={(e) => { e.target.style.borderColor = '#55624a'; e.target.style.background = 'white'; }}
              onBlur={(e) => { e.target.style.background = '#f9fafb'; }}
            />

            {/* Hasta */}
            <input
              type="date"
              value={filters.hasta}
              onChange={(e) => setFilter('hasta', e.target.value)}
              title="Hasta"
              style={{ height: 32, padding: '0 8px', borderRadius: 9, border: `1.5px solid ${filters.hasta ? '#55624a' : '#e5e7eb'}`, fontSize: 12, outline: 'none', color: filters.hasta ? '#374151' : '#9ca3af', background: '#f9fafb', boxSizing: 'border-box', flex: '0 0 130px', transition: 'border-color 150ms' }}
              onFocus={(e) => { e.target.style.borderColor = '#55624a'; e.target.style.background = 'white'; }}
              onBlur={(e) => { e.target.style.background = '#f9fafb'; }}
            />

            {/* Estado */}
            <select value={filters.estado} onChange={(e) => setFilter('estado', e.target.value)} style={selectStyle(!!filters.estado)}>
              <option value="">Estado</option>
              <option value="COMPLETADA">Completada</option>
              <option value="ANULADA">Anulada</option>
            </select>

            {/* Método */}
            <select value={filters.metodoPago} onChange={(e) => setFilter('metodoPago', e.target.value)} style={selectStyle(!!filters.metodoPago)}>
              <option value="">Método</option>
              <option value="EFECTIVO">Efectivo</option>
              <option value="TRANSFERENCIA">Transferencia</option>
              <option value="COMBINADO">Combinado</option>
            </select>

            {/* Clear */}
            {hasFilters && (
              <button
                onClick={clearFilters}
                style={{ height: 32, padding: '0 12px', borderRadius: 9, border: '1.5px solid #fca5a5', background: '#fff5f5', color: '#dc2626', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
              >
                <X size={10} />
                Limpiar
              </button>
            )}

            {/* Count */}
            {!isLoading && (
              <span style={{ marginLeft: 'auto', fontSize: 11, color: '#9ca3af' }}>
                {totalCount} {totalCount === 1 ? 'venta' : 'ventas'}
              </span>
            )}
          </div>
        </div>

        {/* Table */}
        <div style={{ flex: 1, background: 'white', margin: '0 4px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'thin' }}>
            {isLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
                <Loader2 size={24} className="animate-spin" style={{ color: '#d1d5db' }} />
              </div>
            ) : sales.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 64, gap: 10 }}>
                <Package size={34} style={{ color: '#e5e7eb' }} />
                <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>
                  {hasFilters ? 'Sin resultados para estos filtros' : 'No hay ventas registradas'}
                </p>
                {hasFilters && (
                  <button onClick={clearFilters} style={{ fontSize: 12, color: '#55624a', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                    Limpiar filtros
                  </button>
                )}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 720 }}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle, width: 70 }}>#</th>
                    <th style={{ ...thStyle }}>Fecha</th>
                    <th style={{ ...thStyle }}>Cajero</th>
                    <th style={{ ...thStyle, textAlign: 'center', width: 60 }}>Ítems</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>Método</th>
                    <th style={{ ...thStyle }}>Total</th>
                    <th style={{ ...thStyle }}>Estado</th>
                    <th style={{ ...thStyle, textAlign: 'center', width: 54 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale) => {
                    const isAnulada = sale.estado === 'ANULADA';
                    return (
                      <tr
                        key={sale.id}
                        style={{ background: isAnulada ? '#fff5f5' : 'transparent', borderBottom: '1px solid rgba(0,0,0,0.04)', transition: 'background 120ms' }}
                        onMouseEnter={(e) => { if (!isAnulada) e.currentTarget.style.background = '#f9fafb'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = isAnulada ? '#fff5f5' : 'transparent'; }}
                      >
                        <td style={tdStyle}>
                          <span style={{ fontSize: 14, fontWeight: 800, color: '#374151', fontFamily: "'Syne',sans-serif" }}>
                            #{sale.numero}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontSize: 12, color: '#6b7280' }}>{formatDateTime(sale.fechaVenta)}</span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontSize: 12, color: '#374151' }}>
                            {sale.cajero?.nombreCompleto ?? sale.cajero?.nombreUsuario ?? '—'}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          <span style={{ width: 26, height: 26, borderRadius: 8, background: '#f3f4f6', color: '#6b7280', fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            {sale._count?.items ?? '—'}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          <MetodoBadge metodo={sale.metodoPago} />
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: isAnulada ? '#dc2626' : '#55624a', fontFamily: "'Syne',sans-serif", textDecoration: isAnulada ? 'line-through' : 'none' }}>
                            {formatCOP(sale.total)}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <EstadoBadge estado={sale.estado} />
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          <button
                            onClick={() => setDetailId(sale.id)}
                            title="Ver detalle"
                            style={{ width: 30, height: 30, borderRadius: 8, border: '1.5px solid #e5e7eb', background: 'white', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'border-color 150ms, background 150ms' }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#55624a'; e.currentTarget.style.background = '#f0fdf4'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.background = 'white'; }}
                          >
                            <Eye size={13} color="#6b7280" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            )}
          </div>
        </div>

        {/* Pagination */}
        <div style={{ margin: '0 4px 4px', background: 'white', borderRadius: '0 0 14px 14px', padding: '8px 16px', flexShrink: 0, borderTop: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, color: '#9ca3af' }}>
            {totalCount > 0
              ? `Mostrando ${Math.min((page - 1) * LIMIT + 1, totalCount)}–${Math.min(page * LIMIT, totalCount)} de ${totalCount}`
              : '0 resultados'}
          </span>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              style={{ width: 30, height: 30, borderRadius: 8, border: '1.5px solid #e5e7eb', background: 'white', cursor: page > 1 ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'border-color 150ms' }}
              onMouseEnter={(e) => { if (page > 1) e.currentTarget.style.borderColor = '#55624a'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
            >
              <ChevronLeft size={13} color={page > 1 ? '#374151' : '#d1d5db'} />
            </button>
            <span style={{ minWidth: 56, textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#374151' }}>
              {page} / {totalPages || 1}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              style={{ width: 30, height: 30, borderRadius: 8, border: '1.5px solid #e5e7eb', background: 'white', cursor: page < totalPages ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'border-color 150ms' }}
              onMouseEnter={(e) => { if (page < totalPages) e.currentTarget.style.borderColor = '#55624a'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
            >
              <ChevronRight size={13} color={page < totalPages ? '#374151' : '#d1d5db'} />
            </button>
          </div>
        </div>
      </div>

      {/* Detail modal */}
      {detailId && (
        <SaleDetailModal
          saleId={detailId}
          cashActive={cashActive}
          onClose={() => setDetailId(null)}
        />
      )}
    </div>
  );
}
