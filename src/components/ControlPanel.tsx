
import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Clock, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { formatDateTime } from '@/utils/simulationEngine';
import { SimulationData } from '@/utils/dataParser';

interface ControlPanelProps {
  data: SimulationData;
  currentSliderVal: number;
  onSliderValueChange: (value: number) => void;
  isLoading: boolean;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  data,
  currentSliderVal,
  onSliderValueChange,
  isLoading
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeText, setTimeText] = useState('');
  const timerRef = useRef<number | null>(null);
  
  useEffect(() => {
    // Update time text when slider value changes
    if (data.shiftStart) {
      const currentDate = new Date(data.shiftStart);
      currentDate.setMinutes(currentDate.getMinutes() + currentSliderVal);
      setTimeText(formatDateTime(currentDate));
    }
  }, [currentSliderVal, data.shiftStart]);
  
  useEffect(() => {
    // Clean up timer on unmount
    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
      }
    };
  }, []);
  
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = window.setInterval(() => {
        onSliderValueChange(prev => {
          const newVal = prev + 10;
          if (newVal >= data.maxSliderVal) {
            setIsPlaying(false);
            return data.maxSliderVal;
          }
          return newVal;
        });
      }, 1000);
    } else if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
      }
    };
  }, [isPlaying, data.maxSliderVal, onSliderValueChange]);
  
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };
  
  const handleTimeTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTimeText(e.target.value);
  };
  
  const handleTimeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const targetDate = new Date(timeText);
      if (!isNaN(targetDate.getTime())) {
        const minutesRelative = (targetDate.getTime() - data.shiftStart.getTime()) / (60 * 1000);
        let clampedValue = Math.max(data.minSliderVal, Math.min(data.maxSliderVal, minutesRelative));
        onSliderValueChange(clampedValue);
      }
    } catch (error) {
      console.error('Error parsing datetime input:', error);
    }
  };
  
  const handleSkipForward = () => {
    onSliderValueChange(prev => {
      return Math.min(prev + 30, data.maxSliderVal);
    });
  };
  
  return (
    <div className="glass-panel p-6 rounded-xl space-y-4 animate-scale-in">
      <h2 className="text-lg font-medium mb-4">Timeline Controls</h2>
      
      <div className="flex items-center gap-3 mb-4">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePlayPause}
          disabled={isLoading || currentSliderVal >= data.maxSliderVal}
          className="h-9 w-9 transition-all duration-300"
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          onClick={handleSkipForward}
          disabled={isLoading || currentSliderVal >= data.maxSliderVal}
          className="h-9 w-9 transition-all duration-300"
        >
          <SkipForward className="h-4 w-4" />
        </Button>
        
        <div className="text-sm font-medium">
          <div className="text-muted-foreground text-xs">Current Time</div>
          <div className="text-foreground">{timeText}</div>
        </div>
      </div>
      
      <div className="space-y-4">
        <Slider
          value={[currentSliderVal]}
          max={data.maxSliderVal}
          min={data.minSliderVal}
          step={1}
          onValueChange={(values) => onSliderValueChange(values[0])}
          disabled={isLoading}
          className="w-full"
        />
        
        <form onSubmit={handleTimeSubmit} className="flex items-center gap-2 mt-4">
          <div className="relative flex-1">
            <Clock className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="YYYY-MM-DD HH:MM"
              value={timeText}
              onChange={handleTimeTextChange}
              className="pl-8"
              disabled={isLoading}
            />
          </div>
          <Button type="submit" variant="secondary" disabled={isLoading}>
            Go
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ControlPanel;
