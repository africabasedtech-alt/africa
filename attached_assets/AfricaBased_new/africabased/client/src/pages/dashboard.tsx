import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { Link } from "wouter";
import {
  Wallet,
  TrendingUp,
  ArrowDownToLine,
  ArrowUpFromLine,
  Users,
  Briefcase,
  RefreshCcw,
  DollarSign,
  ChevronRight,
} from "lucide-react";
import type { Deposit, Withdrawal, Investment } from "@shared/schema";

interface DashboardData {
  incomeBalance: number;
  walletBalance: number;
  totalInvested: number;
  totalEarnings: number;
  recentDeposits: Deposit[];
  recentWithdrawals: Withdrawal[];
  activeInvestments: number;
}

export default function Dashboard() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
  });

  const quickActions = [
    { label: "Deposit", icon: ArrowDownToLine, href: "/deposit", color: "bg-green-500/10 text-green-600 dark:text-green-400" },
    { label: "Withdraw", icon: ArrowUpFromLine, href: "/withdraw", color: "bg-red-500/10 text-red-600 dark:text-red-400" },
    { label: "Invest", icon: TrendingUp, href: "/products", color: "bg-primary/10 text-primary" },
    { label: "Referrals", icon: Users, href: "/referrals", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
    { label: "Exchange", icon: RefreshCcw, href: "/exchange", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
    { label: "Portfolio", icon: Briefcase, href: "/my-investments", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  ];

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Welcome back, {user?.username}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Here's your investment overview</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Income Balance",
            value: data?.incomeBalance ?? 0,
            icon: DollarSign,
            color: "text-green-600 dark:text-green-400",
            bgColor: "bg-green-500/10",
            description: "Available to collect",
          },
          {
            label: "Wallet Balance",
            value: data?.walletBalance ?? 0,
            icon: Wallet,
            color: "text-blue-600 dark:text-blue-400",
            bgColor: "bg-blue-500/10",
            description: "Ready to withdraw",
          },
          {
            label: "Total Invested",
            value: data?.totalInvested ?? 0,
            icon: TrendingUp,
            color: "text-primary",
            bgColor: "bg-primary/10",
            description: "In active products",
          },
          {
            label: "Total Earnings",
            value: data?.totalEarnings ?? 0,
            icon: Briefcase,
            color: "text-purple-600 dark:text-purple-400",
            bgColor: "bg-purple-500/10",
            description: "Lifetime returns",
          },
        ].map((stat) => (
          <Card key={stat.label} data-testid={`card-${stat.label.toLowerCase().replace(/\s/g, "-")}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
                  {isLoading ? (
                    <Skeleton className="h-7 w-24 mt-1" />
                  ) : (
                    <p className={`text-xl font-bold mt-0.5 ${stat.color}`}>
                      KSH {Number(stat.value).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground/70 mt-1">{stat.description}</p>
                </div>
                <div className={`flex-shrink-0 h-9 w-9 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {quickActions.map((action) => (
              <Link key={action.label} href={action.href}>
                <div
                  className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border hover-elevate cursor-pointer transition-colors"
                  data-testid={`quick-action-${action.label.toLowerCase()}`}
                >
                  <div className={`h-10 w-10 rounded-xl ${action.color} flex items-center justify-center`}>
                    <action.icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium text-foreground">{action.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 pb-3">
            <CardTitle className="text-base">Recent Deposits</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/deposit">
                View all <ChevronRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : !data?.recentDeposits?.length ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <ArrowDownToLine className="h-8 w-8 mx-auto mb-2 opacity-30" />
                No deposits yet
              </div>
            ) : (
              <div className="space-y-2">
                {data.recentDeposits.slice(0, 5).map((d) => (
                  <div key={d.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium text-foreground">KSH {Number(d.amount).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{d.method} · {new Date(d.createdAt!).toLocaleDateString()}</p>
                    </div>
                    <Badge variant={d.status === "approved" ? "default" : d.status === "rejected" ? "destructive" : "secondary"}>
                      {d.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 pb-3">
            <CardTitle className="text-base">Recent Withdrawals</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/withdraw">
                View all <ChevronRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : !data?.recentWithdrawals?.length ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <ArrowUpFromLine className="h-8 w-8 mx-auto mb-2 opacity-30" />
                No withdrawals yet
              </div>
            ) : (
              <div className="space-y-2">
                {data.recentWithdrawals.slice(0, 5).map((w) => (
                  <div key={w.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium text-foreground">KSH {Number(w.amount).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{w.method} · {new Date(w.createdAt!).toLocaleDateString()}</p>
                    </div>
                    <Badge variant={w.status === "approved" ? "default" : w.status === "rejected" ? "destructive" : "secondary"}>
                      {w.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
