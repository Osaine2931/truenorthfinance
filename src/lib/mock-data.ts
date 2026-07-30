export const kpis = {
  totalPortfolio: 248392.4,
  totalInvested: 184000,
  totalProfit: 64392.4,
  availableBalance: 12480.5,
  activePlans: 6,
  referralEarnings: 3240.8,
};

export const portfolioSeries = [
  { month: "Jan", value: 184000 },
  { month: "Feb", value: 187200 },
  { month: "Mar", value: 191800 },
  { month: "Apr", value: 198600 },
  { month: "May", value: 205100 },
  { month: "Jun", value: 212400 },
  { month: "Jul", value: 218900 },
  { month: "Aug", value: 224300 },
  { month: "Sep", value: 229800 },
  { month: "Oct", value: 236400 },
  { month: "Nov", value: 242100 },
  { month: "Dec", value: 248392 },
];

export const distribution = [
  { name: "Real Estate", value: 42, color: "oklch(0.62 0.17 252)" },
  { name: "Blue Chip", value: 28, color: "oklch(0.72 0.14 250)" },
  { name: "Sustainable", value: 18, color: "oklch(0.81 0.1 240)" },
  { name: "Emerging Tech", value: 12, color: "oklch(0.91 0.05 235)" },
];

export type InvestmentPlan = {
  id: string;
  name: string;
  category: string;
  minAmount: number;
  roi: string;
  duration: string;
  risk: "Low" | "Moderate" | "High";
  featured?: boolean;
};

export const investmentPlans: InvestmentPlan[] = [
  {
    id: "prime-realestate",
    name: "Prime Real Estate Fund",
    category: "Real Estate",
    minAmount: 5000,
    roi: "12–15% p.a.",
    duration: "24 months",
    risk: "Low",
    featured: true,
  },
  {
    id: "bluechip-reserve",
    name: "Blue Chip Reserve",
    category: "Equities",
    minAmount: 2500,
    roi: "9–11% p.a.",
    duration: "12 months",
    risk: "Low",
  },
  {
    id: "sustainable-energy",
    name: "Sustainable Energy Fund",
    category: "Green Growth",
    minAmount: 1000,
    roi: "8–10% p.a.",
    duration: "18 months",
    risk: "Moderate",
  },
  {
    id: "emerging-tech",
    name: "Emerging Tech Venture",
    category: "Venture",
    minAmount: 10000,
    roi: "18–24% p.a.",
    duration: "36 months",
    risk: "High",
    featured: true,
  },
  {
    id: "global-alpha",
    name: "Global Alpha Fund",
    category: "Multi-Asset",
    minAmount: 5000,
    roi: "11–14% p.a.",
    duration: "24 months",
    risk: "Moderate",
  },
  {
    id: "fixed-income",
    name: "Sovereign Fixed Income",
    category: "Bonds",
    minAmount: 1000,
    roi: "6–7% p.a.",
    duration: "12 months",
    risk: "Low",
  },
];

export const activeInvestments = [
  {
    id: "1",
    plan: "Prime Real Estate Fund",
    amount: 45000,
    progress: 68,
    roi: "+2.4%",
    status: "Active",
  },
  {
    id: "2",
    plan: "Emerging Tech Venture",
    amount: 12800,
    progress: 12,
    roi: "+8.1%",
    status: "Premium",
  },
  {
    id: "3",
    plan: "Blue Chip Reserve",
    amount: 25000,
    progress: 82,
    roi: "+1.2%",
    status: "Active",
  },
  {
    id: "4",
    plan: "Sustainable Energy Fund",
    amount: 8000,
    progress: 44,
    roi: "+3.7%",
    status: "Active",
  },
];

export const recentTransactions = [
  {
    id: "t1",
    type: "Dividend Credit",
    direction: "in" as const,
    amount: 4210.5,
    date: "May 22, 2025",
  },
  {
    id: "t2",
    type: "Capital Call",
    direction: "out" as const,
    amount: 12000,
    date: "May 18, 2025",
  },
  {
    id: "t3",
    type: "Wallet Deposit",
    direction: "in" as const,
    amount: 5000,
    date: "May 09, 2025",
  },
  {
    id: "t4",
    type: "Referral Bonus",
    direction: "in" as const,
    amount: 320.8,
    date: "May 04, 2025",
  },
  { id: "t5", type: "Withdrawal", direction: "out" as const, amount: 2500, date: "Apr 28, 2025" },
  {
    id: "t6",
    type: "Dividend Credit",
    direction: "in" as const,
    amount: 1840.0,
    date: "Apr 22, 2025",
  },
];

export const notifications = [
  {
    id: "n1",
    title: "Dividend paid",
    body: "$4,210.50 credited from Prime Real Estate Fund.",
    time: "2h ago",
    unread: true,
  },
  {
    id: "n2",
    title: "New plan available",
    body: "Sustainable Energy Fund II is now open for subscription.",
    time: "1d ago",
    unread: true,
  },
  {
    id: "n3",
    title: "KYC verified",
    body: "Your identity has been verified. All limits unlocked.",
    time: "3d ago",
    unread: false,
  },
];

export function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatCompact(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(n);
}

export const performanceSeries = [
  { month: "Jan", returns: 3.2 },
  { month: "Feb", returns: 2.6 },
  { month: "Mar", returns: 4.1 },
  { month: "Apr", returns: 3.4 },
  { month: "May", returns: 5.2 },
  { month: "Jun", returns: 4.6 },
  { month: "Jul", returns: 3.9 },
  { month: "Aug", returns: 5.8 },
];

export const recentActivities = [
  {
    id: "a1",
    title: "Subscribed to Prime Real Estate Fund",
    meta: "$45,000 · Contract #PR-8821",
    time: "Today, 09:12",
  },
  {
    id: "a2",
    title: "KYC documents approved",
    meta: "Identity verification complete",
    time: "Yesterday, 16:40",
  },
  { id: "a3", title: "Withdrawal processed", meta: "$2,500 to •••• 4417", time: "May 21, 11:05" },
  {
    id: "a4",
    title: "Referral joined",
    meta: "M. Adeyemi opened an account",
    time: "May 19, 08:31",
  },
];
