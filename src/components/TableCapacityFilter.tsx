
import React from 'react';
import { Button } from '@/components/ui/button';
import { Table } from '@/utils/dataParser';

interface TableCapacityFilterProps {
  tables: Record<number, Table>;
  selectedCapacity: string;
  onCapacitySelected: (capacity: string) => void;
  isLoading: boolean;
}

const TableCapacityFilter: React.FC<TableCapacityFilterProps> = ({
  tables,
  selectedCapacity,
  onCapacitySelected,
  isLoading
}) => {
  // Get unique capacities from tables
  const capacities = Array.from(
    new Set(Object.values(tables).map(table => table.maxCapacity))
  ).sort((a, b) => a - b);

  return (
    <div className="glass-panel p-6 rounded-xl animate-scale-in">
      <h2 className="text-lg font-medium mb-4">Filter by Table Capacity</h2>
      
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedCapacity === 'All' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onCapacitySelected('All')}
          className="transition-all duration-300 ease-in-out"
          disabled={isLoading}
        >
          All Tables
        </Button>
        
        {capacities.map((capacity) => (
          <Button
            key={capacity}
            variant={selectedCapacity === capacity.toString() ? 'default' : 'outline'}
            size="sm"
            onClick={() => onCapacitySelected(capacity.toString())}
            className="transition-all duration-300 ease-in-out"
            disabled={isLoading}
          >
            {capacity} pax
          </Button>
        ))}
      </div>
    </div>
  );
};

export default TableCapacityFilter;
