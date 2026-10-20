'use client';

import * as React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Filter } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

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
  children?: React.ReactNode;
}

export function FilterBar({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search...',
  activeFilters = {},
  onClearFilters,
  children,
}: FilterBarProps) {
  const hasActiveFilters = Object.values(activeFilters).some((arr) => arr.length > 0);
  const isMobile = useIsMobile();

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

        {isMobile && children ? (
          <Sheet>
            <SheetTrigger render={
              <Button variant="outline" size="sm" className="h-9 w-9 p-0 shrink-0 relative" />
            }>
              <Filter className="h-4 w-4" />
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary" />
              )}
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-xl max-h-[85vh] overflow-y-auto">
              <SheetHeader className="mb-4">
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4">
                {children}
                {hasActiveFilters && onClearFilters && (
                  <Button variant="outline" onClick={onClearFilters} className="w-full mt-2">
                    Clear all filters
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        ) : (
          <div className="hidden sm:flex flex-wrap items-center gap-2">
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
        )}
      </div>
    </div>
  );
}
