import React, { useMemo } from 'react';
import { RPGData } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import BarChart, { ChartData } from '../components/BarChart';

const AnalyticsScreen: React.FC<{ rpgData: RPGData }> = ({ rpgData }) => {
  const { t } = useLanguage();

  const groupData = (items: any[], key: string): ChartData[] => {
    if (!items) return [];
    // FIX: By providing a generic type argument to `reduce`, we ensure `counts` is correctly typed as `{ [key: string]: number }`, which resolves type errors in the subsequent `.map` and `.sort` calls.
    const counts = items.reduce<{ [key: string]: number }>((acc, item) => {
      const groupKey = item[key] || 'Undefined';
      acc[groupKey] = (acc[groupKey] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  };

  const parseCR = (cr: string): number => {
    if (!cr) return 0;
    const fractionMatch = cr.match(/^(\d+)\/(\d+)/);
    if (fractionMatch) {
      return parseInt(fractionMatch[1], 10) / parseInt(fractionMatch[2], 10);
    }
    const numberMatch = cr.match(/^\d+/);
    if (numberMatch) {
      return parseInt(numberMatch[0], 10);
    }
    return 0;
  };

  const creatureCRData = useMemo((): ChartData[] => {
    if (!rpgData.creatures || rpgData.creatures.length === 0) return [];
    const crGroups = {
      '0-2': 0,
      '3-5': 0,
      '6-10': 0,
      '11+': 0,
    };
    rpgData.creatures.forEach(creature => {
      const crValue = parseCR(creature.challengeRating);
      if (crValue <= 2) crGroups['0-2']++;
      else if (crValue <= 5) crGroups['3-5']++;
      else if (crValue <= 10) crGroups['6-10']++;
      else crGroups['11+']++;
    });
    return Object.entries(crGroups).map(([range, value]) => ({
      label: t('challenge_rating_group', { range }),
      value,
    }));
  }, [rpgData.creatures, t]);

  const itemsByType = useMemo(() => groupData(rpgData.items, 'type'), [rpgData.items]);
  const spellsBySchool = useMemo(() => groupData(rpgData.spells, 'school'), [rpgData.spells]);
  const npcsByRole = useMemo(() => groupData(rpgData.npcs, 'role'), [rpgData.npcs]);
  const weaponsByType = useMemo(() => groupData(rpgData.weapons, 'type'), [rpgData.weapons]);

  return (
    <div className="animate-fadeInUp">
      <h1 className="text-3xl font-bold mb-2 text-white">{t('analytics_title')}</h1>
      <p className="text-slate-400 mb-8">{t('analytics_subtitle')}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <BarChart data={itemsByType} title={t('items_by_type')} barColor="bg-green-500" />
        <BarChart data={spellsBySchool} title={t('spells_by_school')} barColor="bg-purple-500" />
        <BarChart data={weaponsByType} title={t('weapons_by_type')} barColor="bg-red-500" />
        <BarChart data={npcsByRole} title={t('npcs_by_role')} barColor="bg-yellow-500" />
        <div className="md:col-span-2">
            <BarChart data={creatureCRData} title={t('creatures_by_cr')} barColor="bg-orange-500" />
        </div>
      </div>
    </div>
  );
};

export default AnalyticsScreen;
