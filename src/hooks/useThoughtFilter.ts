import { useState, useEffect, useMemo } from 'react';
import type { Database } from '@/integrations/supabase/types';

type Thought = Database['public']['Tables']['thoughts']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

interface ThoughtCategory {
  categories: Pick<Category, 'id' | 'name' | 'color'> | null;
}

interface ThoughtWithCategories extends Thought {
  thought_categories: ThoughtCategory[];
}

export function useThoughtFilter(thoughts: ThoughtWithCategories[]) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Debounce search term with 300ms delay as per spec
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const filteredThoughts = useMemo(() => {
    let filtered = thoughts;

    // Filter by search term
    if (debouncedSearchTerm.trim()) {
      const lowercaseSearch = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(thought =>
        thought.content.toLowerCase().includes(lowercaseSearch)
      );
    }

    // Filter by selected categories
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(thought => {
        if (!thought.thought_categories || thought.thought_categories.length === 0) return false;
        return thought.thought_categories.some(tc => 
          tc.categories && selectedCategories.includes(tc.categories.id)
        );
      });
    }

    return filtered;
  }, [thoughts, debouncedSearchTerm, selectedCategories]);

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleClearAll = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setSelectedCategories([]);
  };

  const hasActiveFilters = searchTerm.length > 0 || selectedCategories.length > 0;

  return {
    searchTerm,
    selectedCategories,
    filteredThoughts,
    hasActiveFilters,
    handleSearchChange,
    handleCategoryToggle,
    handleClearAll,
  };
}