import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { X, Search, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getCategoryColor } from "@/lib/categoryColors";
import type { Database } from "@/integrations/supabase/types";

type Category = Database['public']['Tables']['categories']['Row'];

interface FilterPanelProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedCategories: string[];
  onCategoryToggle: (categoryId: string) => void;
  onClearAll: () => void;
  className?: string;
}

export function FilterPanel({
  searchTerm,
  onSearchChange,
  selectedCategories,
  onCategoryToggle,
  onClearAll,
  className = ""
}: FilterPanelProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const hasActiveFilters = searchTerm.length > 0 || selectedCategories.length > 0;

  return (
    <Card className={`p-4 space-y-4 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-4 w-4" />
        <h3 className="text-h3">Filter Thoughts</h3>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search thoughts..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSearchChange('')}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Categories Filter */}
      <div className="space-y-2">
        <h4 className="text-body font-medium">Categories</h4>
        
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-6 bg-muted rounded animate-pulse" />
            <div className="h-6 bg-muted rounded animate-pulse w-3/4" />
          </div>
        ) : categories.length === 0 ? (
          <p className="text-caption text-muted-foreground">
            No categories yet. Create some by adding thoughts!
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const isSelected = selectedCategories.includes(category.id);
              return (
                <Button
                  key={category.id}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => onCategoryToggle(category.id)}
                  className={`text-ui-label ${
                    isSelected
                      ? "text-white"
                      : "hover:bg-muted"
                  }`}
                  style={
                    isSelected
                      ? {
                          backgroundColor: category.color || getCategoryColor(category.name),
                          borderColor: category.color || getCategoryColor(category.name),
                        }
                      : undefined
                  }
                >
                  {category.name}
                </Button>
              );
            })}
          </div>
        )}
      </div>

      {/* Clear All Button */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="w-full text-ui-label"
        >
          Clear All Filters
        </Button>
      )}

      {/* Active Filter Summary */}
      {hasActiveFilters && (
        <div className="pt-2 border-t">
          <div className="space-y-2">
            {searchTerm && (
              <Badge variant="secondary" className="text-ui-label">
                Search: "{searchTerm}"
              </Badge>
            )}
            {selectedCategories.length > 0 && (
              <Badge variant="secondary" className="text-ui-label">
                {selectedCategories.length} category{selectedCategories.length !== 1 ? 'ies' : ''} selected
              </Badge>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}