
import { parse } from 'papaparse';

export interface TableData {
  id_table: number;
  max: number;
  [key: string]: any;
}

export interface Table {
  tableId: number;
  maxCapacity: number;
  occupied: boolean;
  occupancyLog: [number, number, Date, Date][];
}

export interface Reservation {
  arrivalTime: number;
  tableIds: number[];
  partySize: number;
  duration: number;
  creationDatetime: Date;
  reservationDatetime: Date;
}

export interface OccupancyGroup {
  tableIds: number[];
  start: number;
  duration: number;
  creation: Date;
  reservation: Date;
  advance: number;
  creationRel: number;
}

export interface SimulationData {
  tables: Record<number, Table>;
  reservations: Reservation[];
  occupancyGroups: OccupancyGroup[];
  minTime: number;
  maxTime: number;
  shiftStart: Date;
  endTime: number;
  minSliderVal: number;
  maxSliderVal: number;
  day: string;
  mealShift: string;
}

// Helper function to parse tables string from CSV
export const parseTables = (tablesStr: string): number[] => {
  if (!tablesStr) return [];
  
  try {
    if (typeof tablesStr === 'string') {
      const parts = tablesStr.split(',');
      return parts
        .map(part => part.trim())
        .filter(part => /^\d+$/.test(part))
        .map(part => parseInt(part, 10));
    } else if (typeof tablesStr === 'number' && !isNaN(tablesStr)) {
      return [tablesStr];
    }
  } catch (e) {
    console.error('Error parsing tables:', e);
  }
  
  return [];
};

// Parse maps data
export const parseMapData = (csvData: string, day: string): Record<number, Table> => {
  const result: Record<number, Table> = {};
  
  try {
    const { data } = parse(csvData, { header: true, skipEmptyLines: true });
    
    // Filter by day and restaurant if needed
    const filteredData = data.filter((row: any) => row.date === day);
    
    filteredData.forEach((row: any) => {
      try {
        // Parse the tables field which is a JSON string
        const tablesData = JSON.parse(row.tables.replace(/'/g, '"'));
        
        tablesData.forEach((table: TableData) => {
          const tableId = table.id_table;
          result[tableId] = {
            tableId,
            maxCapacity: parseInt(table.max),
            occupied: false,
            occupancyLog: []
          };
        });
      } catch (e) {
        console.error('Error parsing table data for row:', row, e);
      }
    });
  } catch (e) {
    console.error('Error parsing map CSV:', e);
  }
  
  return result;
};

// Parse reservations data
export const parseReservationData = (
  csvData: string, 
  day: string, 
  mealShift: string
): Reservation[] => {
  const reservations: Reservation[] = [];
  
  try {
    const { data } = parse(csvData, { header: true, skipEmptyLines: true });
    
    // Filter by date and meal shift
    const confirmedStatuses = ["Sentada", "Cuenta solicitada", "Liberada", "Llegada", "Confirmada", "Re-Confirmada"];
    
    const filteredData = data.filter((row: any) => 
      row.date === day && 
      row.meal_shift === mealShift &&
      confirmedStatuses.includes(row.status_long)
    );
    
    // Calculate minimum time to establish relative arrival times
    const times = filteredData.map((row: any) => {
      const [hours, minutes] = row.time.split(':').map(Number);
      return hours * 60 + minutes;
    });
    
    const minTime = Math.min(...times);
    
    filteredData.forEach((row: any) => {
      try {
        const [hours, minutes] = row.time.split(':').map(Number);
        const timeInMinutes = hours * 60 + minutes;
        const arrivalTime = timeInMinutes - minTime;
        
        const creationDatetime = new Date(`${row.date_add}T${row.time_add}`);
        const reservationDatetime = new Date(`${row.date}T${row.time}`);
        
        let tableIds = parseTables(row.tables);
        
        if (!tableIds.length && row.table) {
          // If no tables from the 'tables' field, try to get from 'table' field
          tableIds = parseTables(row.table);
        }
        
        reservations.push({
          arrivalTime,
          tableIds,
          partySize: parseInt(row.for || '1'),
          duration: parseInt(row.duration || '90'), // Default 90 minutes if not specified
          creationDatetime,
          reservationDatetime
        });
      } catch (e) {
        console.error('Error parsing reservation:', row, e);
      }
    });
  } catch (e) {
    console.error('Error parsing reservations CSV:', e);
  }
  
  return reservations;
};

// Main function to parse all data and prepare for simulation
export const prepareSimulationData = (
  mapsCSV: string,
  reservationsCSV: string,
  day: string,
  mealShift: string
): SimulationData | null => {
  try {
    // Parse tables from maps data
    const tables = parseMapData(mapsCSV, day);
    
    // Parse reservations
    const reservations = parseReservationData(reservationsCSV, day, mealShift);
    
    if (Object.keys(tables).length === 0 || reservations.length === 0) {
      console.error('No valid tables or reservations found');
      return null;
    }
    
    // Find the earliest reservation time to set as shift start
    const shiftStart = new Date(
      Math.min(...reservations.map(r => r.reservationDatetime.getTime()))
    );
    
    // Determine simulation end time (max arrival time + max duration + buffer)
    const maxArrivalTime = Math.max(...reservations.map(r => r.arrivalTime));
    const maxDuration = Math.max(...reservations.map(r => r.duration));
    const endTime = maxArrivalTime + maxDuration + 10; // 10 mins buffer
    
    // Empty occupancy groups for now - will be populated by simulation
    const occupancyGroups: OccupancyGroup[] = [];
    
    return {
      tables,
      reservations,
      occupancyGroups,
      minTime: Math.min(...reservations.map(r => r.arrivalTime)),
      maxTime: maxArrivalTime,
      shiftStart,
      endTime,
      minSliderVal: 0,
      maxSliderVal: endTime,
      day,
      mealShift
    };
  } catch (e) {
    console.error('Error preparing simulation data:', e);
    return null;
  }
};
