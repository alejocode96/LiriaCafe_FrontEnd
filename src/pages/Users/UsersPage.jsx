import { useState, useMemo } from 'react';
import {
  Plus, Search, Users, Edit2, Loader2, ChevronUp, ChevronDown,
  Lock, Key, UserX, UserCheck, Unlock,
} from 'lucide-react';
import {
  useUsers,
  useDeactivateUser,
  useReactivateUser,
  useUnlockUser,
  useForcePasswordChange,
} from '../../hooks/useUsers';
import UserFormModal from '../../components/users/UserFormModal';

// ─── Visual constants ─────────────────────────────────────────────────────────

const GLASS = {
  background: 'rgba(204,204,204,0.22)',
  backdropFilter: 'blur(28px) saturate(1.8)',
  WebkitBackdropFilter: 'blur(28px) saturate(1.8)',
};

const CELL = '#6b7280';
const CELL_SEL = 'rgba(255,255,255,0.88)';

const COLS = [
  { key: 'nombreCompleto', label: 'Nombre', flex: '2fr' },
  { key: 'nombreUsuario', label: 'Usuario', flex: '1.4fr' },
  { key: 'correo', label: 'Correo', flex: '2fr' },
  { key: 'rol', label: 'Rol', flex: '1.4fr' },
  { key: 'estado', label: 'Estado', flex: '1fr' },
  { key: 'ultimoAcceso', label: 'Último acceso', flex: '1.5fr' },
  { key: '_flags', label: '', flex: '0.7fr' },
];
const GRID = COLS.map((c) => c.flex).join(' ');

// Role badge palette — deterministic by name
const ROLE_PALETTE = [
  { bg: '#ede9fe', color: '#7c3aed', border: '#c4b5fd' },
  { bg: '#dbeafe', color: '#1d4ed8', border: '#93c5fd' },
  { bg: '#fef3c7', color: '#b45309', border: '#fcd34d' },
  { bg: '#d1fae5', color: '#065f46', border: '#6ee7b7' },
  { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' },
  { bg: '#fce7f3', color: '#9d174d', border: '#f9a8d4' },
  { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' },
];

function getRoleStyle(nombre) {
  if (!nombre) return { bg: '#f3f4f6', color: '#6b7280', border: '#e5e7eb' };
  const idx =
    Array.from(nombre).reduce((acc, c) => acc + c.charCodeAt(0), 0) %
    ROLE_PALETTE.length;
  return ROLE_PALETTE[idx];
}

function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0] ?? '')
    .join('')
    .toUpperCase();
}

function formatDate(raw) {
  if (!raw) return '—';
  const utc = raw.endsWith('Z') || raw.includes('+') ? raw : raw + 'Z';
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
    timeZone: 'America/Bogota',
  }).format(new Date(utc));
}

function sortUsers(list, key, dir) {
  if (!key) return list;
  return [...list].sort((a, b) => {
    const va = key === 'rol' ? (a.rol?.nombre ?? '') : (a[key] ?? '');
    const vb = key === 'rol' ? (b.rol?.nombre ?? '') : (b[key] ?? '');
    if (va == null && vb == null) return 0;
    if (va == null) return 1;
    if (vb == null) return -1;
    if (typeof va === 'string') {
      return dir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    }
    return dir === 'asc' ? (va > vb ? 1 : -1) : (vb > va ? 1 : -1);
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SortableHeader({ col, sortKey, sortDir, onSort }) {
  if (col.key === '_flags') return <div />;
  const active = sortKey === col.key;
  return (
    <button
      onClick={() => onSort(col.key)}
      style={{
        background: 'none', border: 'none', padding: 0,
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
      }}
    >
      <span
        style={{
          fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: active ? '#55624a' : '#9ca3af', transition: 'color 100ms',
        }}
      >
        {col.label}
      </span>
      <span style={{ display: 'flex', flexDirection: 'column', gap: 1, marginTop: 1 }}>
        <ChevronUp
          size={9}
          style={{ color: active && sortDir === 'asc' ? '#55624a' : '#d1d5db' }}
        />
        <ChevronDown
          size={9}
          style={{
            color: active && sortDir === 'desc' ? '#55624a' : '#d1d5db',
            marginTop: -3,
          }}
        />
      </span>
    </button>
  );
}

function ActionConfirm({ config, onConfirm, onCancel, busy }) {
  const { icon: Icon, iconBg, iconColor, title, description, confirmText, confirmBg } = config;
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1100,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        background: 'rgba(0,0,0,0.30)', backdropFilter: 'blur(4px)',
      }}
    >
      <div
        style={{
          width: '100%', maxWidth: 380, background: 'white',
          borderRadius: 20, border: '1px solid #e5e7eb',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)', padding: 24,
        }}
      >
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <div
            style={{
              width: 40, height: 40, borderRadius: 12, flexShrink: 0,
              background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Icon size={17} style={{ color: iconColor }} />
          </div>
          <div>
            <h3
              style={{
                color: '#111827', fontSize: 14, fontWeight: 700,
                margin: '0 0 4px', fontFamily: "'Syne', sans-serif",
              }}
            >
              {title}
            </h3>
            <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>{description}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, height: 40, borderRadius: 10,
              border: '1px solid #e5e7eb', background: 'white',
              color: '#6b7280', fontSize: 13, fontWeight: 500, cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            style={{
              flex: 2, height: 40, borderRadius: 10, border: 'none',
              background: busy ? '#e5e7eb' : confirmBg,
              color: busy ? '#9ca3af' : 'white',
              fontSize: 13, fontWeight: 700,
              cursor: busy ? 'not-allowed' : 'pointer',
              fontFamily: "'Syne', sans-serif",
            }}
          >
            {busy ? 'Procesando…' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ACTIVO');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);
  const [sortKey, setSortKey] = useState('nombreCompleto');
  const [sortDir, setSortDir] = useState('asc');
  const [formModal, setFormModal] = useState({ open: false, user: null });
  const [confirm, setConfirm] = useState(null); // { type, user }

  const params = useMemo(() => {
    const p = { page };
    if (search) p.buscar = search;
    if (status !== 'all') p.estado = status;
    return p;
  }, [search, status, page]);

  const { data, isLoading, isFetching } = useUsers(params);
  const deactivate = useDeactivateUser();
  const reactivate = useReactivateUser();
  const unlock = useUnlockUser();
  const forcePwd = useForcePasswordChange();

  const rawUsers = data?.data ?? [];
  const meta = data?.meta ?? {};
  const totalPages = Math.ceil((meta.total ?? 0) / (meta.per_page ?? 20));
  const users = useMemo(() => sortUsers(rawUsers, sortKey, sortDir), [rawUsers, sortKey, sortDir]);

  const selectedUser = users.find((u) => u.id === selectedId) ?? null;
  const has = !!selectedUser;
  const isActive = selectedUser?.estado === 'ACTIVO';
  const isBlocked = selectedUser?.bloqueadoPermanente === true;
  const canForcePwd = has && selectedUser?.requiereCambioClave === false;

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  const confirmBusy =
    deactivate.isPending || reactivate.isPending ||
    unlock.isPending || forcePwd.isPending;

  const handleConfirm = async () => {
    if (!confirm) return;
    const id = confirm.user.id;
    try {
      if (confirm.type === 'deactivate') await deactivate.mutateAsync(id);
      else if (confirm.type === 'activate') await reactivate.mutateAsync(id);
      else if (confirm.type === 'unlock') await unlock.mutateAsync(id);
      else if (confirm.type === 'force-password') await forcePwd.mutateAsync(id);
      setConfirm(null);
      setSelectedId(null);
    } catch { /* errors shown via toast from API interceptor */ }
  };

  const CONFIRM_CONFIGS = {
    deactivate: {
      icon: UserX, iconBg: '#fee2e2', iconColor: '#ef4444',
      title: 'Desactivar usuario',
      description: `¿Desactivar a ${confirm?.user?.nombreCompleto}? No podrá iniciar sesión hasta que sea reactivado.`,
      confirmText: 'Sí, desactivar', confirmBg: '#ef4444',
    },
    activate: {
      icon: UserCheck, iconBg: '#dcfce7', iconColor: '#16a34a',
      title: 'Activar usuario',
      description: `¿Activar a ${confirm?.user?.nombreCompleto}? Recuperará acceso al sistema.`,
      confirmText: 'Sí, activar', confirmBg: '#16a34a',
    },
    unlock: {
      icon: Unlock, iconBg: '#dbeafe', iconColor: '#2563eb',
      title: 'Desbloquear cuenta',
      description: `¿Desbloquear la cuenta de ${confirm?.user?.nombreCompleto}? Podrá iniciar sesión nuevamente.`,
      confirmText: 'Sí, desbloquear', confirmBg: '#2563eb',
    },
    'force-password': {
      icon: Key, iconBg: '#fef3c7', iconColor: '#d97706',
      title: 'Forzar cambio de contraseña',
      description: `${confirm?.user?.nombreCompleto} deberá cambiar su contraseña la próxima vez que inicie sesión.`,
      confirmText: 'Sí, forzar cambio', confirmBg: '#d97706',
    },
  };

  // Status cycle config
  const STATUS_CFG = {
    ACTIVO: { label: 'Activos', dot: '#22c55e', bg: 'rgba(21,128,61,0.08)', border: 'rgba(21,128,61,0.28)', color: '#15803d', next: 'INACTIVO' },
    INACTIVO: { label: 'Inactivos', dot: '#9ca3af', bg: 'rgba(156,163,175,0.12)', border: 'rgba(107,114,128,0.22)', color: '#6b7280', next: 'all' },
    all: { label: 'Todos', dot: '#9ca3af', bg: 'rgba(0,0,0,0.04)', border: 'rgba(0,0,0,0.10)', color: '#6b7280', next: 'ACTIVO' },
  };
  const sc = STATUS_CFG[status] ?? STATUS_CFG.all;

  // Action buttons
  const actions = [
    {
      icon: <Edit2 size={13} />,
      title: 'Editar usuario',
      enabled: has,
      variant: 'neutral',
      action: () => setFormModal({ open: true, user: selectedUser }),
    },
    {
      icon: isActive ? <UserX size={13} /> : <UserCheck size={13} />,
      title: isActive ? 'Desactivar usuario' : 'Activar usuario',
      enabled: has,
      variant: isActive ? 'red' : 'green',
      action: () => setConfirm({ type: isActive ? 'deactivate' : 'activate', user: selectedUser }),
    },
    {
      icon: <Unlock size={13} />,
      title: 'Desbloquear cuenta',
      enabled: has && isBlocked,
      variant: 'blue',
      action: () => setConfirm({ type: 'unlock', user: selectedUser }),
    },
    {
      icon: <Key size={13} />,
      title: 'Forzar cambio de contraseña',
      enabled: canForcePwd,
      variant: 'amber',
      action: () => setConfirm({ type: 'force-password', user: selectedUser }),
    },
  ];

  const VARIANTS = {
    neutral: { bg: 'rgba(255,255,255,0.85)', border: 'rgba(0,0,0,0.12)', color: '#4b5563' },
    red:     { bg: 'rgba(254,242,242,0.9)',  border: 'rgba(239,68,68,0.2)',  color: '#ef4444' },
    green:   { bg: 'rgba(240,253,244,0.9)',  border: 'rgba(22,163,74,0.2)',  color: '#16a34a' },
    blue:    { bg: 'rgba(239,246,255,0.9)',  border: 'rgba(37,99,235,0.2)',  color: '#2563eb' },
    amber:   { bg: 'rgba(255,251,235,0.9)',  border: 'rgba(217,119,6,0.2)',  color: '#d97706' },
  };

  return (
    <div className="w-full h-full overflow-hidden flex flex-col">

      {/* ── Top row ─────────────────────────────────────────────────────────── */}
      <div className="flex items-end shrink-0 h-[40px]">

        {/* Tab */}
        <div
          className="relative flex items-center gap-2 px-4 h-10 border border-b-0 border-white/40 shrink-0"
          style={{ width: 'min(65%, 620px)', ...GLASS, borderRadius: '10px 10px 0 0' }}
        >
          <Users size={13} style={{ color: '#55624a', flexShrink: 0 }} />
          <span
            style={{
              fontSize: 13, fontWeight: 700, color: '#374151',
              fontFamily: "'Syne', sans-serif", flexShrink: 0,
            }}
          >
            Usuarios
          </span>
          {isFetching && !isLoading && (
            <Loader2 size={11} className="animate-spin" style={{ color: '#8c916c', flexShrink: 0 }} />
          )}

          <div style={{ width: 1, height: 16, background: 'rgba(156,163,175,0.5)', margin: '0 4px', flexShrink: 0 }} />

          {/* Search */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <Search
              size={11}
              style={{
                position: 'absolute', left: 8, top: '50%',
                transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none',
              }}
            />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Buscar…"
              style={{
                height: 24, width: 128, borderRadius: 8, fontSize: 11,
                paddingLeft: 24, paddingRight: 8, outline: 'none',
                background: 'rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.08)',
                color: '#374151', boxSizing: 'border-box',
              }}
              onFocus={(e) => { e.target.style.background = 'rgba(255,255,255,0.9)'; e.target.style.borderColor = '#8c916c'; }}
              onBlur={(e) => { e.target.style.background = 'rgba(0,0,0,0.06)'; e.target.style.borderColor = 'rgba(0,0,0,0.08)'; }}
            />
          </div>

          {/* Status chip (cyclic) */}
          <button
            onClick={() => { setStatus(sc.next); setPage(1); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              height: 24, padding: '0 10px', borderRadius: 8,
              fontSize: 11, fontWeight: 500,
              border: `1px solid ${sc.border}`,
              background: sc.bg, color: sc.color,
              cursor: 'pointer', flexShrink: 0, transition: 'all 150ms',
            }}
          >
            <span
              style={{
                width: 6, height: 6, borderRadius: '50%',
                background: sc.dot, display: 'inline-block',
              }}
            />
            {sc.label}
          </button>

          {/* Chrome-style ear */}
          <span
            style={{
              position: 'absolute', bottom: 0, right: -28,
              width: 28, height: 48, overflow: 'hidden', pointerEvents: 'none',
            }}
          >
            <span
              style={{
                position: 'absolute', left: 0, bottom: 0,
                width: 56, height: 56, borderRadius: '50%',
                boxShadow: '-28px 28px 0 0 rgba(204,204,204,0.22)',
              }}
            />
          </span>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 32, paddingBottom: 6 }}>
          <button
            onClick={() => setFormModal({ open: true, user: null })}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              height: 28, padding: '0 12px', borderRadius: 8,
              border: 'none', background: '#55624a', color: 'white',
              fontSize: 12, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(85,98,74,0.30)',
              fontFamily: "'Syne', sans-serif",
            }}
          >
            <Plus size={13} /> Nuevo
          </button>

          <div style={{ width: 1, height: 16, background: 'rgba(156,163,175,0.5)', margin: '0 2px' }} />

          {actions.map(({ icon, title, enabled, variant, action }) => {
            const v = enabled ? VARIANTS[variant] : null;
            return (
              <button
                key={title}
                onClick={() => enabled && action()}
                disabled={!enabled}
                title={title}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 28, height: 28, borderRadius: 8,
                  background: enabled ? v.bg : 'rgba(0,0,0,0.04)',
                  border: `1px solid ${enabled ? v.border : 'rgba(0,0,0,0.06)'}`,
                  color: enabled ? v.color : '#c4c9c0',
                  cursor: enabled ? 'pointer' : 'not-allowed',
                  boxShadow: enabled ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 150ms',
                }}
                onMouseEnter={(e) => {
                  if (enabled) e.currentTarget.style.opacity = '0.82';
                }}
                onMouseLeave={(e) => {
                  if (enabled) e.currentTarget.style.opacity = '1';
                }}
              >
                {icon}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────────── */}
      <div
        className="flex-1 flex flex-col overflow-hidden rounded-b-2xl rounded-tr-2xl"
        style={GLASS}
      >
        <div style={{ flex: 1, minHeight: 0, overflowX: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* Column headers */}
        <div
          style={{
            display: 'grid', gridTemplateColumns: GRID,
            padding: '12px 20px',
            borderBottom: '1px solid rgba(0,0,0,0.06)',
            margin: '8px 4px 0', background: 'white',
            borderRadius: '14px 14px 0 0', flexShrink: 0,
            minWidth: 720,
          }}
        >
          {COLS.map((col) => (
            <SortableHeader
              key={col.key} col={col}
              sortKey={sortKey} sortDir={sortDir}
              onSort={handleSort}
            />
          ))}
        </div>

        {/* Rows */}
        <div
          style={{
            flex: 1, minHeight: 0, overflowY: 'auto',
            background: 'white', margin: '0 4px',
            minWidth: 720,
          }}
        >
          {isLoading ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Loader2 size={20} className="animate-spin" style={{ color: '#d1d5db' }} />
            </div>
          ) : users.length === 0 ? (
            <div
              style={{
                height: '100%', display: 'flex',
                flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 8,
              }}
            >
              <Users size={28} style={{ color: '#d1d5db' }} />
              <p style={{ color: '#9ca3af', fontSize: 13 }}>
                {search ? 'Sin resultados para los filtros aplicados' : 'No hay usuarios registrados'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', paddingTop: 4, paddingBottom: 4 }}>
              {users.map((user, idx) => {
                const isSel = selectedId === user.id;
                const rolStyle = getRoleStyle(user.rol?.nombre);
                const initials = getInitials(user.nombreCompleto);
                const activo = user.estado === 'ACTIVO';

                return (
                  <div
                    key={user.id}
                    onClick={() => setSelectedId(isSel ? null : user.id)}
                    style={{
                      display: 'grid', gridTemplateColumns: GRID,
                      alignItems: 'center', padding: '10px 20px',
                      margin: `0 4px ${idx < users.length - 1 ? 2 : 0}px`,
                      borderRadius: 14, cursor: 'pointer',
                      background: isSel ? '#a1a682' : 'transparent',
                      transition: 'background 150ms',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSel) e.currentTarget.style.background = 'rgba(161,166,130,0.16)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSel) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {/* Nombre + avatar initials */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <div
                        style={{
                          width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                          background: isSel ? 'rgba(255,255,255,0.22)' : '#f3f4f6',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 10, fontWeight: 700,
                          color: isSel ? 'white' : '#6b7280',
                          fontFamily: "'Syne', sans-serif",
                        }}
                      >
                        {initials}
                      </div>
                      <span
                        style={{
                          fontSize: 13, fontWeight: 500,
                          color: isSel ? 'white' : '#374151',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}
                      >
                        {user.nombreCompleto || '—'}
                      </span>
                    </div>

                    {/* Nombre de usuario */}
                    <span
                      style={{
                        fontSize: 12, color: isSel ? CELL_SEL : '#6b7280',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}
                    >
                      {user.nombreUsuario ? `@${user.nombreUsuario}` : '—'}
                    </span>

                    {/* Email */}
                    <span
                      style={{
                        fontSize: 12, color: isSel ? CELL_SEL : CELL,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}
                    >
                      {user.correo || '—'}
                    </span>

                    {/* Role badge */}
                    <div>
                      {user.rol ? (
                        <span
                          style={{
                            display: 'inline-flex', alignItems: 'center',
                            padding: '2px 8px', borderRadius: 20,
                            fontSize: 11, fontWeight: 600,
                            background: isSel ? 'rgba(255,255,255,0.18)' : rolStyle.bg,
                            color: isSel ? 'white' : rolStyle.color,
                            border: `1px solid ${isSel ? 'rgba(255,255,255,0.28)' : rolStyle.border}`,
                          }}
                        >
                          {user.rol.nombre}
                        </span>
                      ) : (
                        <span style={{ fontSize: 12, color: isSel ? CELL_SEL : '#d1d5db' }}>—</span>
                      )}
                    </div>

                    {/* Estado */}
                    <div>
                      <div
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '2px 8px', borderRadius: 20,
                          fontSize: 11, fontWeight: 600,
                          background: activo
                            ? isSel ? 'rgba(21,128,61,0.55)' : '#ecfdf3'
                            : isSel ? 'rgba(156,163,175,0.22)' : '#f3f4f6',
                          color: activo
                            ? isSel ? '#dcfce7' : '#15803d'
                            : isSel ? 'rgba(255,255,255,0.6)' : '#9ca3af',
                          border: activo
                            ? isSel ? '1px solid rgba(21,128,61,0.7)' : '1px solid #bbf7d0'
                            : isSel ? '1px solid rgba(255,255,255,0.15)' : '1px solid #e5e7eb',
                        }}
                      >
                        <span
                          style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: activo
                              ? isSel ? '#4ade80' : '#22c55e'
                              : isSel ? 'rgba(255,255,255,0.4)' : '#9ca3af',
                          }}
                        />
                        {activo ? 'Activo' : 'Inactivo'}
                      </div>
                    </div>

                    {/* Último acceso */}
                    <span style={{ fontSize: 11, color: isSel ? CELL_SEL : '#9ca3af' }}>
                      {formatDate(user.ultimoAcceso)}
                    </span>

                    {/* Flags: bloqueado + cambio clave pendiente */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      {user.bloqueadoPermanente && (
                        <span
                          title="Cuenta bloqueada"
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: 20, height: 20, borderRadius: 6,
                            background: isSel ? 'rgba(239,68,68,0.28)' : '#fee2e2',
                            color: isSel ? '#ff6b6b' : '#dc2626',
                          }}
                        >
                          <Lock size={11} />
                        </span>
                      )}
                      {user.requiereCambioClave && (
                        <span
                          title="Cambio de contraseña pendiente"
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: 20, height: 20, borderRadius: 6,
                            background: isSel ? 'rgba(217,119,6,0.28)' : '#fef3c7',
                            color: isSel ? '#fbbf24' : '#d97706',
                          }}
                        >
                          <Key size={11} />
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        </div>
        {/* Footer / Pagination */}
        {meta.total > 0 && (
          <div
            style={{
              flexShrink: 0, padding: '8px 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'white', margin: '0 4px 4px',
              borderRadius: '0 0 14px 14px',
              borderTop: '1px solid rgba(0,0,0,0.05)',
            }}
          >
            <span style={{ fontSize: 11, color: '#9ca3af' }}>
              {users.length} de {meta.total} usuarios
            </span>
            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    style={{
                      width: 24, height: 24, borderRadius: 6, border: 'none',
                      cursor: 'pointer', fontSize: 11, fontWeight: 600,
                      background: page === p ? '#55624a' : 'rgba(0,0,0,0.06)',
                      color: page === p ? 'white' : '#6b7280',
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Modals ────────────────────────────────────────────────────────────── */}
      <UserFormModal
        open={formModal.open}
        user={formModal.user}
        onClose={() => setFormModal({ open: false, user: null })}
      />

      {confirm && CONFIRM_CONFIGS[confirm.type] && (
        <ActionConfirm
          config={CONFIRM_CONFIGS[confirm.type]}
          onConfirm={handleConfirm}
          onCancel={() => setConfirm(null)}
          busy={confirmBusy}
        />
      )}
    </div>
  );
}
