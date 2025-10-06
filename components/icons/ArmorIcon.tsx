import React from 'react';

const ArmorIcon: React.FC<{className?: string}> = ({className}) => (
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" strokeWidth={1.5} stroke="currentColor" className={className || "w-full h-full"}>
    <path d="M19 4H5C3.89543 4 3 4.89543 3 6V10C3 11.1046 3.89543 12 5 12H6V20H18V12H19C20.1046 12 21 11.1046 21 10V6C21 4.89543 20.1046 4 19 4Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
</svg>
);

export default ArmorIcon;
