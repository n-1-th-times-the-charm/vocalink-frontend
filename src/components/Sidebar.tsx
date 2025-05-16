import React from "react";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Plus, Trash2 } from "lucide-react";

interface Document {
  id: string;
  title: string;
  updatedAt: Date;
}

interface SidebarProps {
  userEmail: string;
  charsUsed: number;
  documents: Document[];
  onSelectDocument: (doc: Document) => void;
  onDeleteDocument: (docId: string) => void;
  onNewDocument: () => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  userEmail,
  charsUsed,
  documents,
  onSelectDocument,
  onDeleteDocument,
  onNewDocument,
  onLogout,
}) => {
  const progressPercentage = Math.min((charsUsed / 2_500) * 100, 100);
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(date);
  };
  return (
    <div className="flex flex-col h-full w-full sm:w-64 bg-white overflow-hidden">
      <div className="p-6 space-y-6">
        <div className="flex items-center">
          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium border border-primary/20">
            Trial
          </span>
        </div>
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-600">Characters Used:</span>
            <span className="text-sm">{charsUsed} / 2500</span>
          </div>
          <Progress 
            value={progressPercentage} 
            className="h-2 w-full rounded-full bg-muted transition-all duration-300"
          />
        </div>
        <div className="pt-1">
          <p className="text-xs text-muted-foreground truncate" title={userEmail || "Guest User"}>
            {userEmail || "Guest User"}
          </p>
        </div>
        <Button 
          variant="outline" 
          className="w-full flex items-center justify-center gap-2 mt-6"
          onClick={onNewDocument}
        >
          <Plus size={16} />
          <span>New Document</span>
        </Button>
        <div>
          <h3 className="text-xs text-muted-foreground font-semibold">Your Documents</h3>
        </div>
      </div>
      <div className="flex-1 px-6 overflow-y-auto min-h-0">
        {documents.length === 0 ? (
          <p className="text-sm text-gray-500 italic mb-12">No documents yet</p>
        ) : (
          <ul className="space-y-2 pb-4">
            {documents.map((doc) => (
              <li 
                key={doc.id}
                className="group rounded-md p-2 hover:bg-gray-50 transition-all duration-200 cursor-pointer"
                onClick={() => onSelectDocument(doc)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate" title={doc.title}>
                      {doc.title || "Untitled Document"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(doc.updatedAt)}
                    </p>
                  </div>
                  <button
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteDocument(doc.id);
                    }}
                    title="Delete document"
                  >
                    <Trash2 size={16} className="text-gray-500 hover:text-red-500" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="sticky bottom-0 bg-white p-4 border-t mt-auto">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;