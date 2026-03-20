import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { RefreshCcw, Key, CheckCircle, Clock, Wallet } from "lucide-react";

const exchangeSchema = z.object({
  code: z.string().min(4, "Enter a valid exchange code"),
});

type ExchangeForm = z.infer<typeof exchangeSchema>;

interface ExchangeHistory {
  id: string;
  code: string;
  amount: string;
  createdAt: string;
}

export default function ExchangePage() {
  const { toast } = useToast();

  const { data: history, isLoading } = useQuery<ExchangeHistory[]>({
    queryKey: ["/api/exchange/history"],
  });

  const form = useForm<ExchangeForm>({
    resolver: zodResolver(exchangeSchema),
    defaultValues: { code: "" },
  });

  const mutation = useMutation({
    mutationFn: async (data: ExchangeForm) => {
      const res = await apiRequest("POST", "/api/exchange/redeem", { code: data.code });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Code redeemed!",
        description: `KSH ${Number(data.amount).toLocaleString()} has been added to your wallet balance.`,
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/exchange/history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: (err: Error) => {
      toast({ title: "Redemption failed", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="p-6 space-y-6 max-w-xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Exchange</h1>
        <p className="text-muted-foreground text-sm mt-1">Redeem exchange codes to add funds to your wallet</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Key className="h-4 w-4 text-primary" />
            Redeem Exchange Code
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 mb-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <RefreshCcw className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">How it works</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Enter a valid exchange code to instantly credit your wallet balance. Codes can only be used once.
                </p>
              </div>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exchange Code</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          className="pl-9 font-mono uppercase"
                          placeholder="e.g. ABEX-12345"
                          data-testid="input-exchange-code"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={mutation.isPending}
                data-testid="button-redeem-code"
              >
                <RefreshCcw className="h-4 w-4 mr-1.5" />
                {mutation.isPending ? "Redeeming..." : "Redeem Code"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2 pb-3">
          <Clock className="h-4 w-4 text-primary" />
          <CardTitle className="text-base">Redemption History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : !history?.length ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Wallet className="h-8 w-8 mx-auto mb-2 opacity-30" />
              No codes redeemed yet
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-muted" data-testid={`exchange-${item.id}`}>
                  <div>
                    <p className="text-sm font-mono font-medium text-foreground">{item.code}</p>
                    <p className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-green-600 dark:text-green-400">+KSH {Number(item.amount).toLocaleString()}</p>
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
