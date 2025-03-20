
import React, { useEffect, useRef } from 'react';
import { SimulationData } from '@/utils/dataParser';
import { getFilteredTableIds, getVisibleOccupancies, formatTimeFromMinutes } from '@/utils/simulationEngine';

interface TimelineVisualizationProps {
  data: SimulationData;
  currentSliderVal: number;
  selectedCapacity: string;
}

const TimelineVisualization: React.FC<TimelineVisualizationProps> = ({
  data,
  currentSliderVal,
  selectedCapacity
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
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
  
  // Get table occupancy status for a specific time and table
  const getTableOccupancyStatus = (tableId: number, timeSlot: number) => {
    for (const group of visibleOccupancies) {
      if (
        group.tableIds.includes(tableId) &&
        timeSlot >= group.start &&
        timeSlot < (group.start + group.duration)
      ) {
        return {
          occupied: true,
          startTime: formatTimeFromMinutes(group.start, data.shiftStart),
          endTime: formatTimeFromMinutes(group.start + group.duration, data.shiftStart)
        };
      }
    }
    return { occupied: false };
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
              return (
                <div key={tableId} className="flex border-b timeline-row-hover">
                  <div className="w-32 flex-shrink-0 p-3 border-r flex items-center text-sm">
                    <div>
                      <div className="font-medium">Table {tableId}</div>
                      <div className="text-xs text-muted-foreground">{table.maxCapacity} pax</div>
                    </div>
                  </div>
                  <div className="flex">
                    {timeSlots.map((slot) => {
                      const status = getTableOccupancyStatus(tableId, slot);
                      return (
                        <div 
                          key={`${tableId}-${slot}`} 
                          className={`w-20 p-2 text-center text-xs border-r flex-shrink-0 timeline-cell
                            ${status.occupied ? 'timeline-cell-occupied' : ''}
                            ${currentSliderVal >= slot && currentSliderVal < slot + 30 ? 'bg-primary/5' : ''}`}
                        >
                          {status.occupied && (
                            <div className="truncate">
                              {status.startTime}-{status.endTime}
                            </div>
                          )}
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
    </div>
  );
};

export default TimelineVisualization;
