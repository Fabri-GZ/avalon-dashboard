import { SectionKey, SECTIONS } from './sections';

export type Role = 'admin_global' | 'client_user' | 'comercial' | 'pm' | 'cm';

export const KNOWN_ROLES: Role[] = ['admin_global', 'client_user', 'comercial', 'pm', 'cm'];

// Only routes that require a specific section permission (gated routes).
// Routes not listed here are allowed by default (e.g. /dashboard/account, /dashboard/settings).
export const ROUTE_SECTION_MAP: Array<{ prefix: string; section: SectionKey }> = [
  { prefix: '/dashboard/commercial', section: SECTIONS.COMMERCIAL },
  { prefix: '/dashboard/pm',         section: SECTIONS.PM },
  { prefix: '/dashboard/website',    section: SECTIONS.WEBSITE },
  { prefix: '/dashboard/ads',        section: SECTIONS.ADS },
  { prefix: '/dashboard/social',     section: SECTIONS.SOCIAL },
  { prefix: '/dashboard/chatbot',    section: SECTIONS.CHATBOT },
  { prefix: '/dashboard/overview',   section: SECTIONS.OVERVIEW },
  { prefix: '/admin',                section: SECTIONS.ADMIN_CLIENTS },
];

export function requiredSectionFor(pathname: string): SectionKey | null {
  const hit = ROUTE_SECTION_MAP.find(r => pathname.startsWith(r.prefix));
  return hit?.section ?? null;
}

export function defaultRouteForRole(role: Role): string {
  const map: Record<Role, string> = {
    admin_global: '/dashboard/overview',
    client_user:  '/dashboard/chatbot/crm',
    cm:           '/dashboard/overview',
    pm:           '/dashboard/pm',
    comercial:    '/dashboard/commercial',
  };
  return map[role] ?? '/dashboard/overview';
}

export function isInternalRole(role: Role): boolean {
  return ['admin_global', 'pm', 'cm', 'comercial'].includes(role);
}

export type DashboardContext = {
  role: Role;
  clientId: string | null;
  allowedSections: SectionKey[];
};

export function getAllowedSections(role: Role, sectionPermissions: { role: string; section_key: string }[]): string[] {
  return sectionPermissions
    .filter(sp => sp.role === role)
    .map(sp => sp.section_key);
}

export function canAccessSection(
  sectionKey: string,
  allowedSections: string[],
  servicesContracted?: string[] | null
): boolean {
  if (!allowedSections.includes(sectionKey)) return false;
  const SERVICE_GATED = ['website', 'ads', 'social', 'chatbot'];
  if (SERVICE_GATED.includes(sectionKey) && servicesContracted !== undefined) {
    return servicesContracted?.includes(sectionKey) ?? false;
  }
  return true;
}
