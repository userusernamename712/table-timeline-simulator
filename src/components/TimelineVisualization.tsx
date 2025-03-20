
import React, { useEffect, useRef, useState } from 'react';
import { SimulationData } from '@/utils/dataParser';
import { getFilteredTableIds, getVisibleOccupancies, formatTimeFromMinutes } from '@/utils/simulationEngine';
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { Clock, Calendar, Users, Info } from 'lucide-react';

interface TimelineVisualizationProps {
  data: SimulationData;
  currentSliderVal: number;
  selectedCapacity: string;
}

interface ReservationDetail {
  tableIds: number[];
  startTime: string;
  endTime: string;
  duration: number;
  creationTime: string;
  reservationTime: string;
  advanceTime: number;
}

const TimelineVisualization: React.FC<TimelineVisualizationProps> = ({
  data,
  currentSliderVal,
  selectedCapacity
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedReservation, setSelectedReservation] = useState<ReservationDetail | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  
  // Get table IDs filtered by capacity
  const filteredTableIds = getFilteredTableIds(data.tables, selectedCapacity);
  
  // Get occupancy groups visible at the current time
  const visibleOccupancies = getVisibleOccupancies(data.occupancyGroups, currentSliderVal);
  
  useEffect(() => {
    // Scroll to the right position to show current time
    const container = containerRef.current;
    if (container) {
      // Calculate the position to scroll to show the current time
      const totalWidth = container.scrollWidth;
      const viewportWidth = container.clientWidth;
      const scrollPosition = (currentSliderVal / data.maxSliderVal) * (totalWidth - viewportWidth);
      
      // Smooth scroll to the calculated position
      container.scrollTo({
        left: Math.max(0, scrollPosition - viewportWidth / 3),
        behavior: 'smooth'
      });
    }
  }, [currentSliderVal, data.maxSliderVal]);
  
  // Calculate time slots for the timeline (30-minute intervals)
  const timeSlots = [];
  for (let time = 0; time <= data.endTime; time += 30) {
    timeSlots.push(time);
  }
  
  const currentTime = formatTimeFromMinutes(currentSliderVal, data.shiftStart);
  
  // Get table occupancy spans for a specific table
  const getTableOccupancySpans = (tableId: number) => {
    const spans = [];
    
    for (const group of visibleOccupancies) {
      if (group.tableIds.includes(tableId)) {
        const startSlot = Math.floor(group.start / 30) * 30;
        const endSlot = Math.ceil((group.start + group.duration) / 30) * 30;
        const spanWidth = ((endSlot - startSlot) / 30);
        
        spans.push({
          start: startSlot,
          width: spanWidth,
          group
        });
      }
    }
    
    return spans;
  };
  
  const handleReservationClick = (group: any) => {
    setSelectedReservation({
      tableIds: group.tableIds,
      startTime: formatTimeFromMinutes(group.start, data.shiftStart),
      endTime: formatTimeFromMinutes(group.start + group.duration, data.shiftStart),
      duration: group.duration,
      creationTime: group.creation.toLocaleTimeString(),
      reservationTime: group.reservation.toLocaleTimeString(),
      advanceTime: Math.round(group.advance / 60) // convert to hours
    });
    setSheetOpen(true);
  };
  
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-lg animate-scale-in">
      <div className="p-4 border-b">
        <h2 className="text-xl font-semibold mb-1">Table Occupancy Timeline</h2>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>
            Date: <span className="font-medium text-foreground">{data.day}</span>
          </div>
          <div>
            Shift: <span className="font-medium text-foreground">{data.mealShift}</span>
          </div>
          <div>
            Current Time: <span className="font-medium text-foreground">{currentTime}</span>
          </div>
        </div>
      </div>
      
      <div className="overflow-auto subtle-scroll" ref={containerRef} style={{ maxHeight: '500px' }}>
        <div className="min-w-max">
          {/* Timeline header with time slots */}
          <div className="flex border-b sticky top-0 bg-secondary z-10">
            <div className="w-32 flex-shrink-0 p-3 font-medium border-r text-sm">Table</div>
            <div className="flex">
              {timeSlots.map((slot) => (
                <div 
                  key={slot} 
                  className={`w-20 p-2 text-center text-xs font-medium border-r flex-shrink-0
                    ${currentSliderVal >= slot && currentSliderVal < slot + 30 ? 'bg-primary/10' : ''}`}
                >
                  {formatTimeFromMinutes(slot, data.shiftStart)}
                </div>
              ))}
            </div>
          </div>
          
          {/* Table rows */}
          {filteredTableIds.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No tables available for the selected capacity.
            </div>
          ) : (
            filteredTableIds.map((tableId) => {
              const table = data.tables[tableId];
              const occupancySpans = getTableOccupancySpans(tableId);
              
              return (
                <div key={tableId} className="flex border-b timeline-row-hover">
                  <div className="w-32 flex-shrink-0 p-3 border-r flex items-center text-sm">
                    <div>
                      <div className="font-medium">Table {tableId}</div>
                      <div className="text-xs text-muted-foreground">{table.maxCapacity} pax</div>
                    </div>
                  </div>
                  <div className="flex relative h-12">
                    {/* Time slots background */}
                    {timeSlots.map((slot) => (
                      <div 
                        key={`bg-${tableId}-${slot}`} 
                        className={`w-20 border-r flex-shrink-0
                          ${currentSliderVal >= slot && currentSliderVal < slot + 30 ? 'bg-primary/5' : ''}`}
                      />
                    ))}
                    
                    {/* Occupancy spans */}
                    {occupancySpans.map((span, index) => {
                      const leftPosition = (span.start / 30) * 80; // 80px per 30min slot (w-20)
                      const width = span.width * 80;
                      
                      return (
                        <div
                          key={`${tableId}-span-${index}`}
                          className="absolute top-0 h-full bg-primary/90 text-white text-xs flex items-center justify-center px-1 rounded-md cursor-pointer hover:bg-primary transition-colors overflow-hidden"
                          style={{ 
                            left: `${leftPosition}px`, 
                            width: `${width}px`,
                            maxWidth: `${width}px`
                          }}
                          onClick={() => handleReservationClick(span.group)}
                        >
                          <div className="truncate w-full text-center">
                            {formatTimeFromMinutes(span.group.start, data.shiftStart)}-
                            {formatTimeFromMinutes(span.group.start + span.group.duration, data.shiftStart)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      
      {/* Reservation detail sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Reservation Details</SheetTitle>
            <SheetDescription>
              Information about the selected reservation
            </SheetDescription>
          </SheetHeader>
          
          {selectedReservation && (
            <div className="mt-6 space-y-4">
              <div className="flex items-start gap-2">
                <div className="bg-muted rounded-full p-2">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-medium">Tables</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedReservation.tableIds.map(id => `Table ${id}`).join(', ')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <div className="bg-muted rounded-full p-2">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-medium">Time</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedReservation.startTime} - {selectedReservation.endTime} ({selectedReservation.duration} min)
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <div className="bg-muted rounded-full p-2">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-medium">Reservation</h4>
                  <p className="text-sm text-muted-foreground">
                    Created: {selectedReservation.creationTime}<br />
                    Time: {selectedReservation.reservationTime}<br />
                    Booked {selectedReservation.advanceTime} hours in advance
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <div className="bg-muted rounded-full p-2">
                  <Info className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-medium">Additional Info</h4>
                  <p className="text-sm text-muted-foreground">
                    Tables reserved: {selectedReservation.tableIds.length}<br />
                  </p>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default TimelineVisualization;
