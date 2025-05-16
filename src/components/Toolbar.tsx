import React, { useState } from "react";
import { 
  Bold, 
  Italic, 
  Underline,
  List,
  ListOrdered,
  Highlighter,
  Download,
  MoreHorizontal,
  ChevronDown
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ToolbarProps {
  onBold: () => void;
  onItalic: () => void;
  onUnderline: () => void;
  onBulletList: () => void;
  onNumberedList: () => void;
  onHighlight: () => void;
  onExport: () => void;
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  isBulletList: boolean;
  isNumberedList: boolean;
  isHighlighting: boolean;
  wordCount?: number;
}

const Toolbar: React.FC<ToolbarProps> = ({
  onBold,
  onItalic,
  onUnderline,
  onBulletList,
  onNumberedList,
  onHighlight,
  onExport,
  isBold,
  isItalic,
  isUnderline,
  isBulletList,
  isNumberedList,
  isHighlighting,
  wordCount = 0
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  return (
    <div className="flex items-center p-2 mb-3 rounded-md bg-muted/50 animate-fade-in shadow-sm">
      <div className="hidden md:flex items-center gap-2 w-full">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onBold}
          className={`p-2.5 ${isBold ? 'bg-accent text-accent-foreground' : ''}`}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onItalic}
          className={`p-2.5 ${isItalic ? 'bg-accent text-accent-foreground' : ''}`}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onUnderline}
          className={`p-2.5 ${isUnderline ? 'bg-accent text-accent-foreground' : ''}`}
          title="Underline"
        >
          <Underline className="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" className="h-6 mx-2" />
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onBulletList}
          className={`p-2.5 ${isBulletList ? 'bg-accent text-accent-foreground' : ''}`}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onNumberedList}
          className={`p-2.5 ${isNumberedList ? 'bg-accent text-accent-foreground' : ''}`}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 mx-2" />
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onHighlight}
          className={`p-2.5 ${isHighlighting ? 'bg-accent text-accent-foreground' : ''}`}
          title="Highlight Text"
        >
          <Highlighter className="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" className="h-6 mx-2" />
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onExport}
          className="p-2.5"
          title="Export Document"
        >
          <Download className="h-4 w-4" />
        </Button>
        <div className="ml-auto text-sm text-muted-foreground">
          {wordCount} {wordCount === 1 ? 'word' : 'words'}
        </div>
      </div>
      <div className="flex md:hidden items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBold}
            className={`p-2.5 ${isBold ? 'bg-accent text-accent-foreground' : ''}`}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onItalic}
            className={`p-2.5 ${isItalic ? 'bg-accent text-accent-foreground' : ''}`}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onUnderline}
            className={`p-2.5 ${isUnderline ? 'bg-accent text-accent-foreground' : ''}`}
            title="Underline"
          >
            <Underline className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {wordCount} {wordCount === 1 ? 'word' : 'words'}
          </span>
          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="p-2.5">
                <MoreHorizontal className="h-4 w-4" />
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="p-1">
            <DropdownMenuItem onClick={onBulletList} className={`px-3 py-2 ${isBulletList ? 'bg-accent/20' : ''}`}>
              <List className="h-4 w-4 mr-2" />
              Bullet List
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onNumberedList} className={`px-3 py-2 ${isNumberedList ? 'bg-accent/20' : ''}`}>
              <ListOrdered className="h-4 w-4 mr-2" />
              Numbered List
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onHighlight} className={`px-3 py-2 ${isHighlighting ? 'bg-accent/20' : ''}`}>
              <Highlighter className="h-4 w-4 mr-2" />
              Highlight
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
    </div>
  );
}

export default Toolbar;