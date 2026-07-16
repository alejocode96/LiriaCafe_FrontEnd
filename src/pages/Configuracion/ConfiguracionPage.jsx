import { useState, useEffect } from 'react';
import { Settings, Pencil, Save, X, Loader2, Building2, Percent } from 'lucide-react';
import toast from 'react-hot-toast';
import { useConfig, useUpdateConfig } from '../../hooks/useConfig';

// ── Visual constants (identical to UsersPage) ────────────────────────────────

const GLASS = {
  background: 'rgba(204,204,204,0.22)',
  backdropFilter: 'blur(28px) saturate(1.8)',
  WebkitBackdropFilter: 'blur(28px) saturate(1.8)',
};

const VARIANTS = {
  neutral: { bg: 'rgba(255,255,255,0.85)', border: 'rgba(0,0,0,0.12)',  color: '#4b5563' },
  green:   { bg: 'rgba(240,253,244,0.9)',  border: 'rgba(22,163,74,0.2)',  color: '#16a34a' },
};

const EMPTY = {
  nombreNegocio: '',
  nit:           '',
  direccion:     '',
  telefono:      '',
  logo:          '',
  porcentajeIva: '0',
  moneda:        'COP',
  formatoFecha:  'DD/MM/YYYY',
};

// ── Sub-components ───────────────────────────────────────────────────────────

function SectionTitle({ icon: Icon, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.06)' }} />
    </div>
  );
}

function Field({ label, hint, error, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {label}
        </label>
        {hint && <span style={{ fontSize: 11, color: '#b0b5b0' }}>{hint}</span>}
      </div>
      {children}
      {error && <span style={{ fontSize: 11, color: '#ef4444' }}>{error}</span>}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ConfiguracionPage() {
  const { data: rawConfig, isLoading, isError, isFetching } = useConfig();
  const updateMutation = useUpdateConfig();

  const [editing, setEditing] = useState(false);
  const [form,    setForm]    = useState(EMPTY);
  const [errors,  setErrors]  = useState({});

  const applyConfig = (raw) => {
    if (!raw) return;
    const cfg = raw?.data ?? raw;
    setForm({
      nombreNegocio: cfg?.nombreNegocio ?? cfg?.nombre         ?? '',
      nit:           cfg?.nit           ?? cfg?.nitRut         ?? '',
      direccion:     cfg?.direccion                            ?? '',
      telefono:      cfg?.telefono                             ?? '',
      logo:          cfg?.logo                                 ?? '',
      porcentajeIva: String(cfg?.porcentajeIva ?? cfg?.iva ?? 0),
      moneda:        cfg?.moneda                              ?? 'COP',
      formatoFecha:  cfg?.formatoFecha  ?? cfg?.formatFecha   ?? 'DD/MM/YYYY',
    });
  };

  useEffect(() => { applyConfig(rawConfig); }, [rawConfig]);

  const set = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: '' }));
  };

  const handleEdit = () => setEditing(true);

  const handleCancel = () => {
    setEditing(false);
    setErrors({});
    applyConfig(rawConfig);
  };

  const handleSave = async () => {
    const e = {};
    if (!form.nombreNegocio.trim()) e.nombreNegocio = 'Campo obligatorio';
    if (Object.keys(e).length) { setErrors(e); return; }
    try {
      await updateMutation.mutateAsync({ ...form, porcentajeIva: parseFloat(form.porcentajeIva) || 0 });
      toast.success('Configuración guardada');
      setEditing(false);
    } catch (err) {
      toast.error(err?.message ?? 'No se pudo guardar la configuración');
    }
  };

  // Input / Select shared styles
  const inp = (hasErr) => ({
    width: '100%', height: 38, borderRadius: 10,
    background: editing ? '#f9fafb' : 'rgba(0,0,0,0.03)',
    border: `1px solid ${hasErr ? 'rgba(239,68,68,0.45)' : editing ? '#e5e7eb' : 'rgba(0,0,0,0.07)'}`,
    color: editing ? '#1f2937' : '#374151',
    fontSize: 13, padding: '0 12px',
    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
    cursor: editing ? 'text' : 'default',
    transition: 'border-color 150ms, background 150ms, box-shadow 150ms',
  });

  const sel = {
    width: '100%', height: 38, borderRadius: 10,
    background: editing ? '#f9fafb' : 'rgba(0,0,0,0.03)',
    border: `1px solid ${editing ? '#e5e7eb' : 'rgba(0,0,0,0.07)'}`,
    color: editing ? '#1f2937' : '#374151',
    fontSize: 13, padding: '0 28px 0 12px',
    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
    cursor: editing ? 'pointer' : 'default',
    appearance: 'none',
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center',
    pointerEvents: editing ? 'auto' : 'none',
    transition: 'border-color 150ms, background 150ms',
  };

  const focusIn  = (e) => { if (editing) { e.target.style.borderColor = '#8c916c'; e.target.style.boxShadow = '0 0 0 3px rgba(140,145,108,0.12)'; e.target.style.background = '#fff'; } };
  const focusOut = (e, hasErr) => { e.target.style.borderColor = hasErr ? 'rgba(239,68,68,0.45)' : editing ? '#e5e7eb' : 'rgba(0,0,0,0.07)'; e.target.style.boxShadow = 'none'; e.target.style.background = editing ? '#f9fafb' : 'rgba(0,0,0,0.03)'; };

  const busyAction = updateMutation.isPending;

  // Top-bar buttons (same style as UsersPage actions)
  const barActions = editing
    ? [
        { icon: <X size={13} />,    title: 'Cancelar edición', enabled: true, variant: 'neutral', action: handleCancel },
        { icon: <Save size={13} />, title: 'Guardar cambios',  enabled: !busyAction, variant: 'green',   action: handleSave },
      ]
    : [
        { icon: <Pencil size={13} />, title: 'Editar configuración', enabled: !isLoading && !isError, variant: 'neutral', action: handleEdit },
      ];

  return (
    <div className="w-full h-full overflow-hidden flex flex-col">

      {/* ── Top row ──────────────────────────────────────────────────────────── */}
      <div className="flex items-end shrink-0 h-10">

        {/* Chrome tab */}
        <div
          className="relative flex items-center gap-2 px-4 h-10 border border-b-0 border-white/40 shrink-0"
          style={{ width: 'min(65%, 620px)', ...GLASS, borderRadius: '10px 10px 0 0' }}
        >
          <Settings size={13} style={{ color: '#55624a', flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#374151', fontFamily: "'Syne', sans-serif", flexShrink: 0 }}>
            Configuración del Sistema
          </span>
          {isFetching && !isLoading && (
            <Loader2 size={11} className="animate-spin" style={{ color: '#8c916c', flexShrink: 0 }} />
          )}
          {editing && (
            <>
              <div style={{ width: 1, height: 16, background: 'rgba(156,163,175,0.5)', margin: '0 4px', flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: '#8c916c', flexShrink: 0 }}>
                Modo edición
              </span>
            </>
          )}

          {/* Chrome ear */}
          <span style={{ position: 'absolute', bottom: 0, right: -28, width: 28, height: 48, overflow: 'hidden', pointerEvents: 'none' }}>
            <span style={{ position: 'absolute', left: 0, bottom: 0, width: 56, height: 56, borderRadius: '50%', boxShadow: '-28px 28px 0 0 rgba(204,204,204,0.22)' }} />
          </span>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 32, paddingBottom: 6 }}>
          {barActions.map(({ icon, title, enabled, variant, action }) => {
            const v = enabled ? VARIANTS[variant] : null;
            return (
              <button
                key={title}
                onClick={() => enabled && action()}
                disabled={!enabled}
                title={title}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, height: 28, padding: '0 12px', borderRadius: 8, background: enabled ? v.bg : 'rgba(0,0,0,0.04)', border: `1px solid ${enabled ? v.border : 'rgba(0,0,0,0.06)'}`, color: enabled ? v.color : '#c4c9c0', cursor: enabled ? 'pointer' : 'not-allowed', fontSize: 12, fontWeight: 600, boxShadow: enabled ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'all 150ms', fontFamily: 'inherit' }}
                onMouseEnter={(e) => { if (enabled) e.currentTarget.style.opacity = '0.82'; }}
                onMouseLeave={(e) => { if (enabled) e.currentTarget.style.opacity = '1'; }}
              >
                {icon}
                {title === 'Editar configuración' ? 'Editar' : title === 'Guardar cambios' ? 'Guardar' : 'Cancelar'}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden rounded-b-2xl rounded-tr-2xl" style={GLASS}>

        {/* Content area (white, scrollable — mirrors the rows panel in UsersPage) */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', background: 'white', margin: '8px 4px 4px', borderRadius: 14, padding: '24px 28px' }}>

          {isLoading ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Loader2 size={20} className="animate-spin" style={{ color: '#d1d5db' }} />
            </div>
          ) : isError ? (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Settings size={28} style={{ color: '#d1d5db' }} />
              <p style={{ color: '#9ca3af', fontSize: 13 }}>
                No se pudo cargar la configuración. Verifica la conexión con el servidor.
              </p>
            </div>
          ) : (
            <div style={{ maxWidth: 720 }}>

              {/* ── Datos del Negocio ── */}
              <SectionTitle icon={Building2} label="Datos del Negocio" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px 24px', marginBottom: 32 }}>

                <div style={{ gridColumn: '1 / -1' }}>
                  <Field label="Nombre del negocio" error={errors.nombreNegocio}>
                    <input
                      style={inp(!!errors.nombreNegocio)}
                      value={form.nombreNegocio}
                      onChange={(e) => set('nombreNegocio', e.target.value)}
                      readOnly={!editing}
                      placeholder="Ej: Liria Café"
                      onFocus={focusIn}
                      onBlur={(e) => focusOut(e, !!errors.nombreNegocio)}
                    />
                  </Field>
                </div>

                <Field label="NIT / RUT">
                  <input
                    style={inp(false)}
                    value={form.nit}
                    onChange={(e) => set('nit', e.target.value)}
                    readOnly={!editing}
                    placeholder="900123456-7"
                    onFocus={focusIn}
                    onBlur={(e) => focusOut(e, false)}
                  />
                </Field>

                <Field label="Teléfono">
                  <input
                    style={inp(false)}
                    value={form.telefono}
                    onChange={(e) => set('telefono', e.target.value)}
                    readOnly={!editing}
                    placeholder="3001234567"
                    onFocus={focusIn}
                    onBlur={(e) => focusOut(e, false)}
                  />
                </Field>

                <div style={{ gridColumn: '1 / -1' }}>
                  <Field label="Dirección">
                    <input
                      style={inp(false)}
                      value={form.direccion}
                      onChange={(e) => set('direccion', e.target.value)}
                      readOnly={!editing}
                      placeholder="Cra 10 #15-20, Bogotá"
                      onFocus={focusIn}
                      onBlur={(e) => focusOut(e, false)}
                    />
                  </Field>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <Field label="Logo" hint="URL de imagen PNG o JPG">
                    <input
                      style={inp(false)}
                      value={form.logo}
                      onChange={(e) => set('logo', e.target.value)}
                      readOnly={!editing}
                      placeholder="https://..."
                      onFocus={focusIn}
                      onBlur={(e) => focusOut(e, false)}
                    />
                  </Field>
                </div>
              </div>

              {/* ── Configuración Fiscal ── */}
              <SectionTitle icon={Percent} label="Configuración Fiscal y de Sistema" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px 24px' }}>

                <Field label="% de IVA" hint="Aplica a todas las ventas">
                  <div style={{ position: 'relative' }}>
                    <input
                      style={{ ...inp(false), paddingRight: 28 }}
                      value={form.porcentajeIva}
                      onChange={(e) => set('porcentajeIva', e.target.value.replace(/[^0-9.]/g, ''))}
                      readOnly={!editing}
                      placeholder="19"
                      inputMode="decimal"
                      onFocus={focusIn}
                      onBlur={(e) => focusOut(e, false)}
                    />
                    <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#9ca3af', pointerEvents: 'none' }}>%</span>
                  </div>
                </Field>

                <Field label="Moneda">
                  <select
                    style={sel}
                    value={form.moneda}
                    onChange={(e) => set('moneda', e.target.value)}
                    disabled={!editing}
                  >
                    <option value="COP">COP — Peso colombiano</option>
                    <option value="USD">USD — Dólar</option>
                    <option value="EUR">EUR — Euro</option>
                  </select>
                </Field>

                <Field label="Formato de fecha">
                  <select
                    style={sel}
                    value={form.formatoFecha}
                    onChange={(e) => set('formatoFecha', e.target.value)}
                    disabled={!editing}
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </Field>
              </div>

              {/* Hint when read-only */}
              {!editing && (
                <p style={{ marginTop: 28, fontSize: 12, color: '#b0b5b0' }}>
                  Los cambios afectan el cálculo de impuestos, facturas y reportes en todo el sistema. Usa el botón <strong>Editar</strong> para modificar.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
