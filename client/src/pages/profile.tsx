import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { User, Phone, Mail, Lock, Shield, Calendar } from "lucide-react";
import { useEffect } from "react";

const profileSchema = z.object({
  username: z.string().min(3).max(30),
  phone: z.string().min(9),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

interface MeResponse {
  id: string;
  username: string;
  email: string;
  phone: string;
  referralCode: string;
  role: string;
  createdAt: string;
  profile: { incomeBalance: string; walletBalance: string; totalInvested: string; totalEarnings: string };
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();

  const { data: me } = useQuery<MeResponse>({ queryKey: ["/api/auth/me"] });

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { username: user?.username || "", phone: user?.phone || "" },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  useEffect(() => {
    if (me) {
      profileForm.reset({ username: me.username, phone: me.phone });
    }
  }, [me]);

  const profileMutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      const res = await apiRequest("PUT", "/api/profile", data);
      return res.json();
    },
    onSuccess: (data) => {
      updateUser({ ...user!, ...data.user });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "Profile updated!" });
    },
    onError: (err: Error) => {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    },
  });

  const passwordMutation = useMutation({
    mutationFn: async (data: PasswordForm) => {
      const res = await apiRequest("PUT", "/api/profile/password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      return res.json();
    },
    onSuccess: () => {
      passwordForm.reset();
      toast({ title: "Password changed!", description: "Your password has been updated successfully." });
    },
    onError: (err: Error) => {
      toast({ title: "Password change failed", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account information</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                {user?.username?.slice(0, 2).toUpperCase() || "AB"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-lg font-bold text-foreground" data-testid="text-username">{user?.username}</h2>
              <p className="text-sm text-muted-foreground" data-testid="text-email">{user?.email}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <Shield className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs text-primary capitalize">{user?.role || "user"}</span>
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Income Balance", value: `KSH ${Number(me?.profile?.incomeBalance || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`, color: "text-green-600 dark:text-green-400" },
              { label: "Wallet Balance", value: `KSH ${Number(me?.profile?.walletBalance || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`, color: "text-blue-600 dark:text-blue-400" },
              { label: "Total Invested", value: `KSH ${Number(me?.profile?.totalInvested || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`, color: "text-primary" },
              { label: "Total Earnings", value: `KSH ${Number(me?.profile?.totalEarnings || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`, color: "text-purple-600 dark:text-purple-400" },
            ].map((stat) => (
              <div key={stat.label} className="p-3 rounded-lg bg-muted">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className={`text-sm font-bold ${stat.color} mt-0.5`}>{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>Member since {me?.createdAt ? new Date(me.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long" }) : "—"}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4 text-primary" /> Edit Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit((d) => profileMutation.mutate(d))} className="space-y-4">
              <FormField
                control={profileForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input className="pl-9" data-testid="input-username" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div>
                <label className="text-sm font-medium text-foreground">Email</label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-9" value={me?.email || ""} disabled />
                </div>
              </div>
              <FormField
                control={profileForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input className="pl-9" data-testid="input-phone" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={profileMutation.isPending} data-testid="button-save-profile">
                {profileMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-4 w-4 text-primary" /> Change Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit((d) => passwordMutation.mutate(d))} className="space-y-4">
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <Input type="password" data-testid="input-current-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="At least 8 characters" data-testid="input-new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input type="password" data-testid="input-confirm-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" variant="outline" disabled={passwordMutation.isPending} data-testid="button-change-password">
                {passwordMutation.isPending ? "Changing..." : "Change Password"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
