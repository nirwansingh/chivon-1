'use client';

import * as React from 'react';
import { Search, Settings, LogOut, User as UserIcon, Loader2 } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import Link from 'next/link';

import { logout } from '@/app/login/actions';

export function AppTopbar({ user }: { user: { name: string; roleName: string } }) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<Record<string, any[]>>({});
  const [isSearching, setIsSearching] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (query.trim().length < 2) {
      setResults({});
      setOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.results) {
          setResults(data.results);
          setOpen(true);
        }
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 border-b bg-background px-4 md:px-6">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
      </div>

      {/* Universal Search */}
      <div className="flex-1 w-full max-w-xl mx-auto hidden md:flex items-center gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger nativeButton={false} render={
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search customers, quotes, invoices... (Press /)"
                className="w-full bg-background pl-9 sm:w-[400px] lg:w-full rounded-md"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {isSearching && (
                <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
          } />
          <PopoverContent className="w-[400px] lg:w-[500px] p-0" align="start">
            {Object.keys(results).length === 0 ? (
              <div className="p-4 text-sm text-center text-muted-foreground">
                No results found.
              </div>
            ) : (
              <div className="max-h-[300px] overflow-y-auto py-2">
                {Object.entries(results).map(([groupName, items]) => (
                  <div key={groupName} className="px-1">
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {groupName}
                    </div>
                    {items.map((item) => (
                      <Link
                        key={item.id}
                        href={item.url}
                        onClick={() => setOpen(false)}
                        className="flex flex-col gap-0.5 px-2 py-1.5 hover:bg-muted rounded-sm outline-none cursor-pointer"
                      >
                        <span className="text-sm font-medium">{item.title}</span>
                        {item.subtitle && <span className="text-xs text-muted-foreground">{item.subtitle}</span>}
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>

      <div className="ml-auto flex items-center gap-4">
        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" className="relative h-8 w-8 rounded-full" />}>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.roleName}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <UserIcon className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <form action={logout}>
              <button type="submit" className="w-full text-left">
                <DropdownMenuItem className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </button>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
