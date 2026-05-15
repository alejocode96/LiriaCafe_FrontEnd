// Mapa de acceso por sección y rol
const MENU_PERMISSIONS = {
  dashboard:   ['Administrador', 'Supervisor', 'Cajero'],
  pos:         ['Administrador', 'Supervisor', 'Cajero', 'Mesero'],
  tables:      ['Administrador', 'Supervisor', 'Cajero', 'Mesero'],
  orders:      ['Administrador', 'Supervisor', 'Cajero', 'Mesero'],
  cash:        ['Administrador', 'Supervisor', 'Cajero'],
  cashHistory: ['Administrador', 'Supervisor'],
  products:    ['Administrador', 'Supervisor'],
  ingredients: ['Administrador', 'Supervisor'],
  losses:      ['Administrador', 'Supervisor'],
  reports:     ['Administrador', 'Supervisor'],
  users:       ['Administrador'],
  categories:  ['Administrador', 'Supervisor'],
  settings:    ['Administrador'],
  audit:       ['Administrador'],
};

export const canAccess = (section, userRole) => {
  return MENU_PERMISSIONS[section]?.includes(userRole) ?? false;
};