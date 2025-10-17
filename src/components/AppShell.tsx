import { useState, useEffect } from "react";
import { Outlet, useNavigate, NavLink } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { User, Session } from "@supabase/supabase-js";
import { Brain, Map, Bell, Home, LogOut, Menu, X, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { QuickCaptureModal } from "@/components/QuickCaptureModal";

export default function AppShell() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [quickCaptureOpen, setQuickCaptureOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out successfully",
    });
    navigate("/auth");
  };

  if (!user) {
    return null;
  }

  const navLinks = [
    { to: "/momentum-maps", label: "Maps", icon: Map },
    { to: "/", label: "Progress", icon: Home },
    { to: "/brain-dump", label: "Brain Dump", icon: Brain },
    { to: "/smart-reminders", label: "Scheduler", icon: Bell },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Momentum
            </h2>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === "/"}
                  className={({ isActive }) =>
                    `flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary ${
                      isActive ? "text-primary" : "text-muted-foreground"
                    }`
                  }
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Button 
              onClick={() => navigate("/momentum-maps")} 
              variant="default"
              size="sm"
              className="gap-1"
            >
              <Plus className="h-4 w-4" />
              New Task
            </Button>
            <Button 
              onClick={() => setQuickCaptureOpen(true)}
              variant="default"
              size="sm"
              className="gap-1 bg-dashboard-brainDump hover:bg-dashboard-brainDump/90"
            >
              <Plus className="h-4 w-4" />
              Brain Dump
            </Button>
            <Button onClick={handleSignOut} variant="ghost" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t">
            <nav className="container py-4 flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2 pb-2 mb-2 border-b">
                <Button 
                  onClick={() => {
                    navigate("/momentum-maps");
                    setMobileMenuOpen(false);
                  }}
                  variant="default"
                  size="sm"
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Task
                </Button>
                <Button 
                  onClick={() => {
                    setQuickCaptureOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  size="sm"
                  className="w-full bg-dashboard-brainDump hover:bg-dashboard-brainDump/90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Brain Dump
                </Button>
              </div>
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === "/"}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted"
                    }`
                  }
                >
                  <link.icon className="h-5 w-5" />
                  {link.label}
                </NavLink>
              ))}
              <div className="border-t pt-2 mt-2">
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  {user.email}
                </div>
                <Button
                  onClick={handleSignOut}
                  variant="ghost"
                  className="w-full justify-start"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Quick Capture Modal */}
      <QuickCaptureModal 
        open={quickCaptureOpen} 
        onOpenChange={setQuickCaptureOpen} 
      />
    </div>
  );
}
