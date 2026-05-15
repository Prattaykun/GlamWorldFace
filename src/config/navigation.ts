export interface NavItem {
  label: string;
  href: string;
}

/**
 * Public-facing nav items shown in the site header for all users.
 * Admin-specific links live entirely in /admin, not here.
 * Dashboard is surfaced via the UserMenu dropdown instead.
 */
export const mainNavItems: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Competitions", href: "/competitions" },
];
