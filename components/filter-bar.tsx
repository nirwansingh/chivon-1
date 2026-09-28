'use client';

import * as React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterGroup {
  id: string;
  label: string;
  options: FilterOption[];
}

interface FilterBarProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;
  filters?: FilterGroup[];
  activeFilters?: Record<string, string[]>;
  onFilterChange?: (groupId: string, values: string[]) => void;
  onClearFilters?: () => void;
  children?: React.ReactNode; // For custom filter controls like Date Pickers
}

export function FilterBar({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search...',
  filters = [],
  activeFilters = {},
  onFilterChange,
  onClearFilters,
  children,
}: FilterBarProps) {
  const hasActiveFilters = Object.values(activeFilters).some((arr) => arr.length > 0);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between w-full">
      <div className="flex flex-1 items-center space-x-2">
        {onSearchChange && (
          <div className="relative w-full sm:w-[300px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery ?? ''}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 h-9 w-full bg-background"
            />
          </div>
        )}
        
        <div className="flex flex-wrap items-center gap-2">
          {/* We can map over simple filter groups here if we implement a custom dropdown component,
              but usually these are passed via children for maximum flexibility with Shadcn select/popover */}
          {children}

          {hasActiveFilters && onClearFilters && (
            <Button
              variant="ghost"
              onClick={onClearFilters}
              className="h-8 px-2 lg:px-3 text-muted-foreground"
            >
              Clear
              <X className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
