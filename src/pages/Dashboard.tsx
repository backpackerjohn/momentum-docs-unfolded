import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { DashboardCard } from "@/components/DashboardCard";
import { Brain, Map, Bell, TrendingUp } from "lucide-react";

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (!user) return null;

  return (
    <main 
      id="main-content" 
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 lg:space-y-8"
    >
      {/* Top Row */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <DashboardCard
          variant="momentum"
          title="MOMENTUM"
          subtitle={
            <>
              transform <span className="text-primary font-semibold">big task</span> into{" "}
              <span className="text-accent font-semibold">small steps</span>
            </>
          }
          links={[
            { text: "Create a Momentum Map", onClick: () => navigate("/momentum-maps") },
            { text: "My Maps", onClick: () => navigate("/momentum-maps") },
          ]}
          className="lg:col-span-2"
        />
        <DashboardCard
          variant="progress"
          title="PROGRESS"
          subtitle={
            <>
              Track the Momentum<br />
              You've <span className="text-primary font-semibold">gained</span>
            </>
          }
          links={[
            { text: "See What You've Achieved", onClick: () => navigate("/momentum-maps") },
          ]}
          icon={TrendingUp}
        />
      </section>

      {/* Bottom Row */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        <DashboardCard
          variant="brainDump"
          title="BRAIN DUMP"
          subtitle={
            <>
              A Place to Organize<br />
              Your Random <span className="text-white font-semibold">Thoughts</span>
            </>
          }
          links={[
            { text: "Clean up my brain", onClick: () => navigate("/brain-dump") },
          ]}
          icon={Brain}
        />
        <DashboardCard
          variant="today"
          title="TODAY"
          subtitle={
            <>
              Easy Things to<br />
              Knock Out <span className="text-primary font-semibold">Today</span>
            </>
          }
          links={[
            { text: "Get Things Done Today", onClick: () => navigate("/momentum-maps") },
          ]}
        />
        <DashboardCard
          variant="scheduler"
          title="SCHEDULER"
          subtitle={
            <>
              Smart Reminders for<br />
              Building Healthy <span className="text-accent font-semibold">Habits</span>
            </>
          }
          links={[
            { text: "Let's Build Healthy Habits", onClick: () => navigate("/smart-reminders") },
          ]}
          icon={Bell}
        />
      </section>
    </main>
  );
}
