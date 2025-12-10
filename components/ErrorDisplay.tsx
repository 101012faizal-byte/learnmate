import React from 'react';
import { XMarkIcon } from './icons/ActionIcons';

const ErrorIcon: React.FC<{ className?: string }> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
);

interface ErrorDisplayProps {
  message: string | null;
  onClear?: () => void;
  className?: string;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message, onClear, className = '' }) => {
  if (!message) return null;

  return (
    <div className={`bg-red-100/50 border border-red-200 text-red-800 p-3 rounded-lg flex justify-between items-center animate-fade-in ${className}`} role="alert">
      <div className="flex items-center">
        <ErrorIcon className="w-5 h-5 mr-3 flex-shrink-0 text-red-500" />
        <p className="text-sm font-medium">{message}</p>
      </div>
      {onClear && (
        <button onClick={onClear} className="p-1 rounded-full hover:bg-red-200/60 transition-colors ml-4 flex-shrink-0" aria-label="Clear error">
          <XMarkIcon className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default ErrorDisplay;