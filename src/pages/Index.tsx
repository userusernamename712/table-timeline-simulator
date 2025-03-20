import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Loader2, Play } from 'lucide-react';
import FileUploader from '@/components/FileUploader';
import DateSelector from '@/components/DateSelector';
import TableCapacityFilter from '@/components/TableCapacityFilter';
import ControlPanel from '@/components/ControlPanel';
import TimelineVisualization from '@/components/TimelineVisualization';
import { prepareSimulationData, SimulationData } from '@/utils/dataParser';
import { runSimulation } from '@/utils/simulationEngine';

const Index = () => {
  const [mapsCSV, setMapsCSV] = useState<string | null>(null);
  const [reservationsCSV, setReservationsCSV] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedMealShift, setSelectedMealShift] = useState('Comida'); // Default to lunch
  const [selectedCapacity, setSelectedCapacity] = useState('All');
  const [simulationData, setSimulationData] = useState<SimulationData | null>(null);
  const [currentSliderVal, setCurrentSliderVal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [simulationReady, setSimulationReady] = useState(false);
  
  const runSimulationProcess = () => {
    if (!mapsCSV || !reservationsCSV || !selectedDate || !selectedMealShift) {
      toast.error('Please provide all required data before running the simulation');
      return;
    }
    
    setIsLoading(true);
    toast('Simulation process started', {
      description: 'Preparing to parse data files',
    });
    
    setTimeout(() => {
      try {
        toast('Parsing input data', {
          description: `Processing data for ${selectedDate}, ${selectedMealShift}`,
        });
        
        const data = prepareSimulationData(
          mapsCSV,
          reservationsCSV,
          selectedDate,
          selectedMealShift
        );
        
        if (!data) {
          toast.error('Failed to prepare simulation data');
          setIsLoading(false);
          return;
        }
        
        toast('Data parsed successfully', {
          description: `Found ${Object.keys(data.tables).length} tables and ${data.reservations.length} reservations`,
        });
        
        toast('Running simulation engine', {
          description: 'Calculating table occupancy patterns',
        });
        
        const simulatedData = runSimulation(data);
        
        setSimulationData(simulatedData);
        setCurrentSliderVal(simulatedData.minSliderVal);
        
        toast.success('Simulation completed successfully', {
          description: `Processed ${simulatedData.occupancyGroups.length} occupancy events`,
        });
      } catch (error) {
        console.error('Simulation error:', error);
        toast.error('An error occurred while running the simulation', {
          description: error instanceof Error ? error.message : 'Unknown error',
        });
      } finally {
        setIsLoading(false);
      }
    }, 100);
  };
  
  useEffect(() => {
    setSimulationReady(
      !!mapsCSV && !!reservationsCSV && !!selectedDate && !!selectedMealShift
    );
  }, [mapsCSV, reservationsCSV, selectedDate, selectedMealShift]);
  
  const handleSliderValueChange = (value: number) => {
    setCurrentSliderVal(value);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent/20 px-4 py-8 lg:px-8 lg:py-12">
      <div className="mx-auto max-w-7xl">
        <header className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Restaurant Table Simulator
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Visualize and analyze table occupancy patterns for optimal restaurant management
          </p>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="animate-slide-in stagger-1">
            <FileUploader
              onMapsFileUploaded={(content) => setMapsCSV(content)}
              onReservationsFileUploaded={(content) => setReservationsCSV(content)}
              isLoading={isLoading}
            />
          </div>
          
          <div className="animate-slide-in stagger-2">
            <DateSelector
              onDateSelected={setSelectedDate}
              onMealShiftSelected={setSelectedMealShift}
              selectedDate={selectedDate}
              selectedMealShift={selectedMealShift}
              isLoading={isLoading}
            />
          </div>
          
          <div className="animate-slide-in stagger-3">
            {simulationData ? (
              <ControlPanel
                data={simulationData}
                currentSliderVal={currentSliderVal}
                onSliderValueChange={handleSliderValueChange}
                isLoading={isLoading}
              />
            ) : (
              <TableCapacityFilter
                tables={simulationData?.tables || {}}
                selectedCapacity={selectedCapacity}
                onCapacitySelected={setSelectedCapacity}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>
        
        <div className="animate-slide-in stagger-4">
          {isLoading ? (
            <Card className="w-full p-12 flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
              <p className="text-muted-foreground">Processing simulation data...</p>
            </Card>
          ) : simulationData ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Simulation Results</h2>
                
                <TableCapacityFilter
                  tables={simulationData.tables}
                  selectedCapacity={selectedCapacity}
                  onCapacitySelected={setSelectedCapacity}
                  isLoading={isLoading}
                />
              </div>
              
              <TimelineVisualization
                data={simulationData}
                currentSliderVal={currentSliderVal}
                selectedCapacity={selectedCapacity}
              />
              
              <Card>
                <CardContent className="p-6">
                  <Tabs defaultValue="overview">
                    <TabsList className="mb-4">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="statistics">Statistics</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="overview" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-secondary/50 rounded-lg p-4">
                          <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Tables</h3>
                          <p className="text-2xl font-bold">{Object.keys(simulationData.tables).length}</p>
                        </div>
                        
                        <div className="bg-secondary/50 rounded-lg p-4">
                          <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Reservations</h3>
                          <p className="text-2xl font-bold">{simulationData.reservations.length}</p>
                        </div>
                        
                        <div className="bg-secondary/50 rounded-lg p-4">
                          <h3 className="text-sm font-medium text-muted-foreground mb-1">Simulation Timespan</h3>
                          <p className="text-2xl font-bold">{Math.round(simulationData.endTime / 60)} hours</p>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h3 className="text-lg font-medium mb-2">Simulation Info</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p><strong>Date:</strong> {simulationData.day}</p>
                            <p><strong>Meal Shift:</strong> {simulationData.mealShift}</p>
                            <p><strong>Shift Start:</strong> {simulationData.shiftStart.toLocaleString()}</p>
                          </div>
                          <div>
                            <p><strong>Total Table Occupancy Events:</strong> {simulationData.occupancyGroups.length}</p>
                            <p><strong>Average Reservation Duration:</strong> {
                              Math.round(simulationData.reservations.reduce((sum, res) => sum + res.duration, 0) / 
                              simulationData.reservations.length)} minutes
                            </p>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="statistics">
                      <div className="space-y-4">
                        <p className="text-muted-foreground">
                          Detailed statistics about reservation patterns and table utilization.
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-secondary/50 rounded-lg p-4">
                            <h3 className="text-sm font-medium text-muted-foreground mb-1">Average Advance Booking Time</h3>
                            <p className="text-2xl font-bold">
                              {Math.round(simulationData.occupancyGroups.reduce((sum, group) => sum + group.advance, 0) / 
                              simulationData.occupancyGroups.length / 60)} hours
                            </p>
                          </div>
                          
                          <div className="bg-secondary/50 rounded-lg p-4">
                            <h3 className="text-sm font-medium text-muted-foreground mb-1">Peak Reservation Time</h3>
                            <p className="text-2xl font-bold">
                              {(() => {
                                const hourCounts: Record<number, number> = {};
                                simulationData.reservations.forEach(res => {
                                  const hour = new Date(res.reservationDatetime).getHours();
                                  hourCounts[hour] = (hourCounts[hour] || 0) + 1;
                                });
                                
                                let peakHour = 0;
                                let maxCount = 0;
                                
                                Object.entries(hourCounts).forEach(([hour, count]) => {
                                  if (count > maxCount) {
                                    peakHour = parseInt(hour);
                                    maxCount = count;
                                  }
                                });
                                
                                return `${peakHour}:00 - ${peakHour + 1}:00`;
                              })()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="w-full p-12">
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-2">Ready to Simulate</h2>
                <p className="text-muted-foreground mb-6">
                  Upload data files, select a date and meal shift to start the simulation
                </p>
                
                <Button 
                  variant="default" 
                  size="lg" 
                  onClick={runSimulationProcess}
                  disabled={!simulationReady || isLoading}
                  className="gap-2"
                >
                  <Play className="h-4 w-4" />
                  Start Simulation
                </Button>
                
                {!simulationReady && (
                  <p className="text-muted-foreground mt-4 text-sm">
                    Please upload both data files and select a date and meal shift to enable simulation
                  </p>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
