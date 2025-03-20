
import { Table, Reservation, OccupancyGroup, SimulationData } from './dataParser';

/**
 * Simulates the reservation process for tables
 * This is a simplified version of the Python SimPy implementation
 */
export const runSimulation = (data: SimulationData): SimulationData => {
  const { tables, reservations, endTime } = data;
  const timeline: Record<number, (() => void)[]> = {};
  
  // Sort reservations by arrival time to ensure correct processing order
  const sortedReservations = [...reservations].sort((a, b) => a.arrivalTime - b.arrivalTime);
  
  // Set up the timeline of events
  sortedReservations.forEach(reservation => {
    // Event at arrival time: Occupy tables if available
    if (!timeline[reservation.arrivalTime]) {
      timeline[reservation.arrivalTime] = [];
    }
    
    // Add occupation event
    timeline[reservation.arrivalTime].push(() => {
      const startTime = reservation.arrivalTime;
      const availableTables = reservation.tableIds
        .map(id => tables[id])
        .filter(table => table && !table.occupied);
      
      // Only proceed if all requested tables are available
      if (availableTables.length === reservation.tableIds.length) {
        // Mark tables as occupied
        availableTables.forEach(table => {
          table.occupied = true;
        });
        
        // Add release event at end time
        const endTimeMinutes = startTime + reservation.duration;
        if (!timeline[endTimeMinutes]) {
          timeline[endTimeMinutes] = [];
        }
        
        // Add release event
        timeline[endTimeMinutes].push(() => {
          availableTables.forEach(table => {
            table.occupied = false;
            table.occupancyLog.push([
              startTime,
              endTimeMinutes,
              reservation.creationDatetime,
              reservation.reservationDatetime
            ]);
          });
        });
      }
    });
  });
  
  // Process all events in chronological order
  const timepoints = Object.keys(timeline).map(Number).sort((a, b) => a - b);
  
  for (const time of timepoints) {
    if (time <= endTime) {
      const events = timeline[time] || [];
      for (const event of events) {
        event();
      }
    }
  }
  
  // Generate occupancy groups from logs
  const occupancyGroupsDict: Record<string, OccupancyGroup> = {};
  
  Object.values(tables).forEach(table => {
    table.occupancyLog.forEach(([start, end, creation, reservation]) => {
      const key = `${start}-${end}-${creation.getTime()}-${reservation.getTime()}`;
      
      if (!occupancyGroupsDict[key]) {
        occupancyGroupsDict[key] = {
          tableIds: [],
          start,
          duration: end - start,
          creation,
          reservation,
          advance: (reservation.getTime() - creation.getTime()) / (60 * 1000), // minutes
          creationRel: (creation.getTime() - data.shiftStart.getTime()) / (60 * 1000) // minutes
        };
      }
      
      occupancyGroupsDict[key].tableIds.push(table.tableId);
    });
  });
  
  const occupancyGroups = Object.values(occupancyGroupsDict);
  occupancyGroups.sort((a, b) => a.creation.getTime() - b.creation.getTime());
  
  // Calculate min and max slider values
  let minSliderVal = 0;
  let maxSliderVal = endTime;
  
  if (occupancyGroups.length) {
    minSliderVal = Math.min(...occupancyGroups.map(g => g.creationRel));
    maxSliderVal = Math.max(...occupancyGroups.map(g => g.creationRel));
  }
  
  return {
    ...data,
    occupancyGroups,
    minSliderVal,
    maxSliderVal
  };
};

// Get filtered table IDs based on capacity selection
export const getFilteredTableIds = (
  tables: Record<number, Table>, 
  selectedCapacity: string
): number[] => {
  return Object.values(tables)
    .filter(table => {
      if (selectedCapacity === 'All') return true;
      return table.maxCapacity === parseInt(selectedCapacity);
    })
    .map(table => table.tableId)
    .sort((a, b) => a - b);
};

// Get visible occupancy groups at the current time point
export const getVisibleOccupancies = (
  occupancyGroups: OccupancyGroup[],
  currentSliderVal: number
): OccupancyGroup[] => {
  return occupancyGroups.filter(group => group.creationRel <= currentSliderVal);
};

// Format time from minutes to HH:MM
export const formatTimeFromMinutes = (minutes: number, baseDate: Date): string => {
  const date = new Date(baseDate);
  date.setMinutes(date.getMinutes() + minutes);
  return date.toTimeString().substring(0, 5); // HH:MM format
};

// Format date to YYYY-MM-DD HH:MM
export const formatDateTime = (date: Date): string => {
  return `${date.toISOString().split('T')[0]} ${date.toTimeString().substring(0, 5)}`;
};
