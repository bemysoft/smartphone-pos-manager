import React, { useState } from 'react';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export default function Tooltip({ text, children, position = 'top' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      className="relative flex items-center justify-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div 
          className={`absolute z-50 px-3 py-1.5 text-[10px] font-bold text-white bg-slate-800 rounded-lg shadow-lg whitespace-nowrap animate-fade-in pointer-events-none ${
            position === 'top' ? 'bottom-full mb-2' : 
            position === 'bottom' ? 'top-full mt-2' : 
            position === 'left' ? 'right-full mr-2' : 
            'left-full ml-2'
          }`}
        >
          {text}
          <div className={`absolute w-2 h-2 bg-slate-800 transform rotate-45 ${
            position === 'top' ? 'bottom-[-4px] left-1/2 -translate-x-1/2' :
            position === 'bottom' ? 'top-[-4px] left-1/2 -translate-x-1/2' :
            position === 'left' ? 'right-[-4px] top-1/2 -translate-y-1/2' :
            'left-[-4px] top-1/2 -translate-y-1/2'
          }`} />
        </div>
      )}
    </div>
  );
}
