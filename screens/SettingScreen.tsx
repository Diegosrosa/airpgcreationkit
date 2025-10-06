
import React, { useState } from 'react';
import { RPGData } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface SettingScreenProps {
  rpgData: RPGData;
  setRpgData: React.Dispatch<React.SetStateAction<RPGData>>;
}

const SettingScreen: React.FC<SettingScreenProps> = ({ rpgData, setRpgData }) => {
    const { t } = useLanguage();
    const [setting, setSetting] = useState(rpgData.setting);
    const [saved, setSaved] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setSetting({ ...setting, [e.target.name]: e.target.value });
    };

    const handleSave = () => {
        setRpgData(prev => ({ ...prev, setting }));
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="animate-fadeInUp">
            <h1 className="text-3xl font-bold mb-6 text-white">{t('world_setting')}</h1>
            <div className="space-y-6 max-w-4xl">
                <div className="bg-zinc-900/70 p-6 rounded-lg border border-zinc-800">
                    <label htmlFor="worldName" className="block text-sm font-medium text-slate-300 mb-2">{t('world_name')}</label>
                    <input
                        type="text"
                        name="worldName"
                        id="worldName"
                        value={setting.worldName}
                        onChange={handleChange}
                        placeholder={t('world_name_placeholder')}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <div className="bg-zinc-900/70 p-6 rounded-lg border border-zinc-800">
                    <label htmlFor="lore" className="block text-sm font-medium text-slate-300 mb-2">{t('world_lore')}</label>
                    <textarea
                        name="lore"
                        id="lore"
                        value={setting.lore}
                        onChange={handleChange}
                        rows={6}
                        placeholder={t('world_lore_placeholder')}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <div className="bg-zinc-900/70 p-6 rounded-lg border border-zinc-800">
                    <label htmlFor="history" className="block text-sm font-medium text-slate-300 mb-2">{t('world_history')}</label>
                    <textarea
                        name="history"
                        id="history"
                        value={setting.history}
                        onChange={handleChange}
                        rows={6}
                        placeholder={t('world_history_placeholder')}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <div className="flex items-center space-x-4">
                    <button
                        onClick={handleSave}
                        className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-all duration-200 transform hover:-translate-y-0.5 active:scale-95"
                    >
                        {t('save_setting')}
                    </button>
                    {saved && <span className="text-green-400 animate-fadeIn">{t('settings_saved')}</span>}
                </div>
            </div>
        </div>
    );
};

export default SettingScreen;