
import React, { useState } from 'react';
import { Store, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [open, setOpen] = useState(false);
  
  const filteredOptions = RESTAURANT_OPTIONS.filter(restaurant => 
    restaurant.toLowerCase().includes(searchTerm.toLowerCase()) ||
    formatRestaurantName(restaurant).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="glass-panel p-6 rounded-xl space-y-4 animate-scale-in">
      <h2 className="text-lg font-medium mb-4">Select Restaurant</h2>
      
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col">
          <label className="block mb-2 text-sm font-medium">Restaurant</label>
          
          <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                disabled={isLoading}
                className="w-full justify-between"
                aria-expanded={open}
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
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[300px] max-h-[400px] overflow-auto" side="bottom" align="start">
              <div className="p-2">
                <Input
                  placeholder="Search restaurant..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mb-2"
                />
              </div>
              
              {filteredOptions.length === 0 ? (
                <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                  No restaurant found.
                </div>
              ) : (
                filteredOptions.map((restaurant) => (
                  <DropdownMenuItem
                    key={restaurant}
                    className="cursor-pointer"
                    onClick={() => {
                      onRestaurantSelected(restaurant);
                      setOpen(false);
                      setSearchTerm('');
                    }}
                  >
                    <Store className="mr-2 h-4 w-4" />
                    <span>{formatRestaurantName(restaurant)}</span>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default RestaurantSelector;
