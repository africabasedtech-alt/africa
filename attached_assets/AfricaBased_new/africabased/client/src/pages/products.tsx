import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Product } from "@shared/schema";
import { TrendingUp, Clock, DollarSign, Zap } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";

const categoryColors: Record<string, string> = {
  standard: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  premium: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  gold: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  vip: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
};

export default function Products() {
  const { toast } = useToast();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products/active"],
  });

  const investMutation = useMutation({
    mutationFn: async (productId: string) => {
      const res = await apiRequest("POST", "/api/invest", { productId });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Investment successful!", description: "You've successfully invested in this product." });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/investments"] });
      setSelectedProduct(null);
    },
    onError: (err: Error) => {
      toast({ title: "Investment failed", description: err.message, variant: "destructive" });
    },
  });

  const dailyReturn = (product: Product) => {
    const income = Number(product.dailyIncome);
    const price = Number(product.price);
    if (!price) return 0;
    return ((income / price) * 100).toFixed(1);
  };

  const totalReturn = (product: Product) => {
    return (Number(product.dailyIncome) * product.holdPeriod).toFixed(2);
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Investment Products</h1>
        <p className="text-muted-foreground text-sm mt-1">Choose a product to start earning daily income</p>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      ) : !products?.length ? (
        <div className="text-center py-16 text-muted-foreground">
          <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-base font-medium">No products available</p>
          <p className="text-sm mt-1">Check back later for new investment opportunities</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="group rounded-xl border border-border bg-card hover-elevate transition-all cursor-pointer"
              onClick={() => setSelectedProduct(product)}
              data-testid={`card-product-${product.id}`}
            >
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <Badge
                    className={`text-xs border ${categoryColors[product.category || "standard"] || categoryColors.standard}`}
                    variant="outline"
                  >
                    {product.category || "standard"}
                  </Badge>
                </div>

                <div>
                  <h3 className="font-bold text-foreground text-base">{product.title}</h3>
                  {product.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{product.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-2 rounded-lg bg-muted">
                    <p className="text-xs text-muted-foreground mb-0.5">Price</p>
                    <p className="text-sm font-bold text-foreground">KSH {Number(product.price).toLocaleString()}</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-green-500/5 border border-green-500/10">
                    <p className="text-xs text-muted-foreground mb-0.5">Daily</p>
                    <p className="text-sm font-bold text-green-600 dark:text-green-400">{dailyReturn(product)}%</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-muted">
                    <p className="text-xs text-muted-foreground mb-0.5">Days</p>
                    <p className="text-sm font-bold text-foreground">{product.holdPeriod}d</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-border">
                  <div>
                    <p className="text-xs text-muted-foreground">Daily Income</p>
                    <p className="text-sm font-bold text-green-600 dark:text-green-400">
                      +KSH {Number(product.dailyIncome).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Total Return</p>
                    <p className="text-sm font-bold text-primary">
                      KSH {Number(totalReturn(product)).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-5 pb-4">
                <Button
                  className="w-full"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); setSelectedProduct(product); }}
                  data-testid={`button-invest-${product.id}`}
                >
                  <Zap className="h-3.5 w-3.5 mr-1.5" />
                  Invest Now
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        {selectedProduct && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedProduct.title}</DialogTitle>
              <DialogDescription>{selectedProduct.description}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <DollarSign className="h-3.5 w-3.5" /> Investment Amount
                  </div>
                  <p className="font-bold text-foreground">KSH {Number(selectedProduct.price).toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/10 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <TrendingUp className="h-3.5 w-3.5" /> Daily Income
                  </div>
                  <p className="font-bold text-green-600 dark:text-green-400">KSH {Number(selectedProduct.dailyIncome).toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" /> Hold Period
                  </div>
                  <p className="font-bold text-foreground">{selectedProduct.holdPeriod} days</p>
                </div>
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Zap className="h-3.5 w-3.5" /> Total Return
                  </div>
                  <p className="font-bold text-primary">KSH {Number(totalReturn(selectedProduct)).toLocaleString()}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                The investment amount (KSH {Number(selectedProduct.price).toLocaleString()}) will be deducted from your wallet balance. Make sure you have sufficient funds deposited before investing.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedProduct(null)}>Cancel</Button>
              <Button
                onClick={() => investMutation.mutate(selectedProduct.id)}
                disabled={investMutation.isPending}
                data-testid="button-confirm-invest"
              >
                {investMutation.isPending ? "Processing..." : "Confirm Investment"}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
