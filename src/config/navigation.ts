export interface NavItem {
  label: string;
  href: string;
}

export const mainNavItems: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Competitions", href: "/competitions" },
  { label: "Dashboard", href: "/dashboard" },
];
