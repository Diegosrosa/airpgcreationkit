import React, { useState, useEffect, useMemo } from 'react';
import { RPGData, Gear } from '../types';
import { generateGear, generateImage, enhanceDescription } from '../services/geminiService';
import LoadingSpinner from '../components/LoadingSpinner';
import ImageIcon from '../components/icons/ImageIcon';
import SparklesIcon from '../components/icons/SparklesIcon';
import { useLanguage } from '../contexts/LanguageContext';
import PencilIcon from '../components/icons/PencilIcon';
import { useDeleteMode } from '../hooks/useDeleteMode';
import DeletionModal from '../components/DeletionModal';
import TrashIcon from '../components/icons/TrashIcon';

interface GearScreenProps {
  rpgData: RPGData;
  setRpgData: React.Dispatch<React.SetStateAction<RPGData>>;
}

const GearForm: React.FC<{ 
    onSave: (gear: Omit<Gear, 'id'>) => void, 
    onCancel: () => void, 
    existingGear?: Gear | null 
}> = ({ onSave, onCancel, existingGear }) => {
    const { t, languageFullName } = useLanguage();
    const [gear, setGear] = useState({ name: '', type: '', slot: '', armorValue: '', description: '' });
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [image, setImage] = useState<string | undefined>(undefined);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);

    useEffect(() => {
        if (existingGear) {
            setGear({
                name: existingGear.name,
                type: existingGear.type,
                slot: existingGear.slot,
                armorValue: existingGear.armorValue,
                description: existingGear.description,
            });
            setImage(existingGear.image);
        } else {
            setGear({ name: '', type: '', slot: '', armorValue: '', description: '' });
            setAiPrompt('');
            setImage(undefined);
        }
    }, [existingGear]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setGear({ ...gear, [e.target.name]: e.target.value });
    };

    const handleGenerate = async () => {
        if (!aiPrompt) return;
        setIsGenerating(true);
        const generatedData = await generateGear(aiPrompt, languageFullName);
        if (generatedData) {
            setGear(generatedData);
        }
        setIsGenerating(false);
    };

    const handleEnhanceDescription = async () => {
        if (!gear.description.trim()) return;
        setIsEnhancing(true);
        try {
            const enhanced = await enhanceDescription('gear', gear.name || 'this gear', gear.description, languageFullName);
            if (enhanced) {
                setGear(prev => ({ ...prev, description: enhanced }));
            }
        } catch (e) {
            console.error("Failed to enhance description", e);
        } finally {
            setIsEnhancing(false);
        }
    };

    const handleGenerateImage = async () => {
        if (!gear.name) return;
        setIsGeneratingImage(true);
        const prompt = `A fantasy RPG armor piece or gear item, "${gear.name}". Description: ${gear.description}. Style: detailed, realistic concept art, inventory icon, on a neutral background.`;
        try {
            const result = await generateImage(prompt);
            if (result) {
                setImage(result);
            }
        } catch (e) {
            console.error("Failed to generate gear image:", e);
        } finally {
            setIsGeneratingImage(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...gear, image });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                 <h2 className="text-xl font-bold text-white mb-4">{t(existingGear ? 'edit_gear' : 'add_new_gear')}</h2>
                <div className="bg-zinc-800/50 p-4 rounded-md border border-zinc-700">
                    <label className="block text-sm font-medium text-slate-300 mb-2">{t('generate_with_ai')}</label>
                    <div className="flex space-x-2">
                        <input
                            type="text"
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            placeholder={t('gear_ai_placeholder')}
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
            </div>
            
            <div className="border-t border-zinc-700 my-4"></div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-slate-300">{t('name')}</label>
                            <input name="name" value={gear.name} onChange={handleChange} required className="w-full bg-zinc-800 p-2 rounded-md mt-1" />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-300">{t('type')}</label>
                            <input name="type" value={gear.type} onChange={handleChange} placeholder={t('gear_type_placeholder')} required className="w-full bg-zinc-800 p-2 rounded-md mt-1" />
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-slate-300">{t('slot')}</label>
                            <input name="slot" value={gear.slot} onChange={handleChange} placeholder={t('gear_slot_placeholder')} required className="w-full bg-zinc-800 p-2 rounded-md mt-1" />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-300">{t('armor_value')}</label>
                            <input name="armorValue" value={gear.armorValue} onChange={handleChange} placeholder={t('gear_armor_value_placeholder')} required className="w-full bg-zinc-800 p-2 rounded-md mt-1" />
                        </div>
                    </div>
                    
                    <div>
                        <label htmlFor={`desc-gear-${existingGear?.id}`} className="block text-sm text-slate-300">{t('description')}</label>
                        <div className="relative mt-1">
                            <textarea 
                                id={`desc-gear-${existingGear?.id}`}
                                name="description" 
                                value={gear.description} 
                                onChange={handleChange} 
                                required rows={6} 
                                className="w-full bg-zinc-800 p-2 rounded-md pr-10"
                            />
                            <button
                                type="button"
                                onClick={handleEnhanceDescription}
                                disabled={isEnhancing || !gear.description.trim()}
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
                </div>

                <div className="md:col-span-1">
                    <label className="block text-sm text-slate-300 mb-2">{t('gear_image')}</label>
                    <div className="aspect-square bg-zinc-800 rounded-md flex items-center justify-center overflow-hidden border border-zinc-700">
                        {isGeneratingImage && <LoadingSpinner />}
                        {!isGeneratingImage && image && <img src={image} alt={gear.name} className="w-full h-full object-cover" />}
                        {!isGeneratingImage && !image && <ImageIcon className="w-12 h-12 text-slate-500" />}
                    </div>
                    <button
                        type="button"
                        onClick={handleGenerateImage}
                        disabled={isGeneratingImage || isGenerating || !gear.name}
                        className="w-full mt-2 px-4 py-2 bg-fuchsia-600 text-white font-semibold rounded-md hover:bg-fuchsia-700 transition-all duration-200 disabled:bg-zinc-600 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {isGeneratingImage ? <LoadingSpinner/> : t('generate_image')}
                    </button>
                </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t border-zinc-700">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-zinc-700 rounded-md hover:bg-zinc-600 transition-transform transform active:scale-95">{t('cancel')}</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-700 transition-transform transform active:scale-95">{t('save_gear')}</button>
            </div>
        </form>
    );
};


const GearScreen: React.FC<GearScreenProps> = ({ rpgData, setRpgData }) => {
    const { t } = useLanguage();
    const [showForm, setShowForm] = useState(false);
    const [editingGear, setEditingGear] = useState<Gear | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterSlot, setFilterSlot] = useState('all');
    const { isDeleteMode, toggleDeleteMode, closeDeleteMode } = useDeleteMode();
    const [deletingGear, setDeletingGear] = useState<Gear | null>(null);

    const gearTypes = useMemo(() => [...new Set(rpgData.gear.map(g => g.type).filter(Boolean).sort())], [rpgData.gear]);
    const gearSlots = useMemo(() => [...new Set(rpgData.gear.map(g => g.slot).filter(Boolean).sort())], [rpgData.gear]);

    const filteredGear = useMemo(() => {
        return rpgData.gear.filter(g => {
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch = g.name.toLowerCase().includes(searchLower) ||
                                g.description.toLowerCase().includes(searchLower);
            const matchesType = filterType === 'all' || g.type === filterType;
            const matchesSlot = filterSlot === 'all' || g.slot === filterSlot;
            return matchesSearch && matchesType && matchesSlot;
        });
    }, [rpgData.gear, searchQuery, filterType, filterSlot]);

    const handleSaveGear = (gearData: Omit<Gear, 'id'>) => {
        if (editingGear) {
            setRpgData(prev => ({
                ...prev,
                gear: prev.gear.map(g => g.id === editingGear.id ? { ...editingGear, ...gearData } : g)
            }));
        } else {
            const newGear = { ...gearData, id: Date.now().toString() };
            setRpgData(prev => ({ ...prev, gear: [...prev.gear, newGear] }));
        }
        setShowForm(false);
        setEditingGear(null);
    };
    
    const handleEdit = (gear: Gear) => {
        setEditingGear(gear);
        setShowForm(true);
        closeDeleteMode();
    };

    const handleOpenDeleteModal = (gear: Gear) => {
        setDeletingGear(gear);
    };

    const handleConfirmDelete = () => {
        if (!deletingGear) return;
        const gearId = deletingGear.id;
        
        setRpgData(prev => {
            const newGear = prev.gear.filter(g => g.id !== gearId);

            const newCharacters = prev.characters.map(char => {
                const migratedGearIds = (char.gearIds || []).map(g => (typeof g === 'string' ? { gearId: g, quantity: 1 } : g));
                const newGearIds = migratedGearIds.filter(item => item.gearId !== gearId);

                const newEquippedGear = { ...(char.equippedGear || {}) };
                Object.keys(newEquippedGear).forEach(slot => {
                    if (newEquippedGear[slot] === gearId) {
                        newEquippedGear[slot] = null;
                    }
                });

                return {
                    ...char,
                    gearIds: newGearIds,
                    equippedGear: newEquippedGear,
                };
            });

            return {
                ...prev,
                gear: newGear,
                characters: newCharacters,
            };
        });
        setDeletingGear(null);
    };

    const handleAddNew = () => {
        setEditingGear(null);
        setShowForm(true);
        closeDeleteMode();
    }

     const handleClearFilters = () => {
        setSearchQuery('');
        setFilterType('all');
        setFilterSlot('all');
    };

    const gearDependencies = useMemo(() => {
        if (!deletingGear) return [];
        return rpgData.characters
            .filter(char => 
                Object.values(char.equippedGear || {}).includes(deletingGear.id) ||
                (char.gearIds || []).some(item => (typeof item === 'string' ? item : item.gearId) === deletingGear.id)
            )
            .map(c => c.name);
    }, [deletingGear, rpgData.characters]);


    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-white">{t('gear')}</h1>
                <div className="flex space-x-2">
                    <button onClick={toggleDeleteMode} className={`px-4 py-2 font-semibold rounded-md transition-all duration-200 transform hover:-translate-y-0.5 active:scale-95 ${isDeleteMode ? 'bg-red-600 text-white' : 'bg-zinc-700 text-slate-300 hover:bg-zinc-600'}`}>
                        {isDeleteMode ? t('cancel_deletion') : t('delete_gear')}
                    </button>
                    <button onClick={handleAddNew} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-all duration-200 transform hover:-translate-y-0.5 active:scale-95">
                        + {t('add_gear')}
                    </button>
                </div>
            </div>

             {rpgData.gear.length > 0 && (
                <div className="mb-6 bg-zinc-900/50 p-4 rounded-lg border border-zinc-800 flex flex-col md:flex-row items-center gap-4">
                    <div className="relative w-full md:flex-1">
                        <input
                            type="text"
                            placeholder={t('search_placeholder_gear')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2 pl-8 text-white focus:ring-2 focus:ring-blue-500"
                        />
                         <svg className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>
                    <div className="flex items-center gap-4 w-full md:w-auto flex-wrap">
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="bg-zinc-800 border border-zinc-700 rounded-md p-2 text-white focus:ring-2 focus:ring-blue-500 w-full sm:w-auto md:w-36"
                        >
                            <option value="all">{t('all_types')}</option>
                            {gearTypes.map(type => <option key={type} value={type}>{type}</option>)}
                        </select>
                        <select
                            value={filterSlot}
                            onChange={(e) => setFilterSlot(e.target.value)}
                            className="bg-zinc-800 border border-zinc-700 rounded-md p-2 text-white focus:ring-2 focus:ring-blue-500 w-full sm:w-auto md:w-36"
                        >
                            <option value="all">{t('all_slots')}</option>
                            {gearSlots.map(slot => <option key={slot} value={slot}>{slot}</option>)}
                        </select>
                        <button onClick={handleClearFilters} className="text-sm text-slate-400 hover:text-white transition-colors">{t('clear')}</button>
                    </div>
                </div>
            )}

            {showForm && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-zinc-900 p-6 rounded-lg shadow-xl w-full max-w-3xl border border-zinc-800 animate-fadeInScaleUp">
                        <GearForm 
                            onSave={handleSaveGear} 
                            onCancel={() => { setShowForm(false); setEditingGear(null); }}
                            existingGear={editingGear}
                        />
                    </div>
                </div>
            )}

            <DeletionModal
                isOpen={!!deletingGear}
                onClose={() => setDeletingGear(null)}
                onConfirm={handleConfirmDelete}
                itemName={deletingGear?.name || ''}
                dependencies={gearDependencies}
                isBlocked={gearDependencies.length > 0}
                entityType="gear"
            />

            {rpgData.gear.length === 0 && !showForm ? (
                <div className="text-center py-16 bg-zinc-900/50 rounded-lg border border-dashed border-zinc-800 animate-fadeInUp">
                    <p className="text-slate-400">{t('no_gear_created')}</p>
                    <p className="text-slate-500">{t('start_creating_gear')}</p>
                </div>
             ) : filteredGear.length === 0 && !showForm ? (
                <div className="text-center py-16 bg-zinc-900/50 rounded-lg border border-dashed border-zinc-800 animate-fadeInUp">
                    <p className="text-slate-400">{t('no_gear_match_search')}</p>
                    <p className="text-slate-500">{t('adjust_filters_search')}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeInUp">
                    {filteredGear.map(g => (
                        <div
                            key={g.id}
                            className={`bg-zinc-900 rounded-lg border border-zinc-800 shadow-md flex flex-col transition-all duration-300 hover:shadow-lg hover:border-blue-500/50 hover:-translate-y-1 overflow-hidden relative group ${isDeleteMode ? 'ring-2 ring-red-500/50' : ''}`}
                        >
                            {isDeleteMode ? (
                                <button onClick={() => handleOpenDeleteModal(g)} className="absolute top-2 right-2 p-1.5 bg-red-600/80 rounded-full text-white hover:bg-red-500 transition-colors z-20" title={t('delete')}>
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                             ) : (
                                <div className="absolute top-2 right-2 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                    <button type="button" onClick={() => handleEdit(g)} className="p-1.5 bg-zinc-700/80 rounded-md text-slate-300 hover:bg-zinc-700 hover:text-white transition-colors" title={t('edit')}>
                                        <PencilIcon className="w-4 h-4" />
                                    </button>
                                </div>
                             )}
                            {g.image && (
                                <img src={g.image} alt={g.name} className="w-full h-40 object-cover"/>
                            )}
                            <div className="p-4 flex flex-col flex-grow">
                                <h3 className="text-lg font-bold text-blue-400">{g.name}</h3>
                                <p className="text-sm text-slate-400">{g.type} | <span className="font-semibold text-slate-300">{g.slot}</span></p>
                                <p className="mt-2 text-slate-300 text-sm flex-grow whitespace-pre-wrap">{g.description}</p>
                                <div className="mt-4 pt-3 border-t border-zinc-800">
                                    <h4 className="font-semibold text-slate-300 text-sm mb-1">{t('armor_value')}:</h4>
                                    <p className="text-xs text-slate-400">{g.armorValue}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default GearScreen;