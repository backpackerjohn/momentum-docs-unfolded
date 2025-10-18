import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Loader2 } from "lucide-react";
import { CapturePanel } from "@/components/brain-dump/CapturePanel";
import { ThoughtCard } from "@/components/brain-dump/ThoughtCard";
import { useBrainDumpData } from "@/hooks/useBrainDumpData";

export default function BrainDump() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  
  const { thoughts: activeThoughts, isLoading: activeLoading } = useBrainDumpData('active');
  const { thoughts: archivedThoughts, isLoading: archivedLoading } = useBrainDumpData('archived');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setIsAuthenticated(true);
      }
    });
  }, [navigate]);

  if (!isAuthenticated) return null;

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <Brain className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Brain Dump</h1>
          <p className="text-muted-foreground">Capture thoughts without friction</p>
        </div>
      </div>

      <CapturePanel />

      <Tabs defaultValue="thoughts" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="thoughts">
            Thoughts {activeThoughts.length > 0 && `(${activeThoughts.length})`}
          </TabsTrigger>
          <TabsTrigger value="clusters">
            Clusters
          </TabsTrigger>
          <TabsTrigger value="archive">
            Archive {archivedThoughts.length > 0 && `(${archivedThoughts.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="thoughts" className="mt-6">
          {activeLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : activeThoughts.length === 0 ? (
            <div className="text-center py-12">
              <Brain className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p className="text-muted-foreground">No thoughts yet. Start dumping!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeThoughts.map((thought) => (
                <ThoughtCard key={thought.id} thought={thought} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="clusters" className="mt-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Clusters coming in Phase 3D</p>
          </div>
        </TabsContent>

        <TabsContent value="archive" className="mt-6">
          {archivedLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : archivedThoughts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No archived thoughts</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {archivedThoughts.map((thought) => (
                <ThoughtCard key={thought.id} thought={thought} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
