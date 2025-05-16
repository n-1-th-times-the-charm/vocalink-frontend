import React, { useState, useEffect } from "react";

interface LogEntry {
  type: "log" | "error" | "warn" | "info";
  message: string;
  timestamp: Date;
}

const safeStringify = (obj: any, indent = 2): string => {
  const cache = new Set();
  return JSON.stringify(obj, (_, value) => {
    if (typeof value === "object" && value !== null) {
      if (value instanceof Node) {
        return `[${value.nodeName}]`;
      }
      if (cache.has(value)) {
        return "[Circular Reference]";
      }
      cache.add(value);
    }
    return value;
  }, indent);
};

const DebugConsole: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    const originalConsoleInfo = console.info;
    console.log = (...args) => {
      originalConsoleLog(...args);
      const message = args.map(arg => 
        typeof arg === "object" && arg !== null 
          ? safeStringify(arg) 
          : String(arg)
      ).join(" ");
      setLogs(prevLogs => [
        ...prevLogs,
        { type: "log" as const, message, timestamp: new Date() }
      ].slice(-50));
    };
    console.error = (...args) => {
      originalConsoleError(...args);
      const message = args.map(arg => 
        typeof arg === "object" && arg !== null 
          ? safeStringify(arg) 
          : String(arg)
      ).join(" ");
      setLogs(prevLogs => [
        ...prevLogs,
        { type: "error" as const, message, timestamp: new Date() }
      ].slice(-50));
    };
    console.warn = (...args) => {
      originalConsoleWarn(...args);
      const message = args.map(arg => 
        typeof arg === "object" && arg !== null 
          ? safeStringify(arg) 
          : String(arg)
      ).join(" ");
      setLogs(prevLogs => [
        ...prevLogs,
        { type: "warn" as const, message, timestamp: new Date() }
      ].slice(-50));
    };
    console.info = (...args) => {
      originalConsoleInfo(...args);
      const message = args.map(arg => 
        typeof arg === "object" && arg !== null 
          ? safeStringify(arg) 
          : String(arg)
      ).join(" ");
      setLogs(prevLogs => [
        ...prevLogs,
        { type: "info" as const, message, timestamp: new Date() }
      ].slice(-50));
    };
    console.log("Debug console initialized");
    return () => {
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
      console.info = originalConsoleInfo;
    };
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };
  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed right-4 bottom-4 bg-gray-800 text-white p-2 rounded shadow z-50"
      >
        Show Debug
      </button>
    );
  }
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 bg-gray-900 text-white shadow-lg max-h-64 overflow-auto">
      <div className="flex justify-between p-2 border-b border-gray-700">
        <h3 className="text-sm font-semibold">Debug Console ({logs.length} logs)</h3>
        <div>
          <button 
            onClick={() => setLogs([])} 
            className="px-2 py-1 mr-2 text-xs bg-red-600 rounded hover:bg-red-700"
          >
            Clear
          </button>
          <button 
            onClick={() => setIsVisible(false)} 
            className="px-2 py-1 text-xs bg-gray-700 rounded hover:bg-gray-600"
          >
            Hide
          </button>
        </div>
      </div>
      <div className="p-3 text-xs font-mono">
        {logs.length === 0 ? (
          <p className="text-gray-500">No logs yet...</p>
        ) : (
          logs.map((log, index) => (
            <div 
              key={index}
              className={`mb-1 border-l-2 pl-2 ${
                log.type === "error" 
                  ? "border-red-500 text-red-300" 
                  : log.type === "warn"
                  ? "border-yellow-500 text-yellow-300"
                  : log.type === "info"
                  ? "border-blue-500 text-blue-300"
                  : "border-gray-500 text-gray-300"
              }`}
            >
              <span className="text-gray-500 mr-2">[{formatTime(log.timestamp)}]</span>
              <span className="mr-2">{log.type.toUpperCase()}:</span>
              <span>{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DebugConsole;
