
import React, { useState } from 'react';
import { Upload, FileText, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface FileUploaderProps {
  onMapsFileUploaded: (content: string) => void;
  onReservationsFileUploaded: (content: string) => void;
  isLoading: boolean;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  onMapsFileUploaded,
  onReservationsFileUploaded,
  isLoading
}) => {
  const [mapsFile, setMapsFile] = useState<File | null>(null);
  const [reservationsFile, setReservationsFile] = useState<File | null>(null);
  
  const handleMapsFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        toast.error('Please upload a CSV file for maps data');
        return;
      }
      setMapsFile(file);
      readFileContent(file, onMapsFileUploaded);
    }
  };
  
  const handleReservationsFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        toast.error('Please upload a CSV file for reservations data');
        return;
      }
      setReservationsFile(file);
      readFileContent(file, onReservationsFileUploaded);
    }
  };
  
  const readFileContent = (file: File, callback: (content: string) => void) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      callback(content);
    };
    reader.onerror = () => {
      toast.error(`Error reading file: ${file.name}`);
    };
    reader.readAsText(file);
  };
  
  return (
    <div className="glass-panel p-6 rounded-xl animate-scale-in">
      <h2 className="text-lg font-medium mb-4">Upload Data Files</h2>
      
      <div className="space-y-4">
        <div className="flex flex-col">
          <label className="block mb-2 text-sm font-medium">Restaurant Maps Data</label>
          <div className="relative">
            <input
              type="file"
              accept=".csv"
              onChange={handleMapsFileChange}
              className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
              disabled={isLoading}
            />
            <div className="flex items-center justify-between border border-input bg-background rounded-md p-2">
              <div className="flex items-center gap-2 text-sm truncate">
                {mapsFile ? (
                  <>
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="truncate max-w-[180px]">{mapsFile.name}</span>
                    <Check className="h-4 w-4 text-green-500" />
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Upload maps CSV</span>
                  </>
                )}
              </div>
              <Button size="sm" variant="ghost" className="h-8">
                Browse
              </Button>
            </div>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Maps CSV with restaurant table layouts
          </p>
        </div>
        
        <div className="flex flex-col">
          <label className="block mb-2 text-sm font-medium">Reservations Data</label>
          <div className="relative">
            <input
              type="file"
              accept=".csv"
              onChange={handleReservationsFileChange}
              className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
              disabled={isLoading}
            />
            <div className="flex items-center justify-between border border-input bg-background rounded-md p-2">
              <div className="flex items-center gap-2 text-sm truncate">
                {reservationsFile ? (
                  <>
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="truncate max-w-[180px]">{reservationsFile.name}</span>
                    <Check className="h-4 w-4 text-green-500" />
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Upload reservations CSV</span>
                  </>
                )}
              </div>
              <Button size="sm" variant="ghost" className="h-8">
                Browse
              </Button>
            </div>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Reservations CSV with booking information
          </p>
        </div>
      </div>
      
      {!mapsFile || !reservationsFile ? (
        <div className="mt-4 p-3 bg-accent rounded-md flex items-start gap-2 text-sm animate-fade-in">
          <AlertCircle className="h-4 w-4 text-accent-foreground mt-0.5" />
          <p>Please upload both maps and reservations CSV files to proceed with the simulation.</p>
        </div>
      ) : null}
    </div>
  );
};

export default FileUploader;
