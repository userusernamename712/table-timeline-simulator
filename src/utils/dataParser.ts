
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
  restaurantId: string;
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

// Convert Python-style JSON to JavaScript-compatible JSON
const pythonToJsJson = (pythonJson: string): string => {
  // Replace Python's None with JavaScript's null
  return pythonJson
    .replace(/: None/g, ': null')
    .replace(/None,/g, 'null,')
    .replace(/: True/g, ': true')
    .replace(/: False/g, ': false')
    .replace(/'/g, '"'); // Replace single quotes with double quotes
};

// Convert meal shift string to numeric value
const getMealShiftNumeric = (mealShift: string): string => {
  return mealShift === 'Comida' ? '1' : mealShift === 'Cena' ? '2' : '';
};

// Parse maps data
export const parseMapData = (csvData: string, day: string, mealShift: string, restaurantId: string): Record<number, Table> => {
  const result: Record<number, Table> = {};
  const mealShiftNumeric = getMealShiftNumeric(mealShift);
  
  try {
    const { data } = parse(csvData, { header: true, skipEmptyLines: true });
    
    // Filter by day, meal shift, and restaurant_name
    const filteredData = data.filter((row: any) => 
      row.date === day && 
      row.meal === mealShiftNumeric &&
      row.restaurant_name === restaurantId
    );
    
    console.log(`Filtered map data: ${filteredData.length} entries for ${day}, meal shift: ${mealShift} (${mealShiftNumeric}), restaurant: ${restaurantId}`);
    
    filteredData.forEach((row: any) => {
      try {
        // Convert Python style JSON to JavaScript compatible JSON
        const jsCompatibleJson = pythonToJsJson(row.tables);
        
        // Now parse the JSON
        const tablesData = JSON.parse(jsCompatibleJson);
        
        // Handle both array and single object formats
        const tablesList = Array.isArray(tablesData) ? tablesData : [tablesData];
        
        tablesList.forEach((table: TableData) => {
          const tableId = table.id_table;
          result[tableId] = {
            tableId,
            maxCapacity: parseInt(table.max.toString()),
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
  
  console.log(`Parsed ${Object.keys(result).length} tables for ${day}, meal shift: ${mealShift}, restaurant: ${restaurantId}`);
  return result;
};

// Parse reservations data
export const parseReservationData = (
  csvData: string, 
  day: string, 
  mealShift: string,
  restaurantId: string
): Reservation[] => {
  const reservations: Reservation[] = [];
  
  try {
    const { data } = parse(csvData, { header: true, skipEmptyLines: true });
    
    // Filter by date, meal shift, and restaurant ID
    const confirmedStatuses = ["Sentada", "Cuenta solicitada", "Liberada", "Llegada", "Confirmada", "Re-Confirmada"];
    
    const filteredData = data.filter((row: any) => 
      row.date === day && 
      row.meal_shift === mealShift &&
      row.restaurant === restaurantId &&
      confirmedStatuses.includes(row.status_long)
    );
    
    console.log(`Filtered reservation data: ${filteredData.length} entries for ${day}, meal shift: ${mealShift}, restaurant: ${restaurantId}`);
    
    // Calculate minimum time to establish relative arrival times
    const times = filteredData.map((row: any) => {
      const [hours, minutes] = row.time.split(':').map(Number);
      return hours * 60 + minutes;
    });
    
    const minTime = Math.min(...times);
    
    let validReservations = 0;
    let invalidTableIds = 0;
    
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
        
        // Only add reservations with valid table IDs
        if (tableIds.length > 0) {
          validReservations++;
          reservations.push({
            arrivalTime,
            tableIds,
            partySize: parseInt(row.for || '1'),
            duration: parseInt(row.duration || '90'), // Default 90 minutes if not specified
            creationDatetime,
            reservationDatetime
          });
        } else {
          invalidTableIds++;
          console.log(`Skipping reservation with no valid table IDs: ${row.id || 'unknown'}`);
        }
      } catch (e) {
        console.error('Error parsing reservation:', row, e);
      }
    });
    
    console.log(`Valid reservations: ${validReservations}, Reservations with invalid table IDs: ${invalidTableIds}`);
    console.log(`Total reservations after processing: ${reservations.length}`);
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
  mealShift: string,
  restaurantId: string
): SimulationData | null => {
  try {
    // Parse tables from maps data
    const tables = parseMapData(mapsCSV, day, mealShift, restaurantId);
    
    // Parse reservations
    const reservations = parseReservationData(reservationsCSV, day, mealShift, restaurantId);
    
    if (Object.keys(tables).length === 0 || reservations.length === 0) {
      console.error('No valid tables or reservations found');
      return null;
    }
    
    console.log(`Initial reservations count: ${reservations.length}`);
    
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
      mealShift,
      restaurantId
    };
  } catch (e) {
    console.error('Error preparing simulation data:', e);
    return null;
  }
};
