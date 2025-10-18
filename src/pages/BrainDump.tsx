import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Loader2 } from "lucide-react";
import { CapturePanel } from "@/components/brain-dump/CapturePanel";
import { ThoughtCard } from "@/components/brain-dump/ThoughtCard";
import { FloatingActionButton } from "@/components/brain-dump/FloatingActionButton";
import { QuickCaptureModal } from "@/components/QuickCaptureModal";
import { useBrainDumpData } from "@/hooks/useBrainDumpData";

export default function BrainDump() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [categorizingThoughts, setCategorizingThoughts] = useState<Set<string>>(new Set());
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
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="mb-6">
          <h1 className="text-[30px] font-bold mb-2">Brain Dump</h1>
          <p className="text-sm text-muted-foreground">
            Capture your thoughts, let us organize them.
          </p>
        </div>

        <CapturePanel 
          onCategorizingUpdate={(thoughtIds, isCategorizing) => {
            setCategorizingThoughts(prev => {
              const next = new Set(prev);
              thoughtIds.forEach(id => {
                if (isCategorizing) {
                  next.add(id);
                } else {
                  next.delete(id);
                }
              });
              return next;
            });
          }}
        />

        <Tabs defaultValue="thoughts" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="thoughts">Thoughts</TabsTrigger>
            <TabsTrigger value="connections">Connections</TabsTrigger>
            <TabsTrigger value="clusters">Clusters</TabsTrigger>
            <TabsTrigger value="archive">Archive</TabsTrigger>
          </TabsList>

          <TabsContent value="thoughts" className="mt-6">
            {activeLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : activeThoughts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No thoughts yet. Start by capturing your first brain dump above!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeThoughts.map((thought) => (
                  <ThoughtCard 
                    key={thought.id} 
                    thought={thought}
                    isCategorizing={categorizingThoughts.has(thought.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="connections" className="mt-6">
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                AI-powered connection discovery coming soon...
              </p>
              <p className="text-sm text-muted-foreground">
                Find relationships between your thoughts
              </p>
            </div>
          </TabsContent>

          <TabsContent value="clusters" className="mt-6">
            <div className="text-center py-12">
              <p className="text-muted-foreground">Cluster system coming in Phase 3E</p>
            </div>
          </TabsContent>

          <TabsContent value="archive" className="mt-6">
            {archivedLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : archivedThoughts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No archived thoughts yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {archivedThoughts.map((thought) => (
                  <ThoughtCard 
                    key={thought.id} 
                    thought={thought}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <FloatingActionButton onClick={() => setIsQuickCaptureOpen(true)} />
      <QuickCaptureModal 
        open={isQuickCaptureOpen} 
        onOpenChange={setIsQuickCaptureOpen} 
      />
    </div>
  );
}
