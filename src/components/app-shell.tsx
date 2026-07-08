import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LayoutGrid, Shield, LogOut, Mail, User } from "lucide-react";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { usePc } from "@/contexts/PcContext";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, isAdmin } = useAuth();
  const { activePc, setActivePc } = usePc();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const isDashboard = pathname.startsWith("/dashboard");
  const isLinks = pathname.startsWith("/links");

  // Determine Initials for Avatar
  const initials = user?.email?.substring(0, 2).toUpperCase() || "US";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-4 shadow-sm z-50">
        <div className="flex items-center gap-4 sm:gap-6">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg" style={{ background: "var(--gradient-primary)" }}>
              <Mail className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold tracking-tight text-foreground hidden sm:inline-block">SR Nexus</span>
          </Link>

          {/* Inline PC Toggle */}
          {isDashboard && (
            <div className="flex items-center bg-background/50 backdrop-blur-sm border border-border rounded-lg p-1 shadow-sm">
              <button
                onClick={() => setActivePc("PC1")}
                className={cn(
                  "px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all",
                  activePc === "PC1" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                PC1
              </button>
              <button
                onClick={() => setActivePc("PC2")}
                className={cn(
                  "px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all",
                  activePc === "PC2" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                PC2
              </button>
            </div>
          )}
        </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <nav className="flex items-center gap-1 sm:gap-2">
              <Link
                to="/dashboard"
                className={cn("flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors", pathname === "/dashboard" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground")}
              >
                <LayoutGrid className="h-4 w-4" />
                <span className="hidden sm:inline-block">Emails</span>
              </Link>
              <Link
                to="/links"
                className={cn("flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors", pathname === "/links" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground")}
              >
                <LayoutGrid className="h-4 w-4" />
                <span className="hidden sm:inline-block">Links</span>
              </Link>
              {isAdmin && (
                <Link
                  to={isLinks ? "/links-admin" : "/admin"}
                  className={cn("flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors", (pathname === "/admin" || pathname === "/links-admin") ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground")}
                >
                  <Shield className="h-4 w-4" />
                  <span className="hidden sm:inline-block">Admin</span>
                </Link>
              )}
            </nav>

          <div className="h-6 w-px bg-border hidden sm:block" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8 border border-border">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.email}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {isAdmin ? "Administrator" : "User"}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex-1 relative overflow-hidden">{children}</main>
    </div>
  );
}
