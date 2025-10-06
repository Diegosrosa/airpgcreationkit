
import React from 'react';
import { RPGData } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface DashboardProps {
  rpgData: RPGData;
}

const StatCard: React.FC<{ title: string; value: number | string }> = ({ title, value }) => (
  <div className="bg-zinc-900/70 p-6 rounded-lg border border-zinc-800 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-blue-500/50 hover:-translate-y-1">
    <p className="text-sm font-medium text-slate-400">{title}</p>
    <p className="text-3xl font-bold text-white">{value}</p>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ rpgData }) => {
  const { t } = useLanguage();
  return (
    <div className="animate-fadeInUp">
      <h1 className="text-3xl font-bold mb-2 text-white">{t('dashboard')}</h1>
      <p className="text-slate-400 mb-8">
        {rpgData.setting.worldName ? (
          <>
            {t('dashboard_welcome')}{' '}
            <span className="font-semibold text-blue-400">{rpgData.setting.worldName}</span>. {t('dashboard_summary')}
          </>
        ) : (
          t('dashboard_welcome_no_name')
        )}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        <StatCard title={t('weapons_created')} value={rpgData.weapons.length} />
        <StatCard title={t('spells_created')} value={rpgData.spells.length} />
        <StatCard title={t('npcs_defined')} value={rpgData.npcs.length} />
        <StatCard title={t('classes_available')} value={rpgData.classes.length} />
        <StatCard title={t('races_playable')} value={rpgData.races.length} />
      </div>

      <div className="mt-8 bg-zinc-900/70 p-6 rounded-lg border border-zinc-800">
        <h2 className="text-xl font-semibold mb-4 text-white">{t('world_lore')}</h2>
        <p className="text-slate-300 whitespace-pre-wrap">{rpgData.setting.lore}</p>
      </div>
    </div>
  );
};

export default Dashboard;