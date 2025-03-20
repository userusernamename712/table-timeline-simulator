
import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface DateSelectorProps {
  onDateSelected: (date: string) => void;
  onMealShiftSelected: (shift: string) => void;
  selectedDate: string;
  selectedMealShift: string;
  isLoading: boolean;
}

const DateSelector: React.FC<DateSelectorProps> = ({
  onDateSelected,
  onMealShiftSelected,
  selectedDate,
  selectedMealShift,
  isLoading
}) => {
  const [date, setDate] = useState<Date | undefined>(
    selectedDate ? new Date(selectedDate) : undefined
  );

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      setDate(selectedDate);
      onDateSelected(format(selectedDate, 'yyyy-MM-dd'));
    }
  };

  const handleMealShiftChange = (value: string) => {
    onMealShiftSelected(value);
  };

  return (
    <div className="glass-panel p-6 rounded-xl space-y-4 animate-scale-in">
      <h2 className="text-lg font-medium mb-4">Select Date & Meal Shift</h2>
      
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col">
          <label className="block mb-2 text-sm font-medium">Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
                disabled={isLoading}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, 'yyyy-MM-dd') : <span>Select date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateSelect}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex flex-col">
          <label className="block mb-2 text-sm font-medium">Meal Shift</label>
          <Select
            value={selectedMealShift}
            onValueChange={handleMealShiftChange}
            disabled={isLoading}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select meal shift" />
            </SelectTrigger>
            <SelectContent className="pointer-events-auto">
              <SelectItem value="Comida">Lunch (Comida)</SelectItem>
              <SelectItem value="Cena">Dinner (Cena)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default DateSelector;
