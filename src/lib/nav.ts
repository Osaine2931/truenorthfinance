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
  { to: "/referrals", label: "Referrals", icon: Users },
  { to: "/rewards", label: "Rewards", icon: Gift },
  { to: "/wallet", label: "Wallet", icon: Wallet },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/support", label: "Support", icon: LifeBuoy },
  { to: "/profile", label: "Profile", icon: User },
  { to: "/settings", label: "Settings", icon: Settings },
];

export const bottomNav: NavItem[] = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/invest", label: "Invest", icon: TrendingUp },
  { to: "/wallet", label: "Wallet", icon: Wallet },
  { to: "/referrals", label: "Refer", icon: Users },
  { to: "/profile", label: "Profile", icon: User },
];
