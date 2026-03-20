import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Users, Copy, CheckCircle, Zap, TrendingUp, Gift } from "lucide-react";
import { useState } from "react";

interface ReferralData {
  referralCode: string;
  referralLink: string;
  totalReferrals: number;
  pendingEarnings: number;
  collectedEarnings: number;
  referredUsers: Array<{
    username: string;
    joinedAt: string;
    status: string;
  }>;
  commissionTiers: Array<{
    level: string;
    label: string;
    minReferrals: number;
    rate: number;
    description: string;
    active: boolean;
  }>;
}

const tierColors: Record<string, string> = {
  active: "border-green-500/20 bg-green-500/5",
  basic: "border-amber-500/20 bg-amber-500/5",
  premium: "border-purple-500/20 bg-purple-500/5",
  gold: "border-yellow-500/20 bg-yellow-500/5",
};

const tierTextColors: Record<string, string> = {
  active: "text-green-600 dark:text-green-400",
  basic: "text-amber-600 dark:text-amber-400",
  premium: "text-purple-600 dark:text-purple-400",
  gold: "text-yellow-600 dark:text-yellow-400",
};

export default function Referrals() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useQuery<ReferralData>({
    queryKey: ["/api/referral"],
  });

  const collectMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/referral/collect", {});
      return res.json();
    },
    onSuccess: (res) => {
      toast({ title: "Earnings collected!", description: `KSH ${Number(res.amount).toLocaleString()} has been added to your income balance.` });
      queryClient.invalidateQueries({ queryKey: ["/api/referral"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: (err: Error) => {
      toast({ title: "Collection failed", description: err.message, variant: "destructive" });
    },
  });

  const copyLink = () => {
    const link = data?.referralLink || `${window.location.origin}/register?ref=${data?.referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied!", description: "Referral link copied to clipboard." });
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Referrals</h1>
        <p className="text-muted-foreground text-sm mt-1">Invite friends and earn commissions on their investments</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: "Total Referrals",
            value: isLoading ? null : data?.totalReferrals ?? 0,
            icon: Users,
            color: "text-blue-600 dark:text-blue-400",
            bg: "bg-blue-500/10",
          },
          {
            label: "Pending Earnings",
            value: isLoading ? null : `KSH ${Number(data?.pendingEarnings ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
            icon: Zap,
            color: "text-amber-600 dark:text-amber-400",
            bg: "bg-amber-500/10",
          },
          {
            label: "Total Collected",
            value: isLoading ? null : `KSH ${Number(data?.collectedEarnings ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
            icon: TrendingUp,
            color: "text-green-600 dark:text-green-400",
            bg: "bg-green-500/10",
          },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`h-8 w-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
              {isLoading || stat.value === null ? (
                <Skeleton className="h-6 w-24" />
              ) : (
                <p className={`text-lg font-bold ${stat.color}`} data-testid={`stat-${stat.label.toLowerCase().replace(/\s/g, "-")}`}>
                  {stat.value}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Gift className="h-4 w-4 text-primary" />
            Your Referral Link
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted border border-border">
            <code className="flex-1 text-xs font-mono text-muted-foreground truncate" data-testid="text-referral-link">
              {isLoading ? "Loading..." : `${window.location.origin}/register?ref=${data?.referralCode}`}
            </code>
            <Button size="sm" variant="outline" onClick={copyLink} data-testid="button-copy-referral">
              {copied ? <CheckCircle className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Referral Code</p>
              <p className="text-2xl font-bold tracking-widest text-primary" data-testid="text-referral-code">
                {isLoading ? "------" : data?.referralCode}
              </p>
            </div>
            {(data?.pendingEarnings ?? 0) > 0 && (
              <Button onClick={() => collectMutation.mutate()} disabled={collectMutation.isPending} data-testid="button-collect-referral">
                <Zap className="h-4 w-4 mr-1.5" />
                {collectMutation.isPending ? "Collecting..." : `Collect KSH ${Number(data?.pendingEarnings ?? 0).toLocaleString()}`}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Commission Tiers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-3">
            {isLoading ? (
              [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)
            ) : (
              (data?.commissionTiers || []).map((tier) => (
                <div
                  key={tier.level}
                  className={`p-4 rounded-xl border ${tierColors[tier.level] || "border-border bg-muted"} ${tier.active ? "ring-1 ring-primary/30" : ""}`}
                  data-testid={`tier-${tier.level}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-foreground capitalize">{tier.label}</h4>
                    {tier.active && <Badge className="text-xs">Current</Badge>}
                  </div>
                  <p className={`text-2xl font-bold ${tierTextColors[tier.level] || "text-foreground"}`}>
                    {tier.rate}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{tier.description}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Min {tier.minReferrals} referrals</p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Referred Users ({data?.totalReferrals || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : !data?.referredUsers?.length ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
              No referrals yet. Share your link to invite friends!
            </div>
          ) : (
            <div className="space-y-2">
              {data.referredUsers.map((u, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <div>
                    <p className="text-sm font-medium text-foreground">{u.username}</p>
                    <p className="text-xs text-muted-foreground">Joined {new Date(u.joinedAt).toLocaleDateString()}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">{u.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
