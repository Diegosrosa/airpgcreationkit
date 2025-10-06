
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export interface ChartData {
  label: string;
  value: number;
}

interface BarChartProps {
  data: ChartData[];
  title: string;
  barColor?: string;
}

const BarChart: React.FC<BarChartProps> = ({ data, title, barColor = 'bg-blue-500' }) => {
  const { t } = useLanguage();
  
  if (!data || data.length === 0) {
    return (
      <div className="bg-zinc-900/70 p-6 rounded-lg border border-zinc-800 h-full flex flex-col">
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
        <div className="flex-grow flex items-center justify-center text-slate-500">
          {t('no_data_for_chart')}
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="bg-zinc-900/70 p-6 rounded-lg border border-zinc-800">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      <div className="space-y-3">
        {data.map(({ label, value }) => (
          <div key={label} className="group">
            <div className="flex justify-between items-center mb-1 text-sm">
              <span className="text-slate-300 font-medium truncate" title={label}>{label}</span>
              <span className="text-slate-200 font-bold">{value}</span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-2.5">
              <div
                className={`${barColor} h-2.5 rounded-full transition-all duration-500 ease-out group-hover:brightness-125`}
                style={{ width: `${(value / maxValue) * 100}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BarChart;
