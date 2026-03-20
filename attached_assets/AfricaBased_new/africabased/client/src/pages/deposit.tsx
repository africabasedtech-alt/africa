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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Deposit } from "@shared/schema";
import { ArrowDownToLine, Phone, Receipt, Copy, CheckCircle, Clock } from "lucide-react";
import { useState } from "react";

const manualDepositSchema = z.object({
  amount: z.string().min(1, "Amount is required").refine((v) => Number(v) >= 100, "Minimum deposit is KSH 100"),
  reference: z.string().min(3, "Enter a transaction reference/ID"),
  notes: z.string().optional(),
});

type ManualDepositForm = z.infer<typeof manualDepositSchema>;

const DEPOSIT_ACCOUNT = "0700 123 456";
const DEPOSIT_NAME = "AfricaBased Technologies";

export default function DepositPage() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data: deposits, isLoading } = useQuery<Deposit[]>({
    queryKey: ["/api/deposits"],
  });

  const form = useForm<ManualDepositForm>({
    resolver: zodResolver(manualDepositSchema),
    defaultValues: { amount: "", reference: "", notes: "" },
  });

  const mutation = useMutation({
    mutationFn: async (data: ManualDepositForm) => {
      const res = await apiRequest("POST", "/api/deposits/manual", {
        amount: Number(data.amount),
        reference: data.reference,
        notes: data.notes,
        method: "manual",
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Deposit submitted!", description: "Your deposit request has been submitted and is pending review." });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/deposits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: (err: Error) => {
      toast({ title: "Deposit failed", description: err.message, variant: "destructive" });
    },
  });

  const copyAccount = () => {
    navigator.clipboard.writeText(DEPOSIT_ACCOUNT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Deposit Funds</h1>
        <p className="text-muted-foreground text-sm mt-1">Add money to your wallet to start investing</p>
      </div>

      <Tabs defaultValue="manual">
        <TabsList className="w-full">
          <TabsTrigger value="manual" className="flex-1" data-testid="tab-manual">
            <Receipt className="h-3.5 w-3.5 mr-1.5" /> Manual Transfer
          </TabsTrigger>
          <TabsTrigger value="mpesa" className="flex-1" data-testid="tab-mpesa">
            <Phone className="h-3.5 w-3.5 mr-1.5" /> M-Pesa Direct
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                Send M-Pesa to this number
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted border border-border">
                <div>
                  <p className="text-xs text-muted-foreground">M-Pesa Number</p>
                  <p className="text-lg font-bold text-foreground" data-testid="text-deposit-account">{DEPOSIT_ACCOUNT}</p>
                  <p className="text-xs text-muted-foreground">{DEPOSIT_NAME}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyAccount}
                  data-testid="button-copy-account"
                >
                  {copied ? <CheckCircle className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-3 p-2 bg-amber-500/5 border border-amber-500/15 rounded-md">
                After sending, fill in the form below with your M-Pesa reference code and the amount sent.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Submit Deposit Request</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount (KSH)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="500"
                            data-testid="input-deposit-amount"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">Minimum deposit: KSH 100</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="reference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>M-Pesa Reference Code</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. QBN7XXXXXXX"
                            data-testid="input-deposit-reference"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">The confirmation code from your M-Pesa SMS</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Notes <span className="text-muted-foreground text-xs">(optional)</span></FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Any additional information..."
                            data-testid="input-deposit-notes"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={mutation.isPending}
                    data-testid="button-submit-deposit"
                  >
                    {mutation.isPending ? "Submitting..." : "Submit Deposit Request"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mpesa" className="mt-4">
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Phone className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-base font-medium">M-Pesa Direct coming soon</p>
              <p className="text-sm mt-1">Use Manual Transfer for now</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-1 pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ArrowDownToLine className="h-4 w-4 text-primary" />
            Deposit History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : !deposits?.length ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
              No deposit history
            </div>
          ) : (
            <div className="space-y-2">
              {deposits.map((d) => (
                <div key={d.id} className="flex items-center justify-between p-3 rounded-lg bg-muted" data-testid={`deposit-${d.id}`}>
                  <div>
                    <p className="text-sm font-semibold text-foreground">KSH {Number(d.amount).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{d.method} · {d.reference} · {new Date(d.createdAt!).toLocaleDateString()}</p>
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
    </div>
  );
}
