'use client';

import { useEffect, useRef } from 'react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface ProgressLogProps {
  logs: string[];
  progress: number;
  isComplete: boolean;
  hasError: boolean;
}

export function ProgressLog({ logs, progress, isComplete, hasError }: ProgressLogProps) {
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            {isComplete
              ? hasError
                ? 'Import Failed'
                : 'Import Complete'
              : 'Importing Designs...'}
          </span>
          <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              hasError
                ? 'bg-red-500'
                : isComplete
                ? 'bg-success-500'
                : 'bg-primary-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Status Icon */}
      <div className="flex items-center justify-center py-4">
        {hasError ? (
          <XCircle className="w-12 h-12 text-red-500" />
        ) : isComplete ? (
          <CheckCircle className="w-12 h-12 text-success-500 animate-pulse-success" />
        ) : (
          <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
        )}
      </div>

      {/* Log Messages */}
      <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto" ref={logContainerRef}>
        <div className="space-y-2">
          {logs.length === 0 ? (
            <p className="text-gray-500 text-sm">Preparing import...</p>
          ) : (
            logs.map((log, index) => (
              <div
                key={index}
                className="text-sm text-gray-700 font-mono animate-slide-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <span className="text-gray-400 mr-2">
                  {new Date().toLocaleTimeString()}
                </span>
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
