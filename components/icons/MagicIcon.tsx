
import React from 'react';

const MagicIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-full h-full"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c.239.023.48.046.72.072M9.75 3.104l-2.022.022M9.75 3.104V1.5m2.022 1.624a2.25 2.25 0 011.591.659l2.43 2.43c.48.48.659 1.11.659 1.591v5.714m-5.454 0L12 14.5m-2.25-2.25l-2.43-2.43a2.25 2.25 0 00-1.591-.659V3.104m0 5.714c.48.48 1.11.659 1.591.659h5.714c.48 0 1.11-.179 1.591-.659M16.5 15.624V21m-4.5-5.376L9 18m0-2.25h.008v.008H9v-.008z" />
  </svg>
);
export default MagicIcon;