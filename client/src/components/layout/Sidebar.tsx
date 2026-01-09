import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  LogOut,
  User,
  Settings,
  Menu,
} from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const { logoutMutation, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const NavItem = ({
    href,
    icon: Icon,
    children,
  }: {
    href: string;
    icon: any;
    children: React.ReactNode;
  }) => {
    const isActive = location === href;
    return (
      <Link
        href={href}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group font-medium",
          isActive
            ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
        )}
        onClick={() => setMobileOpen(false)}
      >
        <Icon
          className={cn(
            "w-5 h-5 transition-transform group-hover:scale-110",
            isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary"
          )}
        />
        {children}
      </Link>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-card/50 backdrop-blur-xl border-r border-border/50">
      <div className="p-6 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="text-white font-bold text-xl font-display">E</span>
          </div>
          <div>
            <h1 className="font-display font-bold text-xl tracking-tight text-foreground">
              ExpenseFlow
            </h1>
            <p className="text-xs text-muted-foreground font-medium">Retail Management</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-6 space-y-2">
        <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Main Menu
        </p>
        <NavItem href="/" icon={LayoutDashboard}>
          Dashboard
        </NavItem>
        <NavItem href="/reports" icon={FileText}>
          Reports
        </NavItem>
      </div>

      <div className="p-4 border-t border-border/40 space-y-2">
        <div className="flex items-center gap-3 px-3 py-3 mb-2 rounded-xl bg-secondary/50 border border-border/50">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
            {user?.username?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-semibold truncate text-foreground">
              {user?.username}
            </p>
            <p className="text-xs text-muted-foreground truncate">Manager</p>
          </div>
        </div>
        <button
          onClick={() => logoutMutation.mutate()}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-destructive hover:bg-destructive/10 transition-colors font-medium text-sm"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={cn("hidden md:flex w-72 flex-col fixed inset-y-0 z-50", className)}>
        <SidebarContent />
      </aside>

      {/* Mobile Trigger */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="shadow-lg rounded-full h-10 w-10">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-80 border-r-0">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
