import { useState, useEffect } from 'react';
import { X, FlaskConical } from 'lucide-react';
import { useCreateIngredient, useUpdateIngredient } from '../../hooks/useIngredients';

const UNITS = ['gramos', 'mililitros', 'unidad', 'litros', 'kilos'];

const EMPTY = {
    name: '',
    unit: 'gramos',
    stock: '',
    min_stock: '',
    cost_price: '',
    description: '',
    is_active: true,
};

export default function IngredientFormModal({ open, onClose, ingredient }) {
    const isEdit = !!ingredient;
    const create = useCreateIngredient();
    const update = useUpdateIngredient();
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
        if (open) {
            setForm(ingredient
                ? {
                    name: ingredient.name || '',
                    unit: ingredient.unit || 'gramos',
                    stock: ingredient.stock ?? '',
                    min_stock: ingredient.min_stock ?? '',
                    cost_price: ingredient.cost_price ?? '',
                    description: ingredient.description || '',
                    is_active: ingredient.is_active ?? true,
                }
                : EMPTY
            );
            setErrors({});
        }
    }, [open, ingredient]);

    const set = (field, value) => {
        setForm(p => ({ ...p, [field]: value }));
        setErrors(p => ({ ...p, [field]: '' }));
    };

    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = 'El nombre es obligatorio';

        // Stock inicial solo se valida al crear
        if (!isEdit) {
            if (form.stock === '' || isNaN(Number(form.stock))) {
                e.stock = 'Stock inicial requerido';
            } else if (Number(form.stock) < 0) {
                e.stock = 'No puede ser negativo';
            }
        }

        if (form.min_stock === '' || isNaN(Number(form.min_stock))) {
            e.min_stock = 'Stock mínimo requerido';
        } else if (Number(form.min_stock) < 0) {
            e.min_stock = 'No puede ser negativo';
        }
        if (form.cost_price !== '' && Number(form.cost_price) < 0) {
            e.cost_price = 'No puede ser negativo';
        }
        return e;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }

        const payload = {
            name: form.name.trim(),
            unit: form.unit,
            min_stock: Number(form.min_stock),
            cost_price: form.cost_price !== '' ? Number(form.cost_price) : undefined,
            description: form.description.trim() || undefined,
            // stock solo se envía al crear
            ...(!isEdit ? { stock: Number(form.stock) } : {}),
            // is_active solo se envía al editar
            ...(isEdit ? { is_active: form.is_active } : {}),
        };

        try {
            if (isEdit) {
                await update.mutateAsync({ id: ingredient.id, ...payload });
            } else {
                await create.mutateAsync(payload);
            }
            onClose();
        } catch (err) {
            const msg = err?.message || '';
            if (msg.toLowerCase().includes("'name'") || msg.toLowerCase().includes('name')) {
                setErrors(p => ({ ...p, name: 'Este nombre ya existe' }));
            }
        }
    };

    if (!mounted) return null;

    const busy = create.isPending || update.isPending;

    return (
        <>
            <style>{`
                @keyframes slideInRight {
                    from { transform: translateX(100%); }
                    to   { transform: translateX(0); }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); }
                    to   { transform: translateX(100%); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to   { opacity: 1; }
                }
                @keyframes fadeOut {
                    from { opacity: 1; }
                    to   { opacity: 0; }
                }

                .ing-overlay-in  { animation: fadeIn  280ms ease forwards; }
                .ing-overlay-out { animation: fadeOut 280ms ease forwards; }
                .ing-panel-in    { animation: slideInRight  300ms cubic-bezier(0.32,0.72,0,1) forwards; }
                .ing-panel-out   { animation: slideOutRight 280ms cubic-bezier(0.32,0.72,0,1) forwards; }

                .ing-input {
                    width: 100%; height: 40px; border-radius: 10px;
                    background: #f9fafb; border: 1px solid #e5e7eb;
                    color: #1f2937; font-size: 13px; padding: 0 12px;
                    outline: none; box-sizing: border-box;
                    transition: border-color 150ms, box-shadow 150ms, background 150ms;
                    font-family: inherit;
                }
                .ing-input:focus {
                    border-color: #8c916c;
                    box-shadow: 0 0 0 3px rgba(140,145,108,0.12);
                    background: #fff;
                }
                .ing-input.has-error { border-color: rgba(239,68,68,0.5); }
                .ing-input.has-error:focus { box-shadow: 0 0 0 3px rgba(239,68,68,0.10); }

                .ing-input-readonly {
                    width: 100%; height: 40px; border-radius: 10px;
                    background: #f3f4f6; border: 1px solid #e5e7eb;
                    color: #9ca3af; font-size: 13px; padding: 0 12px;
                    outline: none; box-sizing: border-box;
                    font-family: inherit; cursor: not-allowed;
                    display: flex; align-items: center;
                }

                .ing-textarea {
                    width: 100%; border-radius: 10px;
                    background: #f9fafb; border: 1px solid #e5e7eb;
                    color: #1f2937; font-size: 13px; padding: 10px 12px;
                    outline: none; box-sizing: border-box; resize: none;
                    transition: border-color 150ms, box-shadow 150ms, background 150ms;
                    font-family: inherit; line-height: 1.5;
                }
                .ing-textarea:focus {
                    border-color: #8c916c;
                    box-shadow: 0 0 0 3px rgba(140,145,108,0.12);
                    background: #fff;
                }

                .ing-select {
                    width: 100%; height: 40px; border-radius: 10px;
                    background: #f9fafb; border: 1px solid #e5e7eb;
                    color: #1f2937; font-size: 13px; padding: 0 12px;
                    outline: none; box-sizing: border-box; cursor: pointer;
                    transition: border-color 150ms; font-family: inherit;
                }
                .ing-select:focus {
                    border-color: #8c916c;
                    box-shadow: 0 0 0 3px rgba(140,145,108,0.12);
                    background: #fff;
                }

                .ing-btn-cancel {
                    flex: 1; height: 40px; border-radius: 10px;
                    border: 1px solid #e5e7eb; background: white;
                    color: #6b7280; font-size: 13px; font-weight: 500;
                    cursor: pointer; transition: background 150ms, color 150ms;
                    font-family: inherit;
                }
                .ing-btn-cancel:hover { background: #f9fafb; color: #374151; }

                .ing-btn-submit {
                    flex: 2; height: 40px; border-radius: 10px; border: none;
                    background: #55624a; color: white;
                    font-size: 13px; font-weight: 700; cursor: pointer;
                    transition: opacity 150ms;
                    font-family: 'Syne', sans-serif; letter-spacing: 0.02em;
                }
                .ing-btn-submit:hover:not(:disabled) { opacity: 0.88; }
                .ing-btn-submit:disabled {
                    background: #e5e7eb; color: #9ca3af; cursor: not-allowed;
                }

                .ing-close-btn {
                    width: 30px; height: 30px; border-radius: 8px;
                    background: transparent; border: 1px solid #e5e7eb;
                    cursor: pointer; color: #9ca3af; flex-shrink: 0;
                    display: flex; align-items: center; justify-content: center;
                    transition: background 150ms, color 150ms;
                }
                .ing-close-btn:hover { background: #f3f4f6; color: #374151; }
            `}</style>

            {/* Overlay */}
            <div className={open ? 'ing-overlay-in' : 'ing-overlay-out'} onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.18)', backdropFilter: 'blur(2px)', }} />

            {/* Panel lateral */}
            <div className={open ? 'ing-panel-in' : 'ing-panel-out'} style={{ position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 1001, width: '400px', background: '#ffffff', borderLeft: '1px solid #e5e7eb', boxShadow: '-12px 0 40px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', overflow: 'hidden', }}   >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '20px 20px 18px', borderBottom: '1px solid #f3f4f6', flexShrink: 0, }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(85,98,74,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, }}>
                        <FlaskConical size={16} color="#55624a" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ color: '#111827', fontSize: '15px', fontWeight: 700, margin: 0, fontFamily: "'Syne', sans-serif", letterSpacing: '0.01em', }}>
                            {isEdit ? 'Editar ingrediente' : 'Nuevo ingrediente'}
                        </h3>
                        <p style={{ color: '#9ca3af', fontSize: '12px', margin: 0 }}>
                            {isEdit ? 'Modifica los datos del insumo' : 'Registra un nuevo insumo'}
                        </p>
                    </div>
                    <button className="ing-close-btn" onClick={onClose}>
                        <X size={15} />
                    </button>
                </div>

                {/* Campos — scroll interno */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '18px', }}>
                    {/* Nombre */}
                    <Field label="Nombre" error={errors.name}>
                        <input className={`ing-input${errors.name ? ' has-error' : ''}`} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ej: Azúcar morena" />
                    </Field>

                    {/* Unidad + Stock mínimo */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <Field label="Unidad">
                            <select className="ing-select" value={form.unit} onChange={e => set('unit', e.target.value)} >
                                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                        </Field>
                        <Field label="Stock mínimo" error={errors.min_stock}>
                            <input className={`ing-input${errors.min_stock ? ' has-error' : ''}`} type="number" min="0" step="0.01" value={form.min_stock} onChange={e => set('min_stock', e.target.value)} onKeyDown={e => e.key === '-' && e.preventDefault()} placeholder="0" />
                        </Field>
                    </div>

                    {/* Stock — editable al crear, solo lectura al editar */}
                    <Field label="Stock inicial" hint={isEdit ? 'Usa movimientos para ajustar' : undefined} error={errors.stock} >
                        {isEdit ? (
                            <div className="ing-input-readonly">
                                {form.stock !== '' ? form.stock : '—'}
                            </div>
                        ) : (
                            <input className={`ing-input${errors.stock ? ' has-error' : ''}`} type="number" min="0" step="0.01" value={form.stock} onChange={e => set('stock', e.target.value)} onKeyDown={e => e.key === '-' && e.preventDefault()} placeholder="0" />
                        )}
                    </Field>

                    {/* Costo unitario */}
                    <Field label="Costo unitario" hint="Opcional" error={errors.cost_price}>
                        <input className={`ing-input${errors.cost_price ? ' has-error' : ''}`} type="number" min="0" step="0.01" value={form.cost_price} onChange={e => set('cost_price', e.target.value)} onKeyDown={e => e.key === '-' && e.preventDefault()} placeholder="0.00" />
                    </Field>

                    {/* Descripción */}
                    <Field label="Descripción" hint="Opcional">
                        <textarea className="ing-textarea" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Notas adicionales…" rows={3} />
                    </Field>

                    {/* Toggle activo — solo edición */}
                    {isEdit && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div onClick={() => set('is_active', !form.is_active)} style={{ width: '40px', height: '22px', borderRadius: '11px', background: form.is_active ? '#55624a' : '#e5e7eb', position: 'relative', transition: 'background 200ms', cursor: 'pointer', flexShrink: 0, }} >
                                <div style={{ position: 'absolute', top: '3px', left: form.is_active ? '21px' : '3px', width: '16px', height: '16px', borderRadius: '50%', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.20)', transition: 'left 200ms', }} />
                            </div>
                            <span style={{ color: '#6b7280', fontSize: '13px' }}>
                                {form.is_active ? 'Ingrediente activo' : 'Ingrediente inactivo'}
                            </span>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{ flexShrink: 0, padding: '14px 20px 20px', borderTop: '1px solid #f3f4f6', display: 'flex', gap: '10px', background: '#ffffff', }}>
                    <button type="button" className="ing-btn-cancel" onClick={onClose}>
                        Cancelar
                    </button>
                    <button className="ing-btn-submit" disabled={busy} onClick={handleSubmit} >
                        {busy ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear ingrediente'}
                    </button>
                </div>
            </div>
        </>
    );
}

function Field({ label, hint, error, children }) {
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