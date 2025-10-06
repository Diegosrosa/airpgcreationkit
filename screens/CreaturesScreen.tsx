import React, { useState, useEffect, useMemo } from 'react';
import { RPGData, Creature } from '../types';
import { generateImage, generateCreature, enhanceDescription } from '../services/geminiService';
import LoadingSpinner from '../components/LoadingSpinner';
import ImageIcon from '../components/icons/ImageIcon';
import SparklesIcon from '../components/icons/SparklesIcon';
import { useLanguage } from '../contexts/LanguageContext';
import PencilIcon from '../components/icons/PencilIcon';
import { useDeleteMode } from '../hooks/useDeleteMode';
import DeletionModal from '../components/DeletionModal';
import TrashIcon from '../components/icons/TrashIcon';

interface CreaturesScreenProps {
  rpgData: RPGData;
  setRpgData: React.Dispatch<React.SetStateAction<RPGData>>;
}

const CreatureForm: React.FC<{ 
    onSave: (creature: Omit<Creature, 'id'>) => void, 
    onCancel: () => void, 
    existingCreature?: Creature | null 
}> = ({ onSave, onCancel, existingCreature }) => {
    const { t, languageFullName } = useLanguage();
    const [creatureData, setCreatureData] = useState<Omit<Creature, 'id' | 'image'>>({
        name: '', type: '', challengeRating: '', hp: '', armorClass: '', attackBonus: '', description: '', abilities: ['']
    });
    const [image, setImage] = useState<string | undefined>(undefined);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [imageStyle, setImageStyle] = useState('fantasy painting');
    
    const imageStyles = ['fantasy painting', 'photorealistic', 'anime', 'cartoon', 'pixel art', 'monster manual illustration'];

    useEffect(() => {
        if (existingCreature) {
            setCreatureData({
                name: existingCreature.name,
                type: existingCreature.type,
                challengeRating: existingCreature.challengeRating,
                description: existingCreature.description,
                hp: existingCreature.hp || '',
                armorClass: existingCreature.armorClass || '',
                attackBonus: existingCreature.attackBonus || '',
                abilities: existingCreature.abilities.length > 0 ? existingCreature.abilities : [''],
            });
            setImage(existingCreature.image);
        } else {
            setCreatureData({ name: '', type: '', challengeRating: '', hp: '', armorClass: '', attackBonus: '', description: '', abilities: [''] });
            setImage(undefined);
            setAiPrompt('');
        }
    }, [existingCreature]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setCreatureData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleAbilityChange = (index: number, value: string) => {
        setCreatureData(prev => {
            const newAbilities = [...prev.abilities];
            newAbilities[index] = value;
            return { ...prev, abilities: newAbilities };
        });
    };

    const handleAddAbility = () => {
        setCreatureData(prev => ({ ...prev, abilities: [...prev.abilities, ''] }));
    };

    const handleRemoveAbility = (index: number) => {
        setCreatureData(prev => ({ ...prev, abilities: prev.abilities.filter((_, i) => i !== index) }));
    };

    const handleGenerate = async () => {
        if (!aiPrompt) return;
        setIsGenerating(true);
        const generatedData = await generateCreature(aiPrompt, languageFullName);
        if (generatedData) {
            setCreatureData(prev => ({
                ...prev,
                name: generatedData.name,
                type: generatedData.type,
                challengeRating: generatedData.challengeRating,
                description: generatedData.description,
                hp: generatedData.hp ?? '',
                armorClass: generatedData.armorClass ?? '',
                attackBonus: generatedData.attackBonus ?? '',
                abilities: generatedData.abilities.length > 0 ? generatedData.abilities : [''],
            }));
        }
        setIsGenerating(false);
    };
    
    const handleEnhanceDescription = async () => {
        if (!creatureData.description.trim()) return;
        setIsEnhancing(true);
        try {
            const enhanced = await enhanceDescription('creature', creatureData.name || 'this creature', creatureData.description, languageFullName);
            if (enhanced) {
                setCreatureData(prev => ({ ...prev, description: enhanced }));
            }
        } catch (e) {
            console.error("Failed to enhance description", e);
        } finally {
            setIsEnhancing(false);
        }
    };

    const handleGenerateImage = async () => {
        if (!creatureData.name) return;
        setIsGeneratingImage(true);
        const prompt = `A fantasy RPG monster illustration of a "${creatureData.name}". Type: ${creatureData.type}. Description: ${creatureData.description}. Style: ${imageStyle}.`;
        try {
            const result = await generateImage(prompt);
            if (result) {
                setImage(result);
            }
        } catch (e) {
            console.error("Failed to generate creature image:", e);
        } finally {
            setIsGeneratingImage(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalAbilities = creatureData.abilities.map(ab => ab.trim()).filter(ab => ab);
        onSave({ ...creatureData, abilities: finalAbilities, image });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-xl font-bold text-white">{existingCreature ? t('edit_creature') : t('add_new_creature')}</h2>
            
            <div className="bg-zinc-800/50 p-4 rounded-md border border-zinc-700">
                <label className="block text-sm font-medium text-slate-300 mb-2">{t('generate_with_ai')}</label>
                <div className="flex space-x-2">
                    <input
                        type="text"
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder={t('creature_ai_placeholder')}
                        className="flex-1 bg-zinc-700 border border-zinc-600 rounded-md p-2 text-white focus:ring-2 focus:ring-blue-500"
                        disabled={isGenerating}
                    />
                    <button
                        type="button"
                        onClick={handleGenerate}
                        disabled={isGenerating || !aiPrompt}
                        className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-all duration-200 transform hover:-translate-y-0.5 active:scale-95 disabled:bg-zinc-600 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center min-w-[110px]"
                    >
                        {isGenerating ? <LoadingSpinner /> : t('generate')}
                    </button>
                </div>
            </div>

            <div className="border-t border-zinc-700 my-4"></div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-slate-300">{t('name')}</label>
                            <input name="name" value={creatureData.name} onChange={handleChange} required className="w-full bg-zinc-800 p-2 rounded-md mt-1" />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-300">{t('type')}</label>
                            <input name="type" value={creatureData.type} onChange={handleChange} placeholder={t('creature_type_placeholder')} required className="w-full bg-zinc-800 p-2 rounded-md mt-1" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm text-slate-300">{t('challenge_rating')}</label>
                        <input name="challengeRating" value={creatureData.challengeRating} onChange={handleChange} placeholder={t('creature_cr_placeholder')} required className="w-full bg-zinc-800 p-2 rounded-md mt-1" />
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm text-slate-300">{t('hp')}</label>
                            <input name="hp" value={creatureData.hp} onChange={handleChange} placeholder={t('creature_hp_placeholder')} className="w-full bg-zinc-800 p-2 rounded-md mt-1" />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-300">{t('armor_class')}</label>
                            <input name="armorClass" value={creatureData.armorClass} onChange={handleChange} placeholder={t('creature_ac_placeholder')} className="w-full bg-zinc-800 p-2 rounded-md mt-1" />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-300">{t('attack_bonus')}</label>
                            <input name="attackBonus" value={creatureData.attackBonus} onChange={handleChange} placeholder={t('creature_ab_placeholder')} className="w-full bg-zinc-800 p-2 rounded-md mt-1" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm text-slate-300">{t('description')}</label>
                        <div className="relative mt-1">
                            <textarea 
                                name="description" 
                                value={creatureData.description} 
                                onChange={handleChange} 
                                required rows={4} 
                                className="w-full bg-zinc-800 p-2 rounded-md pr-10"
                            />
                             <button
                                type="button"
                                onClick={handleEnhanceDescription}
                                disabled={isEnhancing || !creatureData.description.trim()}
                                title={t('enhance_description')}
                                className="absolute top-2 right-2 p-1.5 bg-zinc-700/50 rounded-md text-slate-300 hover:bg-zinc-700 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isEnhancing ? 
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div> :
                                    <SparklesIcon className="w-4 h-4" />
                                }
                            </button>
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm text-slate-300 mb-2">{t('abilities')}</label>
                        <div className="space-y-2">
                            {creatureData.abilities.map((ability, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                    <input
                                        value={ability}
                                        onChange={(e) => handleAbilityChange(index, e.target.value)}
                                        placeholder={t('ability_placeholder_creature', {index: (index+1).toString()})}
                                        className="w-full bg-zinc-800 p-2 rounded-md"
                                    />
                                    <button type="button" onClick={() => handleRemoveAbility(index)} className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 font-bold transition-colors">
                                        &times;
                                    </button>
                                </div>
                            ))}
                        </div>
                         <button type="button" onClick={handleAddAbility} className="mt-2 px-3 py-1 bg-zinc-700 text-white rounded-md hover:bg-zinc-600 text-sm">
                            {t('add_ability_creature')}
                        </button>
                    </div>
                </div>
                <div className="md:col-span-1 space-y-2">
                    <div>
                        <label className="block text-sm text-slate-300 mb-2">{t('character_portrait')}</label>
                        <div className="aspect-square bg-zinc-800 rounded-md flex items-center justify-center overflow-hidden border border-zinc-700">
                            {isGeneratingImage && <LoadingSpinner />}
                            {!isGeneratingImage && image && <img src={image} alt={creatureData.name} className="w-full h-full object-cover" />}
                            {!isGeneratingImage && !image && <ImageIcon className="w-12 h-12 text-slate-500" />}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm text-slate-300 mb-1">{t('portrait_style')}</label>
                         <select
                            value={imageStyle}
                            onChange={(e) => setImageStyle(e.target.value)}
                            className="w-full bg-zinc-800 p-2 rounded-md border border-zinc-700 focus:ring-2 focus:ring-fuchsia-500"
                            disabled={isGeneratingImage || isGenerating}
                        >
                            {imageStyles.map(style => (
                                <option key={style} value={style}>{style.charAt(0).toUpperCase() + style.slice(1)}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        type="button"
                        onClick={handleGenerateImage}
                        disabled={isGeneratingImage || isGenerating || !creatureData.name}
                        className="w-full !mt-4 px-4 py-2 bg-fuchsia-600 text-white font-semibold rounded-md hover:bg-fuchsia-700 transition-all duration-200 disabled:bg-zinc-600 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {isGeneratingImage ? <LoadingSpinner/> : t('generate_image')}
                    </button>
                </div>
            </div>
            <div className="flex justify-end space-x-2 pt-4 border-t border-zinc-700">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-zinc-700 rounded-md hover:bg-zinc-600 transition-transform transform active:scale-95">{t('cancel')}</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-700 transition-transform transform active:scale-95">{t('save_creature')}</button>
            </div>
        </form>
    );
};


const CreaturesScreen: React.FC<CreaturesScreenProps> = ({ rpgData, setRpgData }) => {
    const { t } = useLanguage();
    const [showForm, setShowForm] = useState(false);
    const [editingCreature, setEditingCreature] = useState<Creature | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');
    const { isDeleteMode, toggleDeleteMode, closeDeleteMode } = useDeleteMode();
    const [deletingCreature, setDeletingCreature] = useState<Creature | null>(null);

    const creatureTypes = useMemo(() => [...new Set(rpgData.creatures.map(c => c.type).filter(Boolean).sort())], [rpgData.creatures]);

    const filteredCreatures = useMemo(() => {
        return rpgData.creatures.filter(creature => {
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch = creature.name.toLowerCase().includes(searchLower) ||
                                creature.description.toLowerCase().includes(searchLower);
            const matchesType = filterType === 'all' || creature.type === filterType;

            return matchesSearch && matchesType;
        });
    }, [rpgData.creatures, searchQuery, filterType]);

    const handleSaveCreature = (creatureData: Omit<Creature, 'id'>) => {
        if (editingCreature) {
            setRpgData(prev => ({
                ...prev,
                creatures: prev.creatures.map(c => c.id === editingCreature.id ? { ...editingCreature, ...creatureData } : c)
            }));
        } else {
            const newCreature = { ...creatureData, id: Date.now().toString() };
            setRpgData(prev => ({ ...prev, creatures: [...prev.creatures, newCreature] }));
        }
        setShowForm(false);
        setEditingCreature(null);
    };

    const handleEdit = (creature: Creature) => {
        setEditingCreature(creature);
        setShowForm(true);
        closeDeleteMode();
    };

    const handleOpenDeleteModal = (creature: Creature) => {
        setDeletingCreature(creature);
    };

    const handleConfirmDelete = () => {
        if (!deletingCreature) return;
        setRpgData(prev => ({ ...prev, creatures: prev.creatures.filter(c => c.id !== deletingCreature.id) }));
        setDeletingCreature(null);
    };

    const handleAddNew = () => {
        setEditingCreature(null);
        setShowForm(true);
        closeDeleteMode();
    };

    const handleClearFilters = () => {
        setSearchQuery('');
        setFilterType('all');
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-white">{t('creatures')}</h1>
                <div className="flex space-x-2">
                    <button onClick={toggleDeleteMode} className={`px-4 py-2 font-semibold rounded-md transition-all duration-200 transform hover:-translate-y-0.5 active:scale-95 ${isDeleteMode ? 'bg-red-600 text-white' : 'bg-zinc-700 text-slate-300 hover:bg-zinc-600'}`}>
                        {isDeleteMode ? t('cancel_deletion') : t('delete_creature')}
                    </button>
                    <button onClick={handleAddNew} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-all duration-200 transform hover:-translate-y-0.5 active:scale-95">
                        + {t('add_new_creature')}
                    </button>
                </div>
            </div>

            {rpgData.creatures.length > 0 && (
                <div className="mb-6 bg-zinc-900/50 p-4 rounded-lg border border-zinc-800 flex flex-col md:flex-row items-center gap-4">
                    <div className="relative w-full md:flex-1">
                        <input
                            type="text"
                            placeholder={t('search_placeholder_creatures')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2 pl-8 text-white focus:ring-2 focus:ring-blue-500"
                        />
                        <svg className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="bg-zinc-800 border border-zinc-700 rounded-md p-2 text-white focus:ring-2 focus:ring-blue-500 w-full sm:w-auto md:w-48"
                        >
                            <option value="all">{t('all_types')}</option>
                            {creatureTypes.map(type => <option key={type} value={type}>{type}</option>)}
                        </select>
                        <button onClick={handleClearFilters} className="text-sm text-slate-400 hover:text-white transition-colors">{t('clear')}</button>
                    </div>
                </div>
            )}

            {showForm && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-zinc-900 p-6 rounded-lg shadow-xl w-full max-w-4xl border border-zinc-800 animate-fadeInScaleUp max-h-[90vh] overflow-y-auto">
                        <CreatureForm 
                            onSave={handleSaveCreature} 
                            onCancel={() => { setShowForm(false); setEditingCreature(null); }} 
                            existingCreature={editingCreature}
                        />
                    </div>
                </div>
            )}

            <DeletionModal
                isOpen={!!deletingCreature}
                onClose={() => setDeletingCreature(null)}
                onConfirm={handleConfirmDelete}
                itemName={deletingCreature?.name || ''}
                dependencies={[]}
                isBlocked={false}
                entityType="creature"
            />


            {rpgData.creatures.length === 0 && !showForm ? (
                <div className="text-center py-16 bg-zinc-900/50 rounded-lg border border-dashed border-zinc-800 animate-fadeInUp">
                    <p className="text-slate-400">{t('no_creatures_created')}</p>
                    <p className="text-slate-500">{t('start_creating_creatures')}</p>
                </div>
             ) : filteredCreatures.length === 0 && !showForm ? (
                <div className="text-center py-16 bg-zinc-900/50 rounded-lg border border-dashed border-zinc-800 animate-fadeInUp">
                    <p className="text-slate-400">{t('no_match_search')}</p>
                    <p className="text-slate-500">{t('adjust_filters_search')}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeInUp">
                    {filteredCreatures.map(creature => (
                        <div
                            key={creature.id}
                            className={`bg-zinc-900 rounded-lg border border-zinc-800 shadow-md flex flex-col transition-all duration-300 hover:shadow-lg hover:border-blue-500/50 hover:-translate-y-1 overflow-hidden relative group ${isDeleteMode ? 'ring-2 ring-red-500/50' : ''}`}
                        >
                             {isDeleteMode ? (
                                <button onClick={() => handleOpenDeleteModal(creature)} className="absolute top-2 right-2 p-1.5 bg-red-600/80 rounded-full text-white hover:bg-red-500 transition-colors z-20" title={t('delete')}>
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                             ) : (
                                <div className="absolute top-2 right-2 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                    <button type="button" onClick={() => handleEdit(creature)} className="p-1.5 bg-zinc-700/80 rounded-md text-slate-300 hover:bg-zinc-700 hover:text-white transition-colors" title={t('edit')}>
                                        <PencilIcon className="w-4 h-4" />
                                    </button>
                                </div>
                             )}
                            {creature.image && (
                                <img src={creature.image} alt={creature.name} className="w-full h-48 object-cover object-top"/>
                            )}
                            <div className="p-4 flex flex-col flex-grow">
                                <h3 className="text-lg font-bold text-blue-400">{creature.name}</h3>
                                <p className="text-sm text-slate-400">{creature.type} | <span className="font-semibold text-slate-300">CR {creature.challengeRating}</span></p>
                                
                                <div className="mt-4 pt-3 border-t border-zinc-800 grid grid-cols-3 gap-2 text-center">
                                    <div>
                                        <h4 className="text-xs text-slate-400 font-semibold">{t('hp')}</h4>
                                        <p className="text-sm font-bold text-white truncate" title={creature.hp}>{creature.hp || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-xs text-slate-400 font-semibold">{t('armor_class')}</h4>
                                        <p className="text-sm font-bold text-white truncate" title={creature.armorClass}>{creature.armorClass || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-xs text-slate-400 font-semibold">{t('attack_bonus')}</h4>
                                        <p className="text-sm font-bold text-white truncate" title={creature.attackBonus}>{creature.attackBonus || 'N/A'}</p>
                                    </div>
                                </div>
                                
                                <p className="mt-2 text-slate-300 text-sm flex-grow whitespace-pre-wrap">{creature.description}</p>
                                
                                {creature.abilities.length > 0 &&
                                    <div className="mt-4 pt-3 border-t border-zinc-800">
                                        <h4 className="font-semibold text-slate-300 text-sm mb-2">{t('abilities')}:</h4>
                                        <ul className="list-disc list-inside text-xs text-slate-400 space-y-1">
                                            {creature.abilities.map((ability, index) => (
                                                <li key={index}>{ability}</li>
                                            ))}
                                        </ul>
                                    </div>
                                }
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CreaturesScreen;