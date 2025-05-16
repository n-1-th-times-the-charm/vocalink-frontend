import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SidebarToggleProps {
  isExpanded: boolean;
  onToggle: () => void;
}

const SidebarToggle: React.FC<SidebarToggleProps> = ({ isExpanded, onToggle }) => {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onToggle}
      className="hidden md:flex absolute top-4 -right-3 h-6 w-6 p-0 rounded-full bg-background border shadow-sm z-10 items-center justify-center"
      aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
    >
      {isExpanded ? (
        <ChevronLeft className="h-3 w-3" />
      ) : (
        <ChevronRight className="h-3 w-3" />
      )}
    </Button>
  );
};

export default SidebarToggle;