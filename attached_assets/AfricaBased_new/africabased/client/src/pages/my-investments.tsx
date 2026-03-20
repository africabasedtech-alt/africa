import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Briefcase, TrendingUp, Zap, Clock, CheckCircle } from "lucide-react";

interface InvestmentWithProduct {
  id: string;
  productId: string;
  amount: string;
  dailyIncome: string;
  holdPeriod: number;
  status: string;
  lastCollectedAt: string;
  totalCollected: string;
  investedAt: string;
  productTitle: string;
  productCategory: string;
  daysElapsed: number;
  collectableToday: boolean;
  collectableAmount: string;
}

export default function MyInvestments() {
  const { toast } = useToast();

  const { data: investments, isLoading } = useQuery<InvestmentWithProduct[]>({
    queryKey: ["/api/investments"],
  });

  const collectMutation = useMutation({
    mutationFn: async (investmentId: string) => {
      const res = await apiRequest("POST", `/api/investments/collect/${investmentId}`, {});
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Income collected!", description: `KSH ${Number(data.amount).toLocaleString()} has been added to your income balance.` });
      queryClient.invalidateQueries({ queryKey: ["/api/investments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: (err: Error) => {
      toast({ title: "Collection failed", description: err.message, variant: "destructive" });
    },
  });

  const getProgress = (inv: InvestmentWithProduct) => {
    return Math.min((inv.daysElapsed / inv.holdPeriod) * 100, 100);
  };

  const getStatusColor = (status: string) => {
    if (status === "active") return "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20";
    if (status === "completed") return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
    return "bg-muted text-muted-foreground";
  };

  const activeCount = investments?.filter((i) => i.status === "active").length || 0;
  const totalDailyIncome = investments?.reduce((s, i) => s + (i.status === "active" ? Number(i.dailyIncome) : 0), 0) || 0;
  const totalCollected = investments?.reduce((s, i) => s + Number(i.totalCollected), 0) || 0;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Investments</h1>
        <p className="text-muted-foreground text-sm mt-1">Track and collect your daily investment income</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Active Investments", value: activeCount, suffix: "", color: "text-foreground", icon: Briefcase },
          { label: "Daily Income", value: totalDailyIncome.toFixed(2), suffix: "KSH", color: "text-green-600 dark:text-green-400", icon: TrendingUp },
          { label: "Total Collected", value: totalCollected.toFixed(2), suffix: "KSH", color: "text-primary", icon: Zap },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <stat.icon className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
              {isLoading ? (
                <Skeleton className="h-6 w-20" />
              ) : (
                <p className={`text-lg font-bold ${stat.color}`}>
                  {stat.suffix ? `${stat.suffix} ${Number(stat.value).toLocaleString()}` : stat.value}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
        </div>
      ) : !investments?.length ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-base font-medium">No investments yet</p>
            <p className="text-sm mt-1 mb-4">Start investing in products to earn daily income</p>
            <Button asChild>
              <a href="/products">Browse Products</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {investments.map((inv) => (
            <Card key={inv.id} data-testid={`card-investment-${inv.id}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-foreground">{inv.productTitle}</h3>
                      <Badge
                        variant="outline"
                        className={`text-xs border ${getStatusColor(inv.status)}`}
                      >
                        {inv.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Invested: {new Date(inv.investedAt).toLocaleDateString()} · {inv.holdPeriod} day hold period
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-muted-foreground">Invested</p>
                    <p className="font-bold text-foreground">KSH {Number(inv.amount).toLocaleString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-2 rounded-lg bg-muted">
                    <p className="text-xs text-muted-foreground">Daily Income</p>
                    <p className="text-sm font-bold text-green-600 dark:text-green-400">KSH {Number(inv.dailyIncome).toLocaleString()}</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-muted">
                    <p className="text-xs text-muted-foreground">Total Collected</p>
                    <p className="text-sm font-bold text-primary">KSH {Number(inv.totalCollected).toLocaleString()}</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-muted">
                    <p className="text-xs text-muted-foreground">Days Left</p>
                    <p className="text-sm font-bold text-foreground">{Math.max(0, inv.holdPeriod - inv.daysElapsed)}d</p>
                  </div>
                </div>

                <div className="space-y-1.5 mb-4">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span>{inv.daysElapsed} / {inv.holdPeriod} days</span>
                  </div>
                  <Progress value={getProgress(inv)} className="h-1.5" />
                </div>

                {inv.status === "active" && (
                  <div className="flex items-center justify-between">
                    <div>
                      {inv.collectableToday ? (
                        <div className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
                          <Zap className="h-4 w-4" />
                          <span className="font-medium">KSH {Number(inv.collectableAmount).toLocaleString()} available to collect</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>Already collected today</span>
                        </div>
                      )}
                    </div>
                    <Button
                      size="sm"
                      disabled={!inv.collectableToday || collectMutation.isPending}
                      onClick={() => collectMutation.mutate(inv.id)}
                      data-testid={`button-collect-${inv.id}`}
                      className={inv.collectableToday ? "" : "opacity-50"}
                    >
                      {collectMutation.isPending ? "Collecting..." : "Collect"}
                    </Button>
                  </div>
                )}
                {inv.status === "completed" && (
                  <div className="flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400">
                    <CheckCircle className="h-4 w-4" />
                    <span>Investment period completed</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
