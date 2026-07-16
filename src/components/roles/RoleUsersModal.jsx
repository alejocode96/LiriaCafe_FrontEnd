import { X, Users, Loader2, UserCircle } from 'lucide-react';
import { useRoleUsers } from '../../hooks/useRolesAdmin';

export default function RoleUsersModal({ open, onClose, roleId, roleName }) {
  const { data: raw, isLoading } = useRoleUsers(open ? roleId : null);

  const users = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.data)
    ? raw.data
    : [];

  if (!open) return null;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 1100,
          background: 'rgba(0,0,0,0.22)', backdropFilter: 'blur(3px)',
        }}
      />
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1101,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20, pointerEvents: 'none',
      }}>
        <div style={{
          pointerEvents: 'auto',
          background: '#ffffff', borderRadius: 16,
          border: '1px solid #e5e7eb',
          boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
          width: '100%', maxWidth: 480,
          maxHeight: '80vh', display: 'flex', flexDirection: 'column',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '18px 20px 16px', borderBottom: '1px solid #f3f4f6',
            flexShrink: 0,
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: 'rgba(85,98,74,0.10)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Users size={16} color="#55624a" />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ color: '#111827', fontSize: 15, fontWeight: 700, margin: 0, fontFamily: "'Syne', sans-serif" }}>
                Usuarios con rol
              </h3>
              <p style={{ color: '#9ca3af', fontSize: 12, margin: 0 }}>
                {roleName}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 30, height: 30, borderRadius: 8,
                background: 'transparent', border: '1px solid #e5e7eb',
                cursor: 'pointer', color: '#9ca3af',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <X size={15} />
            </button>
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
            {isLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
                <Loader2 size={22} className="animate-spin" style={{ color: '#9ca3af' }} />
              </div>
            ) : users.length === 0 ? (
              <div style={{ padding: '32px 20px', textAlign: 'center' }}>
                <UserCircle size={32} style={{ color: '#d1d5db', marginBottom: 8 }} />
                <p style={{ color: '#9ca3af', fontSize: 13, margin: 0 }}>
                  Ningún usuario tiene asignado este rol
                </p>
              </div>
            ) : (
              users.map((u) => {
                const nombre = u.nombreCompleto ?? u.nombre ?? '—';
                const username = u.nombreUsuario ?? u.username ?? '';
                const activo = u.estado === 'ACTIVO';
                return (
                  <div
                    key={u.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 20px',
                    }}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #e8eee3 0%, #d4c84a22 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 700, color: '#55624a', flexShrink: 0,
                    }}>
                      {nombre.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: '#1f2937', fontSize: 13, fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {nombre}
                      </p>
                      {username && (
                        <p style={{ color: '#9ca3af', fontSize: 11, margin: 0 }}>
                          @{username}
                        </p>
                      )}
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '2px 8px',
                      borderRadius: 999,
                      background: activo ? 'rgba(34,197,94,0.10)' : 'rgba(239,68,68,0.10)',
                      color: activo ? '#16a34a' : '#dc2626',
                    }}>
                      {activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div style={{ flexShrink: 0, padding: '12px 20px', borderTop: '1px solid #f3f4f6' }}>
            <div style={{ color: '#9ca3af', fontSize: 12, textAlign: 'center' }}>
              {!isLoading && `${users.length} usuario${users.length !== 1 ? 's' : ''} en total`}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
