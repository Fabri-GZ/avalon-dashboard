export const SECTIONS = {
  OVERVIEW:      'overview',
  WEBSITE:       'website',
  ADS:           'ads',
  SOCIAL:        'social',
  CHATBOT:       'chatbot',
  COMMERCIAL:    'commercial',
  PM:            'pm',
  ACCOUNT:       'account',
  ADMIN_CLIENTS: 'admin_clients',
  SETTINGS:      'settings',
} as const;

export type SectionKey = typeof SECTIONS[keyof typeof SECTIONS];

export const NAV_ITEMS = [
  { id: SECTIONS.OVERVIEW,      name: 'Resumen',    icon: 'RxDashboard',    href: '/dashboard/overview' },
  { id: SECTIONS.WEBSITE,       name: 'Web',        icon: 'FiGlobe',        href: '/dashboard/website' },
  { id: SECTIONS.ADS,           name: 'Ads',        icon: 'FiDollarSign',   href: '/dashboard/ads' },
  { id: SECTIONS.SOCIAL,        name: 'Redes',      icon: 'FiShare2',       href: '/dashboard/social' },
  { id: SECTIONS.CHATBOT,       name: 'Bot',        icon: 'FiMessageSquare',href: '/dashboard/chatbot' },
  { id: SECTIONS.COMMERCIAL,    name: 'Comercial',  icon: 'FiBriefcase',    href: '/dashboard/commercial' },
  { id: SECTIONS.PM,            name: 'Proyectos',  icon: 'FiClipboard',    href: '/dashboard/pm' },
  { id: SECTIONS.ACCOUNT,       name: 'Cuenta',     icon: 'FiUser',         href: '/dashboard/account' },
  { id: SECTIONS.ADMIN_CLIENTS, name: 'Clientes',   icon: 'FiUsers',        href: '/admin/clients' },
  { id: SECTIONS.SETTINGS,      name: 'Ajustes',    icon: 'FiSettings',     href: '/dashboard/settings' },
] as const;
