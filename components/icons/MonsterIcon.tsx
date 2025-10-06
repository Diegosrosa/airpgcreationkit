
import React from 'react';
const MonsterIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-full h-full"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21.75c-4.286 0-8.25-3.464-8.25-8.25V4.5a3 3 0 013-3h10.5a3 3 0 013 3v9c0 4.786-3.964 8.25-8.25 8.25zM9 9.75h-.008v.008H9v-.008zm6 0h-.008v.008H15v-.008zm-4.5 3.75a.75.75 0 000 1.5h3a.75.75 0 000-1.5h-3z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 9.75h1.5M20.25 9.75h-1.5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 2.25c-1.28 0-2.45.153-3.56.433m19.82 0c1.11-.28 2.28-.433 3.56-.433" />
  </svg>
);
export default MonsterIcon;
