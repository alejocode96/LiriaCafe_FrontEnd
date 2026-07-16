import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart, Search, Lock, CheckCircle,
  Loader2, PackageOpen, ShoppingBag, X, AlertCircle, ArrowLeft, Printer, ChevronLeft,
} from 'lucide-react';
import { useMobile } from '../../hooks/useMobile';
import toast from 'react-hot-toast';
import { useCashStatus } from '../../hooks/useCashRegister';
import { useCategories } from '../../hooks/useCategories';
import { useProducts, useProductById } from '../../hooks/useProducts';
import { useCreateSale } from '../../hooks/useSales';
import { useConfig } from '../../hooks/useConfig';

const GLASS = {
  background: 'rgba(204,204,204,0.22)',
  backdropFilter: 'blur(28px) saturate(1.8)',
  WebkitBackdropFilter: 'blur(28px) saturate(1.8)',
};

const CAT_PARAMS = { estado: 'ACTIVO', limit: 100 };

const TABLES = Array.from({ length: 9 }, (_, i) => ({
  id: String(i + 1),
  nombre: `Mesa ${i + 1}`,
}));

function formatCOP(n) {
  if (n == null || isNaN(n)) return '$0';
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n);
}

function getElapsed(isoStr) {
  if (!isoStr) return '';
  const mins = Math.floor((Date.now() - new Date(isoStr).getTime()) / 60000);
  if (mins < 1) return 'recién';
  if (mins < 60) return `${mins}min`;
  const h = Math.floor(mins / 60), r = mins % 60;
  return r > 0 ? `${h}h ${r}m` : `${h}h`;
}

let _uid = 0;
function mkCartItem(product, variant = null) {
  const precio = variant ? product.precioBase + (variant.precioDiferencial ?? 0) : product.precioBase;
  return {
    _id: `ci_${++_uid}`,
    productoId: product.id, varianteId: variant?.id ?? null,
    nombre: product.nombre, varianteNombre: variant?.nombre ?? null,
    precio, cantidad: 1, descuento: 0,
  };
}

// ── VariantModal ──────────────────────────────────────────────────────────────
function VariantModal({ product, onSelect, onClose }) {
  const { data: full, isLoading } = useProductById(product?.id);
  const variants = useMemo(() => (full?.variantes ?? []).filter(v => v.estado === 'ACTIVO'), [full]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.30)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 380, background: 'white', borderRadius: 20, border: '1px solid #e5e7eb', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#111827', fontFamily: "'Syne',sans-serif" }}>{product.nombre}</h3>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#9ca3af' }}>Selecciona una variante</p>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: '#f3f4f6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <X size={13} color="#6b7280" />
          </button>
        </div>
        <div style={{ padding: 8, maxHeight: 320, overflowY: 'auto', scrollbarWidth: 'thin' }}>
          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}><Loader2 size={20} className="animate-spin" style={{ color: '#9ca3af' }} /></div>
          ) : variants.length === 0 ? (
            <p style={{ textAlign: 'center', fontSize: 13, color: '#9ca3af', padding: '24px 0', margin: 0 }}>Sin variantes activas</p>
          ) : variants.map(v => {
            const precio = product.precioBase + (v.precioDiferencial ?? 0);
            const disp = v.disponible !== false;
            return (
              <button key={v.id} onClick={() => disp && onSelect(product, v)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 10, border: 'none', background: 'transparent', cursor: disp ? 'pointer' : 'not-allowed', opacity: disp ? 1 : 0.45, textAlign: 'left', transition: 'background 120ms' }}
                onMouseEnter={e => { if (disp) e.currentTarget.style.background = 'rgba(85,98,74,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block' }}>{v.nombre}</span>
                  {!disp && <span style={{ fontSize: 10, color: '#dc2626' }}>Sin stock</span>}
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#55624a', fontFamily: "'Syne',sans-serif", flexShrink: 0 }}>{formatCOP(precio)}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── SaleResultModal ───────────────────────────────────────────────────────────
function SaleResultModal({ result, tableName, onNueva, onVerFactura }) {
  const cambio = result?.cambio ?? result?.resumen?.cambioADevolver ?? 0;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.30)', backdropFilter: 'blur(4px)' }}>
      <div style={{ width: '100%', maxWidth: 380, background: 'white', borderRadius: 20, border: '1px solid #e5e7eb', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', padding: 24 }}>
        <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: '#dcfce7', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={20} color="#16a34a" />
          </div>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: '#111827', fontFamily: "'Syne',sans-serif" }}>
              Venta #{result?.numero ?? '—'} registrada
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
              {tableName} · Total: <strong style={{ color: '#374151' }}>{formatCOP(result?.total)}</strong>
            </p>
          </div>
        </div>
        {cambio > 0 && (
          <div style={{ textAlign: 'center', padding: '16px 20px', background: '#f0fdf4', borderRadius: 14, border: '1px solid #bbf7d0', marginBottom: 20 }}>
            <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cambio a devolver</p>
            <p style={{ margin: 0, fontSize: 32, fontWeight: 800, color: '#15803d', fontFamily: "'Syne',sans-serif" }}>{formatCOP(cambio)}</p>
          </div>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onNueva} style={{ flex: 1, height: 40, borderRadius: 10, border: '1.5px solid #e5e7eb', background: 'white', color: '#6b7280', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Syne',sans-serif" }}>Volver a mesas</button>
          <button onClick={onVerFactura} style={{ flex: 2, height: 40, borderRadius: 10, border: 'none', background: '#55624a', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Syne',sans-serif" }}>Ver factura</button>
        </div>
      </div>
    </div>
  );
}

// ── ProductCard ───────────────────────────────────────────────────────────────
function ProductCard({ product, onAdd }) {
  const disp = product.disponible !== false;
  const [imgErr, setImgErr] = useState(false);
  return (
    <div onClick={() => disp && onAdd(product)} role="button" tabIndex={disp ? 0 : -1}
      style={{ borderRadius: 12, border: '1px solid rgba(0,0,0,0.07)', background: 'white', overflow: 'hidden', cursor: disp ? 'pointer' : 'not-allowed', opacity: disp ? 1 : 0.5, userSelect: 'none', transition: 'box-shadow 150ms, transform 150ms' }}
      onMouseEnter={e => { if (disp) { e.currentTarget.style.boxShadow = '0 4px 14px rgba(85,98,74,0.18)'; e.currentTarget.style.transform = 'translateY(-2px)'; } }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}>
      <div style={{ height: 72, background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        {product.imagenUrl && !imgErr
          ? <img src={product.imagenUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setImgErr(true)} />
          : <span style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(85,98,74,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#55624a', fontFamily: "'Syne',sans-serif" }}>{product.nombre.charAt(0).toUpperCase()}</span>}
        <div style={{ position: 'absolute', top: 5, right: 5, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
          {!disp && <span style={{ fontSize: 8, fontWeight: 700, padding: '2px 5px', borderRadius: 999, background: '#fee2e2', color: '#dc2626' }}>Sin stock</span>}
          {product.tieneVariantes && disp && <span style={{ fontSize: 8, fontWeight: 700, padding: '2px 5px', borderRadius: 999, background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }}>Variantes</span>}
        </div>
      </div>
      <div style={{ padding: '6px 8px 8px' }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.nombre}</p>
        <p style={{ margin: '2px 0 0', fontSize: 12, fontWeight: 700, color: '#55624a', fontFamily: "'Syne',sans-serif" }}>{formatCOP(product.precioBase)}</p>
      </div>
    </div>
  );
}

// ── TableCard ─────────────────────────────────────────────────────────────────
function TableCard({ table, state, onClick }) {
  const cart = state?.cart ?? [];
  const isOcupada = cart.length > 0;
  const itemCount = cart.reduce((s, i) => s + i.cantidad, 0);
  const subtotal = cart.reduce((s, i) => s + i.precio * i.cantidad - i.descuento, 0);
  const total = Math.max(0, subtotal - (parseFloat(state?.descuentoTotal || 0) || 0));
  const elapsed = state?.openedAt ? getElapsed(state.openedAt) : '';

  const cfg = isOcupada
    ? { tableBg: '#fff1f2', tableBorder: '#fca5a5', tableGlow: 'rgba(239,68,68,0.16)', chairBg: '#fee2e2', chairBorder: '#fca5a5', textColor: '#dc2626', dotColor: '#ef4444' }
    : { tableBg: '#f0fdf4', tableBorder: '#86efac', tableGlow: 'rgba(34,197,94,0.14)', chairBg: '#dcfce7', chairBorder: '#86efac', textColor: '#15803d', dotColor: '#22c55e' };

  const Chair = ({ horiz }) => (
    <div style={{
      width: horiz ? 10 : 26, height: horiz ? 26 : 10,
      borderRadius: 4, flexShrink: 0,
      background: cfg.chairBg, border: `1.5px solid ${cfg.chairBorder}`,
      transition: 'background 200ms, border-color 200ms',
    }} />
  );

  return (
    <div onClick={onClick} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, cursor: 'pointer', userSelect: 'none', padding: '4px 10px' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}><Chair /><Chair /></div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, width: '100%' }}>
        <Chair horiz />
        <div
          style={{ flex: 1, height: 90, borderRadius: 14, background: cfg.tableBg, border: `2px solid ${cfg.tableBorder}`, boxShadow: `0 4px 16px ${cfg.tableGlow}, 0 1px 4px rgba(0,0,0,0.06)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, padding: '10px 8px', position: 'relative', overflow: 'hidden', transition: 'transform 220ms cubic-bezier(0.34,1.56,0.64,1), box-shadow 220ms' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = `0 10px 28px ${cfg.tableGlow}, 0 2px 8px rgba(0,0,0,0.12)`; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = `0 4px 16px ${cfg.tableGlow}, 0 1px 4px rgba(0,0,0,0.06)`; }}
        >
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 30% 28%, rgba(255,255,255,0.70) 0%, transparent 58%)', pointerEvents: 'none', borderRadius: 'inherit' }} />
          <div style={{ position: 'absolute', top: 7, right: 8, width: 7, height: 7, borderRadius: '50%', background: cfg.dotColor, boxShadow: `0 0 0 2.5px ${cfg.dotColor}30` }} />
          <span style={{ fontSize: 24, fontWeight: 900, color: cfg.textColor, fontFamily: "'Syne',sans-serif", lineHeight: 1 }}>{table.id}</span>
          <span style={{ fontSize: 10, fontWeight: 600, color: cfg.textColor, opacity: 0.60, lineHeight: 1 }}>{table.nombre}</span>
          {isOcupada && (
            <div style={{ background: 'rgba(0,0,0,0.07)', borderRadius: 6, padding: '2px 8px', marginTop: 2 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: cfg.textColor, fontFamily: "'Syne',sans-serif" }}>{formatCOP(total)}</span>
            </div>
          )}
          {!isOcupada && <span style={{ fontSize: 9, color: cfg.textColor, opacity: 0.50, fontWeight: 600, marginTop: 2, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Libre</span>}
          {isOcupada && <span style={{ fontSize: 9, color: cfg.textColor, opacity: 0.50, lineHeight: 1 }}>{itemCount} ítem{itemCount !== 1 ? 's' : ''}{elapsed ? ` · ${elapsed}` : ''}</span>}
        </div>
        <Chair horiz />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}><Chair /><Chair /></div>
    </div>
  );
}

// ── printReceipt ──────────────────────────────────────────────────────────────
function printReceipt({ result, cartSnapshot, tableName, metodoPago, mEfect, mTransf, descTotalNum, negocio }) {
  const cambio  = result?.cambio ?? result?.resumen?.cambioADevolver ?? 0;
  const total   = result?.total ?? 0;
  const numero  = result?.numero ?? '—';
  const now     = new Date();
  const fecha   = now.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const hora    = now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

  const fmtCOP = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n ?? 0);

  const itemsHTML = cartSnapshot.map(i => {
    const lineTotal = i.precio * i.cantidad - (i.descuento || 0);
    const nombre    = i.varianteNombre ? `${i.nombre} (${i.varianteNombre})` : i.nombre;
    const truncated = nombre.length > 22 ? nombre.slice(0, 21) + '…' : nombre;
    return `
      <tr>
        <td style="padding:1.5mm 0 0.5mm">
          <div style="font-size:8.5pt;font-weight:600">${truncated}</div>
          <div style="display:flex;justify-content:space-between;font-size:8pt;color:#444">
            <span>${i.cantidad} \xd7 ${fmtCOP(i.precio)}</span>
            <span style="font-weight:700">${fmtCOP(lineTotal)}</span>
          </div>
          ${i.descuento > 0 ? `<div style="font-size:7.5pt;color:#888">Desc: -${fmtCOP(i.descuento)}</div>` : ''}
        </td>
      </tr>`;
  }).join('');

  const subtotal     = cartSnapshot.reduce((s, i) => s + i.precio * i.cantidad - (i.descuento || 0), 0);
  const metodoLabel  = { EFECTIVO: 'Efectivo', TRANSFERENCIA: 'Transferencia', COMBINADO: 'Combinado' }[metodoPago] ?? metodoPago;
  const logoAbsUrl   = window.location.origin + '/Logo.png';

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Factura #${numero}</title>
<style>
  @page { size: 58mm auto; margin: 3mm 4mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Courier New', Courier, monospace; font-size: 9pt; width: 50mm; color: #000; }
  .c  { text-align: center; }
  .b  { font-weight: bold; }
  .sm { font-size: 7.5pt; }
  .xs { font-size: 7pt; }
  .lg { font-size: 14pt; letter-spacing: 0.03em; }
  hr  { border: none; border-top: 1px dashed #000; margin: 2.5mm 0; }
  .solid { border-top: 1.5px solid #000; margin: 2.5mm 0; }
  table { width: 100%; border-collapse: collapse; }
  td { vertical-align: top; }
  .kv { display: flex; justify-content: space-between; gap: 2mm; padding: 0.8mm 0; font-size: 8.5pt; }
  .kv .k { flex: 1; }
  .kv .v { flex-shrink: 0; font-weight: 600; }
  .logo { display: block; margin: 0 auto 2mm; height: 18mm; max-width: 44mm; object-fit: contain; }
</style>
</head>
<body>

<img src="${logoAbsUrl}" class="logo" onerror="this.style.display='none'" />
<div class="c b lg">${negocio.nombre || 'Liria Caf\xe9'}</div>
${negocio.telefono ? `<div class="c sm" style="margin-top:1mm">Tel: ${negocio.telefono}</div>` : ''}

<hr>

<div class="kv"><span class="k">Factura #</span><span class="v">${numero}</span></div>
<div class="kv"><span class="k">Fecha</span><span class="v">${fecha} ${hora}</span></div>
<div class="kv"><span class="k">Mesa</span><span class="v">${tableName}</span></div>

<hr>

<table>${itemsHTML}</table>

<div class="solid"></div>

<div class="kv sm"><span class="k">Subtotal</span><span class="v">${fmtCOP(subtotal)}</span></div>
${descTotalNum > 0 ? `<div class="kv sm"><span class="k">Descuento</span><span class="v">-${fmtCOP(descTotalNum)}</span></div>` : ''}
<div class="kv b" style="font-size:11pt;margin-top:1mm"><span class="k">TOTAL</span><span class="v">${fmtCOP(total)}</span></div>

<hr>

<div class="kv sm"><span class="k">Pago</span><span class="v">${metodoLabel}</span></div>
${metodoPago === 'EFECTIVO' ? `<div class="kv sm"><span class="k">Recibido</span><span class="v">${fmtCOP(mEfect)}</span></div>` : ''}
${metodoPago === 'COMBINADO' ? `<div class="kv sm"><span class="k">Efectivo</span><span class="v">${fmtCOP(mEfect)}</span></div><div class="kv sm"><span class="k">Transferencia</span><span class="v">${fmtCOP(mTransf)}</span></div>` : ''}
${cambio > 0 ? `<div class="kv b sm" style="color:#166534"><span class="k">Cambio</span><span class="v">${fmtCOP(cambio)}</span></div>` : ''}

<hr>

<div class="c b" style="font-size:9.5pt">&#161;Gracias por su visita!</div>
<div class="c sm" style="margin-top:1.5mm">Esperamos verte pronto ☕</div>
<div class="c xs" style="margin-top:4mm;color:#555">${fecha} &mdash; ${hora}</div>

<script>
  window.onload = function () {
    var img = document.querySelector('img.logo');
    var proceed = function () { window.print(); setTimeout(function () { window.close(); }, 900); };
    if (img && !img.complete) { img.onload = proceed; img.onerror = proceed; } else { proceed(); }
  };
</script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=320,height=640,toolbar=0,menubar=0,scrollbars=1');
  if (win) { win.document.write(html); win.document.close(); }
}

// ── POSPage ───────────────────────────────────────────────────────────────────
export default function POSPage() {
  const navigate = useNavigate();
  const isMobile = useMobile();

  // ── Navigation
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [showCart, setShowCart] = useState(false);

  // ── Table states persisted to localStorage
  const [tableStates, setTableStates] = useState(() => {
    try { const s = localStorage.getItem('pos_tables_v1'); if (s) return JSON.parse(s); } catch {}
    return {};
  });

  useEffect(() => {
    try { localStorage.setItem('pos_tables_v1', JSON.stringify(tableStates)); } catch {}
  }, [tableStates]);

  // ── POS UI state
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch]           = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [variantModal, setVariantModal] = useState(null);
  const [saleResult, setSaleResult]     = useState(null);
  const [metodoPago, setMetodoPago]     = useState('EFECTIVO');
  const [montoEfect, setMontoEfect]     = useState('');
  const [montoTransf, setMontoTransf]   = useState('');
  const [showCliente, setShowCliente]   = useState(false);
  const [clienteNombre, setClienteN]    = useState('');
  const [clienteNit, setClienteNit]     = useState('');
  const [printEnabled, setPrintEnabled] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // ── Queries
  const { data: cashStatus } = useCashStatus();
  const { data: rawConfig }  = useConfig();
  const { data: catsRaw }    = useCategories(CAT_PARAMS);
  const categories            = useMemo(() => catsRaw?.data ?? [], [catsRaw]);

  const productParams = useMemo(() => ({
    estado: 'ACTIVO', limit: 100,
    ...(categoriaId   ? { categoriaId }           : {}),
    ...(search.trim() ? { buscar: search.trim() } : {}),
  }), [categoriaId, search]);

  const { data: prodsRaw, isLoading: isLoadingProds, isFetching: isFetchingProds } = useProducts(productParams);
  const products = useMemo(() => prodsRaw?.data ?? [], [prodsRaw]);

  const createSale = useCreateSale();

  // ── Current table state
  const currentTState = tableStates[selectedTableId ?? ''] ?? { cart: [], descuentoTotal: '', openedAt: null };
  const cart           = currentTState.cart;
  const descuentoTotal = currentTState.descuentoTotal ?? '';

  // ── Totals
  const subtotal     = useMemo(() => cart.reduce((s, i) => s + i.precio * i.cantidad - i.descuento, 0), [cart]);
  const descTotalNum = Math.max(0, parseFloat(descuentoTotal) || 0);
  const total        = Math.max(0, subtotal - descTotalNum);
  const mEfect       = parseFloat(montoEfect)  || 0;
  const mTransf      = parseFloat(montoTransf) || 0;
  const cambio       = mEfect - total;

  const pagoOK = metodoPago === 'TRANSFERENCIA'
    ? true
    : metodoPago === 'EFECTIVO'
    ? mEfect >= total && mEfect > 0
    : (mEfect + mTransf) >= total && (mEfect + mTransf) > 0;

  const canSell = cart.length > 0 && pagoOK && !createSale.isPending;

  // ── Table state helpers
  const patchTable = (tid, patch) => {
    setTableStates(prev => {
      const cur = prev[tid] ?? { cart: [], descuentoTotal: '', openedAt: null };
      return { ...prev, [tid]: { ...cur, ...patch } };
    });
  };

  const patchTableCart = (tid, cartUpdater) => {
    setTableStates(prev => {
      const cur = prev[tid] ?? { cart: [], descuentoTotal: '', openedAt: null };
      const newCart = typeof cartUpdater === 'function' ? cartUpdater(cur.cart) : cartUpdater;
      return { ...prev, [tid]: { ...cur, cart: newCart, openedAt: cur.openedAt ?? new Date().toISOString() } };
    });
  };

  // ── Cart handlers
  const addToCart = (product, variant = null) => {
    if (!selectedTableId) return;
    const tid = selectedTableId;
    const matchKey = `${product.id}_${variant?.id ?? 'none'}`;
    patchTableCart(tid, prev => {
      const idx = prev.findIndex(i => `${i.productoId}_${i.varianteId ?? 'none'}` === matchKey);
      if (idx >= 0) return prev.map((i, k) => k === idx ? { ...i, cantidad: i.cantidad + 1 } : i);
      return [...prev, mkCartItem(product, variant)];
    });
  };

  const handleProductClick = (product) => {
    if (product.tieneVariantes) { setVariantModal(product); return; }
    addToCart(product);
  };

  const updateItem = (id, field, value) => {
    if (!selectedTableId) return;
    const tid = selectedTableId;
    patchTableCart(tid, prev => prev.map(i => {
      if (i._id !== id) return i;
      if (field === 'cantidad') return { ...i, cantidad: Math.max(1, parseInt(value) || 1) };
      if (field === 'descuento') return { ...i, descuento: Math.max(0, parseFloat(value) || 0) };
      return i;
    }));
  };

  const removeItem = (id) => {
    if (!selectedTableId) return;
    patchTableCart(selectedTableId, prev => prev.filter(i => i._id !== id));
  };

  const clearCart = () => {
    if (!selectedTableId) return;
    patchTable(selectedTableId, { cart: [], descuentoTotal: '', openedAt: null });
  };

  const setDesc = (val) => {
    if (!selectedTableId) return;
    patchTable(selectedTableId, { descuentoTotal: val });
  };

  // ── Navigation handlers
  const selectTable = (tableId) => {
    setSelectedTableId(tableId);
    setShowCart(false);
    setSearchInput(''); setSearch(''); setCategoriaId('');
    setMetodoPago('EFECTIVO'); setMontoEfect(''); setMontoTransf('');
    setClienteN(''); setClienteNit(''); setShowCliente(false);
  };

  const handleSave = () => setSelectedTableId(null);

  // ── Sell
  const resetPayment = () => {
    setMontoEfect(''); setMontoTransf('');
    setClienteN(''); setClienteNit('');
    setMetodoPago('EFECTIVO'); setShowCliente(false);
  };

  const handleSell = () => {
    if (!canSell || !selectedTableId) return;
    const tid          = selectedTableId;
    const cartSnapshot = [...cart];
    const items = cart.map(i => ({
      productoId: i.productoId,
      ...(i.varianteId ? { varianteId: i.varianteId } : {}),
      cantidad: i.cantidad, descuento: i.descuento || 0,
    }));
    const payload = {
      items, descuentoTotal: descTotalNum, metodoPago,
      ...(metodoPago === 'EFECTIVO'      ? { montoEfectivo: mEfect } : {}),
      ...(metodoPago === 'TRANSFERENCIA' ? { montoTransferencia: total } : {}),
      ...(metodoPago === 'COMBINADO'     ? { montoEfectivo: mEfect, montoTransferencia: mTransf } : {}),
      ...(clienteNombre ? { clienteNombre } : {}),
      ...(clienteNit    ? { clienteNit    } : {}),
    };
    createSale.mutate(payload, {
      onSuccess: (res) => {
        const result = res.data?.data ?? res.data ?? {};
        setSaleResult(result);
        patchTable(tid, { cart: [], descuentoTotal: '', openedAt: null });
        resetPayment();
        if (printEnabled) {
          const cfg = rawConfig?.data ?? rawConfig ?? {};
          printReceipt({
            result,
            cartSnapshot,
            tableName: TABLES.find(t => t.id === tid)?.nombre ?? `Mesa ${tid}`,
            metodoPago, mEfect, mTransf, descTotalNum,
            negocio: {
              nombre:   cfg.nombreNegocio ?? cfg.nombre ?? 'Liria Café',
              telefono: cfg.telefono ?? '',
            },
          });
        }
      },
      onError: (err) => toast.error(err?.message ?? 'Error al procesar la venta'),
    });
  };

  const isBlocked = cashStatus?.hayTCajaAbierta === false;
  const selectedTable = TABLES.find(t => t.id === selectedTableId) ?? null;
  const occupiedCount = TABLES.filter(t => (tableStates[t.id]?.cart?.length ?? 0) > 0).length;
  const totalItemsInCart = cart.reduce((s, i) => s + i.cantidad, 0);

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="w-full h-full overflow-hidden flex flex-col">
      <style>{`.pos-cat-strip::-webkit-scrollbar{display:none}`}</style>

      {/* ── Chrome tab ── */}
      <div className="flex items-end shrink-0">
        <div
          className="relative flex items-center gap-2 px-4 h-10 border border-b-0 border-white/40 shrink-0"
          style={{ width: selectedTableId ? 'min(60%, 540px)' : 'min(50%, 420px)', ...GLASS, borderRadius: '10px 10px 0 0' }}
        >
          {selectedTableId ? (
            <>
              <button onClick={handleSave} style={{ width: 24, height: 24, borderRadius: 7, border: '1px solid rgba(0,0,0,0.10)', background: 'rgba(0,0,0,0.03)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ArrowLeft size={11} color="#6b7280" />
              </button>
              <div style={{ width: 1, height: 16, background: 'rgba(0,0,0,0.12)', flexShrink: 0 }} />
              <ShoppingCart size={13} style={{ color: '#55624a', flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#374151', fontFamily: "'Syne',sans-serif", flexShrink: 0 }}>{selectedTable?.nombre}</span>
              {totalItemsInCart > 0 && (
                <span style={{ fontSize: 11, color: '#9ca3af', flexShrink: 0 }}>· {totalItemsInCart} ítem{totalItemsInCart !== 1 ? 's' : ''}</span>
              )}
              {isFetchingProds && !isLoadingProds && <Loader2 size={11} className="animate-spin" style={{ color: '#8c916c' }} />}
            </>
          ) : (
            <>
              <ShoppingCart size={13} style={{ color: '#55624a', flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#374151', fontFamily: "'Syne',sans-serif" }}>Punto de Venta</span>
              {occupiedCount > 0 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 3, height: 18, padding: '0 7px', borderRadius: 6, fontSize: 9, fontWeight: 700, background: '#dcfce7', color: '#15803d', flexShrink: 0 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
                  {occupiedCount} ocupada{occupiedCount !== 1 ? 's' : ''}
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

      {/* ── Glass body ── */}
      <div className="flex-1 overflow-hidden rounded-b-2xl rounded-tr-2xl" style={{ ...GLASS, display: 'flex', flexDirection: 'column' }}>

        {/* ════ TABLE GRID VIEW ════ */}
        {!selectedTableId && (
          <>
            {/* Header */}
            <div style={{ margin: '8px 4px 0', background: 'white', borderRadius: '14px 14px 0 0', padding: '12px 18px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#374151', fontFamily: "'Syne',sans-serif" }}>Mesas</p>
                <p style={{ margin: '1px 0 0', fontSize: 12, color: '#9ca3af' }}>
                  {occupiedCount === 0 ? 'Todas disponibles' : `${occupiedCount} ocupada${occupiedCount !== 1 ? 's' : ''} · ${TABLES.length - occupiedCount} libre${TABLES.length - occupiedCount !== 1 ? 's' : ''}`}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#9ca3af' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#e5e7eb', display: 'inline-block' }} />Libre
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#15803d' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />Ocupada
                </span>
              </div>
            </div>

            {/* Table grid */}
            <div style={{ flex: 1, background: 'white', margin: '0 4px', overflowY: 'auto', scrollbarWidth: 'thin', padding: '16px 18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))', gap: 18 }}>
                {TABLES.map(table => (
                  <TableCard
                    key={table.id}
                    table={table}
                    state={tableStates[table.id]}
                    onClick={() => selectTable(table.id)}
                  />
                ))}
              </div>
            </div>

            {/* Footer */}
            <div style={{ margin: '0 4px 4px', background: 'white', borderRadius: '0 0 14px 14px', padding: '8px 18px', flexShrink: 0, borderTop: '1px solid rgba(0,0,0,0.05)' }}>
              <p style={{ margin: 0, fontSize: 11, color: '#9ca3af', textAlign: 'center' }}>Toca una mesa para comenzar a tomar el pedido</p>
            </div>
          </>
        )}

        {/* ════ ORDER VIEW ════ */}
        {selectedTableId && (
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative', flexDirection: 'row' }}>

            {/* Mobile cart toggle FAB */}
            {isMobile && (
              <button
                onClick={() => setShowCart(v => !v)}
                style={{
                  position: 'absolute', bottom: 16,
                  right: showCart ? 'auto' : 16,
                  left: showCart ? 16 : 'auto',
                  zIndex: 20,
                  height: 44, padding: '0 18px',
                  borderRadius: 22, border: 'none',
                  background: showCart ? '#374151' : '#55624a',
                  color: 'white', fontSize: 13, fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 7,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.22)',
                  transition: 'background 150ms',
                }}
              >
                {showCart ? (
                  <><ChevronLeft size={16} /> Productos</>
                ) : (
                  <><ShoppingCart size={15} />{totalItemsInCart > 0 ? `Carrito (${totalItemsInCart})` : 'Carrito'}</>
                )}
              </button>
            )}

            {/* No-caja overlay */}
            {isBlocked && (
              <div style={{ position: 'absolute', inset: 0, zIndex: 100, background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, borderRadius: '0 16px 16px 16px' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fef2f2', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Lock size={22} color="#dc2626" />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: '#111827', fontFamily: "'Syne',sans-serif" }}>Caja no activa</h3>
                  <p style={{ margin: '0 0 20px', fontSize: 13, color: '#6b7280' }}>Abre la caja antes de comenzar a vender</p>
                  <button onClick={() => navigate('/caja')} style={{ height: 40, padding: '0 24px', borderRadius: 10, border: 'none', background: '#55624a', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Syne',sans-serif" }}>
                    Ir a abrir caja →
                  </button>
                </div>
              </div>
            )}

            {/* Left panel: category tabs + search + product grid */}
            <div style={{ flex: 1, minWidth: 0, margin: '8px 2px 4px 4px', borderRadius: 14, background: 'white', display: isMobile && showCart ? 'none' : 'flex', flexDirection: 'column', overflow: 'hidden' }}>

              {/* Category tabs */}
              <div className="pos-cat-strip" style={{ overflowX: 'auto', scrollbarWidth: 'none', display: 'flex', gap: 6, padding: '8px 12px', borderBottom: '1px solid rgba(0,0,0,0.05)', flexShrink: 0 }}>
                {[{ id: '', nombre: 'Todos' }, ...categories].map(cat => {
                  const active = categoriaId === cat.id;
                  return (
                    <button key={cat.id} onClick={() => setCategoriaId(cat.id)} style={{ flexShrink: 0, height: 30, padding: '0 12px', borderRadius: 8, border: `1.5px solid ${active ? '#55624a' : 'rgba(0,0,0,0.07)'}`, background: active ? 'rgba(85,98,74,0.1)' : 'rgba(0,0,0,0.02)', color: active ? '#55624a' : '#6b7280', fontSize: 12, fontWeight: active ? 700 : 500, cursor: 'pointer', fontFamily: "'Syne',sans-serif", whiteSpace: 'nowrap', transition: 'all 150ms' }}>
                      {cat.nombre}
                    </button>
                  );
                })}
              </div>

              {/* Search bar */}
              <div style={{ padding: '8px 12px', flexShrink: 0, borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                  <input value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Buscar producto…"
                    style={{ width: '100%', height: 30, padding: '0 10px 0 28px', borderRadius: 9, fontSize: 12, border: '1.5px solid #e5e7eb', outline: 'none', background: '#f9fafb', color: '#374151', boxSizing: 'border-box', transition: 'border-color 150ms, background 150ms' }}
                    onFocus={e => { e.target.style.borderColor = '#55624a'; e.target.style.background = 'white'; }}
                    onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#f9fafb'; }}
                  />
                </div>
              </div>

              {/* Product grid */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px 12px', scrollbarWidth: 'thin' }}>
                {isLoadingProds ? (
                  <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 50 }}><Loader2 size={22} className="animate-spin" style={{ color: '#9ca3af' }} /></div>
                ) : products.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 50, gap: 8 }}>
                    <PackageOpen size={28} style={{ color: '#d1d5db' }} />
                    <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>Sin productos</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(118px, 1fr))', gap: 9 }}>
                    {products.map(p => <ProductCard key={p.id} product={p} onAdd={handleProductClick} />)}
                  </div>
                )}
              </div>
            </div>

            {/* Right panel: cart */}
            <div style={{ width: isMobile ? '100%' : 300, flexShrink: isMobile ? undefined : 0, margin: '8px 4px 4px 2px', borderRadius: 14, background: 'white', display: isMobile && !showCart ? 'none' : 'flex', flexDirection: 'column', overflow: 'hidden' }}>

              {/* Cart header */}
              <div style={{ padding: '10px 14px 8px', flexShrink: 0, borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <ShoppingBag size={13} style={{ color: '#55624a' }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#374151', fontFamily: "'Syne',sans-serif" }}>{selectedTable?.nombre}</span>
                  {totalItemsInCart > 0 && (
                    <span style={{ minWidth: 18, height: 18, borderRadius: 999, padding: '0 5px', background: '#55624a', color: 'white', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {totalItemsInCart}
                    </span>
                  )}
                </div>
                {cart.length > 0 && (
                  <button onClick={clearCart} style={{ fontSize: 11, fontWeight: 600, color: '#ef4444', border: 'none', background: 'transparent', cursor: 'pointer', padding: '2px 4px' }}>Limpiar</button>
                )}
              </div>

              {/* Cart items */}
              <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'thin' }}>
                {cart.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 52, gap: 8 }}>
                    <ShoppingCart size={28} style={{ color: '#e5e7eb' }} />
                    <p style={{ fontSize: 12, color: '#d1d5db', margin: 0 }}>Carrito vacío</p>
                  </div>
                ) : cart.map(item => (
                  <div key={item._id} style={{ padding: '9px 14px', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 5 }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.nombre}</p>
                        {item.varianteNombre && <p style={{ margin: '1px 0 0', fontSize: 10, color: '#9ca3af' }}>{item.varianteNombre}</p>}
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginLeft: 8, flexShrink: 0 }}>
                        {formatCOP(item.precio * item.cantidad - item.descuento)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <button onClick={() => item.cantidad > 1 ? updateItem(item._id, 'cantidad', item.cantidad - 1) : removeItem(item._id)}
                        style={{ width: 22, height: 22, borderRadius: 6, border: '1.5px solid #e5e7eb', background: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, flexShrink: 0 }}>−</button>
                      <span style={{ width: 22, textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#374151', flexShrink: 0 }}>{item.cantidad}</span>
                      <button onClick={() => updateItem(item._id, 'cantidad', item.cantidad + 1)}
                        style={{ width: 22, height: 22, borderRadius: 6, border: '1.5px solid #e5e7eb', background: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, flexShrink: 0 }}>+</button>
                      <span style={{ fontSize: 10, color: '#9ca3af' }}>@{formatCOP(item.precio)}</span>
                      <button onClick={() => removeItem(item._id)} style={{ marginLeft: 'auto', width: 20, height: 20, borderRadius: 6, border: 'none', background: '#fef2f2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <X size={10} color="#ef4444" />
                      </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
                      <span style={{ fontSize: 10, color: '#d1d5db', flexShrink: 0 }}>Desc $</span>
                      <input type="number" min="0" step="100" value={item.descuento || ''} onChange={e => updateItem(item._id, 'descuento', e.target.value)} placeholder="0"
                        style={{ width: 64, height: 18, padding: '0 5px', fontSize: 10, borderRadius: 5, outline: 'none', textAlign: 'right', border: '1px solid #e5e7eb', color: '#374151', boxSizing: 'border-box' }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom: totals + payment */}
              {cart.length > 0 && (
                <div style={{ flexShrink: 0, borderTop: '1.5px solid rgba(0,0,0,0.06)', padding: '10px 14px 12px', overflowY: 'auto', scrollbarWidth: 'thin', maxHeight: '52%' }}>

                  {/* Additional discount */}
                  <div style={{ marginBottom: 8 }}>
                    <label style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', display: 'block', marginBottom: 3 }}>Descuento adicional ($)</label>
                    <input type="number" min="0" step="100" value={descuentoTotal} onChange={e => setDesc(e.target.value)} placeholder="0"
                      style={{ width: '100%', height: 28, padding: '0 8px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 12, outline: 'none', boxSizing: 'border-box', color: '#374151', transition: 'border-color 150ms' }}
                      onFocus={e => { e.target.style.borderColor = '#55624a'; }} onBlur={e => { e.target.style.borderColor = '#e5e7eb'; }} />
                  </div>

                  {/* Totals */}
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9ca3af', marginBottom: 3 }}>
                      <span>Subtotal</span><span>{formatCOP(subtotal)}</span>
                    </div>
                    {descTotalNum > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#dc2626', marginBottom: 3 }}>
                        <span>Descuento</span><span>−{formatCOP(descTotalNum)}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6, borderTop: '1px solid rgba(0,0,0,0.07)' }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#374151', fontFamily: "'Syne',sans-serif" }}>TOTAL</span>
                      <span style={{ fontSize: 15, fontWeight: 800, color: '#55624a', fontFamily: "'Syne',sans-serif" }}>{formatCOP(total)}</span>
                    </div>
                  </div>

                  {/* Payment method */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, marginBottom: 8 }}>
                    {[{ v: 'EFECTIVO', l: 'Efectivo' }, { v: 'TRANSFERENCIA', l: 'Transf.' }, { v: 'COMBINADO', l: 'Comb.' }].map(({ v, l }) => {
                      const active = metodoPago === v;
                      return (
                        <button key={v} onClick={() => setMetodoPago(v)} style={{ height: 28, borderRadius: 7, border: '1.5px solid', borderColor: active ? '#55624a' : '#e5e7eb', background: active ? '#55624a' : 'white', color: active ? 'white' : '#9ca3af', fontSize: 10, fontWeight: 700, cursor: 'pointer', transition: 'all 150ms' }}>{l}</button>
                      );
                    })}
                  </div>

                  {/* Efectivo inputs */}
                  {metodoPago === 'EFECTIVO' && (
                    <div style={{ marginBottom: 8 }}>
                      <label style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', display: 'block', marginBottom: 3 }}>Monto recibido</label>
                      <input type="number" min="0" step="500" value={montoEfect} onChange={e => setMontoEfect(e.target.value)} placeholder={String(total)}
                        style={{ width: '100%', height: 30, padding: '0 8px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 12, outline: 'none', boxSizing: 'border-box', color: '#374151', transition: 'border-color 150ms' }}
                        onFocus={e => { e.target.style.borderColor = '#55624a'; }} onBlur={e => { e.target.style.borderColor = '#e5e7eb'; }} />
                      {mEfect > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 11 }}>
                          <span style={{ color: '#9ca3af' }}>Cambio</span>
                          <span style={{ fontWeight: 700, color: cambio >= 0 ? '#15803d' : '#dc2626' }}>{cambio >= 0 ? formatCOP(cambio) : `−${formatCOP(Math.abs(cambio))}`}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Combinado inputs */}
                  {metodoPago === 'COMBINADO' && (
                    <div style={{ marginBottom: 8 }}>
                      <label style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', display: 'block', marginBottom: 3 }}>Efectivo</label>
                      <input type="number" min="0" step="500" value={montoEfect} onChange={e => setMontoEfect(e.target.value)} placeholder="0"
                        style={{ width: '100%', height: 28, padding: '0 8px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 12, outline: 'none', boxSizing: 'border-box', marginBottom: 5, color: '#374151' }}
                        onFocus={e => { e.target.style.borderColor = '#55624a'; }} onBlur={e => { e.target.style.borderColor = '#e5e7eb'; }} />
                      <label style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', display: 'block', marginBottom: 3 }}>Transferencia</label>
                      <input type="number" min="0" step="500" value={montoTransf} onChange={e => setMontoTransf(e.target.value)} placeholder="0"
                        style={{ width: '100%', height: 28, padding: '0 8px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 12, outline: 'none', boxSizing: 'border-box', color: '#374151' }}
                        onFocus={e => { e.target.style.borderColor = '#55624a'; }} onBlur={e => { e.target.style.borderColor = '#e5e7eb'; }} />
                      {(mEfect + mTransf) > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 11 }}>
                          <span style={{ color: '#9ca3af' }}>Total ingresado</span>
                          <span style={{ fontWeight: 700, color: (mEfect + mTransf) >= total ? '#15803d' : '#dc2626' }}>{formatCOP(mEfect + mTransf)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Cliente toggle */}
                  <button onClick={() => setShowCliente(v => !v)} style={{ width: '100%', height: 24, borderRadius: 7, border: '1px dashed #e5e7eb', background: 'transparent', color: '#9ca3af', fontSize: 10, fontWeight: 600, cursor: 'pointer', marginBottom: showCliente ? 6 : 10 }}>
                    {showCliente ? '− Ocultar datos de cliente' : '+ Datos de cliente (opcional)'}
                  </button>

                  {showCliente && (
                    <div style={{ marginBottom: 10 }}>
                      <input value={clienteNombre} onChange={e => setClienteN(e.target.value)} placeholder="Nombre del cliente"
                        style={{ width: '100%', height: 28, padding: '0 8px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 12, outline: 'none', boxSizing: 'border-box', marginBottom: 5, color: '#374151' }}
                        onFocus={e => { e.target.style.borderColor = '#55624a'; }} onBlur={e => { e.target.style.borderColor = '#e5e7eb'; }} />
                      <input value={clienteNit} onChange={e => setClienteNit(e.target.value)} placeholder="NIT / C.C."
                        style={{ width: '100%', height: 28, padding: '0 8px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 12, outline: 'none', boxSizing: 'border-box', color: '#374151' }}
                        onFocus={e => { e.target.style.borderColor = '#55624a'; }} onBlur={e => { e.target.style.borderColor = '#e5e7eb'; }} />
                    </div>
                  )}

                  {/* Validation hint */}
                  {!pagoOK && metodoPago !== 'TRANSFERENCIA' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
                      <AlertCircle size={11} color="#f59e0b" />
                      <span style={{ fontSize: 10, color: '#f59e0b', fontWeight: 500 }}>
                        {metodoPago === 'EFECTIVO' ? 'Ingresa el monto recibido' : 'La suma debe cubrir el total'}
                      </span>
                    </div>
                  )}

                  {/* Print toggle */}
                  <button
                    onClick={() => setPrintEnabled(v => !v)}
                    style={{
                      width: '100%', height: 34, borderRadius: 9, marginBottom: 7,
                      border: `1.5px solid ${printEnabled ? '#15803d' : '#e5e7eb'}`,
                      background: printEnabled ? '#f0fdf4' : 'rgba(0,0,0,0.02)',
                      color: printEnabled ? '#15803d' : '#9ca3af',
                      fontSize: 11, fontWeight: 700, cursor: 'pointer',
                      fontFamily: "'Syne',sans-serif",
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '0 10px', transition: 'all 180ms',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Printer size={13} />
                      <span>Imprimir factura</span>
                    </div>
                    <div style={{
                      width: 32, height: 18, borderRadius: 9,
                      background: printEnabled ? '#15803d' : '#d1d5db',
                      position: 'relative', flexShrink: 0,
                      transition: 'background 180ms',
                    }}>
                      <div style={{
                        position: 'absolute', top: 2,
                        left: printEnabled ? 16 : 2,
                        width: 14, height: 14, borderRadius: '50%',
                        background: 'white',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                        transition: 'left 180ms',
                      }} />
                    </div>
                  </button>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={handleSave} style={{ flex: 1, height: 40, borderRadius: 10, border: '1.5px solid #e5e7eb', background: 'white', color: '#374151', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Syne',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                      Guardar
                    </button>
                    <button onClick={handleSell} disabled={!canSell} style={{ flex: 2, height: 40, borderRadius: 10, border: 'none', background: canSell ? '#55624a' : '#e5e7eb', color: canSell ? 'white' : '#9ca3af', fontSize: 13, fontWeight: 800, cursor: canSell ? 'pointer' : 'not-allowed', fontFamily: "'Syne',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'background 150ms' }}>
                      {createSale.isPending ? <Loader2 size={15} className="animate-spin" /> : <><ShoppingCart size={13} />Cobrar</>}
                    </button>
                  </div>
                </div>
              )}

              {/* Empty cart actions */}
              {cart.length === 0 && (
                <div style={{ flexShrink: 0, padding: '12px 14px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                  <button onClick={handleSave} style={{ width: '100%', height: 36, borderRadius: 10, border: '1.5px solid #e5e7eb', background: 'white', color: '#9ca3af', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'Syne',sans-serif" }}>
                    ← Volver a mesas
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {variantModal && (
        <VariantModal product={variantModal}
          onSelect={(product, variant) => { addToCart(product, variant); setVariantModal(null); }}
          onClose={() => setVariantModal(null)} />
      )}

      {saleResult && (
        <SaleResultModal
          result={saleResult}
          tableName={selectedTable?.nombre ?? ''}
          onNueva={() => { setSaleResult(null); setSelectedTableId(null); }}
          onVerFactura={() => { setSaleResult(null); setSelectedTableId(null); navigate('/ventas'); }}
        />
      )}
    </div>
  );
}
