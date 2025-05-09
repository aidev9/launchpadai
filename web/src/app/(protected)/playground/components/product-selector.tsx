"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PopoverProps } from "@radix-ui/react-popover";
import { Check, ChevronsUpDown, Plus, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { selectedProductAtom } from "@/lib/store/product-store";
import { Product } from "@/lib/firebase/schema";
import { useProducts } from "@/hooks/useProducts";
import { useAtom } from "jotai";

interface ProductSelectorProps extends PopoverProps {}

export function ProductSelector({ ...props }: ProductSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedProduct, setSelectedProduct] = useAtom(selectedProductAtom);
  const { products, selectProduct, clearProductSelection } = useProducts();
  const router = useRouter();

  const handleSelectProduct = async (product: Product) => {
    await selectProduct(product.id);
    setOpen(false);
  };

  const handleDeselectProduct = () => {
    clearProductSelection();
    setOpen(false);
  };

  const handleAddNewProduct = () => {
    router.push("/welcome");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen} {...props}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-label="Select a product..."
          aria-expanded={open}
          className="flex-1 justify-between md:max-w-[200px] lg:max-w-[300px]"
        >
          {selectedProduct ? selectedProduct.name : "Select a product..."}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search products..." />
          <CommandList>
            <CommandEmpty>No products found.</CommandEmpty>
            <CommandGroup heading="Products">
              {products.map((product) => (
                <CommandItem
                  key={product.id}
                  onSelect={() => handleSelectProduct(product)}
                >
                  {product.name}
                  <Check
                    className={cn(
                      "ml-auto",
                      selectedProduct?.id === product.id
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              {selectedProduct && (
                <CommandItem
                  onSelect={handleDeselectProduct}
                  className="text-muted-foreground"
                >
                  <X className="mr-2 h-4 w-4" />
                  Deselect product
                </CommandItem>
              )}
              <CommandItem
                onSelect={handleAddNewProduct}
                className="text-muted-foreground"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add new product
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
