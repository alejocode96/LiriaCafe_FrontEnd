/**
 * Mapeo: clave interna del nav → nombre del módulo en el backend.
 *
 * Los nombres de módulo deben coincidir EXACTAMENTE con lo que
 * retorna GET /auth/me en rol.permisos[].modulo
 */
const MODULE_MAP = {
  dashboard:     'DASHBOARD',
  pos:           'VENTAS',
  ventas:        'VENTAS',
  caja:          'CAJA',
  flujo_caja:    'FLUJO_CAJA',
  inventario:    'INVENTARIO',
  productos:     'PRODUCTOS',
  categorias:    'PRODUCTOS',
  reportes:      'REPORTES',
  usuarios:      'USUARIOS',
  roles:         'ROLES',
  configuracion: 'ADMINISTRACION',
};

/**
 * Devuelve true si el usuario puede VER una sección del nav.
 *
 * @param {string}  key      - clave de MODULE_MAP (ej. 'caja')
 * @param {boolean} esAdmin  - si es true, siempre retorna true
 * @param {Array}   permisos - array [{ modulo, accion, permitido }]
 */
export function canAccess(key, esAdmin = false, permisos = []) {
  if (esAdmin) return true;

  const modulo = MODULE_MAP[key];
  if (!modulo) return false;

  return permisos.some(
    (p) => p.modulo === modulo && p.accion === 'VER' && p.permitido === true
  );
}

/**
 * Devuelve true si el usuario puede ejecutar una acción específica.
 *
 * @param {string}  key      - clave de MODULE_MAP
 * @param {string}  accion   - 'CREAR' | 'EDITAR' | 'ELIMINAR' | 'VER'
 * @param {boolean} esAdmin
 * @param {Array}   permisos
 */
export function canDo(key, accion, esAdmin = false, permisos = []) {
  if (esAdmin) return true;

  const modulo = MODULE_MAP[key];
  if (!modulo) return false;

  return permisos.some(
    (p) => p.modulo === modulo && p.accion === accion && p.permitido === true
  );
}