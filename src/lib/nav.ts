import {
  LayoutDashboard,
  TrendingUp,
  Briefcase,
  ArrowDownToLine,
  ArrowUpFromLine,
  Receipt,
  Users,
  Gift,
  Wallet,
  Bell,
  LifeBuoy,
  User,
  Settings,
  ShieldCheck,
} from "lucide-react";

export type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
};

export const primaryNav: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/invest", label: "Invest", icon: TrendingUp },
  { to: "/my-investments", label: "My Investments", icon: Briefcase },
  { to: "/deposit", label: "Deposit", icon: ArrowDownToLine },
  { to: "/withdraw", label: "Withdraw", icon: ArrowUpFromLine },
  { to: "/transactions", label: "Transactions", icon: Receipt },
  { to: "/wallet", label: "Wallet", icon: Wallet },
  { to: "/referrals", label: "Referral Program", icon: Users },
  { to: "/rewards", label: "Rewards", icon: Gift },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/support", label: "Support", icon: LifeBuoy },
  { to: "/profile", label: "Profile", icon: User },
  { to: "/settings", label: "Settings", icon: Settings },
];

export const adminNav: NavItem = { to: "/admin", label: "Admin Dashboard", icon: ShieldCheck };

export const bottomNav: NavItem[] = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/invest", label: "Invest", icon: TrendingUp },
  { to: "/deposit", label: "Deposit", icon: ArrowDownToLine },
  { to: "/wallet", label: "Wallet", icon: Wallet },
  { to: "/profile", label: "Profile", icon: User },
];
