
import React, { useRef } from 'react';
import { useLanguage, languageMap } from '../contexts/LanguageContext';

interface HeaderProps {
  onNewProject: () => void;
  onSaveProject: () => void;
  onLoadProject: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const Header: React.FC<HeaderProps> = ({ onNewProject, onSaveProject, onLoadProject }) => {
  const { language, setLanguage, t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLoadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <header className="bg-zinc-950/80 backdrop-blur-sm shadow-md z-10">
      <div className="flex items-center justify-between h-14 px-4 border-b border-zinc-800/50">
        <h1 className="text-lg font-bold text-slate-200">{t('header_title')}</h1>
        <div className="flex items-center space-x-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={onLoadProject}
              className="hidden"
              accept=".rpgproject,application/json"
            />
            <div className="hidden sm:flex items-center space-x-4 text-sm">
                <button onClick={onNewProject} className="px-3 py-1 bg-zinc-800/50 border border-zinc-700/80 rounded-md text-slate-300 hover:bg-zinc-800 hover:text-white transition-colors">{t('new_project')}</button>
                <button onClick={handleLoadClick} className="px-3 py-1 bg-zinc-800/50 border border-zinc-700/80 rounded-md text-slate-300 hover:bg-zinc-800 hover:text-white transition-colors">{t('load_project')}</button>
                <button onClick={onSaveProject} className="px-3 py-1 bg-blue-600 border border-blue-500 rounded-md text-white hover:bg-blue-700 transition-colors">{t('save_project')}</button>
            </div>
            <div className="flex items-center space-x-2">
                <label htmlFor="language-select" className="text-sm text-slate-400 sr-only">{t('language')}</label>
                 <select
                    id="language-select"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="bg-zinc-800 border border-zinc-700 rounded-md py-1 pl-2 pr-8 text-sm text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    aria-label="Select language"
                >
                    {Object.keys(languageMap).map(langCode => (
                        <option key={langCode} value={langCode}>
                            {languageMap[langCode]}
                        </option>
                    ))}
                </select>
            </div>
        </div>
      </div>
    </header>
  );
};

export default Header;