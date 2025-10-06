
import React from 'react';
import { Screen } from '../types';
import HomeIcon from './icons/HomeIcon';
import WorldIcon from './icons/WorldIcon';
import SwordIcon from './icons/SwordIcon';
import PersonIcon from './icons/PersonIcon';
import BookIcon from './icons/BookIcon';
import MountainIcon from './icons/MountainIcon';
import SheetIcon from './icons/SheetIcon';
import MagicIcon from './icons/MagicIcon';
import ImageIcon from './icons/ImageIcon';
import BagIcon from './icons/BagIcon';
import ArmorIcon from './icons/ArmorIcon';
import SparklesIcon from './icons/SparklesIcon';
import MonsterIcon from './icons/MonsterIcon';
import AnalyticsIcon from './icons/AnalyticsIcon';
import { useLanguage } from '../contexts/LanguageContext';

interface SidebarProps {
  activeScreen: Screen;
  setActiveScreen: (screen: Screen) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeScreen, setActiveScreen }) => {
  const { t } = useLanguage();
  
  const NAV_ITEMS = [
    { id: 'dashboard', label: t('dashboard'), icon: <HomeIcon /> },
    { id: 'setting', label: t('setting'), icon: <WorldIcon /> },
    { id: 'weapons', label: t('weapons'), icon: <SwordIcon /> },
    { id: 'items', label: t('items'), icon: <BagIcon /> },
    { id: 'gear', label: t('gear'), icon: <ArmorIcon /> },
    { id: 'spells', label: t('spells'), icon: <SparklesIcon /> },
    { id: 'npcs', label: t('npcs'), icon: <PersonIcon /> },
    { id: 'creatures', label: t('creatures'), icon: <MonsterIcon /> },
    { id: 'classes', label: t('classes'), icon: <BookIcon /> },
    { id: 'races', label: t('races'), icon: <MountainIcon /> },
    { id: 'characters', label: t('characters'), icon: <SheetIcon /> },
    { id: 'analytics', label: t('analytics'), icon: <AnalyticsIcon /> },
    { id: 'campaign-generator', label: t('campaign_generator'), icon: <MagicIcon /> },
    { id: 'image-generator', label: t('image_generator'), icon: <ImageIcon /> },
  ];

  return (
    <nav className="w-64 bg-zinc-950/80 border-r border-zinc-800/50 flex flex-col">
      <div className="p-4 border-b border-zinc-800/50">
        <h2 className="text-xl font-semibold text-white">{t('sidebar_title')}</h2>
      </div>
      <ul className="flex-1 p-2 space-y-1">
        {NAV_ITEMS.map((item) => (
          <li key={item.id}>
            <button
              onClick={() => setActiveScreen(item.id as Screen)}
              className={`w-full flex items-center p-2 rounded-md text-left transition-all duration-200 transform ${
                activeScreen === item.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'text-slate-300 hover:bg-zinc-800/50 hover:text-white hover:translate-x-1'
              }`}
            >
              <span className="mr-3 w-5 h-5">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="p-4 border-t border-zinc-800/50 text-xs text-slate-500">
        <p>&copy; 2025 Diego da Rosa</p>
      </div>
    </nav>
  );
};

export default Sidebar;
