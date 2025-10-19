import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Brain } from "lucide-react";
import { CapturePanel } from "@/components/brain-dump/CapturePanel";
import { ThoughtCard } from "@/components/brain-dump/ThoughtCard";
import { FloatingActionButton } from "@/components/brain-dump/FloatingActionButton";
import { QuickCaptureModal } from "@/components/QuickCaptureModal";
import { ThoughtCardSkeleton } from "@/components/ui/skeleton";
import { FilterPanel } from "@/components/brain-dump/FilterPanel";
import { ClusterCard } from "@/components/brain-dump/ClusterCard";
import { ConnectionCard } from "@/components/brain-dump/ConnectionCard";
import { useBrainDumpData } from "@/hooks/useBrainDumpData";
import { toast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { useThoughtFilter } from "@/hooks/useThoughtFilter";
import { useClusterData } from "@/hooks/useClusterData";

export default function BrainDump() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [categorizingThoughts, setCategorizingThoughts] = useState<Set<string>>(new Set());
  const [connections, setConnections] = useState<any[]>([]);
  const [isLoadingConnections, setIsLoadingConnections] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedThoughts, setSelectedThoughts] = useState<Set<string>>(new Set());
  const [isPerformingBulkAction, setIsPerformingBulkAction] = useState(false);
  const navigate = useNavigate();
  
  const { thoughts: activeThoughts, isLoading: activeLoading, refetch: refetchActive } = useBrainDumpData('active');
  const { thoughts: archivedThoughts, isLoading: archivedLoading, refetch: refetchArchived } = useBrainDumpData('archived');
  const { clusters, isLoading: clustersLoading, refetch: refetchClusters } = useClusterData();
  
  // Filter functionality for active thoughts
  const {
    searchTerm,
    selectedCategories,
    filteredThoughts,
    hasActiveFilters,
    handleSearchChange,
    handleCategoryToggle,
    handleClearAll,
  } = useThoughtFilter(activeThoughts);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setIsAuthenticated(true);
      }
    });
  }, [navigate]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd/Ctrl+K - Open quick capture
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setIsQuickCaptureOpen(true);
      }
      
      // Cmd/Ctrl+A - Select all (in selection mode)
      if ((event.metaKey || event.ctrlKey) && event.key === 'a' && isSelectionMode) {
        event.preventDefault();
        handleSelectAll();
      }
      
      // Escape - Cancel selection mode or clear filters
      if (event.key === 'Escape') {
        if (isSelectionMode) {
          setIsSelectionMode(false);
          setSelectedThoughts(new Set());
        } else if (hasActiveFilters) {
          handleClearAll();
        }
      }
      
      // Delete - Archive selected (with confirmation)
      if (event.key === 'Delete' && selectedThoughts.size > 0) {
        event.preventDefault();
        if (confirm(`Archive ${selectedThoughts.size} selected thoughts?`)) {
          handleBulkArchive();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSelectionMode, selectedThoughts, hasActiveFilters]);//eslint-disable-line

  async function handleRunConnections() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setIsLoadingConnections(true);
    setConnections([]);

    try {
      const { data, error } = await supabase.functions.invoke('find-connections', {
        body: { userId: user.id }
      });

      if (error) throw error;

      if (data?.success) {
        setConnections(data.connections || []);
        toast({
          title: `Found ${data.connections?.length || 0} connections`,
          description: data.connections?.length > 0 
            ? "Discover relationships between your thoughts"
            : "Try adding more thoughts to find connections"
        });
      } else {
        throw new Error(data?.error || 'Failed to find connections');
      }
    } catch (error) {
      console.error('Error finding connections:', error);
      toast({
        title: "Failed to find connections",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsLoadingConnections(false);
    }
  }

  function handleToggleSelectionMode() {
    setIsSelectionMode(!isSelectionMode);
    setSelectedThoughts(new Set());
  }

  function handleToggleThoughtSelection(thoughtId: string) {
    setSelectedThoughts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(thoughtId)) {
        newSet.delete(thoughtId);
      } else {
        newSet.add(thoughtId);
      }
      return newSet;
    });
  }

  function handleSelectAll() {
    const allThoughtIds = new Set(filteredThoughts.map(t => t.id));
    setSelectedThoughts(allThoughtIds);
  }

  async function handleBulkArchive() {
    if (selectedThoughts.size === 0) return;

    setIsPerformingBulkAction(true);
    try {
      const thoughtIds = Array.from(selectedThoughts);
      
      const { error } = await supabase
        .from('thoughts')
        .update({ status: 'archived', archived_at: new Date().toISOString() })
        .in('id', thoughtIds);

      if (error) throw error;

      toast({
        title: `${thoughtIds.length} thoughts moved to Archive`,
        description: "Undo?",
        action: (
          <ToastAction 
            altText="Undo" 
            onClick={async () => {
              await supabase
                .from('thoughts')
                .update({ status: 'active', archived_at: null })
                .in('id', thoughtIds);
              
              toast({ title: "Thoughts restored" });
            }}
          >
            Undo
          </ToastAction>
        ),
        duration: 12000,
      });
      
      setSelectedThoughts(new Set());
      setIsSelectionMode(false);
    } catch (error) {
      console.error('Error archiving thoughts:', error);
      toast({ title: "Failed to archive thoughts", variant: "destructive" });
    } finally {
      setIsPerformingBulkAction(false);
    }
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen p-4" role="main" aria-label="Brain Dump Application">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="mb-4">
          <h1 className="text-h1 mb-2">Brain Dump</h1>
          <p className="text-body text-muted-foreground">
            Capture your thoughts, let us organize them. Press Ctrl+K to quickly add thoughts.
          </p>
        </div>

        <CapturePanel 
          onRefetch={refetchActive}
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
            <TabsTrigger value="thoughts">
              Thoughts {hasActiveFilters && `(${filteredThoughts.length})`}
            </TabsTrigger>
            <TabsTrigger value="connections">Connections</TabsTrigger>
            <TabsTrigger value="clusters">Clusters</TabsTrigger>
            <TabsTrigger value="archive">Archive</TabsTrigger>
          </TabsList>

          <TabsContent value="thoughts" className="mt-6">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Filter Panel - Right sidebar on desktop, top on mobile */}
              <div className="lg:order-2 lg:w-80 lg:flex-shrink-0 space-y-4">
                <FilterPanel
                  searchTerm={searchTerm}
                  onSearchChange={handleSearchChange}
                  selectedCategories={selectedCategories}
                  onCategoryToggle={handleCategoryToggle}
                  onClearAll={handleClearAll}
                  className="lg:sticky lg:top-4"
                />
                
                {/* Selection Controls */}
                <div className="lg:sticky lg:top-80">
                  <div className="bg-card border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-body font-medium">Bulk Actions</h4>
                      <Button
                        variant={isSelectionMode ? "default" : "outline"}
                        size="sm"
                        onClick={handleToggleSelectionMode}
                        disabled={filteredThoughts.length === 0}
                      >
                        {isSelectionMode ? "Cancel" : "Select"}
                      </Button>
                    </div>
                    
                    {isSelectionMode && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-caption text-muted-foreground">
                          <span>{selectedThoughts.size} selected</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleSelectAll}
                            className="h-auto p-0 text-caption"
                          >
                            Select All
                          </Button>
                        </div>
                        
                        {selectedThoughts.size > 0 && (
                          <div className="space-y-2">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={handleBulkArchive}
                              disabled={isPerformingBulkAction}
                              className="w-full text-ui-label"
                            >
                              {isPerformingBulkAction ? "Archiving..." : `Archive ${selectedThoughts.size} thoughts`}
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Thoughts Grid */}
              <div className="lg:order-1 flex-1">
                {activeLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <ThoughtCardSkeleton key={index} />
                    ))}
                  </div>
                ) : activeThoughts.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Brain className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-h3 mb-2">No thoughts yet</h3>
                    <p className="text-body">Start by capturing your first brain dump above!</p>
                  </div>
                ) : filteredThoughts.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Brain className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-h3 mb-2">No thoughts match your filters</h3>
                    <p className="text-body">Try adjusting your search or category filters</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredThoughts.map((thought) => (
                      <ThoughtCard 
                        key={thought.id} 
                        thought={thought}
                        isCategorizing={categorizingThoughts.has(thought.id)}
                        isSelectionMode={isSelectionMode}
                        isSelected={selectedThoughts.has(thought.id)}
                        onToggleSelection={handleToggleThoughtSelection}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="connections" className="mt-6">
            <div className="space-y-6">
              {/* Run Connections Button */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                  <h3 className="text-h3 mb-1">Discover Connections</h3>
                  <p className="text-body text-muted-foreground">
                    AI will analyze your thoughts to find meaningful relationships
                  </p>
                </div>
                <Button
                  onClick={handleRunConnections}
                  disabled={isLoadingConnections || activeThoughts.length < 2}
                  className="min-w-40"
                >
                  {isLoadingConnections ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                      Finding connections...
                    </>
                  ) : (
                    'Run Connections'
                  )}
                </Button>
              </div>

              {/* Connections Results */}
              {isLoadingConnections ? (
                <div className="space-y-4">
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="animate-pulse text-body mb-2">🔍 Finding connections in your thoughts...</div>
                    <p className="text-caption">This may take a few moments</p>
                  </div>
                </div>
              ) : connections.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Brain className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-h3 mb-2">No connections found yet</h3>
                  <p className="text-body mb-4">
                    {activeThoughts.length < 2 
                      ? "You need at least 2 thoughts to find connections"
                      : "Click 'Run Connections' to discover relationships between your thoughts"
                    }
                  </p>
                  <p className="text-caption">AI will analyze your thoughts for related topics, themes, and patterns</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-body text-muted-foreground">
                      Found {connections.length} connection{connections.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  {connections.map((connection, index) => (
                    <ConnectionCard key={index} connection={connection} />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="clusters" className="mt-6">
            {clustersLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="p-4 border rounded-md">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-4 w-4 bg-muted rounded animate-pulse" />
                      <div className="h-5 bg-muted rounded animate-pulse flex-1 max-w-48" />
                    </div>
                    <div className="h-2 bg-muted rounded animate-pulse max-w-40" />
                  </div>
                ))}
              </div>
            ) : clusters.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Brain className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-h3 mb-2">No clusters yet</h3>
                <p className="text-body mb-4">Clusters help you group related thoughts into projects</p>
                <p className="text-caption">Create clusters by selecting multiple thoughts and using bulk actions</p>
              </div>
            ) : (
              <div className="space-y-4">
                {clusters.map((cluster) => (
                  <ClusterCard
                    key={cluster.id}
                    cluster={cluster}
                    onUpdate={refetchClusters}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="archive" className="mt-6">
            {archivedLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 2 }).map((_, index) => (
                  <ThoughtCardSkeleton key={index} />
                ))}
              </div>
            ) : archivedThoughts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <h3 className="text-h3 mb-2">No archived thoughts yet</h3>
                <p className="text-body">Completed thoughts will appear here</p>
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
