'use client';

import * as React from 'react';
import { Customer } from '@prisma/client';
import { Check, ChevronsUpDown, Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CustomerForm } from '@/components/customer-form';

interface CustomerSelectorProps {
  value?: string;
  onChange: (value: string) => void;
  error?: boolean;
}

export function CustomerSelector({ value, onChange, error }: CustomerSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [search, setSearch] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  
  const selectedCustomer = customers.find((c) => c.id === value);

  React.useEffect(() => {
    async function searchCustomers() {
      if (search.length < 2 && search.length > 0) return;
      
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(search)}`);
        const data = await res.json();
        // search returns generic format, we need to map or we can create a dedicated API
        // For inline creation, it's better to hit a dedicated customers API or parse search results
        // Since Search API returns { "Customers": [{ id, title, subtitle }] } we can use that for UI
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    
    // In a real implementation, we should fetch actual Customer records.
    // Let's assume we can fetch them via a dedicated API we'll create next.
    const timer = setTimeout(() => {
      fetchCustomers(search);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [search]);
  
  // Initial fetch for the selected customer if present and not in list
  React.useEffect(() => {
    if (value && !selectedCustomer) {
      fetchCustomers('', value);
    }
  }, [value, selectedCustomer]);

  const fetchCustomers = async (q: string, idToInclude?: string) => {
    setLoading(true);
    try {
      const url = new URL(window.location.origin + '/api/customers');
      if (q) url.searchParams.set('search', q);
      if (idToInclude) url.searchParams.set('id', idToInclude);
      
      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setCustomers((prev) => {
          // Merge avoiding duplicates
          const map = new Map(prev.map(c => [c.id, c]));
          data.customers.forEach((c: Customer) => map.set(c.id, c));
          return Array.from(map.values());
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger render={<Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", error && "border-destructive")}
        />}>
          {selectedCustomer ? selectedCustomer.companyName : "Select customer..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput 
              placeholder="Search customers..." 
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              {loading && <div className="p-4 text-center text-sm text-muted-foreground"><Loader2 className="inline mr-2 h-4 w-4 animate-spin"/> Loading...</div>}
              {!loading && customers.length === 0 && <CommandEmpty>No customer found.</CommandEmpty>}
              <CommandGroup>
                {customers.map((customer) => (
                  <CommandItem
                    key={customer.id}
                    value={customer.id}
                    onSelect={(currentValue: string) => {
                      onChange(currentValue === value ? "" : currentValue);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === customer.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {customer.companyName}
                  </CommandItem>
                ))}
              </CommandGroup>
              <div className="p-2 border-t">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-sm text-primary"
                  onClick={() => {
                    setOpen(false);
                    setCreateOpen(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Customer
                </Button>
              </div>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-4xl h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Quick Create Customer</DialogTitle>
          </DialogHeader>
          {/* We wrap CustomerForm or a simplified version here. 
              Since CustomerForm navigates away on success, we need a prop to handle inline success. */}
          <CustomerForm 
            // @ts-ignore - we'll add onInlineSuccess prop to CustomerForm next
            onInlineSuccess={(id) => {
              setCreateOpen(false);
              onChange(id);
              fetchCustomers('', id); // ensure it's loaded
            }} 
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
