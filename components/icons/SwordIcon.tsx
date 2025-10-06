
import React from 'react';

const SwordIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-full h-full"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 21l15-15m-1.5 1.5L3 21m15-15l-1.5-1.5m1.5 1.5L21 3m-15 15l-1.5 1.5m1.5-1.5L6 18m9-9l-1.5-1.5M6 18l6-6m3 3L9 9" />
  </svg>
);
export default SwordIcon;