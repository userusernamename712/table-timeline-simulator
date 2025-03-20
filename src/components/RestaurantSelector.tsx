
import React, { useState } from 'react';
import { Store, Search, ChevronDown } from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RestaurantSelectorProps {
  onRestaurantSelected: (restaurantId: string) => void;
  selectedRestaurant: string;
  isLoading: boolean;
}

const RESTAURANT_OPTIONS = [
  "restaurante-saona-blasco-ibanez",
  "restaurante-turqueta",
  "restaurante-saona-ciscar",
  "restaurante-saona-santa-barbara",
  "restauerante-saonalaeliana",
  "restaurante-saonacasinodeagricultura",
  "restaurante-saona-epicentre-sagunto",
  "restaurante-saona-viveros",
];

// Helper function to format restaurant ID for display
const formatRestaurantName = (id: string): string => {
  return id
    .replace('restaurante-', '')
    .replace('restauerante-', '')
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const RestaurantSelector: React.FC<RestaurantSelectorProps> = ({
  onRestaurantSelected,
  selectedRestaurant,
  isLoading
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="glass-panel p-6 rounded-xl space-y-4 animate-scale-in">
      <h2 className="text-lg font-medium mb-4">Select Restaurant</h2>
      
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col">
          <label className="block mb-2 text-sm font-medium">Restaurant</label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                disabled={isLoading}
                className="w-full justify-between"
              >
                <div className="flex items-center gap-2 truncate">
                  <Store className="h-4 w-4" />
                  {selectedRestaurant ? (
                    <span className="truncate">{formatRestaurantName(selectedRestaurant)}</span>
                  ) : (
                    <span className="text-muted-foreground">Select restaurant</span>
                  )}
                </div>
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0 pointer-events-auto bg-popover z-50">
              <Command>
                <CommandInput 
                  placeholder="Search restaurant..." 
                  className="h-9"
                />
                <CommandEmpty>No restaurant found.</CommandEmpty>
                <CommandGroup className="max-h-[300px] overflow-auto">
                  {RESTAURANT_OPTIONS.map((restaurant) => (
                    <CommandItem
                      key={restaurant}
                      value={restaurant}
                      onSelect={() => {
                        onRestaurantSelected(restaurant);
                        setOpen(false);
                      }}
                      className="cursor-pointer"
                    >
                      <Store className="mr-2 h-4 w-4" />
                      <span>{formatRestaurantName(restaurant)}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
};

export default RestaurantSelector;
