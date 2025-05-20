"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Product } from "@/lib/firebase/schema";
import { useProducts } from "@/hooks/useProducts";

interface ProductSelectorProps {
  value: string | null;
  onChange: (productId: string | null) => void;
  placeholder?: string;
  allowClear?: boolean;
}

export function ProductSelector({
  value,
  onChange,
  placeholder = "Select a product...",
  allowClear = false,
}: ProductSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const { products } = useProducts();

  // Find the selected product
  const selectedProduct = React.useMemo(() => {
    return products.find((product) => product.id === value);
  }, [products, value]);

  const handleSelectProduct = (productId: string) => {
    onChange(productId);
    setOpen(false);
  };

  const handleClearSelection = () => {
    onChange(null);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-label={placeholder}
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedProduct ? selectedProduct.name : placeholder}
          <ChevronsUpDown className="opacity-50 h-4 w-4 ml-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-76 p-0">
        <Command>
          <CommandInput placeholder="Search products..." />
          <CommandList>
            <CommandEmpty>No products found.</CommandEmpty>
            <CommandGroup heading="Products">
              {products.map((product) => (
                <CommandItem
                  key={product.id}
                  onSelect={() => handleSelectProduct(product.id)}
                  className="cursor-pointer"
                >
                  {product.name}
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      selectedProduct?.id === product.id
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
            {allowClear && selectedProduct && (
              <CommandGroup>
                <CommandItem
                  onSelect={handleClearSelection}
                  className="text-muted-foreground"
                >
                  <X className="mr-2 h-4 w-4" />
                  Clear selection
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
