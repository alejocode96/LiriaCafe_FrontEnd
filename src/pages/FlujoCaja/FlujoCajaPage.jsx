import { useState, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, Package, DollarSign, Plus, X,
  Loader2, ChevronLeft, ChevronRight, Banknote, Smartphone,
  Tag, AlertCircle, Settings2, ArrowUpRight, ArrowDownRight,
  ShoppingBag, Info, Check,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useMovements, useCashFlowSummary, useCreateMovement,
  useCFCategories, useCreateCFCategory,
  useDeactivateCFCategory, useActivateCFCategory,
} from '../../hooks/useCashFlow';
import { useInventoryItems } from '../../hooks/useInventory';

const GLASS = {
  background: 'rgba(204,204,204,0.22)',
  backdropFilter: 'blur(28px) saturate(1.8)',
  WebkitBackdropFilter: 'blur(28px) saturate(1.8)',
};

const LIMIT = 20;
const CHEVRON = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`;

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatCOP(n) {
  if (n == null || isNaN(n)) return '$0';
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n);
}
function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

const TIPO_CFG = {
  INGRESO:             { label: 'Ingreso',   Icon: ArrowUpRight,  bg: '#f0fdf4', color: '#15803d', border: '#86efac', sign: '+' },
  EGRESO:              { label: 'Egreso',    Icon: ArrowDownRight, bg: '#fff5f5', color: '#dc2626', border: '#fca5a5', sign: '−' },
  COMPRA_INVENTARIO:   { label: 'Compra',    Icon: ShoppingBag,   bg: '#eff6ff', color: '#1d4ed8', border: '#93c5fd', sign: '−' },
};

// ── TipoBadge ─────────────────────────────────────────────────────────────────
function TipoBadge({ tipo }) {
  const cfg = TIPO_CFG[tipo] ?? { label: tipo, Icon: DollarSign, bg: '#f9fafb', color: '#6b7280', border: '#e5e7eb' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, height: 22, padding: '0 8px', borderRadius: 7, fontSize: 10, fontWeight: 700, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
      <cfg.Icon size={10} />
      {cfg.label}
    </span>
  );
}

// ── MedioBadge ────────────────────────────────────────────────────────────────
function MedioBadge({ medio }) {
  const map = {
    EFECTIVO:      { Icon: Banknote,   bg: '#f0fdf4', color: '#15803d', label: 'Efectivo' },
    TRANSFERENCIA: { Icon: Smartphone, bg: '#eff6ff', color: '#1d4ed8', label: 'Transf.' },
  };
  const cfg = map[medio] ?? { Icon: Banknote, bg: '#f9fafb', color: '#6b7280', label: medio ?? '—' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, height: 20, padding: '0 8px', borderRadius: 6, fontSize: 9, fontWeight: 600, background: cfg.bg, color: cfg.color }}>
      <cfg.Icon size={10} /> {cfg.label}
    </span>
  );
}

// ── SummaryCard ───────────────────────────────────────────────────────────────
function SummaryCard({ Icon, label, amount, count, color, bg, isLoading }) {
  return (
    <div style={{ flex: 1, minWidth: 0, padding: '12px 16px', borderRadius: 14, background: bg, border: `1.5px solid ${color}20`, display: 'flex', gap: 12, alignItems: 'center' }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={18} color={color} />
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
        {isLoading ? (
          <div style={{ width: 80, height: 18, background: 'rgba(0,0,0,0.07)', borderRadius: 6, marginTop: 4 }} />
        ) : (
          <p style={{ margin: '2px 0 0', fontSize: 17, fontWeight: 800, color, fontFamily: "'Syne',sans-serif" }}>{formatCOP(amount ?? 0)}</p>
        )}
        {!isLoading && count != null && (
          <p style={{ margin: 0, fontSize: 10, color: '#9ca3af' }}>{count} movimiento{count !== 1 ? 's' : ''}</p>
        )}
      </div>
    </div>
  );
}

// ── CategoriesModal ───────────────────────────────────────────────────────────
function CategoriesModal({ onClose }) {
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const { data: raw, isLoading } = useCFCategories({});
  const createCat   = useCreateCFCategory();
  const deactivate  = useDeactivateCFCategory();
  const activate    = useActivateCFCategory();
  const categories  = raw?.data ?? raw ?? [];

  const handleCreate = () => {
    if (newName.trim().length < 2 || createCat.isPending) return;
    createCat.mutate({ nombre: newName.trim(), descripcion: newDesc.trim() || undefined }, {
      onSuccess: () => { toast.success('Categoría creada'); setNewName(''); setNewDesc(''); },
      onError: (err) => toast.error(err?.message ?? 'Error al crear categoría'),
    });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(0,0,0,0.30)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: '100%', maxWidth: 460, background: 'white', borderRadius: 20, border: '1px solid #e5e7eb', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 11, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Tag size={16} color="#15803d" />
            </div>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#111827', fontFamily: "'Syne',sans-serif" }}>Categorías de Movimiento</h3>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: '#f3f4f6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={13} color="#6b7280" />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'thin', padding: '12px 20px' }}>
          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><Loader2 size={20} className="animate-spin" style={{ color: '#d1d5db' }} /></div>
          ) : categories.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 12, padding: '20px 0' }}>Sin categorías aún</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 4 }}>
              {categories.map((cat) => {
                const isActive = cat.estado === 'ACTIVO';
                const isWorking = deactivate.isPending || activate.isPending;
                return (
                  <div key={cat.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', borderRadius: 10, border: `1px solid ${isActive ? 'rgba(0,0,0,0.07)' : 'rgba(0,0,0,0.04)'}`, background: isActive ? 'white' : '#f9fafb', opacity: isActive ? 1 : 0.6 }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: isActive ? '#374151' : '#9ca3af' }}>{cat.nombre}</p>
                      {cat._count?.movimientos != null && (
                        <p style={{ margin: 0, fontSize: 10, color: '#9ca3af' }}>{cat._count.movimientos} movimiento{cat._count.movimientos !== 1 ? 's' : ''}</p>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ height: 18, padding: '0 7px', borderRadius: 5, fontSize: 9, fontWeight: 700, background: isActive ? '#dcfce7' : '#fee2e2', color: isActive ? '#15803d' : '#dc2626', display: 'flex', alignItems: 'center' }}>
                        {isActive ? 'ACTIVO' : 'INACTIVO'}
                      </span>
                      <button
                        onClick={() => isActive ? deactivate.mutate(cat.id, { onSuccess: () => toast.success('Desactivada'), onError: (e) => toast.error(e?.message ?? 'Error') }) : activate.mutate(cat.id, { onSuccess: () => toast.success('Activada'), onError: (e) => toast.error(e?.message ?? 'Error') })}
                        disabled={isWorking}
                        style={{ height: 26, padding: '0 10px', borderRadius: 7, border: `1.5px solid ${isActive ? '#fca5a5' : '#86efac'}`, background: isActive ? '#fff5f5' : '#f0fdf4', color: isActive ? '#dc2626' : '#15803d', fontSize: 10, fontWeight: 700, cursor: isWorking ? 'wait' : 'pointer' }}
                      >
                        {isActive ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ padding: '12px 20px 16px', borderTop: '1px solid rgba(0,0,0,0.05)', flexShrink: 0 }}>
          <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Nueva categoría</p>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              value={newName} onChange={(e) => setNewName(e.target.value)}
              placeholder="Nombre *"
              style={{ flex: 2, height: 34, padding: '0 10px', borderRadius: 9, border: '1.5px solid #e5e7eb', fontSize: 12, outline: 'none', color: '#374151', transition: 'border-color 150ms' }}
              onFocus={(e) => { e.target.style.borderColor = '#55624a'; }} onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
            />
            <input
              value={newDesc} onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Descripción (opc.)"
              style={{ flex: 3, height: 34, padding: '0 10px', borderRadius: 9, border: '1.5px solid #e5e7eb', fontSize: 12, outline: 'none', color: '#374151', transition: 'border-color 150ms' }}
              onFocus={(e) => { e.target.style.borderColor = '#55624a'; }} onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; }}
            />
            <button
              onClick={handleCreate}
              disabled={newName.trim().length < 2 || createCat.isPending}
              style={{ height: 34, padding: '0 14px', borderRadius: 9, border: 'none', background: newName.trim().length >= 2 ? '#55624a' : '#e5e7eb', color: newName.trim().length >= 2 ? 'white' : '#9ca3af', fontSize: 12, fontWeight: 700, cursor: newName.trim().length >= 2 ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}
            >
              {createCat.isPending ? <Loader2 size={13} className="animate-spin" /> : <><Plus size={13} />Crear</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── RegisterModal ─────────────────────────────────────────────────────────────
function RegisterModal({ onClose, onSuccess }) {
  const [tipo,               setTipo]               = useState('EGRESO');
  const [monto,              setMonto]              = useState('');
  const [concepto,           setConcepto]           = useState('');
  const [categoriaId,        setCategoriaId]        = useState('');
  const [medioPago,          setMedioPago]          = useState('EFECTIVO');
  const [afectaCaja,         setAfectaCaja]         = useState(true);
  const [notas,              setNotas]              = useState('');
  const [itemInventarioId,   setItemId]             = useState('');
  const [cantidadInventario, setCantidad]           = useState('');
  const [showInfo,           setShowInfo]           = useState(false);

  const { data: catsRaw }    = useCFCategories({ estado: 'ACTIVO' });
  const { data: invRaw }     = useInventoryItems({ estado: 'ACTIVO', limit: 100 });
  const createMov            = useCreateMovement();

  const categories   = catsRaw?.data ?? catsRaw ?? [];
  const invItems     = invRaw?.data ?? [];
  const montoNum     = parseFloat(monto) || 0;
  const cantNum      = parseInt(cantidadInventario) || 0;
  const unitPrice    = cantNum > 0 && montoNum > 0 ? montoNum / cantNum : 0;

  const isCompra = tipo === 'COMPRA_INVENTARIO';
  const canSubmit = tipo && montoNum > 0 && concepto.trim().length >= 2 && medioPago &&
    (!isCompra || (itemInventarioId && cantNum > 0));

  const handleSubmit = () => {
    if (!canSubmit || createMov.isPending) return;
    const payload = {
      tipo, monto: montoNum, concepto: concepto.trim(), medioPago, afectaCaja,
      ...(categoriaId             ? { categoriaId }                              : {}),
      ...(notas.trim()            ? { notas: notas.trim() }                      : {}),
      ...(isCompra                ? { itemInventarioId, cantidadInventario: cantNum } : {}),
    };
    createMov.mutate(payload, {
      onSuccess: () => { toast.success('Movimiento registrado'); onSuccess(); },
      onError:   (err) => toast.error(err?.message ?? 'Error al registrar movimiento'),
    });
  };

  const inputStyle = {
    width: '100%', height: 34, padding: '0 10px', borderRadius: 9,
    border: '1.5px solid #e5e7eb', fontSize: 12, outline: 'none',
    color: '#374151', boxSizing: 'border-box', background: '#f9fafb',
    transition: 'border-color 150ms, background 150ms',
  };
  const focusIn  = (e) => { e.target.style.borderColor = '#55624a'; e.target.style.background = 'white'; };
  const focusOut = (e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#f9fafb'; };
  const selectStyle = { ...inputStyle, appearance: 'none', backgroundImage: CHEVRON, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', paddingRight: 28, cursor: 'pointer' };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(0,0,0,0.30)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: '100%', maxWidth: 520, background: 'white', borderRadius: 20, border: '1px solid #e5e7eb', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={17} color="#15803d" />
            </div>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#111827', fontFamily: "'Syne',sans-serif" }}>Registrar Movimiento</h3>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: '#f3f4f6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={13} color="#6b7280" />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'thin', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Tipo */}
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 7 }}>Tipo *</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
              {Object.entries(TIPO_CFG).map(([key, cfg]) => {
                const active = tipo === key;
                return (
                  <button key={key} onClick={() => setTipo(key)} style={{ height: 48, borderRadius: 10, border: `1.5px solid ${active ? cfg.color : '#e5e7eb'}`, background: active ? cfg.bg : 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, cursor: 'pointer', transition: 'all 150ms' }}>
                    <cfg.Icon size={16} color={active ? cfg.color : '#9ca3af'} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: active ? cfg.color : '#9ca3af' }}>{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Monto + Concepto */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 5 }}>Monto *</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: '#9ca3af', pointerEvents: 'none' }}>$</span>
                <input type="number" min="0" step="100" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="0"
                  style={{ ...inputStyle, paddingLeft: 20 }} onFocus={focusIn} onBlur={focusOut} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 5 }}>Concepto *</label>
              <input value={concepto} onChange={(e) => setConcepto(e.target.value)} placeholder="Descripción del movimiento"
                style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
            </div>
          </div>

          {/* Categoría + Medio de pago */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 5 }}>Categoría</label>
              <select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} style={selectStyle} onFocus={focusIn} onBlur={focusOut}>
                <option value="">Sin categoría</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 5 }}>Medio de pago *</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
                {[['EFECTIVO', Banknote, 'Efectivo'], ['TRANSFERENCIA', Smartphone, 'Transf.']].map(([v, Icon, l]) => {
                  const active = medioPago === v;
                  return (
                    <button key={v} onClick={() => setMedioPago(v)} style={{ height: 34, borderRadius: 9, border: `1.5px solid ${active ? '#55624a' : '#e5e7eb'}`, background: active ? 'rgba(85,98,74,0.08)' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, cursor: 'pointer', transition: 'all 150ms' }}>
                      <Icon size={12} color={active ? '#55624a' : '#9ca3af'} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: active ? '#55624a' : '#9ca3af' }}>{l}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Afecta caja */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 10, background: afectaCaja ? '#f0fdf4' : '#f9fafb', border: `1.5px solid ${afectaCaja ? '#86efac' : '#e5e7eb'}`, transition: 'all 180ms' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: afectaCaja ? '#15803d' : '#6b7280' }}>Afecta caja registradora</span>
              <button onClick={() => setShowInfo((v) => !v)} style={{ width: 16, height: 16, borderRadius: 999, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                <Info size={13} color="#9ca3af" />
              </button>
            </div>
            <button onClick={() => setAfectaCaja((v) => !v)} style={{ width: 36, height: 20, borderRadius: 10, background: afectaCaja ? '#15803d' : '#d1d5db', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 180ms', flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: 3, left: afectaCaja ? 18 : 3, width: 14, height: 14, borderRadius: '50%', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.25)', transition: 'left 180ms' }} />
            </button>
          </div>
          {showInfo && (
            <div style={{ padding: '8px 12px', borderRadius: 10, background: '#fffbeb', border: '1px solid #fde68a', display: 'flex', gap: 8 }}>
              <AlertCircle size={13} color="#d97706" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ margin: 0, fontSize: 11, color: '#92400e', lineHeight: 1.5 }}>
                Activo: modifica el saldo de la caja registradora abierta.<br />
                Inactivo: registra el movimiento sin afectar el saldo de caja (ej. gastos pagados por fuera).
              </p>
            </div>
          )}

          {/* COMPRA_INVENTARIO fields */}
          {isCompra && (
            <div style={{ padding: '12px', borderRadius: 12, background: '#eff6ff', border: '1px solid #93c5fd', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Detalle de compra de inventario</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 600, color: '#1d4ed8', display: 'block', marginBottom: 4 }}>Ítem de inventario *</label>
                  <select value={itemInventarioId} onChange={(e) => setItemId(e.target.value)}
                    style={{ ...selectStyle, background: 'white', borderColor: '#93c5fd' }} onFocus={focusIn} onBlur={focusOut}>
                    <option value="">Seleccionar ítem…</option>
                    {invItems.map((i) => <option key={i.id} value={i.id}>{i.nombre}</option>)}
                  </select>
                </div>
                <div style={{ width: 90 }}>
                  <label style={{ fontSize: 10, fontWeight: 600, color: '#1d4ed8', display: 'block', marginBottom: 4 }}>Cantidad *</label>
                  <input type="number" min="1" step="1" value={cantidadInventario} onChange={(e) => setCantidad(e.target.value)} placeholder="0"
                    style={{ ...inputStyle, width: '100%', background: 'white', borderColor: '#93c5fd' }} onFocus={focusIn} onBlur={focusOut} />
                </div>
              </div>
              {montoNum > 0 && cantNum > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 8, background: 'white', border: '1px solid #bfdbfe' }}>
                  <Check size={12} color="#1d4ed8" />
                  <span style={{ fontSize: 11, color: '#1d4ed8', fontWeight: 600 }}>
                    {cantNum} unid. × {formatCOP(unitPrice)} c/u = {formatCOP(montoNum)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Notas */}
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 5 }}>Notas <span style={{ fontWeight: 400 }}>(opcional)</span></label>
            <textarea value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Información adicional…" rows={2}
              style={{ width: '100%', padding: '8px 10px', borderRadius: 9, border: '1.5px solid #e5e7eb', fontSize: 12, outline: 'none', resize: 'vertical', color: '#374151', background: '#f9fafb', fontFamily: 'system-ui, sans-serif', boxSizing: 'border-box', lineHeight: 1.5, transition: 'border-color 150ms, background 150ms' }}
              onFocus={(e) => { e.target.style.borderColor = '#55624a'; e.target.style.background = 'white'; }}
              onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#f9fafb'; }} />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px 16px', borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex', gap: 8, flexShrink: 0 }}>
          <button onClick={onClose} style={{ flex: 1, height: 40, borderRadius: 10, border: '1.5px solid #e5e7eb', background: 'white', color: '#6b7280', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Syne',sans-serif" }}>
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={!canSubmit || createMov.isPending}
            style={{ flex: 2, height: 40, borderRadius: 10, border: 'none', background: canSubmit && !createMov.isPending ? '#55624a' : '#e5e7eb', color: canSubmit && !createMov.isPending ? 'white' : '#9ca3af', fontSize: 13, fontWeight: 700, cursor: canSubmit && !createMov.isPending ? 'pointer' : 'not-allowed', fontFamily: "'Syne',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'background 150ms' }}>
            {createMov.isPending ? <Loader2 size={15} className="animate-spin" /> : <><Plus size={14} />Registrar movimiento</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── FlujoCajaPage ─────────────────────────────────────────────────────────────
export default function FlujoCajaPage({ autoOpenRegister = false }) {
  const [showRegister,   setShowRegister]   = useState(autoOpenRegister);
  const [showCategories, setShowCategories] = useState(false);
  const [filters,        setFilters]        = useState({ tipo: '', medioPago: '', desde: '', hasta: '' });
  const [page,           setPage]           = useState(1);

  const queryParams = useMemo(() => {
    const p = { page, limit: LIMIT };
    if (filters.tipo)     p.tipo     = filters.tipo;
    if (filters.medioPago) p.medioPago = filters.medioPago;
    if (filters.desde)    p.desde    = filters.desde + 'T00:00:00.000Z';
    if (filters.hasta)    p.hasta    = filters.hasta + 'T23:59:59.999Z';
    return p;
  }, [filters, page]);

  const { data,        isLoading, isFetching } = useMovements(queryParams);
  const { data: sumRaw, isLoading: sumLoading } = useCashFlowSummary({});

  const movements  = data?.data ?? [];
  const meta       = data?.meta ?? {};
  const totalCount = meta.total ?? 0;
  const totalPages = meta.totalPages ?? 1;

  const summary    = sumRaw?.data ?? sumRaw ?? {};
  const balance    = summary.balance ?? 0;
  const hasFilters = filters.tipo || filters.medioPago || filters.desde || filters.hasta;

  const setFilter = (key, val) => { setFilters((f) => ({ ...f, [key]: val })); setPage(1); };
  const clearFilters = () => { setFilters({ tipo: '', medioPago: '', desde: '', hasta: '' }); setPage(1); };

  const thStyle = {
    padding: '9px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700,
    color: '#9ca3af', letterSpacing: '0.07em', textTransform: 'uppercase',
    borderBottom: '1.5px solid rgba(0,0,0,0.07)', whiteSpace: 'nowrap',
    background: 'white', position: 'sticky', top: 0, zIndex: 10,
  };
  const tdStyle = { padding: '9px 14px', verticalAlign: 'middle' };
  const selectStyle = (active) => ({
    height: 30, padding: '0 24px 0 9px', borderRadius: 8,
    border: `1.5px solid ${active ? '#55624a' : '#e5e7eb'}`,
    fontSize: 11, outline: 'none', color: active ? '#374151' : '#9ca3af',
    background: '#f9fafb', boxSizing: 'border-box', cursor: 'pointer',
    appearance: 'none', backgroundImage: CHEVRON,
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 7px center',
    transition: 'border-color 150ms',
  });

  return (
    <div className="w-full h-full overflow-hidden flex flex-col">

      {/* Chrome tab */}
      <div className="flex items-end shrink-0">
        <div className="relative flex items-center gap-2 px-4 h-10 border border-b-0 border-white/40 shrink-0"
          style={{ width: 'min(50%, 380px)', ...GLASS, borderRadius: '10px 10px 0 0' }}>
          <TrendingUp size={13} style={{ color: '#55624a', flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#374151', fontFamily: "'Syne',sans-serif" }}>Flujo de Caja</span>
          {isFetching && !isLoading && <Loader2 size={11} className="animate-spin" style={{ color: '#8c916c' }} />}
          <span style={{ position: 'absolute', bottom: 0, right: -28, width: 28, height: 48, overflow: 'hidden', pointerEvents: 'none' }}>
            <span style={{ position: 'absolute', left: 0, bottom: 0, width: 56, height: 56, borderRadius: '50%', boxShadow: '-28px 28px 0 0 rgba(204,204,204,0.22)' }} />
          </span>
        </div>
      </div>

      {/* Glass body */}
      <div className="flex-1 overflow-hidden rounded-b-2xl rounded-tr-2xl" style={{ ...GLASS, display: 'flex', flexDirection: 'column' }}>

        {/* Summary cards */}
        <div style={{ margin: '8px 4px 0', background: 'white', borderRadius: '14px 14px 0 0', padding: '12px 16px', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <SummaryCard Icon={ArrowUpRight}  label="Ingresos"       amount={summary.totalIngresos}           count={summary.cantidadIngresos}  color="#15803d" bg="#f0fdf4" isLoading={sumLoading} />
            <SummaryCard Icon={ArrowDownRight} label="Egresos"        amount={summary.totalEgresosConCompras}  count={summary.cantidadEgresos}   color="#dc2626" bg="#fff5f5" isLoading={sumLoading} />
            <SummaryCard Icon={ShoppingBag}    label="Compras Inv."   amount={summary.totalComprasInventario}  count={summary.cantidadCompras}   color="#1d4ed8" bg="#eff6ff" isLoading={sumLoading} />
            <div style={{ flex: 1, minWidth: 0, padding: '12px 16px', borderRadius: 14, background: balance >= 0 ? '#f0fdf4' : '#fff5f5', border: `1.5px solid ${balance >= 0 ? '#86efac20' : '#fca5a520'}`, display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: balance >= 0 ? '#15803d18' : '#dc262618', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <DollarSign size={18} color={balance >= 0 ? '#15803d' : '#dc2626'} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Balance</p>
                {sumLoading ? (
                  <div style={{ width: 80, height: 18, background: 'rgba(0,0,0,0.07)', borderRadius: 6, marginTop: 4 }} />
                ) : (
                  <p style={{ margin: '2px 0 0', fontSize: 17, fontWeight: 800, color: balance > 0 ? '#15803d' : balance < 0 ? '#dc2626' : '#9ca3af', fontFamily: "'Syne',sans-serif" }}>
                    {balance >= 0 ? '' : '−'}{formatCOP(Math.abs(balance))}
                  </p>
                )}
                <p style={{ margin: 0, fontSize: 10, color: '#9ca3af' }}>{summary.totalMovimientos ?? 0} movimientos</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter + action bar */}
        <div style={{ background: 'white', margin: '0 4px', padding: '8px 16px', flexShrink: 0, borderTop: '1px solid rgba(0,0,0,0.05)', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', gap: 7, alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={filters.tipo} onChange={(e) => setFilter('tipo', e.target.value)} style={selectStyle(!!filters.tipo)}>
            <option value="">Tipo</option>
            <option value="INGRESO">Ingreso</option>
            <option value="EGRESO">Egreso</option>
            <option value="COMPRA_INVENTARIO">Compra Inventario</option>
          </select>
          <select value={filters.medioPago} onChange={(e) => setFilter('medioPago', e.target.value)} style={selectStyle(!!filters.medioPago)}>
            <option value="">Medio de pago</option>
            <option value="EFECTIVO">Efectivo</option>
            <option value="TRANSFERENCIA">Transferencia</option>
          </select>
          <input type="date" value={filters.desde} onChange={(e) => setFilter('desde', e.target.value)} title="Desde"
            style={{ height: 30, padding: '0 7px', borderRadius: 8, border: `1.5px solid ${filters.desde ? '#55624a' : '#e5e7eb'}`, fontSize: 11, outline: 'none', color: filters.desde ? '#374151' : '#9ca3af', background: '#f9fafb', boxSizing: 'border-box', transition: 'border-color 150ms' }} />
          <input type="date" value={filters.hasta} onChange={(e) => setFilter('hasta', e.target.value)} title="Hasta"
            style={{ height: 30, padding: '0 7px', borderRadius: 8, border: `1.5px solid ${filters.hasta ? '#55624a' : '#e5e7eb'}`, fontSize: 11, outline: 'none', color: filters.hasta ? '#374151' : '#9ca3af', background: '#f9fafb', boxSizing: 'border-box', transition: 'border-color 150ms' }} />
          {hasFilters && (
            <button onClick={clearFilters} style={{ height: 30, padding: '0 10px', borderRadius: 8, border: '1.5px solid #fca5a5', background: '#fff5f5', color: '#dc2626', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <X size={10} />Limpiar
            </button>
          )}
          {!isLoading && <span style={{ fontSize: 11, color: '#9ca3af' }}>{totalCount} resultado{totalCount !== 1 ? 's' : ''}</span>}

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            <button onClick={() => setShowCategories(true)}
              style={{ height: 32, padding: '0 12px', borderRadius: 9, border: '1.5px solid #e5e7eb', background: 'white', color: '#6b7280', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, transition: 'border-color 150ms' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#55624a'; e.currentTarget.style.color = '#55624a'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#6b7280'; }}>
              <Settings2 size={12} />Categorías
            </button>
            <button onClick={() => setShowRegister(true)}
              style={{ height: 32, padding: '0 14px', borderRadius: 9, border: 'none', background: '#55624a', color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Syne',sans-serif" }}>
              <Plus size={13} />Registrar
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ flex: 1, background: 'white', margin: '0 4px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'thin' }}>
            {isLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
                <Loader2 size={24} className="animate-spin" style={{ color: '#d1d5db' }} />
              </div>
            ) : movements.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 60, gap: 10 }}>
                <TrendingUp size={32} style={{ color: '#e5e7eb' }} />
                <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>
                  {hasFilters ? 'Sin resultados para estos filtros' : 'No hay movimientos registrados'}
                </p>
                {hasFilters && <button onClick={clearFilters} style={{ fontSize: 12, color: '#55624a', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Limpiar filtros</button>}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 700 }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Tipo</th>
                    <th style={thStyle}>Concepto</th>
                    <th style={thStyle}>Categoría</th>
                    <th style={thStyle}>Fecha</th>
                    <th style={thStyle}>Cajero</th>
                    <th style={thStyle}>Medio</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Monto</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>Caja</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((mov) => {
                    const cfg = TIPO_CFG[mov.tipo] ?? TIPO_CFG.EGRESO;
                    return (
                      <tr key={mov.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)', transition: 'background 120ms' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#f9fafb'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                        <td style={tdStyle}><TipoBadge tipo={mov.tipo} /></td>
                        <td style={tdStyle}>
                          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#374151', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mov.concepto}</p>
                          {mov.notas && <p style={{ margin: '1px 0 0', fontSize: 10, color: '#9ca3af', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mov.notas}</p>}
                        </td>
                        <td style={tdStyle}>
                          {mov.categoria ? (
                            <span style={{ height: 20, padding: '0 7px', borderRadius: 5, background: '#f3f4f6', color: '#6b7280', fontSize: 10, fontWeight: 600, display: 'inline-flex', alignItems: 'center' }}>{mov.categoria.nombre}</span>
                          ) : <span style={{ color: '#d1d5db', fontSize: 11 }}>—</span>}
                        </td>
                        <td style={tdStyle}><span style={{ fontSize: 11, color: '#6b7280' }}>{formatDateTime(mov.createdAt)}</span></td>
                        <td style={tdStyle}><span style={{ fontSize: 11, color: '#374151' }}>{mov.usuario?.nombreCompleto ?? '—'}</span></td>
                        <td style={tdStyle}><MedioBadge medio={mov.medioPago} /></td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: cfg.color, fontFamily: "'Syne',sans-serif" }}>
                            {cfg.sign}{formatCOP(mov.monto)}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          {mov.afectaCaja ? (
                            <span style={{ width: 22, height: 22, borderRadius: 7, background: '#dcfce7', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Check size={11} color="#15803d" />
                            </span>
                          ) : (
                            <span style={{ height: 18, padding: '0 6px', borderRadius: 5, background: '#f3f4f6', color: '#9ca3af', fontSize: 9, fontWeight: 700, display: 'inline-flex', alignItems: 'center' }}>NO</span>
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
        </div>

        {/* Pagination */}
        <div style={{ margin: '0 4px 4px', background: 'white', borderRadius: '0 0 14px 14px', padding: '8px 16px', flexShrink: 0, borderTop: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, color: '#9ca3af' }}>
            {totalCount > 0 ? `${Math.min((page - 1) * LIMIT + 1, totalCount)}–${Math.min(page * LIMIT, totalCount)} de ${totalCount}` : '0 resultados'}
          </span>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
              style={{ width: 28, height: 28, borderRadius: 8, border: '1.5px solid #e5e7eb', background: 'white', cursor: page > 1 ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronLeft size={13} color={page > 1 ? '#374151' : '#d1d5db'} />
            </button>
            <span style={{ minWidth: 52, textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#374151' }}>{page} / {totalPages || 1}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              style={{ width: 28, height: 28, borderRadius: 8, border: '1.5px solid #e5e7eb', background: 'white', cursor: page < totalPages ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronRight size={13} color={page < totalPages ? '#374151' : '#d1d5db'} />
            </button>
          </div>
        </div>
      </div>

      {showRegister   && <RegisterModal onClose={() => setShowRegister(false)}   onSuccess={() => setShowRegister(false)} />}
      {showCategories && <CategoriesModal onClose={() => setShowCategories(false)} />}
    </div>
  );
}
