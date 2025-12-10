
import React from 'react';

export const GeminiIcon: React.FC<{className?: string}> = (props) => (
    <svg {...props} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gemini-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f87171" />
          <stop offset="30%" stopColor="#fde047" />
          <stop offset="70%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#4ade80" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="24" height="24" rx="6" fill="#1F2937" />
      <path
          d="M12,4 C17,8 19,10 24,15 C19,20 17,22 12,26 C7,22 5,20 0,15 C5,10 7,8 12,4 Z"
          transform="scale(0.7) translate(8, -2)"
          fill="url(#gemini-gradient)"
      />
    </svg>
);

export const CalculatorIcon: React.FC<{className?: string}> = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="2" width="16" height="20" rx="4" fill="#3B82F6" className="text-blue-500 fill-current opacity-10" stroke="currentColor" strokeWidth="1.5" />
    <rect x="7" y="5" width="10" height="5" rx="1.5" fill="#DBEAFE" className="text-blue-100 fill-current" />
    <circle cx="8" cy="13" r="1.5" fill="currentColor" className="text-blue-400" />
    <circle cx="12" cy="13" r="1.5" fill="currentColor" className="text-blue-400" />
    <circle cx="16" cy="13" r="1.5" fill="#FBBF24" />
    <circle cx="8" cy="17" r="1.5" fill="currentColor" className="text-blue-400" />
    <circle cx="12" cy="17" r="1.5" fill="currentColor" className="text-blue-400" />
    <circle cx="16" cy="17" r="1.5" fill="#EF4444" />
  </svg>
);

export const BookOpenIcon: React.FC<{className?: string}> = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
     <path d="M12 7V21C12 21 16 19 20 19V5C16 5 12 7 12 7Z" fill="#F472B6" className="text-pink-400 fill-current opacity-20"/>
     <path d="M12 7V21C12 21 8 19 4 19V5C8 5 12 7 12 7Z" fill="#F472B6" className="text-pink-400 fill-current opacity-30"/>
     <path d="M4 19C4 19 8 17 12 17C16 17 20 19 20 19" stroke="currentColor" className="text-pink-500" strokeWidth="1.5" strokeLinecap="round"/>
     <path d="M12 5V7" stroke="currentColor" className="text-pink-500" strokeWidth="1.5" strokeLinecap="round"/>
     <path d="M12 5V17" stroke="currentColor" className="text-pink-500" strokeWidth="1.5" strokeLinecap="round"/>
     <path d="M7 9H9" stroke="currentColor" className="text-pink-300" strokeWidth="1.5" strokeLinecap="round"/>
     <path d="M7 13H10" stroke="currentColor" className="text-pink-300" strokeWidth="1.5" strokeLinecap="round"/>
     <path d="M15 9H17" stroke="currentColor" className="text-pink-300" strokeWidth="1.5" strokeLinecap="round"/>
     <path d="M14 13H17" stroke="currentColor" className="text-pink-300" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export const BeakerIcon: React.FC<{className?: string}> = (props) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 2H14V6L19 16C19.8 17.6 18.6 20 16.8 20H7.2C5.4 20 4.2 17.6 5 16L10 6V2Z" fill="#10B981" className="text-emerald-500 fill-current opacity-20" />
        <path d="M5 16L10 6V4" stroke="currentColor" className="text-emerald-600" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M19 16L14 6V4" stroke="currentColor" className="text-emerald-600" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10 2H14" stroke="currentColor" className="text-emerald-600" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M5 16C4.2 17.6 5.4 20 7.2 20H16.8C18.6 20 19.8 17.6 19 16" stroke="currentColor" className="text-emerald-600" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M6 14C6 14 8 13 10 14C12 15 14 13 16 14C18 15 18.5 14.5 18.5 14.5" stroke="currentColor" className="text-emerald-400" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2"/>
        <circle cx="11" cy="10" r="1" fill="currentColor" className="text-emerald-300"/>
        <circle cx="14" cy="12" r="1.5" fill="currentColor" className="text-emerald-300"/>
        <circle cx="9" cy="17" r="0.5" fill="currentColor" className="text-emerald-300"/>
    </svg>
);

export const PhysicsIcon: React.FC<{className?: string}> = (props) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="2.5" fill="currentColor" className="text-violet-500" stroke="none"/>
        <ellipse cx="12" cy="12" rx="9" ry="3" transform="rotate(0 12 12)" stroke="currentColor" className="text-violet-400" />
        <ellipse cx="12" cy="12" rx="9" ry="3" transform="rotate(60 12 12)" stroke="currentColor" className="text-violet-400" />
        <ellipse cx="12" cy="12" rx="9" ry="3" transform="rotate(120 12 12)" stroke="currentColor" className="text-violet-400" />
        <circle cx="21" cy="12" r="1" fill="currentColor" className="text-violet-300" stroke="none"/>
        <circle cx="7.5" cy="4.2" r="1" fill="currentColor" className="text-violet-300" stroke="none"/>
        <circle cx="7.5" cy="19.8" r="1" fill="currentColor" className="text-violet-300" stroke="none"/>
    </svg>
);

export const BiologyIcon: React.FC<{className?: string}> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M12 9c-3 0-5 2-5 5s2 5 5 5 5-2 5-5-2-5-5-5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 14c0-2 1.5-3 3-3s3 1 3 3" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 14c0 2-1.5 3-3 3s-3-1-3-3" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c3 0 5-2 5-2s-1 4-2 6" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c-3 0-5-2-5-2s1 4 2 6" />
    </svg>
);

export const GlobeAltIcon: React.FC<{className?: string}> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
  </svg>
);

export const HistoryIcon: React.FC<{className?: string}> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-18 0v12a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 21V9m-18 0h18" />
  </svg>
);

export const CodeBracketIcon: React.FC<{className?: string}> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
  </svg>
);

export const BrainCircuitIcon: React.FC<{className?: string}> = (props) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 4.5a2.5 2.5 0 0 0-4.96-.46 2.5 2.5 0 0 0-1.98 3 2.5 2.5 0 0 0-1.32 4.24 3 3 0 0 0 .34 5.58 2.5 2.5 0 0 0 2.96 3.08 2.5 2.5 0 0 0 4.91.05L12 20V4.5z" />
        <path d="M16 8v5" />
        <path d="M12 12h4" />
        <path d="M12 16h4" />
        <circle cx="16" cy="8" r=".5" fill="currentColor" />
        <circle cx="16" cy="13" r=".5" fill="currentColor" />
        <circle cx="16" cy="16" r=".5" fill="currentColor" />
        <path d="M20.5 10c0 1.5-1 2-2 2" />
        <path d="M20.5 14c0 1.5-1 2-2 2" />
    </svg>
);
