// src/components/ingredients/StockMovementModal.jsx
import { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { useStockMovement } from '../../hooks/useIngredients';

const TYPE_META = {
    entrada: {
        label: 'Entrada',
        icon: TrendingUp,
        color: '#003a30',
        bg: 'rgba(0,58,48,0.09)',
        border: 'rgba(0,58,48,0.25)',
        hint: 'Suma la cantidad al stock actual',
    },
    ajuste: {
        label: 'Ajuste',
        icon: RefreshCw,
        color: '#b38600',
        bg: 'rgba(255,193,7,0.15)',
        border: 'rgba(255,193,7,0.50)',
        hint: 'El stock quedará exactamente en esta cantidad',
    },
    perdida: {
        label: 'Pérdida',
        icon: TrendingDown,
        color: '#dc2626',
        bg: 'rgba(220,38,38,0.10)',
        border: 'rgba(220,38,38,0.25)',
        hint: 'Resta la cantidad al stock actual',
    },
};

const EMPTY = { type: 'entrada', quantity: '', reason: '', unit_cost: '' };

export default function StockMovementModal({ open, onClose, ingredient }) {
    const movement = useStockMovement(ingredient?.id);
    const [form, setForm] = useState(EMPTY);
    const [errors, setErrors] = useState({});
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        if (open) {
            setMounted(true);
        } else {
            const t = setTimeout(() => setMounted(false), 300);
            return () => clearTimeout(t);
        }
    }, [open]);

    useEffect(() => {
        if (open) { setForm(EMPTY); setErrors({}); }
    }, [open]);

    const set = (field, value) => {
        setForm(p => ({ ...p, [field]: value }));
        setErrors(p => ({ ...p, [field]: '' }));
    };

    const validate = () => {
        const e = {};
        const qty = Number(form.quantity);
        if (!form.quantity || isNaN(qty) || qty <= 0)
            e.quantity = 'Cantidad inválida';
        if (!form.reason.trim())
            e.reason = 'La razón es obligatoria';
        if (form.unit_cost !== '' && Number(form.unit_cost) < 0)
            e.unit_cost = 'No puede ser negativo';
        return e;
    };

    const handleSubmit = async (ev) => {
        ev.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }

        await movement.mutateAsync({
            type: form.type,
            quantity: Number(form.quantity),
            reason: form.reason.trim(),
            unit_cost: form.unit_cost !== '' ? Number(form.unit_cost) : undefined,
        });
        onClose();
    };

    if (!mounted || !ingredient) return null;

    const meta = TYPE_META[form.type];
    const busy = movement.isPending;

    // Color del botón submit: ajuste usa amarillo oscuro para texto legible en bg amarillo
    const submitBg = busy ? '#e5e7eb' : form.type === 'ajuste' ? '#ffc107' : meta.color;
    const submitColor = busy ? '#9ca3af' : form.type === 'ajuste' ? '#3d2e00' : '#ffffff';

    return (
        <>
            <style>{`
                @keyframes stkSlideIn  { from { transform: translateX(100%); } to { transform: translateX(0); } }
                @keyframes stkSlideOut { from { transform: translateX(0); }    to { transform: translateX(100%); } }
                @keyframes stkFadeIn   { from { opacity: 0; } to { opacity: 1; } }
                @keyframes stkFadeOut  { from { opacity: 1; } to { opacity: 0; } }

                .stk-overlay-in  { animation: stkFadeIn  280ms ease forwards; }
                .stk-overlay-out { animation: stkFadeOut 280ms ease forwards; }
                .stk-panel-in    { animation: stkSlideIn  300ms cubic-bezier(0.32,0.72,0,1) forwards; }
                .stk-panel-out   { animation: stkSlideOut 280ms cubic-bezier(0.32,0.72,0,1) forwards; }

                .stk-input {
                    width: 100%; height: 40px; border-radius: 10px;
                    background: #f9fafb; border: 1px solid #e5e7eb;
                    color: #1f2937; font-size: 13px; padding: 0 12px;
                    outline: none; box-sizing: border-box;
                    transition: border-color 150ms, box-shadow 150ms, background 150ms;
                    font-family: inherit;
                }
                .stk-input:focus {
                    border-color: #8c916c;
                    box-shadow: 0 0 0 3px rgba(140,145,108,0.12);
                    background: #fff;
                }
                .stk-input.has-error { border-color: rgba(220,38,38,0.45); }
                .stk-input.has-error:focus { box-shadow: 0 0 0 3px rgba(220,38,38,0.10); }

                .stk-type-btn {
                    padding: 10px 6px; border-radius: 10px;
                    border: 1px solid #e5e7eb; cursor: pointer;
                    background: #f9fafb;
                    display: flex; flex-direction: column; align-items: center; gap: 5px;
                    transition: all 150ms;
                }
                .stk-type-btn:hover { background: #f3f4f6; }

                .stk-btn-cancel {
                    flex: 1; height: 40px; border-radius: 10px;
                    border: 1px solid #e5e7eb; background: white;
                    color: #6b7280; font-size: 13px; font-weight: 500;
                    cursor: pointer; transition: background 150ms, color 150ms;
                    font-family: inherit;
                }
                .stk-btn-cancel:hover { background: #f9fafb; color: #374151; }

                .stk-close-btn {
                    width: 30px; height: 30px; border-radius: 8px;
                    background: transparent; border: 1px solid #e5e7eb;
                    cursor: pointer; color: #9ca3af; flex-shrink: 0;
                    display: flex; align-items: center; justify-content: center;
                    transition: background 150ms, color 150ms;
                }
                .stk-close-btn:hover { background: #f3f4f6; color: #374151; }
            `}</style>

            {/* Overlay */}
            <div className={open ? 'stk-overlay-in' : 'stk-overlay-out'} onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.18)', backdropFilter: 'blur(2px)', }} />

            {/* Panel lateral */}
            <div className={open ? 'stk-panel-in' : 'stk-panel-out'} style={{ position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 1001, width: '400px', background: '#ffffff', borderLeft: '1px solid #e5e7eb', boxShadow: '-12px 0 40px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', overflow: 'hidden', }}   >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '20px 20px 18px', borderBottom: '1px solid #f3f4f6', flexShrink: 0, }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 200ms', }}>
                        <meta.icon size={16} color={meta.color} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ color: '#111827', fontSize: '15px', fontWeight: 700, margin: 0, fontFamily: "'Syne', sans-serif", letterSpacing: '0.01em', }}>
                            Movimiento de stock
                        </h3>
                        <p style={{ color: '#9ca3af', fontSize: '12px', margin: 0 }}>
                            {ingredient.name} — {ingredient.stock ?? ingredient.stock_current} {ingredient.unit}
                        </p>
                    </div>
                    <button className="stk-close-btn" onClick={onClose}>
                        <X size={15} />
                    </button>
                </div>

                {/* Campos — scroll interno */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '20px', }}>

                    {/* Tipo de movimiento */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ color: '#6b7280', fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', }}>
                            Tipo de movimiento
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                            {Object.entries(TYPE_META).map(([key, m]) => {
                                const active = form.type === key;
                                return (
                                    <button key={key} type="button" className="stk-type-btn" onClick={() => set('type', key)} style={{ background: active ? m.bg : '#f9fafb', border: active ? `1px solid ${m.border}` : '1px solid #e5e7eb', }}>
                                        <m.icon size={15} color={active ? m.color : '#9ca3af'} />
                                        <span style={{ fontSize: '11px', fontWeight: 600, color: active ? m.color : '#6b7280', }}>
                                            {m.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                        <p style={{ color: '#9ca3af', fontSize: '12px', margin: 0 }}>
                            {meta.hint}
                        </p>
                    </div>

                    {/* Cantidad */}
                    <StkField label={`Cantidad (${ingredient.unit})`} error={errors.quantity}>
                        <input className={`stk-input${errors.quantity ? ' has-error' : ''}`} type="number" min="0.01" step="0.01" value={form.quantity} onChange={e => set('quantity', e.target.value)} onKeyDown={e => e.key === '-' && e.preventDefault()} placeholder="0" />
                    </StkField>

                    {/* Razón */}
                    <StkField label="Razón" error={errors.reason}>
                        <input className={`stk-input${errors.reason ? ' has-error' : ''}`} value={form.reason} onChange={e => set('reason', e.target.value)} placeholder="Ej: Compra semanal, conteo físico…" />
                    </StkField>

                    {/* Costo unitario — solo entradas */}
                    {form.type === 'entrada' && (
                        <StkField label="Costo unitario" hint="Opcional" error={errors.unit_cost}>
                            <input className={`stk-input${errors.unit_cost ? ' has-error' : ''}`} type="number" min="0" step="0.01" value={form.unit_cost} onChange={e => set('unit_cost', e.target.value)} onKeyDown={e => e.key === '-' && e.preventDefault()} placeholder="0.00" />
                        </StkField>
                    )}
                </div>

                {/* Footer */}
                <div style={{ flexShrink: 0, padding: '14px 20px 20px', borderTop: '1px solid #f3f4f6', display: 'flex', gap: '10px', background: '#ffffff', }}>
                    <button type="button" className="stk-btn-cancel" onClick={onClose}>
                        Cancelar
                    </button>
                    <button disabled={busy} onClick={handleSubmit} style={{ flex: 2, height: '40px', borderRadius: '10px', border: 'none', background: submitBg, color: submitColor, fontSize: '13px', fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer', transition: 'opacity 150ms, background 200ms', fontFamily: "'Syne', sans-serif", letterSpacing: '0.02em', }} onMouseEnter={e => { if (!busy) e.currentTarget.style.opacity = '0.88'; }} onMouseLeave={e => { if (!busy) e.currentTarget.style.opacity = '1'; }}>
                        {busy ? 'Registrando…' : 'Registrar movimiento'}
                    </button>
                </div>
            </div>
        </>
    );
}

function StkField({ label, hint, error, children }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'baseline' }}>
                <label style={{ color: '#6b7280', fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', }}>
                    {label}
                </label>
                {hint && <span style={{ color: '#b0b5b0', fontSize: '11px' }}>{hint}</span>}
            </div>
            {children}
            {error && <span style={{ color: '#ef4444', fontSize: '12px' }}>{error}</span>}
        </div>
    );
}