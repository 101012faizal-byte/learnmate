import React from 'react';

export const LearnMateLogo: React.FC<{className?: string}> = (props) => (
    <svg {...props} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" /> {/* Indigo 500 */}
                <stop offset="100%" stopColor="#a855f7" /> {/* Purple 500 */}
            </linearGradient>
            <linearGradient id="book-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#f3f4f6" />
            </linearGradient>
            <filter id="drop-shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
                <feOffset dx="1" dy="2" result="offsetblur" />
                <feComponentTransfer>
                    <feFuncA type="linear" slope="0.3" />
                </feComponentTransfer>
                <feMerge>
                    <feMergeNode />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
        </defs>

        {/* Background Shape */}
        <rect x="10" y="10" width="80" height="80" rx="20" fill="url(#logo-gradient)" />
        
        {/* Book / Mortarboard Symbol */}
        <g transform="translate(50, 50) scale(0.65)" filter="url(#drop-shadow)">
            {/* Open Book Base */}
            <path d="M-35 10 Q -17.5 25, 0 10 Q 17.5 25, 35 10 L 35 30 Q 17.5 45, 0 30 Q -17.5 45, -35 30 Z" fill="#e0e7ff" />
            
            {/* Pages */}
            <path d="M-32 8 Q -16 22, -1 8" stroke="#818cf8" strokeWidth="2" fill="none" />
            <path d="M1 8 Q 16 22, 32 8" stroke="#818cf8" strokeWidth="2" fill="none" />

            {/* Mortarboard Top */}
            <path d="M0 -35 L 40 -15 L 0 5 L -40 -15 Z" fill="url(#book-gradient)" />
            
            {/* Tassel */}
            <path d="M0 -15 L 0 -15" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />
            <path d="M38 -16 L 38 15" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />
            <circle cx="38" cy="-16" r="2" fill="#fbbf24" />
            
            {/* Central Sparkle */}
            <path d="M0 -25 L 3 -18 L 10 -15 L 3 -12 L 0 -5 L -3 -12 L -10 -15 L -3 -18 Z" fill="#fbbf24" />
        </g>
    </svg>
);