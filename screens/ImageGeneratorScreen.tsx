
import React, { useState, useMemo } from 'react';
import { RPGData } from '../types';
import { generateImage } from '../services/geminiService';
import LoadingSpinner from '../components/LoadingSpinner';
import ImageIcon from '../components/icons/ImageIcon';
import { useLanguage } from '../contexts/LanguageContext';

interface ImageGeneratorScreenProps {
  rpgData: RPGData;
}

type GenerationType = 'landscape' | 'map' | 'other';

const ImageGeneratorScreen: React.FC<ImageGeneratorScreenProps> = ({ rpgData }) => {
  const { t } = useLanguage();
  const [type, setType] = useState<GenerationType>('landscape');
  const [customPrompt, setCustomPrompt] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finalPrompt = useMemo(() => {
    let basePrompt = '';
    switch (type) {
        case 'landscape':
            basePrompt = `A fantasy RPG landscape of ${rpgData.setting.worldName}. Style: atmospheric landscape painting, detailed, digital art.`;
            return `${basePrompt} ${customPrompt}`.trim();
        case 'map':
            basePrompt = `A fantasy RPG world map of ${rpgData.setting.worldName}. Style: detailed, fantasy cartography, vintage map.`;
            return `${basePrompt} ${customPrompt}`.trim();
        case 'other':
            return customPrompt;
    }
  }, [type, customPrompt, rpgData.setting.worldName]);
  
  const handleGenerate = async () => {
    if (!finalPrompt) return;
    setLoading(true);
    setError(null);
    setImage(null);
    try {
      const result = await generateImage(finalPrompt);
      if (result) {
        setImage(result);
      } else {
        setError(t('error_generating_image'));
      }
    } catch (e) {
      setError(t('error_unexpected'));
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-2">{t('ai_image_generator')}</h1>
      <p className="text-slate-400 mb-6">{t('image_generator_subtitle')}</p>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
                <label className="block text-sm font-medium text-slate-300 mb-2">{t('generation_type')}</label>
                <select value={type} onChange={e => setType(e.target.value as GenerationType)} className="w-full bg-zinc-800 p-2 rounded-md">
                    <option value="landscape">{t('landscape')}</option>
                    <option value="map">{t('world_map')}</option>
                    <option value="other">{t('other')}</option>
                </select>
            </div>
            
            <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                    {type === 'other' ? t('prompt') : t('additional_details')}
                </label>
                <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder={
                        type === 'other' 
                        ? t('image_gen_placeholder_other')
                        : t('image_gen_placeholder_details')
                    }
                    rows={4}
                    className="w-full bg-zinc-800 p-2 rounded-md"
                />
            </div>
             <button
                onClick={handleGenerate}
                disabled={loading || !finalPrompt}
                className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-all duration-200 transform hover:-translate-y-0.5 active:scale-95 disabled:bg-zinc-700 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
            >
                {loading ? <LoadingSpinner /> : t('generate_image')}
            </button>
        </div>

        <div className="lg:col-span-2">
            <div className="aspect-square bg-zinc-900/50 rounded-lg border border-zinc-800 flex items-center justify-center overflow-hidden">
                {loading && <LoadingSpinner />}
                {error && <div className="p-4 text-red-300 text-center animate-fadeIn">{error}</div>}
                {image && <img src={image} alt="Generated artwork" className="w-full h-full object-contain animate-fadeIn" />}
                {!loading && !error && !image && (
                    <div className="text-center text-slate-500 animate-fadeIn">
                        <ImageIcon className="w-16 h-16 mx-auto opacity-30" />
                        <p className="mt-2">{t('image_gen_output_placeholder')}</p>
                    </div>
                )}
            </div>
             {finalPrompt && !loading && (
                <div className="mt-4 p-3 bg-zinc-950/50 rounded-md text-xs text-slate-400 border border-zinc-800 animate-fadeIn">
                    <strong className="text-slate-300">{t('final_prompt')}:</strong> {finalPrompt}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ImageGeneratorScreen;