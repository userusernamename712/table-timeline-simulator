
import { Table, Reservation, OccupancyGroup, SimulationData } from './dataParser';

/**
 * Simulates the reservation process for tables
 * This implements the same logic as the Python SimPy implementation
 */
export const runSimulation = (data: SimulationData): SimulationData => {
  const { tables, reservations, endTime } = data;
  const timeline: Record<number, (() => void)[]> = {};
  
  console.log(`Starting simulation with ${reservations.length} reservations and ${Object.keys(tables).length} tables`);
  
  // Sort reservations by arrival time to ensure correct processing order
  const sortedReservations = [...reservations].sort((a, b) => a.arrivalTime - b.arrivalTime);
  
  // Track invalid reservations and successful ones
  let nonExistentTableCount = 0;
  let successfulReservations = 0;
  
  // For debugging purposes
  let overlappingReservationCount = 0;
  
  // Keep track of table occupancy
  const tableOccupancyEvents: Record<number, { start: number, end: number }[]> = {};
  Object.keys(tables).forEach(id => {
    tableOccupancyEvents[Number(id)] = [];
  });
  
  // Set up the timeline of events
  sortedReservations.forEach(reservation => {
    // Check if all tables in this reservation exist
    const allTablesExist = reservation.tableIds.every(id => tables[id] !== undefined);
    
    if (!allTablesExist) {
      nonExistentTableCount++;
      console.log(`Reservation for tables [${reservation.tableIds.join(', ')}] includes non-existent tables`);
      return; // Skip this reservation
    }
    
    const startTime = reservation.arrivalTime;
    const endTimeMinutes = startTime + reservation.duration;
    
    // Check for availability of all tables at the requested time
    let allTablesAvailable = true;
    
    for (const tableId of reservation.tableIds) {
      const events = tableOccupancyEvents[tableId] || [];
      
      for (const event of events) {
        // If there's an overlap, the table is not available
        if (!(endTimeMinutes <= event.start || startTime >= event.end)) {
          allTablesAvailable = false;
          overlappingReservationCount++;
          console.log(`Table ${tableId} is already occupied during ${startTime}-${endTimeMinutes}`);
          break;
        }
      }
      
      if (!allTablesAvailable) break;
    }
    
    if (allTablesAvailable) {
      // All tables are available, so add to occupancy events
      for (const tableId of reservation.tableIds) {
        if (!tableOccupancyEvents[tableId]) {
          tableOccupancyEvents[tableId] = [];
        }
        tableOccupancyEvents[tableId].push({
          start: startTime,
          end: endTimeMinutes
        });
      }
      
      // Mark as successful
      successfulReservations++;
      
      // Add occupation event to timeline
      if (!timeline[startTime]) {
        timeline[startTime] = [];
      }
      
      // Add occupation event
      timeline[startTime].push(() => {
        const affectedTables = reservation.tableIds
          .map(id => tables[id])
          .filter(table => table);
        
        // Mark tables as occupied
        affectedTables.forEach(table => {
          table.occupied = true;
        });
        
        // Add release event at end time
        if (!timeline[endTimeMinutes]) {
          timeline[endTimeMinutes] = [];
        }
        
        // Add release event
        timeline[endTimeMinutes].push(() => {
          affectedTables.forEach(table => {
            table.occupied = false;
            table.occupancyLog.push([
              startTime,
              endTimeMinutes,
              reservation.creationDatetime,
              reservation.reservationDatetime
            ]);
          });
        });
      });
    } else {
      console.log(`Cannot process reservation at ${startTime} for tables [${reservation.tableIds.join(', ')}] due to overlapping reservations`);
    }
  });
  
  console.log(`Timeline events setup: ${Object.keys(timeline).length} distinct time points`);
  console.log(`Reservations with non-existent tables: ${nonExistentTableCount}`);
  console.log(`Overlapping reservations detected: ${overlappingReservationCount}`);
  console.log(`Successful reservations: ${successfulReservations}, Failed due to overlap: ${overlappingReservationCount}`);
  
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
  occupancyGroups.sort((a, b) => a.start - b.start);
  
  console.log(`Generated ${occupancyGroups.length} occupancy groups`);
  
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
