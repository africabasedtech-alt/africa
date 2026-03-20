import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Withdrawal } from "@shared/schema";
import { ArrowUpFromLine, Phone, Building2, Wallet, Clock } from "lucide-react";
import { useQuery as useQ } from "@tanstack/react-query";

const withdrawSchema = z.object({
  amount: z.string().min(1).refine((v) => Number(v) >= 50, "Minimum withdrawal is KSH 50"),
  accountDetails: z.string().min(6, "Enter your M-Pesa number or bank details"),
});

type WithdrawForm = z.infer<typeof withdrawSchema>;

interface DashboardData {
  walletBalance: number;
}

export default function WithdrawPage() {
  const { toast } = useToast();

  const { data: balance } = useQ<DashboardData>({ queryKey: ["/api/dashboard"] });
  const { data: withdrawals, isLoading } = useQuery<Withdrawal[]>({ queryKey: ["/api/withdrawals"] });

  const mpesaForm = useForm<WithdrawForm>({
    resolver: zodResolver(withdrawSchema),
    defaultValues: { amount: "", accountDetails: "" },
  });

  const bankForm = useForm<WithdrawForm>({
    resolver: zodResolver(withdrawSchema),
    defaultValues: { amount: "", accountDetails: "" },
  });

  const mutation = useMutation({
    mutationFn: async ({ method, data }: { method: string; data: WithdrawForm }) => {
      const res = await apiRequest("POST", "/api/withdrawals", {
        amount: Number(data.amount),
        method,
        accountDetails: data.accountDetails,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Withdrawal requested!", description: "Your withdrawal is being processed. Usually takes 1-24 hours." });
      mpesaForm.reset();
      bankForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: (err: Error) => {
      toast({ title: "Withdrawal failed", description: err.message, variant: "destructive" });
    },
  });

  const WithdrawForm = ({ form, method }: { form: typeof mpesaForm; method: string }) => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((d) => mutation.mutate({ method, data: d }))} className="space-y-4">
        <div className="p-3 rounded-lg bg-muted flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Available balance</span>
          </div>
          <span className="font-bold text-foreground" data-testid="text-wallet-balance">
            KSH {Number(balance?.walletBalance || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </span>
        </div>
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount (KSH)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="500" data-testid="input-withdraw-amount" {...field} />
              </FormControl>
              <FormDescription className="text-xs">Minimum withdrawal: KSH 50</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="accountDetails"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{method === "mpesa" ? "M-Pesa Number" : "Bank Account Details"}</FormLabel>
              <FormControl>
                <Input
                  placeholder={method === "mpesa" ? "+254 7XX XXX XXX" : "Bank name, Account number, Account name"}
                  data-testid="input-account-details"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={mutation.isPending} data-testid="button-submit-withdrawal">
          {mutation.isPending ? "Processing..." : "Request Withdrawal"}
        </Button>
      </form>
    </Form>
  );

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Withdraw Funds</h1>
        <p className="text-muted-foreground text-sm mt-1">Withdraw your wallet balance to your preferred method</p>
      </div>

      <Tabs defaultValue="mpesa">
        <TabsList className="w-full">
          <TabsTrigger value="mpesa" className="flex-1" data-testid="tab-mpesa">
            <Phone className="h-3.5 w-3.5 mr-1.5" /> M-Pesa
          </TabsTrigger>
          <TabsTrigger value="bank" className="flex-1" data-testid="tab-bank">
            <Building2 className="h-3.5 w-3.5 mr-1.5" /> Bank Transfer
          </TabsTrigger>
        </TabsList>
        <TabsContent value="mpesa" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" /> Withdraw via M-Pesa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <WithdrawForm form={mpesaForm} method="mpesa" />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="bank" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" /> Withdraw via Bank Transfer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <WithdrawForm form={bankForm} method="bank" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader className="flex flex-row items-center gap-1 pb-3">
          <ArrowUpFromLine className="h-4 w-4 text-primary" />
          <CardTitle className="text-base">Withdrawal History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : !withdrawals?.length ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
              No withdrawal history
            </div>
          ) : (
            <div className="space-y-2">
              {withdrawals.map((w) => (
                <div key={w.id} className="flex items-center justify-between p-3 rounded-lg bg-muted" data-testid={`withdrawal-${w.id}`}>
                  <div>
                    <p className="text-sm font-semibold text-foreground">KSH {Number(w.amount).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{w.method} · {w.accountDetails} · {new Date(w.createdAt!).toLocaleDateString()}</p>
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
  );
}
