import React from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Save, Download, Menu } from "lucide-react";

interface HeaderProps {
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onSave: () => void;
  onExport: () => void;
  documentTitle: string;
  onTitleChange: (title: string) => void;
  onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({
  isRecording,
  onStartRecording,
  onStopRecording,
  onSave,
  onExport,
  documentTitle,
  onTitleChange,
  onToggleSidebar,
}) => {
  return (
    <header className="flex items-center justify-between py-4 mb-2 border-b animate-fade-in">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleSidebar}
          className="mr-3 p-2 md:hidden rounded-md hover:bg-muted/60"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <input
            type="text"
            value={documentTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Untitled Document"
            className="text-xl font-medium outline-none w-full bg-transparent border-none focus:ring-0 px-1"
            aria-label="Document title"
          />
        </div>
      </div>
      <div className="hidden md:flex items-center gap-3">
        {isRecording ? (
          <div className="flex items-center">
            <span className="recording-indicator mr-3 text-red-500 font-medium animate-pulse">
              Recording
            </span>
            <Button 
              onClick={onStopRecording} 
              size="sm" 
              variant="outline"
              className="transition-all duration-300 px-4"
            >
              <MicOff className="mr-2 h-4 w-4" />
              Stop
            </Button>
          </div>
        ) : (
          <Button 
            onClick={onStartRecording} 
            size="sm" 
            variant="outline"
            className="transition-all duration-300 px-4"
          >
            <Mic className="mr-2 h-4 w-4" />
            Start Recording
          </Button>
        )}
        <Button 
          onClick={onSave} 
          size="sm" 
          variant="default"
          className="ml-2 transition-all duration-300 px-4"
        >
          <Save className="mr-2 h-4 w-4" />
          Save
        </Button>
        
        <Button 
          onClick={onExport} 
          size="sm" 
          variant="outline"
          className="ml-2 transition-all duration-300 px-4"
        >
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>
      {isRecording && (
        <div className="md:hidden flex items-center">
          <span className="recording-indicator text-red-500 font-medium animate-pulse text-sm px-2">
            Recording...
          </span>
        </div>
      )}
    </header>
  );
};

export default Header;