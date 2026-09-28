'use client';

import * as React from 'react';
import { Product } from '@prisma/client';
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
import { ProductForm } from '@/components/product-form';

interface ProductSelectorProps {
  value?: string;
  onChange: (value: string) => void;
  error?: boolean;
}

export function ProductSelector({ value, onChange, error }: ProductSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [search, setSearch] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  
  const selectedProduct = products.find((p) => p.id === value);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts(search);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [search]);
  
  React.useEffect(() => {
    if (value && !selectedProduct) {
      fetchProducts('', value);
    }
  }, [value, selectedProduct]);

  const fetchProducts = async (q: string, idToInclude?: string) => {
    setLoading(true);
    try {
      const url = new URL(window.location.origin + '/api/products');
      if (q) url.searchParams.set('search', q);
      if (idToInclude) url.searchParams.set('id', idToInclude);
      
      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setProducts((prev) => {
          const map = new Map(prev.map(p => [p.id, p]));
          data.products.forEach((p: Product) => map.set(p.id, p));
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
          {selectedProduct ? selectedProduct.name : "Select product..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput 
              placeholder="Search products..." 
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              {loading && <div className="p-4 text-center text-sm text-muted-foreground"><Loader2 className="inline mr-2 h-4 w-4 animate-spin"/> Loading...</div>}
              {!loading && products.length === 0 && <CommandEmpty>No product found.</CommandEmpty>}
              <CommandGroup>
                {products.map((product) => (
                  <CommandItem
                    key={product.id}
                    value={product.id}
                    onSelect={(currentValue: string) => {
                      onChange(currentValue === value ? "" : currentValue);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === product.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {product.name} {product.sku ? `(${product.sku})` : ''}
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
                  Create New Product
                </Button>
              </div>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-4xl h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Quick Create Product</DialogTitle>
          </DialogHeader>
          <ProductForm 
            categories={[]} // For inline creation, categories can be skipped or fetched later, but let's just pass empty for now.
            onInlineSuccess={(id) => {
              if (id === 'cancel') {
                setCreateOpen(false);
                return;
              }
              setCreateOpen(false);
              onChange(id);
              fetchProducts('', id);
            }} 
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
